import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiCache, generateCacheKey } from '@/lib/api-cache'

/**
 * API-Route für präzise Marken-Anzahlen
 * Berechnet die Anzahl der Artikel pro Marke basierend auf allen Filtern (außer Marke selbst)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Check cache first
    const cacheKey = generateCacheKey('/api/watches/brand-counts', Object.fromEntries(searchParams))
    const cached = apiCache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Cache': 'HIT',
        },
      })
    }
    const category = searchParams.get('category') || ''
    const subcategory = searchParams.get('subcategory') || ''
    const isAuction = searchParams.get('isAuction')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const condition = searchParams.get('condition')
    const postalCode = searchParams.get('postalCode')
    const query = searchParams.get('q') || ''

    const now = new Date()

    // Baue whereClause mit allen Filtern außer Marke
    const whereClause: any = {
      purchases: {
        none: {},
      },
    }

    // Filter nach Angebotsart
    if (isAuction === 'true') {
      whereClause.isAuction = true
      whereClause.auctionEnd = {
        gt: now,
      }
    } else if (isAuction === 'false') {
      whereClause.isAuction = false
    }

    // Zustand-Filter
    if (condition) {
      whereClause.condition = condition
    }

    // Standort-Filter
    if (postalCode) {
      whereClause.seller = {
        postalCode: {
          contains: postalCode,
          mode: 'insensitive',
        },
      }
    }

    // Kategorie-Filter (wenn vorhanden)
    if (category) {
      // Verwende Keyword-basierte Filterung
      const categoryKeywords: Record<string, string[]> = {
        'auto-motorrad': [
          'fahrzeug',
          'pkw',
          'wagen',
          'bmw',
          'mercedes',
          'audi',
          'vw',
          'volkswagen',
          'porsche',
          'tesla',
          'ferrari',
          'lamborghini',
          'mclaren',
          'motorrad',
          'motorcycle',
          'bike',
          'ducati',
          'yamaha',
          'kawasaki',
          'honda',
          'suzuki',
        ],
        'uhren-schmuck': [
          'rolex',
          'omega',
          'submariner',
          'speedmaster',
          'datejust',
          'daytona',
          'seamaster',
          'aquanaut',
          'nautilus',
          'hublot',
          'breitling',
          'patek',
          'audemars',
          'cartier',
          'iwc',
          'panerai',
          'tag heuer',
          'tudor',
          'longines',
          'tissot',
        ],
        'computer-netzwerk': [
          'laptop',
          'notebook',
          'macbook',
          'thinkpad',
          'computer',
          'pc',
          'desktop',
          'tablet',
          'ipad',
          'monitor',
          'bildschirm',
          'drucker',
          'printer',
          'scanner',
          'tastatur',
          'keyboard',
          'maus',
          'mouse',
        ],
        'handy-telefon': ['handy', 'smartphone', 'iphone', 'galaxy', 'pixel', 'telefon', 'mobile'],
        'foto-optik': ['kamera', 'camera', 'spiegelreflex', 'objektiv', 'lens'],
        sport: [
          'fahrrad',
          'velo',
          'rennrad',
          'mountainbike',
          'e-bike',
          'fitness',
          'ski',
          'snowboard',
        ],
        'kleidung-accessoires': [
          'jacke',
          'jacket',
          'hose',
          'pants',
          'shirt',
          'hemd',
          'pullover',
          'schuhe',
          'shoes',
        ],
        'haushalt-wohnen': [
          'möbel',
          'furniture',
          'sofa',
          'couch',
          'tisch',
          'table',
          'stuhl',
          'chair',
        ],
        'handwerk-garten': [
          'werkzeug',
          'bohrmaschine',
          'säge',
          'hammer',
          'schraubenzieher',
          'rasenmäher',
          'garten',
        ],
        'games-konsolen': [
          'playstation',
          'xbox',
          'nintendo',
          'switch',
          'ps5',
          'ps4',
          'konsole',
          'console',
        ],
        'musik-instrumente': [
          'gitarre',
          'guitar',
          'piano',
          'klavier',
          'keyboard',
          'schlagzeug',
          'drums',
        ],
      }

      const keywords = categoryKeywords[category] || []
      if (keywords.length > 0) {
        whereClause.OR = keywords.map(keyword => ({
          OR: [
            { brand: { contains: keyword, mode: 'insensitive' } },
            { model: { contains: keyword, mode: 'insensitive' } },
            { title: { contains: keyword, mode: 'insensitive' } },
            { description: { contains: keyword, mode: 'insensitive' } },
          ],
        }))
      }
    }

    // Hole alle Artikel mit den Filtern
    let watches = await prisma.watch.findMany({
      where: whereClause,
      include: {
        bids: {
          orderBy: { amount: 'desc' },
        },
        seller: {
          select: {
            city: true,
            postalCode: true,
          },
        },
      },
    })

    // Wenn Suchbegriff vorhanden, filtere intelligent
    if (query) {
      const q = query.toLowerCase().trim()
      const queryWords = q.split(/\s+/).filter(w => w.length > 0)

      watches = watches.filter(watch => {
        const searchText =
          `${watch.brand} ${watch.model} ${watch.title} ${watch.description || ''}`.toLowerCase()
        return queryWords.some(word => searchText.includes(word))
      })
    }

    // Berechne aktuellen Preis und wende Preis-Filter an
    let watchesWithImages = watches.map(watch => {
      const highestBid = watch.bids[0]
      const currentPrice = highestBid ? highestBid.amount : watch.price
      return {
        ...watch,
        price: currentPrice,
      }
    })

    // Preis-Filter anwenden
    if (minPrice || maxPrice) {
      const min = minPrice ? parseFloat(minPrice) : 0
      const max = maxPrice ? parseFloat(maxPrice) : Infinity

      watchesWithImages = watchesWithImages.filter(watch => {
        return watch.price >= min && watch.price <= max
      })
    }

    // Zähle Marken
    const brandCounts: Record<string, number> = {}
    watchesWithImages.forEach(watch => {
      if (watch.brand) {
        const brand = watch.brand.trim()
        brandCounts[brand] = (brandCounts[brand] || 0) + 1
      }
    })

    return NextResponse.json({ brandCounts })
  } catch (error) {
    console.error('Error fetching brand counts:', error)
    return NextResponse.json({ brandCounts: {} }, { status: 500 })
  }
}
