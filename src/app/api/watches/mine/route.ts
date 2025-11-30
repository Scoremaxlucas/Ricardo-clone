import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ watches: [] }, { status: 200 })
    }

    // Query-Parameter für Filterung
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    // Basis-Where-Klausel
    const whereClause: any = { sellerId: session.user.id }
    
    // Wenn activeOnly=true, filtere nur nicht-verkaufte Watches
    if (activeOnly) {
      const now = new Date()
      whereClause.AND = [
        {
          purchases: {
            none: {
              status: {
                not: 'cancelled'
              }
            }
          }
        },
        {
          OR: [
            // Keine Auktion (Sofortkauf)
            { auctionEnd: null },
            // Oder Auktion noch nicht abgelaufen
            { auctionEnd: { gt: now } },
            // Oder Auktion abgelaufen, aber bereits ein Purchase vorhanden
            {
              AND: [
                { auctionEnd: { lte: now } },
                {
                  purchases: {
                    some: {
                      status: {
                        not: 'cancelled'
                      }
                    }
                  }
                }
              ]
            }
          ]
        }
      ]
    }

    const watches = await prisma.watch.findMany({
      where: whereClause,
      include: {
        purchases: {
          take: 1, // Nur prüfen ob es ein Purchase gibt
          include: {
            buyer: {
              select: {
                id: true,
                name: true,
                email: true,
                firstName: true,
                lastName: true,
                street: true,
                streetNumber: true,
                postalCode: true,
                city: true,
                phone: true,
                paymentMethods: true
              }
            }
          }
        },
        bids: {
          orderBy: { amount: 'desc' },
          take: 1 // Höchstes Gebot für finalPrice
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const watchesWithImages = watches.map(w => {
      const images = w.images ? JSON.parse(w.images) : []
      // RICARDO-STYLE: Nur nicht-stornierte Purchases zählen als "verkauft"
      const activePurchases = w.purchases.filter(p => p.status !== 'cancelled')
      const isSold = activePurchases.length > 0
      const buyer = isSold ? activePurchases[0].buyer : null
      
      // Parse boosters
      let boosters: string[] = []
      if (w.boosters) {
        try {
          boosters = JSON.parse(w.boosters)
        } catch (e) {
          if (w.boosters !== 'none' && w.boosters) {
            boosters = [w.boosters]
          }
        }
      }
      
      // Bestimme finalPrice: höchstes Gebot oder Purchase-Preis oder Startpreis
      let finalPrice = w.price // Fallback zum Startpreis
      const highestBid = w.bids?.[0] // Höchstes Gebot
      
      if (isSold) {
        finalPrice = highestBid?.amount || activePurchases[0].price || w.price
      } else if (highestBid) {
        // Wenn noch nicht verkauft, aber Gebote vorhanden: zeige höchstes Gebot
        finalPrice = highestBid.amount
      }
      
      return {
        ...w,
        images,
        isSold,
        buyer,
        finalPrice,
        highestBid: highestBid ? {
          amount: highestBid.amount,
          createdAt: highestBid.createdAt
        } : null,
        bidCount: w.bids.length,
        boosters
      }
    })

    return NextResponse.json({ watches: watchesWithImages })
  } catch (error: any) {
    return NextResponse.json({ message: 'Fehler beim Laden Ihrer Uhren: ' + error.message }, { status: 500 })
  }
}


