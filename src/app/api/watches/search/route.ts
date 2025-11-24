import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Kategorie-Keyword-Mapping (spezifisch, um Verwechslungen zu vermeiden)
const categoryKeywords: Record<string, string[]> = {
  'auto-motorrad': ['fahrzeug', 'pkw', 'wagen', 'bmw', 'mercedes', 'audi', 'vw', 'volkswagen', 'porsche', 'tesla', 'ferrari', 'lamborghini', 'mclaren', 'motorrad', 'motorcycle', 'bike', 'ducati', 'yamaha', 'kawasaki', 'honda', 'suzuki', 'e-tron', 'amg', 'series', 'klasse'],
  'uhren-schmuck': ['rolex', 'omega', 'submariner', 'speedmaster', 'datejust', 'daytona', 'seamaster', 'aquanaut', 'nautilus', 'hublot', 'breitling', 'patek', 'audemars', 'cartier', 'iwc', 'panerai', 'tag heuer', 'tudor', 'longines', 'tissot', 'sinn', 'steinhart', 'armbanduhr', 'chronograph', 'taucheruhr'],
  'computer-netzwerk': ['laptop', 'notebook', 'macbook', 'thinkpad', 'computer', 'pc', 'desktop', 'tablet', 'ipad', 'monitor', 'bildschirm', 'drucker', 'printer', 'scanner', 'tastatur', 'keyboard', 'maus', 'mouse', 'dell', 'hp', 'lenovo', 'asus', 'acer', 'msi'],
  'handy-telefon': ['handy', 'smartphone', 'iphone', 'galaxy', 'pixel', 'telefon', 'mobile', 'samsung', 'huawei', 'xiaomi', 'oppo', 'oneplus', 'sony xperia'],
  'foto-optik': ['kamera', 'camera', 'spiegelreflex', 'objektiv', 'lens', 'canon', 'nikon', 'sony alpha', 'fuji', 'fujifilm', 'leica', 'panasonic', 'olympus', 'pentax', 'eos', 'lumix', 'gopro', 'drohne', 'drone', 'dji'],
  'sport': ['fahrrad', 'velo', 'rennrad', 'mountainbike', 'e-bike', 'fitness', 'ski', 'snowboard', 'camping', 'outdoor', 'trek', 'specialized', 'canyon', 'scott', 'cube', 'giant', 'garmin'],
  'kleidung-accessoires': ['jacke', 'jacket', 'hose', 'pants', 'shirt', 'hemd', 'pullover', 'schuhe', 'shoes', 'sneaker', 'tasche', 'bag', 'rucksack', 'nike', 'adidas', 'gucci', 'prada', 'louis vuitton', 'balenciaga', 'moncler'],
  'haushalt-wohnen': ['möbel', 'furniture', 'sofa', 'couch', 'tisch', 'table', 'stuhl', 'chair', 'lampe', 'lamp', 'teppich', 'carpet', 'küche', 'kitchen', 'staubsauger', 'vacuum', 'dyson', 'miele', 'kaffeemaschine', 'nespresso', 'jura'],
  'handwerk-garten': ['werkzeug', 'bohrmaschine', 'säge', 'hammer', 'schraubenzieher', 'rasenmäher', 'garten', 'grill', 'weber', 'bosch professional', 'makita', 'dewalt', 'stihl', 'husqvarna'],
  'games-konsolen': ['playstation', 'xbox', 'nintendo', 'switch', 'ps5', 'ps4', 'konsole', 'console', 'game', 'gaming'],
  'musik-instrumente': ['gitarre', 'guitar', 'piano', 'klavier', 'keyboard', 'schlagzeug', 'drums', 'yamaha', 'fender', 'gibson', 'roland'],
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category') || ''
    const subcategory = searchParams.get('subcategory') || ''
    const isAuction = searchParams.get('isAuction')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const condition = searchParams.get('condition')
    const brand = searchParams.get('brand')
    const postalCode = searchParams.get('postalCode')
    const sortBy = searchParams.get('sortBy') || 'relevance'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('Search params:', { query, category, subcategory, isAuction, minPrice, maxPrice, condition, brand, postalCode })

    const now = new Date()
    
    // Intelligente Such-Logik: Hole alle verfügbaren Artikel
    const whereClause: any = {
      purchases: {
        none: {} // Nur nicht verkaufte Produkte
      },
      seller: {
        // Nur Watches von existierenden Usern (nicht von gelöschten Usern)
        id: { not: null }
      }
    }
    
    // Filter nach Angebotsart (Auktion oder Sofortkauf)
    if (isAuction === 'true') {
      whereClause.isAuction = true
      const now = new Date()
      
      // Eine Auktion ist aktiv wenn:
      // 1. auctionEnd > now (noch nicht abgelaufen)
      // 2. UND (auctionStart ist null ODER auctionStart <= now) - Auktion hat begonnen
      whereClause.AND = [
        {
          auctionEnd: {
            gt: now // Noch nicht abgelaufen
          }
        },
        {
          OR: [
            { auctionStart: null }, // Kein Starttermin = startet sofort
            { auctionStart: { lte: now } } // Starttermin ist erreicht oder in der Vergangenheit
          ]
        }
      ]
    } else if (isAuction === 'false') {
      whereClause.isAuction = false
    }
    
    // Preis-Filter (wird später nach Berechnung des aktuellen Preises angewendet)
    // Für Auktionen wird der aktuelle Preis (höchstes Gebot) berücksichtigt
    
    // Zustand-Filter
    if (condition) {
      whereClause.condition = condition
    }
    
    // Marke-Filter - Exakte Übereinstimmung (case-insensitive)
    if (brand) {
      whereClause.brand = {
        equals: brand,
        mode: 'insensitive'
      }
    }
    
    // Standort-Filter (Postleitzahl)
    if (postalCode) {
      whereClause.seller = {
        postalCode: {
          contains: postalCode,
          mode: 'insensitive'
        }
      }
    }
    
    // Kategorie-Filter über Relation (categories -> category.slug)
    // Unterstützt sowohl slug als auch name für Rückwärtskompatibilität
    // SQLite ist standardmäßig case-insensitive, daher kein 'mode: insensitive' nötig
    if (category) {
      console.log(`[SEARCH] Filtering by category: ${category}`)
      const categorySlug = category.toLowerCase().trim()
      
      // Normalisiere verschiedene Varianten des Category-Slugs
      const categoryVariants = [
        categorySlug,
        category,
        category.toLowerCase(),
        category.toUpperCase(),
        categorySlug.replace(/-/g, '_'),
        categorySlug.replace(/_/g, '-')
      ]
      
      // Entferne Duplikate
      const uniqueVariants = [...new Set(categoryVariants)]
      
      whereClause.categories = {
        some: {
          category: {
            OR: [
              ...uniqueVariants.map(v => ({ slug: v })),
              { name: { equals: category, mode: 'insensitive' } },
              { name: { equals: categorySlug, mode: 'insensitive' } }
            ]
          }
        }
      }
      console.log(`[SEARCH] Category filter WHERE clause:`, JSON.stringify(whereClause.categories, null, 2))
      console.log(`[SEARCH] Category variants checked:`, uniqueVariants)
    }
    
    console.log('[SEARCH] WHERE clause before query:', JSON.stringify(whereClause, null, 2))
    
    // DEBUG: Prüfe alle Kategorien in der DB
    if (category) {
      const allCategories = await prisma.category.findMany({
        where: {
          OR: [
            { slug: { contains: category.toLowerCase() } },
            { name: { contains: category, mode: 'insensitive' } }
          ]
        }
      })
      console.log(`[SEARCH] DEBUG: Found ${allCategories.length} categories matching "${category}":`, allCategories.map(c => ({ id: c.id, name: c.name, slug: c.slug })))
      
      // Prüfe auch alle Watches mit Kategorien
      const watchesWithCategories = await prisma.watch.findMany({
        where: {
          purchases: { none: {} }
        },
        include: {
          categories: {
            include: {
              category: true
            }
          }
        },
        take: 10
      })
      console.log(`[SEARCH] DEBUG: Sample watches with categories:`)
      watchesWithCategories.forEach((w: any) => {
        const cats = w.categories?.map((c: any) => `${c.category?.name} (${c.category?.slug})`).join(', ') || 'NONE'
        console.log(`  - ${w.title}: [${cats}]`)
      })
    }
    
    // WICHTIG: Wenn Kategorie-Filter gesetzt ist, aber keine Watches gefunden werden,
    // entferne den Kategorie-Filter temporär, um alle Watches zu holen
    // Dann filtern wir später manuell
    let watches: any[] = []
    let removedCategoryFilter = false
    
    if (category && whereClause.categories) {
      // Versuche zuerst mit Kategorie-Filter
      watches = await prisma.watch.findMany({
        where: whereClause,
        include: {
          bids: {
            orderBy: { amount: 'desc' }
          },
          seller: {
            select: {
              city: true,
              postalCode: true
            }
          },
          categories: {
            include: {
              category: true
            }
          },
          purchases: {
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' }
      })
      
      console.log(`[SEARCH] Prisma query with category filter: ${watches.length} watches`)
      
      // Wenn keine Watches gefunden wurden, entferne Kategorie-Filter und hole alle
      if (watches.length === 0) {
        console.log(`[SEARCH] No watches found with category filter, removing category filter and fetching all watches`)
        removedCategoryFilter = true
        
        const whereClauseWithoutCategory = { ...whereClause }
        delete whereClauseWithoutCategory.categories
        
        watches = await prisma.watch.findMany({
          where: whereClauseWithoutCategory,
          include: {
            bids: {
              orderBy: { amount: 'desc' }
            },
            seller: {
              select: {
                city: true,
                postalCode: true
              }
            },
            categories: {
              include: {
                category: true
              }
            },
            purchases: {
              take: 1
            }
          },
          orderBy: { createdAt: 'desc' }
        })
        
        console.log(`[SEARCH] Prisma query without category filter: ${watches.length} watches`)
      }
    } else {
      // Kein Kategorie-Filter, normale Abfrage
      watches = await prisma.watch.findMany({
        where: whereClause,
        include: {
          bids: {
            orderBy: { amount: 'desc' }
          },
          seller: {
            select: {
              city: true,
              postalCode: true
            }
          },
          categories: {
            include: {
              category: true
            }
          },
          purchases: {
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' }
      })
      
      console.log('[SEARCH] Prisma query result:', watches.length, 'watches')
    }
    
    // DEBUG: Zeige Kategorien der gefundenen Watches
    if (category && watches.length > 0) {
      console.log(`[SEARCH] DEBUG: Categories of found watches:`)
      watches.slice(0, 5).forEach((w: any, idx: number) => {
        const cats = w.categories?.map((c: any) => `${c.category?.name} (${c.category?.slug})`).join(', ') || 'NONE'
        console.log(`  ${idx + 1}. ${w.title}: [${cats}]`)
      })
    } else if (category && watches.length === 0) {
      console.log(`[SEARCH] DEBUG: No watches found with category filter "${category}"`)
      // Prüfe ob es überhaupt Watches ohne Purchases gibt
      const allWatches = await prisma.watch.findMany({
        where: { purchases: { none: {} } },
        take: 5,
        include: {
          categories: {
            include: {
              category: true
            }
          }
        }
      })
      console.log(`[SEARCH] DEBUG: Found ${allWatches.length} watches without purchases:`)
      allWatches.forEach((w: any) => {
        const cats = w.categories?.map((c: any) => `${c.category?.name} (${c.category?.slug})`).join(', ') || 'NONE'
        console.log(`  - ${w.title}: [${cats}]`)
      })
    }
    if (watches.length === 0) {
      // Debug: Prüfe ob Prisma überhaupt Watches findet
      const allWatches = await prisma.watch.findMany({ take: 5 })
      console.log('[SEARCH] DEBUG: Total watches in DB:', allWatches.length)
      const watchesWithoutPurchases = await prisma.watch.findMany({
        where: { purchases: { none: {} } },
        take: 5
      })
      console.log('[SEARCH] DEBUG: Watches without purchases:', watchesWithoutPurchases.length)
    }
    
    // Filtere verkaufte Produkte raus (sicher mit Type-Check)
    // WICHTIG: purchases wurde bereits durch whereClause gefiltert, daher sollten alle Watches purchases.length === 0 haben
    const beforePurchaseFilter = watches.length
    watches = watches.filter((watch: any) => {
      try {
        const hasPurchases = watch.purchases && Array.isArray(watch.purchases) && watch.purchases.length > 0
        if (hasPurchases) {
          console.log(`[SEARCH] Filtering out watch ${watch.id} - has ${watch.purchases.length} purchases`)
        }
        return !hasPurchases
      } catch (e) {
        console.error('Error filtering purchases:', e, 'watch:', watch?.id)
        return true // Bei Fehler: behalte das Produkt
      }
    })
    console.log(`[SEARCH] Purchase filter: ${beforePurchaseFilter} -> ${watches.length} watches`)
    console.log(`[SEARCH] Category filter: ${category || 'none'}, Subcategory: ${subcategory || 'none'}`)
    
    // Debug: Zeige Kategorien der gefundenen Watches
    if (category && watches.length > 0) {
      console.log(`[SEARCH] Sample watches with categories:`)
      watches.slice(0, 3).forEach((w: any, idx: number) => {
        const categorySlugs = w.categories?.map((cat: any) => cat.category?.slug).filter(Boolean) || []
        const categoryNames = w.categories?.map((cat: any) => cat.category?.name).filter(Boolean) || []
        console.log(`  Watch ${idx + 1}: ${w.title} - Categories: [${categorySlugs.join(', ')}] / [${categoryNames.join(', ')}]`)
      })
    }

    // Wenn Suchbegriff vorhanden, filtere intelligent mit Relevanz-Ranking
    if (query) {
      const q = query.trim()
      const qLower = q.toLowerCase()
      const queryWords = qLower.split(/\s+/).filter(w => w.length > 0)
      
      // Prüfe ob es eine Artikelnummer ist
      // 1. Numerische Artikelnummer (8-stellig, z.B. 12345678)
      // 2. CUID Format (beginnt mit 'c', 25 Zeichen)
      // 3. Lange alphanumerische ID
      const isNumericArticleNumber = /^\d{6,10}$/.test(q) // 6-10 stellige Nummer
      const isCuid = q.length >= 20 && q.startsWith('c')
      const isLongId = q.length >= 20 && /^[a-z0-9]{20,}$/i.test(q)
      
      if (isNumericArticleNumber || isCuid || isLongId) {
        // Suche nach Artikelnummer ODER ID
        const searchWhereClause: any = {
          purchases: {
            none: {}
          }
        }
        
        if (isNumericArticleNumber) {
          // Suche nach benutzerfreundlicher Artikelnummer
          searchWhereClause.articleNumber = parseInt(q)
        } else {
          // Suche nach technischer ID
          searchWhereClause.id = q
        }
        
        const watchById = await prisma.watch.findFirst({
          where: searchWhereClause,
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                nickname: true,
                city: true,
                postalCode: true,
                verified: true,
                verificationStatus: true
              }
            },
            categories: {
              include: {
                category: true
              }
            },
            bids: {
              orderBy: { amount: 'desc' },
              take: 1
            },
            purchases: {
              take: 1
            }
          }
        })
        
        if (watchById) {
          // Parse images und boosters
          let images: string[] = []
          let boosters: string[] = []
          try {
            if (watchById.images) images = JSON.parse(watchById.images)
            if (watchById.boosters) boosters = JSON.parse(watchById.boosters)
          } catch (e) {
            console.error('Error parsing watch data:', e)
          }
          
          const highestBid = watchById.bids?.[0]
          const currentPrice = highestBid ? highestBid.amount : watchById.price
          
          return NextResponse.json({
            watches: [{
              ...watchById,
              images,
              boosters,
              price: currentPrice,
              city: watchById.seller?.city || null,
              postalCode: watchById.seller?.postalCode || null
            }],
            total: 1,
            limit,
            offset
          })
        }
        
        // Wenn keine direkte ID gefunden, suche weiter normal
      }
      
      // Spezial-Behandlung für häufige Suchbegriffe
      const specialSearchMappings: Record<string, string[]> = {
        'auto': ['audi', 'bmw', 'mercedes', 'porsche', 'tesla', 'ferrari', 'lamborghini', 'volkswagen'],
        'uhr': ['rolex', 'omega', 'breitling', 'tag heuer', 'patek', 'tissot', 'longines', 'iwc'],
        'handy': ['iphone', 'samsung', 'google pixel', 'xiaomi', 'oneplus'],
        'laptop': ['macbook', 'thinkpad', 'dell', 'hp', 'asus'],
        'kamera': ['canon', 'nikon', 'sony', 'fuji', 'leica'],
      }
      
      // Wenn Spezial-Mapping existiert, verwende es
      if (specialSearchMappings[q]) {
        const brands = specialSearchMappings[q]
        watches = watches.filter(watch => {
          const brandLower = (watch.brand || '').toLowerCase()
          const titleLower = (watch.title || '').toLowerCase()
          return brands.some(b => brandLower.includes(b) || titleLower.includes(b))
        })
      } else {
        // Verbesserte präzise Suche mit intelligenter Relevanz-Berechnung
        const watchesWithScore = watches.map(watch => {
          // Parse boosters für Priorität
          let boosters: string[] = []
          try {
            if ((watch as any).boosters) {
              boosters = JSON.parse((watch as any).boosters)
            }
          } catch (e) {
            boosters = []
          }
          
          const brandLower = (watch.brand || '').toLowerCase().trim()
          const modelLower = (watch.model || '').toLowerCase().trim()
          const titleLower = (watch.title || '').toLowerCase().trim()
          const descLower = (watch.description || '').toLowerCase().trim()
          const refLower = (watch.referenceNumber || '').toLowerCase().trim()
          
          const searchText = `${brandLower} ${modelLower} ${titleLower} ${descLower} ${refLower}`
          let relevanceScore = 0
          let matches = false
          
          // Booster-Priorität zu Relevanz-Score hinzufügen (wie bei Ricardo)
          if (boosters.includes('super-boost')) {
            relevanceScore += 10000 // Sehr hoher Bonus für Super-Boost
          } else if (boosters.includes('turbo-boost')) {
            relevanceScore += 5000 // Hoher Bonus für Turbo-Boost
          } else if (boosters.includes('boost')) {
            relevanceScore += 2000 // Bonus für Boost
          }
          
          // Exakte Übereinstimmung (höchste Priorität) - 1000 Punkte
          if (searchText === q || brandLower === q || modelLower === q || titleLower === q) {
            relevanceScore = 1000
            matches = true
          } else {
            // Multi-Wort Matching mit Gewichtung
            let allWordsMatch = true
            let exactWordMatches = 0
            
            for (const word of queryWords) {
              if (word.length < 2) continue
              
              const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
              const exactMatchRegex = new RegExp(`\\b${escapedWord}\\b`, 'i')
              const partialMatchRegex = new RegExp(escapedWord, 'i')
              
              let wordMatched = false
              
              // Exakte Wort-Übereinstimmung (Word Boundary) - höchste Priorität
              if (exactMatchRegex.test(brandLower)) {
                relevanceScore += 150
                wordMatched = true
                exactWordMatches++
              } else if (exactMatchRegex.test(modelLower)) {
                relevanceScore += 120
                wordMatched = true
                exactWordMatches++
              } else if (exactMatchRegex.test(titleLower)) {
                relevanceScore += 100
                wordMatched = true
                exactWordMatches++
              } else if (exactMatchRegex.test(refLower)) {
                relevanceScore += 90
                wordMatched = true
                exactWordMatches++
              } else if (exactMatchRegex.test(descLower)) {
                relevanceScore += 40
                wordMatched = true
                exactWordMatches++
              }
              // Teil-Übereinstimmung - niedrigere Priorität
              else if (partialMatchRegex.test(brandLower)) {
                relevanceScore += 50
                wordMatched = true
              } else if (partialMatchRegex.test(modelLower)) {
                relevanceScore += 40
                wordMatched = true
              } else if (partialMatchRegex.test(titleLower)) {
                relevanceScore += 30
                wordMatched = true
              } else if (partialMatchRegex.test(descLower)) {
                relevanceScore += 10
                wordMatched = true
              }
              
              if (!wordMatched) {
                allWordsMatch = false
              }
            }
            
            // Bonus für alle Wörter gefunden
            if (allWordsMatch && queryWords.length > 1) {
              relevanceScore += 200
            }
            
            // Bonus für viele exakte Wort-Übereinstimmungen
            if (exactWordMatches === queryWords.length && queryWords.length > 1) {
              relevanceScore += 300
            }
            
            matches = relevanceScore > 0
          }
          
          return { watch, relevanceScore, matches }
        })
        
        watches = watchesWithScore
          .filter(item => item.matches)
          .sort((a, b) => {
            // Sortiere nach Relevanz-Score (inkl. Booster-Priorität)
            if (b.relevanceScore !== a.relevanceScore) {
              return b.relevanceScore - a.relevanceScore
            }
            // Bei gleichem Score: nach Erstellungsdatum (neueste zuerst)
            return new Date(b.watch.createdAt).getTime() - new Date(a.watch.createdAt).getTime()
          })
          .map(item => item.watch)
      }
    } else if (category) {
      // Nur Kategorie-Filter ohne Suchbegriff
      // Die Kategorie wurde bereits in der Datenbank-Abfrage gefiltert
      // KEIN Fallback - nur Produkte aus der gewählten Kategorie werden angezeigt
      
      // Sortiere nach Booster-Priorität (wie bei Ricardo)
      const getBoostPriority = (boosters: string[]): number => {
        if (boosters.includes('super-boost')) return 4
        if (boosters.includes('turbo-boost')) return 3
        if (boosters.includes('boost')) return 2
        return 1
      }
      
      watches = watches.sort((a, b) => {
        // Parse boosters
        let boostersA: string[] = []
        let boostersB: string[] = []
        try {
          if ((a as any).boosters) {
            boostersA = JSON.parse((a as any).boosters)
          }
          if ((b as any).boosters) {
            boostersB = JSON.parse((b as any).boosters)
          }
        } catch (e) {
          // Ignore
        }
        
        const priorityA = getBoostPriority(boostersA)
        const priorityB = getBoostPriority(boostersB)
        
        if (priorityA !== priorityB) {
          return priorityB - priorityA // Höhere Priorität zuerst
        }
        
        // Bei gleicher Priorität: nach Erstellungsdatum (neueste zuerst)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    }

    // Fallback: Case-insensitive Filter auf App-Seite, falls DB-Filters case-sensitive sind
    // WICHTIG: Respektiere Kategorie-Filter auch im Fallback
    if (query && watches.length === 0) {
      const fallbackWhere: any = {
        purchases: {
          none: {} // Keine Käufe = nicht verkauft
        }
      }
      
      // Wenn Kategorie angegeben, MUSS sie auch im Fallback respektiert werden
      if (category) {
        fallbackWhere.categories = {
          some: {
            category: {
              slug: category
            }
          }
        }
      }
      
      const all = await prisma.watch.findMany({ 
        where: fallbackWhere,
        orderBy: { createdAt: 'desc' },
        include: {
          bids: {
            orderBy: { amount: 'desc' },
            take: 1
          },
          purchases: true,
          categories: {
            include: {
              category: true
            }
          }
        }
      })
      const q = query.toLowerCase()
      watches = all
        .filter(w => w.purchases.length === 0) // Nochmal filtern für Sicherheit
        .filter(w => {
          // Wenn Kategorie angegeben, stelle sicher dass Produkt zur Kategorie gehört
          if (category) {
            const belongsToCategory = w.categories?.some((cat: any) => 
              cat.category?.slug === category
            )
            if (!belongsToCategory) {
              return false
            }
          }
          
          const fields = [w.brand, w.model, w.title, w.description ?? '', w.referenceNumber ?? '']
          return fields.some(f => (f ?? '').toLowerCase().includes(q))
        })
        .slice(0, limit)
    }

    console.log('Found watches:', watches.length)
    console.log('[SEARCH] Processing watches, query:', query || 'none', 'category:', category || 'none')

    // Konvertiere Bilder von JSON String zu Array und berechne aktuellen Preis
    let watchesWithImages = watches.map((watch: any) => {
      try {
        const highestBid = watch.bids?.[0]
        const currentPrice = highestBid ? highestBid.amount : (watch.price || 0)
        
        // Parse boosters
        let boosters: string[] = []
        try {
          if (watch.boosters) {
            if (Array.isArray(watch.boosters)) {
              boosters = watch.boosters
            } else if (typeof watch.boosters === 'string') {
              boosters = JSON.parse(watch.boosters)
            }
          }
        } catch (e) {
          boosters = []
        }
        
        // Parse images sicher
        let images: string[] = []
        try {
          if (watch.images) {
            if (Array.isArray(watch.images)) {
              images = watch.images
            } else if (typeof watch.images === 'string') {
              // Prüfe ob es JSON ist oder eine einfache URL
              if (watch.images.trim().startsWith('[') || watch.images.trim().startsWith('{')) {
                // JSON Format
                images = JSON.parse(watch.images)
              } else if (watch.images.trim().startsWith('http')) {
                // Einzelne URL
                images = [watch.images]
              } else {
                // Versuche trotzdem JSON zu parsen, falls es ein String-Array ist
                try {
                  images = JSON.parse(watch.images)
                } catch {
                  // Falls Parsing fehlschlägt, behandle als einzelne URL
                  images = watch.images.trim() ? [watch.images] : []
                }
              }
            }
          }
        } catch (e) {
          // Bei Fehler: versuche als einzelne URL zu behandeln
          if (watch.images && typeof watch.images === 'string' && watch.images.trim().startsWith('http')) {
            images = [watch.images]
          } else {
            images = []
          }
        }
        
        // Extrahiere Kategorie-Slugs für Filterung
        const categorySlugs = watch.categories?.map((cat: any) => cat.category?.slug).filter(Boolean) || []
        const categoryNames = watch.categories?.map((cat: any) => cat.category?.name).filter(Boolean) || []
        
        // DEBUG: Log Kategorien für Auto-Motorrad
        if (category === 'auto-motorrad' && (watch.title?.toLowerCase().includes('auto') || watch.title?.toLowerCase().includes('motorrad') || watch.brand?.toLowerCase().includes('bmw') || watch.brand?.toLowerCase().includes('mercedes'))) {
          console.log(`[SEARCH] DEBUG Watch: ${watch.title} - categorySlugs: [${categorySlugs.join(', ')}], categoryNames: [${categoryNames.join(', ')}]`)
        }
        
        return {
          id: watch.id,
          title: watch.title || '',
          description: watch.description || '',
          brand: watch.brand || '',
          model: watch.model || '',
          price: currentPrice,
          buyNowPrice: watch.buyNowPrice || null,
          condition: watch.condition || '',
          year: watch.year || null,
          images: images,
          boosters: boosters,
          isAuction: watch.isAuction || false,
          auctionEnd: watch.auctionEnd || null,
          auctionStart: watch.auctionStart || null,
          city: watch.seller?.city || null,
          postalCode: watch.seller?.postalCode || null,
          bids: watch.bids || [],
          createdAt: watch.createdAt,
          updatedAt: watch.updatedAt,
          sellerId: watch.sellerId,
          seller: watch.seller ? {
            city: watch.seller.city,
            postalCode: watch.seller.postalCode
          } : null,
          categorySlugs: categorySlugs // Für Kategorie-Filterung
        }
      } catch (e) {
        console.error('Error processing watch:', watch?.id, e)
        return null
      }
    }).filter((w: any) => w !== null)
    
    console.log('[SEARCH] After image processing:', watchesWithImages.length, 'watches')

    // Preis-Filter anwenden (nach Berechnung des aktuellen Preises)
    if (minPrice || maxPrice) {
      const min = minPrice ? parseFloat(minPrice) : 0
      const max = maxPrice ? parseFloat(maxPrice) : Infinity
      
      watchesWithImages = watchesWithImages.filter(watch => {
        const currentPrice = watch.price
        return currentPrice >= min && currentPrice <= max
      })
    }
    
    // Kategorie-Filterung: Zeige Produkte mit Kategorie-Verknüpfung ODER Fallback-basierte Zuordnung
    // WICHTIG: Wenn KEINE Kategorie ausgewählt ist, zeige ALLE Artikel an (auch ohne Kategorie)
    if (category) {
      const beforeFilter = watchesWithImages.length
      console.log(`[SEARCH] Before category filter: ${beforeFilter} watches, category: "${category}"`)
      
      const categorySlug = category.toLowerCase().trim()
      const categoryVariants = [
        categorySlug,
        category,
        category.toLowerCase(),
        category.toUpperCase(),
        categorySlug.replace(/-/g, '_'),
        categorySlug.replace(/_/g, '-')
      ]
      
      // Kategorie-Keywords für Fallback-Zuordnung (erweitert)
      const categoryKeywords: Record<string, string[]> = {
        'auto-motorrad': ['auto', 'fahrzeug', 'pkw', 'wagen', 'motorrad', 'motorcycle', 'bike', 'bmw', 'mercedes', 'audi', 'vw', 'volkswagen', 'porsche', 'tesla', 'ferrari', 'lamborghini', 'mclaren', 'ducati', 'yamaha', 'kawasaki', 'honda', 'suzuki', 'ford', 'opel', 'renault', 'peugeot', 'citroen', 'fiat', 'seat', 'skoda', 'toyota', 'nissan', 'mazda', 'subaru', 'mitsubishi', 'hyundai', 'kia', 'volvo', 'saab', 'jaguar', 'land rover', 'range rover', 'mini', 'smart', 'fiat', 'alfa romeo', 'maserati', 'bentley', 'rolls-royce', 'aston martin', 'mclaren', 'lamborghini', 'ferrari', 'pagani', 'koenigsegg'],
        'uhren-schmuck': ['uhr', 'watch', 'rolex', 'omega', 'armbanduhr', 'schmuck', 'ring', 'kette', 'ohrring'],
        'computer-netzwerk': ['laptop', 'notebook', 'computer', 'pc', 'tablet', 'macbook', 'thinkpad', 'desktop'],
        'handy-telefon': ['handy', 'smartphone', 'iphone', 'telefon', 'mobile', 'samsung', 'galaxy'],
        'foto-optik': ['kamera', 'camera', 'objektiv', 'lens', 'canon', 'nikon', 'sony'],
        'sport': ['fahrrad', 'velo', 'rennrad', 'mountainbike', 'e-bike', 'fitness', 'ski', 'snowboard'],
        'kleidung-accessoires': ['jacke', 'hose', 'shirt', 'schuhe', 'sneaker', 'pullover', 'hemd'],
        'haushalt-wohnen': ['möbel', 'sofa', 'tisch', 'stuhl', 'lampe', 'schrank', 'bett'],
        'handwerk-garten': ['werkzeug', 'garten', 'rasenmäher', 'grill', 'bohrmaschine', 'säge'],
        'games-konsolen': ['playstation', 'xbox', 'nintendo', 'switch', 'konsole', 'ps5', 'ps4'],
        'musik-instrumente': ['gitarre', 'guitar', 'piano', 'klavier', 'keyboard', 'schlagzeug']
      }
      
      // Zuerst: Prüfe ob überhaupt Artikel mit Kategorie-Verknüpfung gefunden wurden
      const watchesWithCategoryLink = watchesWithImages.filter(watch => {
        return watch.categorySlugs?.some(slug => {
          const slugLower = slug?.toLowerCase().trim()
          return categoryVariants.some(variant => {
            const variantLower = variant.toLowerCase().trim()
            return slugLower === variantLower || 
                   slugLower?.includes(variantLower) || 
                   variantLower.includes(slugLower || '')
          })
        })
      })
      
      console.log(`[SEARCH] Watches with category link: ${watchesWithCategoryLink.length} out of ${beforeFilter}`)
      
      // Wenn keine Artikel mit Kategorie-Verknüpfung gefunden wurden, verwende Fallback
      if (watchesWithCategoryLink.length === 0) {
        console.log(`[SEARCH] No watches with category link found, using keyword fallback for "${categorySlug}"`)
        const keywords = categoryKeywords[categorySlug] || []
        console.log(`[SEARCH] Using keywords:`, keywords.slice(0, 10))
        
        watchesWithImages = watchesWithImages.filter(watch => {
          const searchText = `${watch.brand} ${watch.model} ${watch.title} ${watch.description || ''}`.toLowerCase()
          const matchesKeywords = keywords.some(keyword => searchText.includes(keyword.toLowerCase()))
          
          if (matchesKeywords) {
            console.log(`[SEARCH] ✅ Fallback match: "${watch.title}" matched category "${category}" via keywords`)
            // Wenn Subkategorie angegeben, filtere auch danach
            if (subcategory) {
              const subcatLower = subcategory.toLowerCase()
              return searchText.includes(subcatLower)
            }
            return true
          }
          return false
        })
      } else {
        // Verwende normale Filterung mit Kategorie-Verknüpfung
        watchesWithImages = watchesWithImages.filter(watch => {
          // 1. Prüfe ob das Produkt eine Kategorie-Verknüpfung hat
          const hasCategoryLink = watch.categorySlugs?.some(slug => {
            const slugLower = slug?.toLowerCase().trim()
            return categoryVariants.some(variant => {
              const variantLower = variant.toLowerCase().trim()
              return slugLower === variantLower || 
                     slugLower?.includes(variantLower) || 
                     variantLower.includes(slugLower || '')
            })
          })
          
          if (hasCategoryLink) {
            // Wenn Subkategorie angegeben, filtere auch danach
            if (subcategory) {
              const subcatLower = subcategory.toLowerCase()
              const searchText = `${watch.brand} ${watch.model} ${watch.title} ${watch.description || ''}`.toLowerCase()
              return searchText.includes(subcatLower)
            }
            return true
          }
          
          // 2. Fallback: Prüfe ob das Produkt basierend auf Keywords zur Kategorie passt
          const keywords = categoryKeywords[categorySlug] || []
          if (keywords.length > 0) {
            const searchText = `${watch.brand} ${watch.model} ${watch.title} ${watch.description || ''}`.toLowerCase()
            const matchesKeywords = keywords.some(keyword => searchText.includes(keyword.toLowerCase()))
            
            if (matchesKeywords) {
              console.log(`[SEARCH] ✅ Fallback match: "${watch.title}" matched category "${category}" via keywords`)
              // Wenn Subkategorie angegeben, filtere auch danach
              if (subcategory) {
                const subcatLower = subcategory.toLowerCase()
                return searchText.includes(subcatLower)
              }
              return true
            }
          }
          
          // 3. Keine Übereinstimmung gefunden
          return false
        })
      }
      
      console.log(`[SEARCH] Category filter applied: ${beforeFilter} -> ${watchesWithImages.length} watches (category: ${category})`)
    } else if (subcategory) {
      // Nur Subkategorie ohne Hauptkategorie
      const subcatLower = subcategory.toLowerCase()
      watchesWithImages = watchesWithImages.filter(watch => {
        const searchText = `${watch.brand} ${watch.model} ${watch.title} ${watch.description || ''}`.toLowerCase()
        return searchText.includes(subcatLower)
      })
    } else {
      // KEINE Kategorie-Filter: Zeige ALLE Artikel an (inkl. Artikel ohne Kategorie)
      console.log(`No category filter: Showing all ${watchesWithImages.length} watches (including watches without category)`)
    }

    // Hilfsfunktion für Booster-Priorität (wie bei Ricardo)
    const getBoostPriority = (boosters: string[]): number => {
      if (boosters.includes('super-boost')) return 4
      if (boosters.includes('turbo-boost')) return 3
      if (boosters.includes('boost')) return 2
      return 1
    }

    // Sortierung anwenden (wie bei Ricardo: Booster-Priorität hat IMMER Vorrang)
    if (sortBy === 'relevance') {
      // Sortiere nach Booster-Priorität: super-boost > turbo-boost > boost > none
      watchesWithImages = watchesWithImages.sort((a, b) => {
        const priorityA = getBoostPriority(a.boosters || [])
        const priorityB = getBoostPriority(b.boosters || [])
        
        if (priorityA !== priorityB) {
          return priorityB - priorityA // Höhere Priorität zuerst
        }
        
        // Bei gleicher Priorität: nach Erstellungsdatum sortieren
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    } else if (sortBy === 'ending') {
      // Endet bald (nur für Auktionen relevant)
      // ABER: Booster-Priorität hat Vorrang (wie bei Ricardo)
      watchesWithImages = watchesWithImages.sort((a, b) => {
        const priorityA = getBoostPriority(a.boosters || [])
        const priorityB = getBoostPriority(b.boosters || [])
        
        // Zuerst nach Booster-Priorität
        if (priorityA !== priorityB) {
          return priorityB - priorityA
        }
        
        // Dann nach Enddatum
        if (!a.auctionEnd && !b.auctionEnd) return 0
        if (!a.auctionEnd) return 1
        if (!b.auctionEnd) return -1
        return new Date(a.auctionEnd).getTime() - new Date(b.auctionEnd).getTime()
      })
    } else if (sortBy === 'newest') {
      // Neuheit - ABER: Booster-Priorität hat Vorrang
      watchesWithImages = watchesWithImages.sort((a, b) => {
        const priorityA = getBoostPriority(a.boosters || [])
        const priorityB = getBoostPriority(b.boosters || [])
        
        // Zuerst nach Booster-Priorität
        if (priorityA !== priorityB) {
          return priorityB - priorityA
        }
        
        // Dann nach Erstellungsdatum
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    } else if (sortBy === 'price-low') {
      // Tiefster Preis - ABER: Booster-Priorität hat Vorrang
      watchesWithImages = watchesWithImages.sort((a, b) => {
        const priorityA = getBoostPriority(a.boosters || [])
        const priorityB = getBoostPriority(b.boosters || [])
        
        // Zuerst nach Booster-Priorität
        if (priorityA !== priorityB) {
          return priorityB - priorityA
        }
        
        // Dann nach Preis
        return a.price - b.price
      })
    } else if (sortBy === 'price-high') {
      // Höchster Preis - ABER: Booster-Priorität hat Vorrang
      watchesWithImages = watchesWithImages.sort((a, b) => {
        const priorityA = getBoostPriority(a.boosters || [])
        const priorityB = getBoostPriority(b.boosters || [])
        
        // Zuerst nach Booster-Priorität
        if (priorityA !== priorityB) {
          return priorityB - priorityA
        }
        
        // Dann nach Preis
        return b.price - a.price
      })
    } else if (sortBy === 'bids') {
      // Meiste Gebote - ABER: Booster-Priorität hat Vorrang
      watchesWithImages = watchesWithImages.sort((a, b) => {
        const priorityA = getBoostPriority(a.boosters || [])
        const priorityB = getBoostPriority(b.boosters || [])
        
        // Zuerst nach Booster-Priorität
        if (priorityA !== priorityB) {
          return priorityB - priorityA
        }
        
        // Dann nach Anzahl Gebote
        const bidsA = a.bids?.length || 0
        const bidsB = b.bids?.length || 0
        return bidsB - bidsA
      })
    } else {
      // Standard: Nach Booster-Priorität sortieren (wie bei Ricardo)
      watchesWithImages = watchesWithImages.sort((a, b) => {
        const priorityA = getBoostPriority(a.boosters || [])
        const priorityB = getBoostPriority(b.boosters || [])
        
        if (priorityA !== priorityB) {
          return priorityB - priorityA
        }
        
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    }

    // Limit und Offset anwenden
    const limitedWatches = watchesWithImages.slice(offset, offset + limit)
    
    console.log(`Returning ${limitedWatches.length} watches (limit: ${limit}, offset: ${offset}, total: ${watchesWithImages.length})`)
    if (limitedWatches.length > 0) {
      console.log(`Sample watch IDs: ${limitedWatches.slice(0, 3).map((w: any) => w.id).join(', ')}`)
    }
    
    return NextResponse.json({
      watches: limitedWatches,
      total: watchesWithImages.length
    })
  } catch (error: any) {
    console.error('Search error:', error)
    console.error('Error stack:', error?.stack)
    return NextResponse.json(
      { 
        error: 'Ein Fehler ist aufgetreten bei der Suche',
        message: error?.message || String(error),
        watches: []
      },
      { status: 500 }
    )
  }
}
