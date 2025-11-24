import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API-Endpoint für geboostete Produkte (Turbo-Boost und Super-Boost)
 * 
 * Query-Parameter:
 * - type: 'turbo-boost' | 'super-boost' | 'all' (default: 'all')
 * - limit: Anzahl der Produkte (default: 6)
 * 
 * Algorithmus:
 * - Super-Boost hat höchste Priorität
 * - Turbo-Boost hat zweithöchste Priorität
 * - Sortierung: Super-Boost zuerst, dann Turbo-Boost, dann nach Erstellungsdatum
 * - Nur aktive, nicht verkaufte Angebote
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const boosterType = searchParams.get('type') || 'all' // 'turbo-boost', 'super-boost', 'all'
    const limit = parseInt(searchParams.get('limit') || '6')

    // Basis-Where-Klausel: Nur aktive, nicht verkaufte Angebote
    const baseWhere = {
      purchases: {
        none: {} // Nicht verkauft
      }
    }

    // Erweitere Where-Klausel basierend auf Booster-Type
    // Da boosters ein JSON-String ist (z.B. '["super-boost"]'), suchen wir nach dem String
    let where: any = { ...baseWhere }

    if (boosterType === 'super-boost') {
      // Nur Super-Boost - suche nach "super-boost" im JSON-String
      where.boosters = {
        contains: 'super-boost'
      }
    } else if (boosterType === 'turbo-boost') {
      // Nur Turbo-Boost (aber keine Super-Boost)
      where.AND = [
        { boosters: { contains: 'turbo-boost' } },
        { 
          OR: [
            { boosters: { not: { contains: 'super-boost' } } },
            { boosters: null }
          ]
        }
      ]
    } else if (boosterType === 'all') {
      // Turbo-Boost ODER Super-Boost
      where.OR = [
        { boosters: { contains: 'turbo-boost' } },
        { boosters: { contains: 'super-boost' } }
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
            verified: true
          }
        },
        bids: {
          orderBy: {
            amount: 'desc'
          },
          take: 1
        },
        categories: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit * 2 // Hole mehr, um nach Sortierung zu filtern
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
        postalCode: watch.seller?.postalCode || null
      }
    })

    // Sortiere nach Booster-Priorität (wie bei Ricardo)
    // Algorithmus: Super-Boost > Turbo-Boost > Erstellungsdatum
    watchesWithBoosters = watchesWithBoosters.sort((a, b) => {
      const getBoostPriority = (boosters: string[]): number => {
        if (boosters.includes('super-boost')) return 4
        if (boosters.includes('turbo-boost')) return 3
        if (boosters.includes('boost')) return 2
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
      boosterType: boosterType
    })

  } catch (error: any) {
    console.error('[watches/boosted] Error:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden der geboosteten Produkte', error: error.message },
      { status: 500 }
    )
  }
}

