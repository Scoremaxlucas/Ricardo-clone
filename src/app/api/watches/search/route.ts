import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('Search query:', query)

    // Suche in der Datenbank - wenn keine Query, zeige alle Uhren
    const whereClause = query ? {
      OR: [
        { brand: { contains: query } },
        { model: { contains: query } },
        { title: { contains: query } },
        { description: { contains: query } },
        { referenceNumber: { contains: query } }
      ]
    } : {}

    const now = new Date()
    
    let watches = await prisma.watch.findMany({
      where: {
        ...whereClause,
        // Verkaufe Uhren ausschließen
        purchases: {
          none: {} // Keine Käufe = nicht verkauft
        },
        // Nur aktive Angebote anzeigen (kein Starttermin oder Starttermin bereits erreicht)
        OR: [
          { auctionStart: null },
          { auctionStart: { lte: now } }
        ]
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        bids: {
          orderBy: { amount: 'desc' },
          take: 1 // Nur das höchste Gebot
        }
      }
    })

    // Fallback: Case-insensitive Filter auf App-Seite, falls DB-Filters case-sensitive sind
    if (query && watches.length === 0) {
      const all = await prisma.watch.findMany({ 
        where: {
          // Verkaufe Uhren ausschließen
          purchases: {
            none: {} // Keine Käufe = nicht verkauft
          },
          // Nur aktive Angebote anzeigen (kein Starttermin oder Starttermin bereits erreicht)
          OR: [
            { auctionStart: null },
            { auctionStart: { lte: now } }
          ]
        },
        orderBy: { createdAt: 'desc' },
        include: {
          bids: {
            orderBy: { amount: 'desc' },
            take: 1
          },
          purchases: true
        }
      })
      const q = query.toLowerCase()
      watches = all
        .filter(w => w.purchases.length === 0) // Nochmal filtern für Sicherheit
        .filter(w => {
          const fields = [w.brand, w.model, w.title, w.description ?? '', w.referenceNumber ?? '']
          return fields.some(f => (f ?? '').toLowerCase().includes(q))
        })
        .slice(0, limit)
    }

    console.log('Found watches:', watches.length)

    // Konvertiere Bilder von JSON String zu Array und berechne aktuellen Preis
    let watchesWithImages = watches.map(watch => {
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
      
      return {
        ...watch,
        price: currentPrice, // Überschreibe price mit aktuellem Preis
        images: watch.images ? JSON.parse(watch.images) : [],
        boosters: boosters
      }
    })

    // Sortiere nach Booster-Priorität: super-boost > turbo-boost > boost > none
    watchesWithImages = watchesWithImages.sort((a, b) => {
      const getBoostPriority = (boosters: string[]): number => {
        if (boosters.includes('super-boost')) return 4
        if (boosters.includes('turbo-boost')) return 3
        if (boosters.includes('boost')) return 2
        return 1
      }
      
      const priorityA = getBoostPriority(a.boosters || [])
      const priorityB = getBoostPriority(b.boosters || [])
      
      if (priorityA !== priorityB) {
        return priorityB - priorityA // Höhere Priorität zuerst
      }
      
      // Bei gleicher Priorität: nach Erstellungsdatum sortieren
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return NextResponse.json({
      watches: watchesWithImages,
      total: watches.length
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { message: 'Ein Fehler ist aufgetreten bei der Suche: ' + error },
      { status: 500 }
    )
  }
}
