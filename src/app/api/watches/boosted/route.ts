import { getMainAddress } from '@/lib/address'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API-Endpoint für geboostete Produkte
 * Watch-out.ch Style: Boost (basic), Turbo-Boost (featured), Super-Boost (premium)
 *
 * Query-Parameter:
 * - type: 'turbo-boost' | 'super-boost' | 'all' (default: 'all')
 * - limit: Anzahl der Produkte (default: 6)
 *
 * Algorithmus:
 * - Super-Boost hat höchste Priorität
 * - Turbo-Boost hat zweithöchste Priorität
 * - Boost hat niedrigste Priorität
 * - Sortierung: Super-Boost zuerst, dann Turbo-Boost, dann Boost, dann nach Erstellungsdatum
 * - Nur aktive, nicht verkaufte Angebote
 *
 * Note: Old naming (gold, silber, bronze) is still supported for backwards compatibility
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

    if (boosterType === 'super-boost' || boosterType === 'gold') {
      // Super-Boost (or legacy gold)
      where.OR = [{ boosters: { contains: 'super-boost' } }, { boosters: { contains: 'gold' } }]
    } else if (boosterType === 'turbo-boost' || boosterType === 'silber') {
      // Turbo-Boost (or legacy silber), but not Super-Boost
      where.AND = [
        {
          OR: [{ boosters: { contains: 'turbo-boost' } }, { boosters: { contains: 'silber' } }],
        },
        {
          AND: [
            { boosters: { not: { contains: 'super-boost' } } },
            { boosters: { not: { contains: 'gold' } } },
          ],
        },
      ]
    } else if (boosterType === 'boost' || boosterType === 'bronze') {
      // Boost (or legacy bronze), but not Turbo-Boost or Super-Boost
      where.AND = [
        {
          OR: [{ boosters: { contains: 'boost' } }, { boosters: { contains: 'bronze' } }],
        },
        {
          AND: [
            { boosters: { not: { contains: 'super-boost' } } },
            { boosters: { not: { contains: 'gold' } } },
            { boosters: { not: { contains: 'turbo-boost' } } },
            { boosters: { not: { contains: 'silber' } } },
          ],
        },
      ]
    } else if (boosterType === 'all') {
      // All boosters (with backwards compat)
      where.OR = [
        { boosters: { contains: 'super-boost' } },
        { boosters: { contains: 'gold' } },
        { boosters: { contains: 'turbo-boost' } },
        { boosters: { contains: 'silber' } },
        { boosters: { contains: 'boost' } },
        { boosters: { contains: 'bronze' } },
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

    // Fetch seller addresses from UserAddress table
    const sellerIds = Array.from(new Set(watches.map(w => w.sellerId)))
    const sellerAddresses = await Promise.all(
      sellerIds.map(async id => ({
        sellerId: id,
        address: await getMainAddress(id),
      }))
    )
    const addressMap = new Map(sellerAddresses.map(sa => [sa.sellerId, sa.address]))

    // Parse boosters und berechne aktuellen Preis
    let watchesWithBoosters = watches.map(watch => {
      const sellerAddress = addressMap.get(watch.sellerId)
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
        city: sellerAddress?.city || null,
        postalCode: sellerAddress?.postalCode || null,
        buyNowPrice: watch.buyNowPrice || null,
        isAuction: watch.isAuction || false,
        auctionEnd: watch.auctionEnd || null,
        createdAt: watch.createdAt,
        bids: watch.bids || [],
      }
    })

    // Sortiere nach Booster-Priorität
    // Algorithmus: Super-Boost > Turbo-Boost > Boost > Erstellungsdatum (Watch-out.ch Style)
    watchesWithBoosters = watchesWithBoosters.sort((a, b) => {
      const getBoostPriority = (boosters: string[]): number => {
        // Watch-out.ch Style with backwards compat for gold/silber/bronze
        if (boosters.includes('super-boost') || boosters.includes('gold')) return 4
        if (boosters.includes('turbo-boost') || boosters.includes('silber')) return 3
        if (boosters.includes('boost') || boosters.includes('bronze')) return 2
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
