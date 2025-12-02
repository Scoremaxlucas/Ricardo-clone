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
              // WICHTIG: Manuell deaktivierte Artikel ausschließen
              OR: [
                { moderationStatus: null },
                { moderationStatus: { not: 'rejected' } }
              ]
            },
            {
              // Stornierte Purchases machen den Artikel wieder verfügbar
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

        // Parse images
        let images: string[] = []
        try {
          if (watch.images) {
            images = JSON.parse(watch.images)
          }
        } catch (e) {
          if (typeof watch.images === 'string') {
            images = watch.images.split(',').filter((img: string) => img.trim().length > 0)
          }
        }

        // Parse boosters
        let boosters: string[] = []
        try {
          if (watch.boosters) {
            boosters = JSON.parse(watch.boosters)
          }
        } catch (e) {
          boosters = []
        }

        return {
          ...watch,
          price: currentPrice,
          images: images,
          city: watch.seller?.city || null,
          postalCode: watch.seller?.postalCode || null,
          buyNowPrice: watch.buyNowPrice || null,
          isAuction: watch.isAuction || false,
          auctionEnd: watch.auctionEnd || null,
          createdAt: watch.createdAt,
          bids: watch.bids || [],
          boosters: boosters
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
          include: {
            categories: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    })

    // Finde häufigste Kategorien in Favoriten
    const categoryCounts: Record<string, number> = {}
    favorites.forEach((fav) => {
      if (fav.watch?.categories && fav.watch.categories.length > 0) {
        fav.watch.categories.forEach((wc) => {
          const categorySlug = wc.category?.slug || ''
          if (categorySlug) {
            categoryCounts[categorySlug] = (categoryCounts[categorySlug] || 0) + 1
          }
        })
      }
    })

    const topCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category)

    // Hole Artikel aus diesen Kategorien
    let watches: any[] = []
    if (topCategories.length > 0) {
      watches = await prisma.watch.findMany({
        where: {
          AND: [
            {
              // WICHTIG: Manuell deaktivierte Artikel ausschließen
              OR: [
                { moderationStatus: null },
                { moderationStatus: { not: 'rejected' } }
              ]
            },
            {
              purchases: { none: {} }
            },
            {
              categories: {
                some: {
                  category: {
                    slug: {
                      in: topCategories,
                    },
                  },
                },
              },
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
          ],
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
          AND: [
            {
              // WICHTIG: Manuell deaktivierte Artikel ausschließen
              OR: [
                { moderationStatus: null },
                { moderationStatus: { not: 'rejected' } }
              ]
            },
            {
              // Stornierte Purchases machen den Artikel wieder verfügbar
              OR: [
                { purchases: { none: {} } },
                { purchases: { every: { status: 'cancelled' } } }
              ]
            },
            {
              id: {
                notIn: [...(watches?.map((w) => w.id) || []), ...favorites.map((f) => f.watchId)],
              }
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
        take: 8 - (watches?.length || 0),
      })

      watches = [...(watches || []), ...additionalWatches].slice(0, 12)
    }

    // Transformiere Daten für Frontend
    const watchesWithData = (watches || []).map(watch => {
      const highestBid = watch.bids?.[0]
      const currentPrice = highestBid ? highestBid.amount : watch.price

      // Parse images
      let images: string[] = []
      try {
        if (watch.images) {
          images = JSON.parse(watch.images)
        }
      } catch (e) {
        if (typeof watch.images === 'string') {
          images = watch.images.split(',').filter((img: string) => img.trim().length > 0)
        }
      }

      // Parse boosters
      let boosters: string[] = []
      try {
        if (watch.boosters) {
          boosters = JSON.parse(watch.boosters)
        }
      } catch (e) {
        boosters = []
      }

      return {
        ...watch,
        price: currentPrice,
        images: images,
        city: watch.seller?.city || null,
        postalCode: watch.seller?.postalCode || null,
        buyNowPrice: watch.buyNowPrice || null,
        isAuction: watch.isAuction || false,
        auctionEnd: watch.auctionEnd || null,
        createdAt: watch.createdAt,
        bids: watch.bids || [],
        boosters: boosters
      }
    })

    return NextResponse.json({ watches: watchesWithData })
  } catch (error) {
    console.error('Error fetching recommended watches:', error)
    return NextResponse.json({ error: 'Failed to fetch recommended watches' }, { status: 500 })
  }
}
