import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API-Endpoint für geboostete Produkte (Silber und Gold)
 * Ricardo-style naming: Bronze (basic), Silber (featured), Gold (premium)
 *
 * Query-Parameter:
 * - type: 'silber' | 'gold' | 'all' (default: 'all')
 * - limit: Anzahl der Produkte (default: 6)
 *
 * Algorithmus:
 * - Gold hat höchste Priorität
 * - Silber hat zweithöchste Priorität
 * - Sortierung: Gold zuerst, dann Silber, dann nach Erstellungsdatum
 * - Nur aktive, nicht verkaufte Angebote
 *
 * Note: Old naming (super-boost, turbo-boost) is still supported for backwards compatibility
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const boosterType = searchParams.get('type') || 'all' // 'turbo-boost', 'super-boost', 'all'
    const limit = parseInt(searchParams.get('limit') || '6')

    const now = new Date()

    // Basis-Where-Klausel: Nur aktive, nicht verkaufte Angebote
    // RICARDO-STYLE: Exclude blocked, removed, ended (not just rejected)
    const baseWhere = {
      AND: [
        {
          OR: [
            { moderationStatus: null },
            { moderationStatus: { notIn: ['rejected', 'blocked', 'removed', 'ended'] } },
          ],
        },
        {
          // Artikel die nicht verkauft sind ODER nur stornierte Purchases haben
          OR: [
            {
              purchases: {
                none: {}, // Keine Purchases vorhanden
              },
            },
            {
              purchases: {
                every: {
                  status: 'cancelled', // Alle Purchases sind storniert
                },
              },
            },
          ],
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
                        not: 'cancelled',
                      },
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    }

    // Erweitere Where-Klausel basierend auf Booster-Type
    // Da boosters ein JSON-String ist (z.B. '["super-boost"]'), suchen wir nach dem String
    const where: any = { ...baseWhere }

    if (boosterType === 'gold' || boosterType === 'super-boost') {
      // Gold (or legacy super-boost)
      where.OR = [{ boosters: { contains: 'gold' } }, { boosters: { contains: 'super-boost' } }]
    } else if (boosterType === 'silber' || boosterType === 'turbo-boost') {
      // Silber (or legacy turbo-boost), but not Gold
      where.AND = [
        {
          OR: [{ boosters: { contains: 'silber' } }, { boosters: { contains: 'turbo-boost' } }],
        },
        {
          AND: [
            { boosters: { not: { contains: 'gold' } } },
            { boosters: { not: { contains: 'super-boost' } } },
          ],
        },
      ]
    } else if (boosterType === 'all') {
      // Silber/Gold (or legacy turbo-boost/super-boost)
      where.OR = [
        { boosters: { contains: 'gold' } },
        { boosters: { contains: 'silber' } },
        { boosters: { contains: 'super-boost' } },
        { boosters: { contains: 'turbo-boost' } },
      ]
    }

    // Hole geboostete Produkte
    const watches = await prisma.watch.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            city: true,
            postalCode: true,
            verified: true,
          },
        },
        bids: {
          orderBy: {
            amount: 'desc',
          },
          take: 1,
        },
        categories: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit * 2, // Hole mehr, um nach Sortierung zu filtern
    })

    // Parse boosters und berechne aktuellen Preis
    let watchesWithBoosters = watches.map(watch => {
      const highestBid = watch.bids[0]
      const currentPrice = highestBid ? highestBid.amount : watch.price

      // Parse boosters
      let boosters: string[] = []
      try {
        if ((watch as any).boosters) {
          boosters = JSON.parse((watch as any).boosters)
        }
      } catch (e) {
        boosters = []
      }

      // Parse images - unterstütze sowohl JSON-Arrays als auch komma-separierte Strings
      let images: string[] = []
      try {
        if (watch.images) {
          // Versuche zuerst JSON zu parsen
          const parsed = JSON.parse(watch.images)
          if (Array.isArray(parsed)) {
            images = parsed
          } else {
            images = []
          }
        }
      } catch (e) {
        // Falls JSON-Parsing fehlschlägt, versuche komma-separierten String
        if (typeof watch.images === 'string') {
          images = watch.images.split(',').filter((img: string) => img.trim().length > 0)
        } else {
          images = []
        }
      }

      return {
        ...watch,
        price: currentPrice,
        images: images,
        boosters: boosters,
        city: watch.seller?.city || null,
        postalCode: watch.seller?.postalCode || null,
        buyNowPrice: watch.buyNowPrice || null,
        isAuction: watch.isAuction || false,
        auctionEnd: watch.auctionEnd || null,
        createdAt: watch.createdAt,
        bids: watch.bids || [],
      }
    })

    // Sortiere nach Booster-Priorität
    // Algorithmus: Gold > Silber > Bronze > Erstellungsdatum
    watchesWithBoosters = watchesWithBoosters.sort((a, b) => {
      const getBoostPriority = (boosters: string[]): number => {
        // Support both new (gold/silber/bronze) and legacy (super-boost/turbo-boost/boost) naming
        if (boosters.includes('gold') || boosters.includes('super-boost')) return 4
        if (boosters.includes('silber') || boosters.includes('turbo-boost')) return 3
        if (boosters.includes('bronze') || boosters.includes('boost')) return 2
        return 1
      }

      const priorityA = getBoostPriority(a.boosters || [])
      const priorityB = getBoostPriority(b.boosters || [])

      // Zuerst nach Booster-Priorität
      if (priorityA !== priorityB) {
        return priorityB - priorityA // Höhere Priorität zuerst
      }

      // Bei gleicher Priorität: nach Erstellungsdatum (neueste zuerst)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    // Limitiere auf gewünschte Anzahl
    watchesWithBoosters = watchesWithBoosters.slice(0, limit)

    return NextResponse.json({
      watches: watchesWithBoosters,
      count: watchesWithBoosters.length,
      boosterType: boosterType,
    })
  } catch (error: any) {
    console.error('[watches/boosted] Error:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden der geboosteten Produkte', error: error.message },
      { status: 500 }
    )
  }
}
