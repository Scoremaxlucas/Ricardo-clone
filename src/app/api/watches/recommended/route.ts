import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    const now = new Date()
    
    if (!userId) {
      // Wenn nicht eingeloggt, zeige beliebte Artikel
      const watches = await prisma.watch.findMany({
        where: {
          AND: [
            {
              // RICARDO-STYLE: Stornierte Purchases machen das Watch wieder verfügbar
              OR: [
                { purchases: { none: {} } },
                { purchases: { every: { status: 'cancelled' } } }
              ]
            },
            {
              // Beendete Auktionen ohne Purchase ausschließen
              OR: [
                { auctionEnd: null },
                { auctionEnd: { gt: now } },
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
        },
        include: {
          seller: {
            select: {
              name: true,
              nickname: true,
              city: true,
              postalCode: true,
            },
          },
          bids: {
            orderBy: { amount: 'desc' }
          }
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 12,
      })

      // Transformiere Daten für Frontend
      const watchesWithData = watches.map(watch => {
        const highestBid = watch.bids[0]
        const currentPrice = highestBid ? highestBid.amount : watch.price
        
        return {
          ...watch,
          price: currentPrice,
          images: watch.images ? JSON.parse(watch.images) : [],
          city: watch.seller?.city,
          postalCode: watch.seller?.postalCode,
          bids: watch.bids || []
        }
      })

      return NextResponse.json({ watches: watchesWithData })
    }

    // Personalisierte Empfehlungen basierend auf:
    // 1. Favoriten-Kategorien
    // 2. Browsing-Historie (könnte später implementiert werden)
    // 3. Ähnliche Käufer

    // Hole Favoriten des Users
    const favorites = await prisma.favorite.findMany({
      where: {
        userId: userId,
      },
      include: {
        watch: {
          select: {
            category: true,
            subcategory: true,
          },
        },
      },
    })

    // Finde häufigste Kategorien in Favoriten
    const categoryCounts: Record<string, number> = {}
    favorites.forEach((fav) => {
      if (fav.watch?.category) {
        categoryCounts[fav.watch.category] = (categoryCounts[fav.watch.category] || 0) + 1
      }
    })

    const topCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category)

    // Hole Artikel aus diesen Kategorien
    let watches
    if (topCategories.length > 0) {
      watches = await prisma.watch.findMany({
        where: {
          AND: [
            {
              purchases: { none: {} }
            },
            {
              category: {
                in: topCategories,
              }
            },
            {
              // Beendete Auktionen ohne Purchase ausschließen
              OR: [
                { auctionEnd: null },
                { auctionEnd: { gt: now } },
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
            },
            {
              id: {
            notIn: favorites.map((f) => f.watchId),
          },
        },
        include: {
          seller: {
            select: {
              name: true,
              nickname: true,
              city: true,
              postalCode: true,
            },
          },
          bids: {
            orderBy: { amount: 'desc' }
          }
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 8,
      })
    }

    // Wenn nicht genug Artikel, fülle mit beliebten auf
    if (!watches || watches.length < 8) {
      const additionalWatches = await prisma.watch.findMany({
        where: {
          // RICARDO-STYLE: Stornierte Purchases machen das Watch wieder verfügbar
          OR: [
            { purchases: { none: {} } },
            { purchases: { every: { status: 'cancelled' } } }
          ],
          id: {
            notIn: [...(watches?.map((w) => w.id) || []), ...favorites.map((f) => f.watchId)],
          },
        },
        include: {
          seller: {
            select: {
              name: true,
              nickname: true,
              city: true,
              postalCode: true,
            },
          },
          bids: {
            orderBy: { amount: 'desc' }
          }
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 8 - (watches?.length || 0),
      })

      watches = [...(watches || []), ...additionalWatches].slice(0, 12)
    }

    // Transformiere Daten für Frontend
    const watchesWithData = (watches || []).map(watch => {
      const highestBid = watch.bids?.[0]
      const currentPrice = highestBid ? highestBid.amount : watch.price
      
      return {
        ...watch,
        price: currentPrice,
        images: watch.images ? JSON.parse(watch.images) : [],
        city: watch.seller?.city,
        bids: watch.bids || []
      }
    })

    return NextResponse.json({ watches: watchesWithData })
  } catch (error) {
    console.error('Error fetching recommended watches:', error)
    return NextResponse.json({ error: 'Failed to fetch recommended watches' }, { status: 500 })
  }
}
