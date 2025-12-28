import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Return info about the route (prevent 405/500 on GET requests)
export async function GET() {
  return NextResponse.json({
    message: 'Diese Route verarbeitet abgelaufene Auktionen. Verwenden Sie POST.',
    method: 'POST required',
  })
}

// Prüfe abgelaufene Auktionen und erstelle Purchases für Gewinner
export async function POST(request: NextRequest) {
  try {
    const now = new Date()

    console.log(`[check-expired] Prüfe abgelaufene Auktionen zum Zeitpunkt ${now.toISOString()}`)

    // Finde alle abgelaufenen Auktionen ohne aktives Purchase
    // Ein Purchase ist aktiv, wenn es nicht storniert wurde
    const expiredWatches = await prisma.watch.findMany({
      where: {
        auctionEnd: {
          lte: now, // Abgelaufen
        },
        purchases: {
          none: {
            status: {
              not: 'cancelled', // Kein aktives (nicht-storniertes) Purchase
            },
          },
        },
        bids: {
          some: {}, // Hat mindestens ein Gebot
        },
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            nickname: true,
            firstName: true,
          },
        },
        bids: {
          orderBy: { amount: 'desc' },
          take: 1, // Höchstes Gebot
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                nickname: true,
                firstName: true,
              },
            },
          },
        },
      },
    })

    console.log(
      `[check-expired] Gefunden: ${expiredWatches.length} abgelaufene Auktionen ohne Purchase`
    )

    const processedWatches = []

    for (const watch of expiredWatches) {
      const highestBid = watch.bids[0]

      if (highestBid) {
        // Prüfe ob bereits ein aktives Purchase existiert (nicht storniert)
        const existingPurchase = await prisma.purchase.findFirst({
          where: {
            watchId: watch.id,
            status: {
              not: 'cancelled',
            },
          },
        })

        if (!existingPurchase) {
          // Hole Verkäufer-Informationen
          const seller = await prisma.user.findUnique({
            where: { id: watch.sellerId },
            select: {
              id: true,
              name: true,
              email: true,
              firstName: true,
              lastName: true,
              nickname: true,
            },
          })

          // Hole Käufer-Informationen
          const buyer = await prisma.user.findUnique({
            where: { id: highestBid.userId },
            select: {
              id: true,
              name: true,
              email: true,
              firstName: true,
              lastName: true,
              nickname: true,
            },
          })

          // Erstelle Purchase für den Gewinner mit Kontaktfrist (7 Tage)
          const contactDeadline = new Date()
          contactDeadline.setDate(contactDeadline.getDate() + 7) // 7 Tage nach Purchase

          const purchase = await prisma.purchase.create({
            data: {
              watchId: watch.id,
              buyerId: highestBid.userId,
              price: highestBid.amount, // Speichere den Gewinnbetrag
              contactDeadline: contactDeadline, // 7-Tage-Kontaktfrist
            },
          })

          console.log(
            `[check-expired] Purchase erstellt: ID=${purchase.id}, buyerId=${highestBid.userId}, watchId=${watch.id}, price=${highestBid.amount}`
          )

          // Erstelle Rechnung SOFORT nach erfolgreichem Verkauf
          try {
            const { calculateInvoiceForSale } = await import('@/lib/invoice')
            const invoice = await calculateInvoiceForSale(purchase.id)
            console.log(
              `[check-expired] ✅ Rechnung erstellt: ${invoice.invoiceNumber} für Seller ${watch.sellerId} (sofort nach Verkauf)`
            )
          } catch (invoiceError: any) {
            console.error('[check-expired] ❌ Fehler bei Rechnungserstellung:', invoiceError)
            // Fehler wird geloggt, aber Purchase bleibt bestehen
          }

          // Sende E-Mail-Benachrichtigung an Verkäufer
          if (seller && buyer) {
            try {
              const { sendEmail, getSaleNotificationEmail } = await import('@/lib/email')
              const sellerName = seller.nickname || seller.firstName || seller.name || 'Verkäufer'
              const buyerName =
                buyer.nickname || buyer.firstName || buyer.name || buyer.email || 'Käufer'

              const { subject, html, text } = getSaleNotificationEmail(
                sellerName,
                buyerName,
                watch.title,
                highestBid.amount,
                'auction',
                watch.id
              )

              await sendEmail({
                to: seller.email,
                subject,
                html,
                text,
              })

              console.log(`[check-expired] Verkaufs-E-Mail gesendet an ${seller.email}`)
            } catch (emailError: any) {
              console.error('Fehler beim Senden der Verkaufs-E-Mail:', emailError)
              // E-Mail-Fehler sollte den Kauf nicht verhindern
            }

            // Erstelle Benachrichtigung für Verkäufer
            try {
              const buyerName =
                buyer.nickname || buyer.firstName || buyer.name || buyer.email || 'Ein Käufer'
              await prisma.notification.create({
                data: {
                  userId: watch.sellerId,
                  type: 'PURCHASE',
                  title: 'Ihr Artikel wurde verkauft',
                  message: `${buyerName} hat "${watch.title}" für CHF ${highestBid.amount.toFixed(2)} gekauft`,
                  watchId: watch.id,
                  link: `/my-watches/selling/sold`,
                },
              })
              console.log(
                `[check-expired] ✅ Verkaufs-Benachrichtigung für Seller ${watch.sellerId} erstellt`
              )
            } catch (notificationError: any) {
              console.error(
                '[check-expired] ❌ Fehler beim Erstellen der Verkaufs-Benachrichtigung:',
                notificationError
              )
              // Fehler sollte den Kauf nicht verhindern
            }

            // Sende Bestätigungs-E-Mail an Käufer
            try {
              const { sendEmail, getPurchaseConfirmationEmail } = await import('@/lib/email')
              const { getShippingCost } = await import('@/lib/shipping')
              const buyerName =
                buyer.nickname || buyer.firstName || buyer.name || buyer.email || 'Käufer'
              const sellerName =
                seller.nickname || seller.firstName || seller.name || seller.email || 'Verkäufer'

              // Berechne Versandkosten
              const shippingMethod = watch.shippingMethod
              let shippingMethods: any = null
              try {
                if (shippingMethod) {
                  shippingMethods =
                    typeof shippingMethod === 'string' ? JSON.parse(shippingMethod) : shippingMethod
                }
              } catch {
                shippingMethods = null
              }
              const shippingCost = getShippingCost(shippingMethods)

              const { subject, html, text } = getPurchaseConfirmationEmail(
                buyerName,
                sellerName,
                watch.title,
                highestBid.amount,
                shippingCost,
                'auction',
                purchase.id,
                watch.id
              )

              await sendEmail({
                to: buyer.email,
                subject,
                html,
                text,
              })

              console.log(
                `[check-expired] ✅ Kaufbestätigungs-E-Mail gesendet an Käufer ${buyer.email}`
              )
            } catch (emailError: any) {
              console.error(
                '[check-expired] ❌ Fehler beim Senden der Kaufbestätigungs-E-Mail:',
                emailError
              )
              // E-Mail-Fehler sollte den Kauf nicht verhindern
            }

            // E-Mail: Auktionsende-Benachrichtigung an Gewinner (gewonnen)
            try {
              const { sendEmail, getAuctionEndWonEmail } = await import('@/lib/email')
              const buyerName =
                buyer.nickname || buyer.firstName || buyer.name || buyer.email || 'Käufer'
              const { subject, html, text } = getAuctionEndWonEmail(
                buyerName,
                watch.title,
                highestBid.amount,
                watch.id,
                purchase.id
              )
              await sendEmail({
                to: buyer.email,
                subject,
                html,
                text,
              })
              console.log(
                `[check-expired] ✅ Auktionsende-Gewonnen-E-Mail gesendet an Käufer ${buyer.email}`
              )
            } catch (emailError: any) {
              console.error(
                '[check-expired] ❌ Fehler beim Senden der Auktionsende-Gewonnen-E-Mail:',
                emailError
              )
            }

            // E-Mail: Auktionsende-Benachrichtigung an Verkäufer
            try {
              const { sendEmail, getAuctionEndSellerEmail } = await import('@/lib/email')
              const sellerName = seller.nickname || seller.firstName || seller.name || 'Verkäufer'
              const buyerName =
                buyer.nickname || buyer.firstName || buyer.name || buyer.email || 'Käufer'
              const { subject, html, text } = getAuctionEndSellerEmail(
                sellerName,
                watch.title,
                highestBid.amount,
                buyerName,
                watch.id,
                purchase.id
              )
              await sendEmail({
                to: seller.email,
                subject,
                html,
                text,
              })
              console.log(
                `[check-expired] ✅ Auktionsende-Verkäufer-E-Mail gesendet an ${seller.email}`
              )
            } catch (emailError: any) {
              console.error(
                '[check-expired] ❌ Fehler beim Senden der Auktionsende-Verkäufer-E-Mail:',
                emailError
              )
            }

            // E-Mail: Auktionsende-Benachrichtigung an alle anderen Bieter (nicht gewonnen)
            try {
              const { sendEmail, getAuctionEndLostEmail } = await import('@/lib/email')
              // Hole alle anderen Bieter (außer dem Gewinner)
              const otherBids = await prisma.bid.findMany({
                where: {
                  watchId: watch.id,
                  userId: { not: highestBid.userId },
                },
                include: {
                  user: {
                    select: {
                      id: true,
                      email: true,
                      name: true,
                      nickname: true,
                      firstName: true,
                    },
                  },
                },
                distinct: ['userId'], // Nur einmal pro User
              })

              for (const otherBid of otherBids) {
                if (otherBid.user.email) {
                  const otherBidderName =
                    otherBid.user.nickname ||
                    otherBid.user.firstName ||
                    otherBid.user.name ||
                    'Käufer'
                  const { subject, html, text } = getAuctionEndLostEmail(
                    otherBidderName,
                    watch.title,
                    highestBid.amount,
                    watch.id
                  )
                  await sendEmail({
                    to: otherBid.user.email,
                    subject,
                    html,
                    text,
                  })
                  console.log(
                    `[check-expired] ✅ Auktionsende-Nicht-Gewonnen-E-Mail gesendet an ${otherBid.user.email}`
                  )
                }
              }
            } catch (emailError: any) {
              console.error(
                '[check-expired] ❌ Fehler beim Senden der Auktionsende-Nicht-Gewonnen-E-Mails:',
                emailError
              )
            }
          }

          processedWatches.push({
            watchId: watch.id,
            watchTitle: watch.title,
            winnerId: highestBid.userId,
            winnerName: highestBid.user.name,
            winningBid: highestBid.amount,
          })

          console.log(
            `Auktion beendet: ${watch.title} - Gewinner: ${highestBid.user.name} (CHF ${highestBid.amount})`
          )
        }
      }
    }

    return NextResponse.json({
      message: `${processedWatches.length} abgelaufene Auktion(en) verarbeitet`,
      processed: processedWatches,
    })
  } catch (error: any) {
    console.error('[check-expired] Error processing expired auctions:', error)
    console.error('[check-expired] Stack:', error.stack)
    return NextResponse.json(
      { 
        message: 'Ein Fehler ist aufgetreten', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
