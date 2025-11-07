import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Prüfe abgelaufene Auktionen und erstelle Purchases für Gewinner
export async function POST(request: NextRequest) {
  try {
    const now = new Date()
    
    console.log(`[check-expired] Prüfe abgelaufene Auktionen zum Zeitpunkt ${now.toISOString()}`)

    // Finde alle abgelaufenen Auktionen ohne Purchase
    const expiredWatches = await prisma.watch.findMany({
      where: {
        auctionEnd: {
          lte: now // Abgelaufen
        },
        purchases: {
          none: {} // Noch kein Purchase erstellt
        },
        bids: {
          some: {} // Hat mindestens ein Gebot
        }
      },
      include: {
        bids: {
          orderBy: { amount: 'desc' },
          take: 1, // Höchstes Gebot
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    console.log(`[check-expired] Gefunden: ${expiredWatches.length} abgelaufene Auktionen ohne Purchase`)

    const processedWatches = []

    for (const watch of expiredWatches) {
      const highestBid = watch.bids[0]
      
      if (highestBid) {
        // Prüfe ob bereits ein Purchase existiert
        const existingPurchase = await prisma.purchase.findFirst({
          where: {
            watchId: watch.id
          }
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
              nickname: true
            }
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
              nickname: true
            }
          })

          // Erstelle Purchase für den Gewinner
          const purchase = await prisma.purchase.create({
            data: {
              watchId: watch.id,
              buyerId: highestBid.userId,
              price: highestBid.amount // Speichere den Gewinnbetrag
            }
          })

          console.log(`[check-expired] Purchase erstellt: ID=${purchase.id}, buyerId=${highestBid.userId}, watchId=${watch.id}, price=${highestBid.amount}`)

          // Sende E-Mail-Benachrichtigung an Verkäufer
          if (seller && buyer) {
            try {
              const { sendEmail, getSaleNotificationEmail } = await import('@/lib/email')
              const sellerName = seller.nickname || seller.firstName || seller.name || 'Verkäufer'
              const buyerName = buyer.nickname || buyer.firstName || buyer.name || buyer.email || 'Käufer'
              
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
                text
              })
              
              console.log(`[check-expired] Verkaufs-E-Mail gesendet an ${seller.email}`)
            } catch (emailError: any) {
              console.error('Fehler beim Senden der Verkaufs-E-Mail:', emailError)
              // E-Mail-Fehler sollte den Kauf nicht verhindern
            }
          }

          processedWatches.push({
            watchId: watch.id,
            watchTitle: watch.title,
            winnerId: highestBid.userId,
            winnerName: highestBid.user.name,
            winningBid: highestBid.amount
          })

          console.log(`Auktion beendet: ${watch.title} - Gewinner: ${highestBid.user.name} (CHF ${highestBid.amount})`)
        }
      }
    }

    return NextResponse.json({
      message: `${processedWatches.length} abgelaufene Auktion(en) verarbeitet`,
      processed: processedWatches
    })
  } catch (error: any) {
    console.error('Error processing expired auctions:', error)
    return NextResponse.json(
      { message: 'Ein Fehler ist aufgetreten: ' + error.message },
      { status: 500 }
    )
  }
}

