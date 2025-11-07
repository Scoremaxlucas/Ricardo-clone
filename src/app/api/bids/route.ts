import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Neues Gebot erstellen
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Nicht autorisiert. Bitte melden Sie sich an.' },
        { status: 401 }
      )
    }

    // Prüfe ob User verifiziert ist
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { verified: true }
    })

    if (!user?.verified) {
      return NextResponse.json(
        { message: 'Sie müssen sich zuerst verifizieren, um zu bieten oder zu kaufen. Bitte besuchen Sie die Verifizierungsseite.' },
        { status: 403 }
      )
    }

    const data = await request.json()
    const { watchId, amount, isBuyNow = false } = data

    if (!watchId || !amount) {
      return NextResponse.json(
        { message: 'watchId und Betrag sind erforderlich' },
        { status: 400 }
      )
    }

    // Hole das Angebot
    const watch = await prisma.watch.findUnique({
      where: { id: watchId },
      include: {
        bids: {
          orderBy: { amount: 'desc' }, // Sortiere nach Betrag, nicht nach Datum
          take: 1 // Nur das höchste Gebot
        }
      }
    })

    if (!watch) {
      return NextResponse.json(
        { message: 'Angebot nicht gefunden' },
        { status: 404 }
      )
    }

    // Prüfe ob der User der Verkäufer ist - Verkäufer können nicht bei eigenen Angeboten mitbieten
    if (watch.sellerId === session.user.id) {
      return NextResponse.json(
        { message: 'Als Verkäufer können Sie nicht bei Ihrem eigenen Angebot mitbieten.' },
        { status: 403 }
      )
    }

    // Sofortkauf
    if (isBuyNow) {
      // Prüfe ob bereits ein Purchase existiert (Angebot bereits verkauft)
      const existingPurchase = await prisma.purchase.findFirst({
        where: { watchId }
      })

      if (existingPurchase) {
        return NextResponse.json(
          { message: 'Dieses Angebot wurde bereits verkauft' },
          { status: 400 }
        )
      }

      if (!watch.buyNowPrice) {
        return NextResponse.json(
          { message: 'Sofortpreis nicht verfügbar' },
          { status: 400 }
        )
      }

      if (amount !== watch.buyNowPrice) {
        return NextResponse.json(
          { message: 'Der Sofortpreis beträgt CHF ' + watch.buyNowPrice.toFixed(2) },
          { status: 400 }
        )
      }

      // Erstelle Gebot für Sofortkauf
      const bid = await prisma.bid.create({
        data: {
          watchId,
          userId: session.user.id,
          amount: watch.buyNowPrice
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              nickname: true,
              image: true
            }
          }
        }
      })

      // Beende das Angebot sofort (setze auctionEnd auf jetzt)
      await prisma.watch.update({
        where: { id: watchId },
        data: {
          auctionEnd: new Date() // Beendet die Auktion sofort
        }
      })

      // Erstelle Purchase-Eintrag
      const purchase = await prisma.purchase.create({
        data: {
          watchId,
          buyerId: session.user.id,
          price: watch.buyNowPrice || watch.price // Speichere den tatsächlichen Kaufpreis
        },
        include: {
          buyer: {
            select: {
              id: true,
              name: true,
              email: true,
              firstName: true,
              lastName: true,
              nickname: true
            }
          },
          watch: {
            select: {
              title: true,
              sellerId: true,
              seller: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  nickname: true
                }
              }
            }
          }
        }
      })

      console.log(`[bids] Purchase erstellt: ID=${purchase.id}, buyerId=${session.user.id}, watchId=${watchId}, price=${watch.buyNowPrice || watch.price}`)

      // Sende E-Mail-Benachrichtigung an Verkäufer
      try {
        const { sendEmail, getSaleNotificationEmail } = await import('@/lib/email')
        const seller = purchase.watch.seller
        const buyer = purchase.buyer
        const sellerName = seller.nickname || seller.firstName || seller.name || 'Verkäufer'
        const buyerName = buyer.nickname || buyer.firstName || buyer.name || buyer.email || 'Käufer'
        
        const { subject, html, text } = getSaleNotificationEmail(
          sellerName,
          buyerName,
          purchase.watch.title,
          watch.buyNowPrice || watch.price,
          'buy-now',
          watchId
        )
        
        await sendEmail({
          to: seller.email,
          subject,
          html,
          text
        })
        
        console.log(`[bids] Verkaufs-E-Mail gesendet an ${seller.email}`)
      } catch (emailError: any) {
        console.error('Fehler beim Senden der Verkaufs-E-Mail:', emailError)
        // E-Mail-Fehler sollte den Kauf nicht verhindern
      }

      return NextResponse.json({
        message: 'Sofortkauf erfolgreich! Das Angebot wurde beendet.',
        bid,
        purchase
      })
    }

    // Normales Gebot (Auktion)
    // Prüfe ob bereits ein Purchase existiert (Angebot bereits verkauft)
    const existingPurchase = await prisma.purchase.findFirst({
      where: { watchId }
    })

    if (existingPurchase) {
      return NextResponse.json(
        { message: 'Dieses Angebot wurde bereits verkauft' },
        { status: 400 }
      )
    }

    // Prüfe ob Auktion noch läuft
    const now = new Date()
    const auctionEndDate = watch.auctionEnd ? new Date(watch.auctionEnd) : null
    
    if (auctionEndDate && auctionEndDate < now) {
      return NextResponse.json(
        { message: 'Die Auktion ist bereits beendet' },
        { status: 400 }
      )
    }

    // Prüfe Mindestgebot
    const highestBid = watch.bids[0]
    const minBid = highestBid ? highestBid.amount + 1.00 : watch.price

    if (amount < minBid) {
      return NextResponse.json(
        { message: `Das Gebot muss mindestens CHF ${minBid.toFixed(2)} betragen` },
        { status: 400 }
      )
    }

    // Prüfe, dass das Gebot nicht gleich dem aktuellen Höchstgebot ist
    if (highestBid && amount === highestBid.amount) {
      return NextResponse.json(
        { message: `Das Gebot muss höher sein als CHF ${highestBid.amount.toFixed(2)}. Das nächste Gebot muss mindestens CHF ${minBid.toFixed(2)} betragen.` },
        { status: 400 }
      )
    }

    // Automatische Verlängerung: Wenn Gebot in den letzten 3 Minuten vor Ablauf
    let newAuctionEnd = auctionEndDate
    if (auctionEndDate) {
      const timeUntilEnd = auctionEndDate.getTime() - now.getTime()
      const threeMinutes = 3 * 60 * 1000 // 3 Minuten in Millisekunden
      
      if (timeUntilEnd <= threeMinutes && timeUntilEnd > 0) {
        // Verlängere um 3 Minuten ab jetzt
        newAuctionEnd = new Date(now.getTime() + threeMinutes)
        console.log(`Auktion verlängert um 3 Minuten. Neues Ende: ${newAuctionEnd}`)
      }
    }

    // Erstelle Gebot
    const bid = await prisma.bid.create({
      data: {
        watchId,
        userId: session.user.id,
        amount
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Aktualisiere auctionEnd falls verlängert
    if (newAuctionEnd && newAuctionEnd !== auctionEndDate) {
      await prisma.watch.update({
        where: { id: watchId },
        data: {
          auctionEnd: newAuctionEnd
        }
      })
    }

    return NextResponse.json({
      message: newAuctionEnd && newAuctionEnd !== auctionEndDate 
        ? 'Gebot erfolgreich abgegeben! Die Auktion wurde um 3 Minuten verlängert.'
        : 'Gebot erfolgreich abgegeben!',
      bid,
      auctionExtended: newAuctionEnd && newAuctionEnd !== auctionEndDate
    })
  } catch (error: any) {
    console.error('Error creating bid:', error)
    return NextResponse.json(
      { message: 'Ein Fehler ist aufgetreten beim Abgeben des Gebots: ' + error.message },
      { status: 500 }
    )
  }
}

// Alle Gebote für ein Angebot abrufen
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const watchId = searchParams.get('watchId')

    if (!watchId) {
      return NextResponse.json(
        { message: 'watchId fehlt' },
        { status: 400 }
      )
    }

    const bids = await prisma.bid.findMany({
      where: { watchId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            nickname: true,
            image: true
          }
        }
      },
      orderBy: { amount: 'desc' } // Sortiere nach Betrag (höchstes zuerst)
    })

    return NextResponse.json({ bids })
  } catch (error: any) {
    console.error('Error fetching bids:', error)
    return NextResponse.json(
      { message: 'Ein Fehler ist aufgetreten beim Laden der Gebote: ' + error.message },
      { status: 500 }
    )
  }
}

