import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fuzzyMatch, normalizeSearchText, extractSearchTerms } from '@/lib/search-utils'
import { categoryKeywords, searchSynonyms } from '@/lib/search-synonyms'

/**
 * Prüft ob ein Suchbegriff mehrdeutig ist und KI-Prüfung benötigt
 */
function needsAIRelevanceCheck(query: string): boolean {
  const ambiguousTerms = [
    'maus',
    'mouse',
    'tastatur',
    'keyboard',
    'laptop',
    'notebook',
    'uhr',
    'watch',
    'ring',
    'kette',
    'schuhe',
    'shoes',
    'jacke',
    'jacket',
  ]

  const queryLower = query.toLowerCase().trim()
  return ambiguousTerms.some(term => queryLower === term || queryLower.includes(term))
}

/**
 * KI-basierte Batch-Relevanz-Prüfung mit OpenAI
 * Bewertet mehrere Artikel gleichzeitig für bessere Performance
 */
async function checkRelevanceBatchWithAI(
  query: string,
  articles: Array<{
    title: string
    description: string
    brand?: string
  }>
): Promise<number[]> {
  const openaiApiKey = process.env.OPENAI_API_KEY

  // Wenn kein OpenAI API Key, nutze Fallback (alle relevant)
  if (!openaiApiKey || articles.length === 0) {
    return articles.map(() => 1.0)
  }

  try {
    const articlesText = articles
      .map(
        (article, index) =>
          `Artikel ${index + 1}:\nTitel: "${article.title}"\nBeschreibung: "${article.description}"\n${article.brand ? `Marke: "${article.brand}"` : ''}`
      )
      .join('\n\n')

    const systemPrompt = `Du bist ein Experte für Produktrelevanz-Bewertung auf einem Online-Marktplatz.

Deine Aufgabe: Bewerte ob Artikel wirklich zur Suchanfrage passen.

Antworte IMMER im JSON-Format:
{
  "relevances": [0.0-1.0, 0.0-1.0, ...]
}

Bewertung:
- 1.0 = Perfekt passend (z.B. "Maus" → Computer-Maus)
- 0.8-0.9 = Sehr relevant
- 0.6-0.7 = Teilweise relevant
- 0.3-0.5 = Schwach relevant
- 0.0-0.2 = Nicht relevant (z.B. "Maus" → Headset mit "Mausklick" in Beschreibung)

WICHTIG:
- "Maus" sollte NUR Computer-Mäuse finden, NICHT Headsets oder andere Produkte
- "Laptop" sollte NUR Laptops finden, NICHT Taschen oder Zubehör
- Sei sehr streng bei Mehrdeutigkeiten
- Array-Länge muss exakt der Anzahl der Artikel entsprechen`

    const userPrompt = `Suchanfrage: "${query}"

Artikel:
${articlesText}

Antworte mit JSON-Array der Relevanz-Bewertungen:`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Günstigeres Model für schnelle Bewertungen
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1, // Sehr niedrig für konsistente Bewertungen
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      console.error('OpenAI API Fehler bei Batch-Relevanz-Prüfung:', response.status)
      return articles.map(() => 1.0) // Fallback: Akzeptiere alle
    }

    const data = await response.json()
    const resultText = data.choices[0]?.message?.content?.trim() || '{"relevances": []}'

    try {
      const result = JSON.parse(resultText)
      const relevances = result.relevances || []

      // Validiere und fülle auf falls nötig
      return articles.map((_, index) => {
        const relevance = relevances[index]
        if (typeof relevance === 'number' && relevance >= 0 && relevance <= 1) {
          return relevance
        }
        return 1.0 // Fallback
      })
    } catch (parseError) {
      console.error('Fehler beim Parsen der KI-Antwort:', parseError)
      return articles.map(() => 1.0) // Fallback
    }
  } catch (error) {
    console.error('Fehler bei KI-Batch-Relevanz-Prüfung:', error)
    return articles.map(() => 1.0) // Fallback: Akzeptiere alle bei Fehler
  }
}

/**
 * KI-basierte Relevanz-Prüfung mit OpenAI (Einzelprüfung - Legacy)
 * @deprecated Nutze checkRelevanceBatchWithAI für bessere Performance
 */
async function checkRelevanceWithAI(
  query: string,
  articleTitle: string,
  articleDescription: string,
  articleBrand?: string
): Promise<number> {
  const openaiApiKey = process.env.OPENAI_API_KEY

  // Wenn kein OpenAI API Key, nutze Fallback (immer relevant)
  if (!openaiApiKey) {
    return 1.0
  }

  try {
    const articleText = `${articleTitle} ${articleDescription} ${articleBrand || ''}`.trim()

    const systemPrompt = `Du bist ein Experte für Produktrelevanz-Bewertung auf einem Online-Marktplatz.

Deine Aufgabe: Bewerte ob ein Artikel wirklich zur Suchanfrage passt.

Antworte IMMER nur mit einer Zahl zwischen 0.0 und 1.0:
- 1.0 = Perfekt passend (z.B. "Maus" → Computer-Maus)
- 0.8-0.9 = Sehr relevant
- 0.6-0.7 = Teilweise relevant
- 0.3-0.5 = Schwach relevant
- 0.0-0.2 = Nicht relevant (z.B. "Maus" → Headset mit "Mausklick" in Beschreibung)

WICHTIG:
- "Maus" sollte NUR Computer-Mäuse finden, NICHT Headsets oder andere Produkte
- "Laptop" sollte NUR Laptops finden, NICHT Taschen oder Zubehör
- Sei sehr streng bei Mehrdeutigkeiten`

    const userPrompt = `Suchanfrage: "${query}"

Artikel:
Titel: "${articleTitle}"
Beschreibung: "${articleDescription}"
${articleBrand ? `Marke: "${articleBrand}"` : ''}

Bewerte die Relevanz (0.0-1.0):`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Günstigeres Model für schnelle Bewertungen
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: 0.1, // Sehr niedrig für konsistente Bewertungen
        max_tokens: 10, // Nur eine Zahl
      }),
    })

    if (!response.ok) {
      console.error('OpenAI API Fehler bei Relevanz-Prüfung:', response.status)
      return 1.0 // Fallback: Akzeptiere Artikel
    }

    const data = await response.json()
    const relevanceText = data.choices[0]?.message?.content?.trim() || '1.0'
    const relevance = parseFloat(relevanceText)

    // Validiere Ergebnis
    if (isNaN(relevance) || relevance < 0 || relevance > 1) {
      return 1.0 // Fallback
    }

    return relevance
  } catch (error) {
    console.error('Fehler bei KI-Relevanz-Prüfung:', error)
    return 1.0 // Fallback: Akzeptiere Artikel bei Fehler
  }
}

// OPTIMIERT: Synonym-Mappings wurden in separate Datei ausgelagert für bessere Performance
// Die Mappings werden nur einmal geladen und können gecached werden
// categoryKeywords und searchSynonyms sind jetzt in @/lib/search-synonyms.ts

// Hilfsfunktion: Normalisiert Umlaute (ä->ae, ö->oe, ü->ue)
function normalizeUmlauts(text: string): string {
  return text
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/Ä/g, 'Ae')
    .replace(/Ö/g, 'Oe')
    .replace(/Ü/g, 'Ue')
    .replace(/ß/g, 'ss')
}

// Hilfsfunktion: Erstellt Plural- und Singular-Varianten
function getPluralSingularVariants(word: string): string[] {
  const variants: string[] = [word]

  // Deutsche Plural-Regeln
  if (word.endsWith('e')) {
    variants.push(word + 'n') // Auto -> Autos (aber auch Auto -> Autos)
  }
  if (word.endsWith('er') || word.endsWith('el') || word.endsWith('en')) {
    variants.push(word) // Singular = Plural
  }
  if (word.endsWith('s') || word.endsWith('x') || word.endsWith('z')) {
    variants.push(word) // Singular = Plural
  }

  // Englische Plural-Regeln
  if (word.endsWith('y')) {
    variants.push(word.slice(0, -1) + 'ies') // city -> cities
  }
  if (
    word.endsWith('s') ||
    word.endsWith('sh') ||
    word.endsWith('ch') ||
    word.endsWith('x') ||
    word.endsWith('z')
  ) {
    variants.push(word + 'es') // box -> boxes
  }
  if (!word.endsWith('s')) {
    variants.push(word + 's') // car -> cars
  }

  // Entferne 's' für Singular
  if (word.endsWith('s') && word.length > 1) {
    variants.push(word.slice(0, -1)) // cars -> car
  }
  if (word.endsWith('es') && word.length > 2) {
    variants.push(word.slice(0, -2)) // boxes -> box
  }
  if (word.endsWith('ies') && word.length > 3) {
    variants.push(word.slice(0, -3) + 'y') // cities -> city
  }

  return Array.from(new Set(variants))
}

// Hilfsfunktion: Erweitert Suchbegriffe um Synonyme, Plural/Singular, Umlaute
// INTELLIGENT: Fügt auch kategoriebasierte Marken hinzu
function expandSearchTerms(queryWords: string[]): string[] {
  const expanded: string[] = []

  for (const word of queryWords) {
    const wordLower = word.toLowerCase().trim()
    if (wordLower.length < 2) continue

    // Füge Original-Wort hinzu
    expanded.push(wordLower)

    // Füge Umlaut-Normalisierung hinzu
    const normalized = normalizeUmlauts(wordLower)
    if (normalized !== wordLower) {
      expanded.push(normalized)
    }

    // Füge Plural/Singular-Varianten hinzu
    const pluralSingular = getPluralSingularVariants(wordLower)
    expanded.push(...pluralSingular)

    // Füge Synonyme hinzu
    if (searchSynonyms[wordLower]) {
      expanded.push(...searchSynonyms[wordLower])
    }

    // Prüfe auch ohne Umlaute für Synonyme
    if (normalized !== wordLower && searchSynonyms[normalized]) {
      expanded.push(...searchSynonyms[normalized])
    }

    // INTELLIGENT: Füge kategoriebasierte Marken hinzu
    // Wenn jemand nach "motorrad" sucht, sollten auch Motorrad-Marken gefunden werden
    for (const [categorySlug, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.includes(wordLower) || keywords.includes(normalized)) {
        // Füge alle Marken dieser Kategorie hinzu
        expanded.push(...keywords.filter(k => k.length >= 2))
      }
    }
  }

  // Entferne Duplikate und kurze Wörter
  return Array.from(new Set(expanded)).filter(w => w.length >= 2)
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

    // Removed console.log for better performance

    const now = new Date()

    // Intelligente Such-Logik: Hole alle verfügbaren Artikel
    // Stornierte Purchases machen den Artikel wieder verfügbar
    // Ein Artikel ist verfügbar wenn:
    // 1. Keine Purchases vorhanden sind ODER
    // 2. Alle Purchases storniert sind (status = 'cancelled')
    // 3. Beendete Auktionen ohne Purchase werden ausgeschlossen
    const whereClause: any = {
      AND: [
        {
          // GOLDEN RULE: Zeige ALLE Artikel außer explizit 'rejected'
          // Explizit null UND alle anderen Werte außer 'rejected' einschließen
          OR: [
            { moderationStatus: null },
            { moderationStatus: { not: 'rejected' } },
          ],
        },
        {
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

    // Filter nach Angebotsart (Auktion oder Sofortkauf)
    if (isAuction === 'true') {
      // Eine Auktion ist aktiv wenn:
      // 1. isAuction = true
      // 2. auctionEnd > now (noch nicht abgelaufen)
      // 3. UND (auctionStart ist null ODER auctionStart <= now) - Auktion hat begonnen
      whereClause.AND.push({
        isAuction: true,
      })
      whereClause.AND.push({
        auctionEnd: {
          gt: now, // Noch nicht abgelaufen
        },
      })
      whereClause.AND.push({
        OR: [
          { auctionStart: null }, // Kein Starttermin = startet sofort
          { auctionStart: { lte: now } }, // Starttermin ist erreicht oder in der Vergangenheit
        ],
      })
    } else if (isAuction === 'false') {
      whereClause.AND.push({
        isAuction: false,
      })
    }

    // Zustand-Filter
    if (condition) {
      whereClause.AND.push({
        condition: condition,
      })
    }

    // Marke-Filter - Exakte Übereinstimmung (case-insensitive)
    if (brand) {
      whereClause.AND.push({
        brand: {
          equals: brand,
          mode: 'insensitive',
        },
      })
    }

    // Standort-Filter (Postleitzahl)
    if (postalCode) {
      whereClause.AND.push({
        seller: {
          postalCode: {
            contains: postalCode,
            mode: 'insensitive',
          },
        },
      })
    }

    // KRITISCH: Wenn ein Suchbegriff vorhanden ist, muss die DB-Query bereits danach filtern!
    // Sonst werden relevante Artikel übersehen, wenn sie nicht in den ersten 1000 sind
    if (query && query.trim()) {
      const q = query.trim().toLowerCase()
      const queryWords = q.split(/\s+/).filter(w => w.length > 0)

      // Erweitere Query-Wörter um Synonyme für DB-Query
      const expandedQueryWords = expandSearchTerms(queryWords)
      const uniqueSearchTerms = Array.from(new Set(expandedQueryWords)).slice(0, 50) // Limit für DB-Performance

      // Baue OR-Bedingung für alle Suchfelder mit allen erweiterten Begriffen
      const searchConditions: any[] = []

      for (const term of uniqueSearchTerms) {
        if (term.length < 2) continue
        searchConditions.push(
          { title: { contains: term, mode: 'insensitive' } },
          { brand: { contains: term, mode: 'insensitive' } },
          { model: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
          { referenceNumber: { contains: term, mode: 'insensitive' } }
        )
      }

      if (searchConditions.length > 0) {
        whereClause.AND.push({
          OR: searchConditions
        })
      }
    }

    // OPTIMIERT: Kategorie-Filter direkt in WHERE-Klausel (serverseitig)
    if (category) {
      const categorySlug = category.toLowerCase().trim()
      const categoryVariants = [
        categorySlug,
        category,
        category.toLowerCase(),
        category.toUpperCase(),
        categorySlug.replace(/-/g, '_'),
        categorySlug.replace(/_/g, '-'),
      ]

      whereClause.AND.push({
        OR: [
          {
            categories: {
              some: {
                category: {
                  OR: categoryVariants.map(variant => ({
                    OR: [
                      { slug: variant },
                      { name: variant },
                    ],
                  })),
                },
              },
            },
          },
        ],
      })
    }

    // OPTIMIERT: Preis-Filter direkt in WHERE-Klausel (serverseitig)
    if (minPrice || maxPrice) {
      const priceFilter: any = {}
      if (minPrice) {
        priceFilter.gte = parseFloat(minPrice)
      }
      if (maxPrice) {
        priceFilter.lte = parseFloat(maxPrice)
      }
      whereClause.AND.push({ price: priceFilter })
    }

    // OPTIMIERT: Reduziertes Limit für bessere Performance
    // Pagination wird client-side oder über separate API-Call gehandhabt
    const MAX_INITIAL_RESULTS = 50 // Reduziert von 1000 für bessere Performance

    let articles: any[] = []

    articles = await prisma.watch.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        brand: true,
        model: true,
        referenceNumber: true,
        price: true,
        buyNowPrice: true,
        condition: true,
        year: true,
        images: true,
        boosters: true,
        isAuction: true,
        auctionStart: true,
        auctionEnd: true,
        createdAt: true,
        updatedAt: true,
        sellerId: true,
        bids: {
          select: {
            id: true,
            amount: true,
            userId: true,
            createdAt: true,
          },
          orderBy: { amount: 'desc' },
        },
        seller: {
          select: {
            id: true,
            email: true,
            city: true,
            postalCode: true,
          },
        },
        categories: {
          select: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        purchases: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: MAX_INITIAL_RESULTS,
    })

    // OPTIMIERT: Filter bereits in DB-Query enthalten (purchases WHERE status != 'cancelled')
    // Nur noch Sicherheits-Check für Seller
    articles = articles.filter((w: any) => w.seller && w.seller.id)

    // OPTIMIERT: Verkaufte Artikel sind bereits durch purchases-Filter ausgeschlossen
    // Keine zusätzliche Filterung nötig

    // Wenn Suchbegriff vorhanden, filtere intelligent mit Relevanz-Ranking
    if (query) {
      const q = query.trim()
      const qLower = q.toLowerCase()
      const queryWords = qLower.split(/\s+/).filter(w => w.length > 0)

      // Prüfe ob es eine Artikelnummer ist
      const isNumericArticleNumber = /^\d{6,10}$/.test(q) // 6-10 stellige Nummer
      const isCuid = q.length >= 20 && q.startsWith('c')
      const isLongId = q.length >= 20 && /^[a-z0-9]{20,}$/i.test(q)

      if (isNumericArticleNumber || isCuid || isLongId) {
        // Suche nach Artikelnummer ODER ID
        const searchWhereClause: any = {
          AND: [
            {
              OR: [
                {
                  purchases: {
                    none: {},
                  },
                },
                {
                  purchases: {
                    every: {
                      status: 'cancelled',
                    },
                  },
                },
              ],
            },
          ],
        }

        if (isNumericArticleNumber) {
          searchWhereClause.AND.push({
            articleNumber: parseInt(q),
          })
        } else {
          searchWhereClause.AND.push({
            id: q,
          })
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
                verificationStatus: true,
              },
            },
            categories: {
              include: {
                category: true,
              },
            },
            bids: {
              orderBy: { amount: 'desc' },
              take: 1,
            },
            purchases: {
              where: {
                status: {
                  not: 'cancelled',
                },
              },
            },
          },
        })

        if (watchById) {
          // Prüfe ob Watch verkauft ist
          if (watchById.purchases && watchById.purchases.length > 0) {
            // Watch ist verkauft
            return NextResponse.json({
              watches: [],
              total: 0,
            })
          }

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
            watches: [
              {
                ...watchById,
                images,
                boosters,
                price: currentPrice,
                city: watchById.seller?.city || null,
                postalCode: watchById.seller?.postalCode || null,
              },
            ],
            total: 1,
            limit,
            offset,
          })
        }

        // Wenn keine direkte ID gefunden, suche weiter normal
      }

      // Erweitere Query-Wörter um Synonyme, Plural/Singular, Umlaute
      const expandedQueryWords = expandSearchTerms(queryWords)

      // Verbesserte präzise Suche mit intelligenter Relevanz-Berechnung
      // WICHTIG: Booster beeinflussen nur die Sortierung, NICHT die Filterung!
      const articlesWithScore = articles.map(article => {
        // Parse boosters für Priorität (nur für Sortierung)
        let boosters: string[] = []
        try {
          if ((article as any).boosters) {
            boosters = JSON.parse((article as any).boosters)
          }
        } catch (e) {
          boosters = []
        }

        const brandLower = (article.brand || '').toLowerCase().trim()
        const modelLower = (article.model || '').toLowerCase().trim()
        const titleLower = (article.title || '').toLowerCase().trim()
        const descLower = (article.description || '').toLowerCase().trim()
        const refLower = (article.referenceNumber || '').toLowerCase().trim()

        const searchText = `${brandLower} ${modelLower} ${titleLower} ${descLower} ${refLower}`
        let relevanceScore = 0
        let matches = false

        // WICHTIG: Prüfe zuerst, ob der Artikel zur Suche passt (OHNE Booster-Bonus)
        // Exakte Übereinstimmung (höchste Priorität)
        const normalizedQ = normalizeUmlauts(qLower)
        const normalizedSearchText = normalizeUmlauts(searchText)

        if (
          searchText === q ||
          normalizedSearchText === normalizedQ ||
          brandLower === q ||
          modelLower === q ||
          titleLower === q ||
          normalizedSearchText.includes(normalizedQ) ||
          searchText.includes(qLower)
        ) {
          relevanceScore = 1000
          matches = true
        } else {
          // Multi-Wort Matching mit Gewichtung und Synonymen
          // INTELLIGENT: Zähle sowohl Original-Wörter als auch Synonyme als Match
          const originalWordsMatched = new Set<string>()
          const synonymWordsMatched = new Set<string>()
          let exactWordMatches = 0
          const matchedFields = new Set<string>()

            // Prüfe sowohl Original-Wörter als auch Synonyme
          for (const word of expandedQueryWords) {
            if (word.length < 2) continue

            const isOriginalWord = queryWords.includes(word)
            const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            const exactMatchRegex = new RegExp(`\\b${escapedWord}\\b`, 'i')
            const partialMatchRegex = new RegExp(escapedWord, 'i')

            // Normalisiere auch für Umlaute
            const normalizedWord = normalizeUmlauts(word)
            const normalizedExactMatchRegex =
              normalizedWord !== word ? new RegExp(`\\b${normalizedWord}\\b`, 'i') : null
            const normalizedPartialMatchRegex =
              normalizedWord !== word ? new RegExp(normalizedWord, 'i') : null

            let wordMatched = false
            let wordScore = 0

            // Prüfe alle Felder (nicht mit else if, damit alle Felder geprüft werden)
            // Exakte Wort-Übereinstimmung (Word Boundary) - höchste Priorität

            // Brand - mit Fuzzy-Search Unterstützung
            if (
              exactMatchRegex.test(brandLower) ||
              (normalizedExactMatchRegex &&
                normalizedExactMatchRegex.test(normalizeUmlauts(brandLower)))
            ) {
              wordScore = Math.max(wordScore, 150)
              wordMatched = true
              if (isOriginalWord) {
                exactWordMatches++
                originalWordsMatched.add(word)
              } else {
                synonymWordsMatched.add(word)
              }
              matchedFields.add('brand')
            } else if (
              partialMatchRegex.test(brandLower) ||
              (normalizedPartialMatchRegex &&
                normalizedPartialMatchRegex.test(normalizeUmlauts(brandLower)))
            ) {
              wordScore = Math.max(wordScore, 50)
              wordMatched = true
              if (isOriginalWord) {
                originalWordsMatched.add(word)
              } else {
                synonymWordsMatched.add(word)
              }
              matchedFields.add('brand')
            } else if (fuzzyMatch(word, brandLower, 0.75)) {
              // OPTIMIERT: Fuzzy-Match für Tippfehler (nur wenn kein exakter Match)
              wordScore = Math.max(wordScore, 30) // Niedrigere Punktzahl für Fuzzy-Matches
              wordMatched = true
              matchedFields.add('brand')
            }

            // Model - mit Fuzzy-Search Unterstützung
            if (
              exactMatchRegex.test(modelLower) ||
              (normalizedExactMatchRegex &&
                normalizedExactMatchRegex.test(normalizeUmlauts(modelLower)))
            ) {
              wordScore = Math.max(wordScore, 120)
              wordMatched = true
              if (isOriginalWord) {
                exactWordMatches++
                originalWordsMatched.add(word)
              } else {
                synonymWordsMatched.add(word)
              }
              matchedFields.add('model')
            } else if (
              partialMatchRegex.test(modelLower) ||
              (normalizedPartialMatchRegex &&
                normalizedPartialMatchRegex.test(normalizeUmlauts(modelLower)))
            ) {
              wordScore = Math.max(wordScore, 40)
              wordMatched = true
              if (isOriginalWord) {
                originalWordsMatched.add(word)
              } else {
                synonymWordsMatched.add(word)
              }
              matchedFields.add('model')
            } else if (fuzzyMatch(word, modelLower, 0.75)) {
              // OPTIMIERT: Fuzzy-Match für Tippfehler (nur wenn kein exakter Match)
              wordScore = Math.max(wordScore, 25)
              wordMatched = true
              matchedFields.add('model')
            }

            // Title
            if (
              exactMatchRegex.test(titleLower) ||
              (normalizedExactMatchRegex &&
                normalizedExactMatchRegex.test(normalizeUmlauts(titleLower)))
            ) {
              wordScore = Math.max(wordScore, 100)
              wordMatched = true
              if (isOriginalWord) {
                exactWordMatches++
                originalWordsMatched.add(word)
              } else {
                synonymWordsMatched.add(word)
              }
              matchedFields.add('title')
            } else if (
              partialMatchRegex.test(titleLower) ||
              (normalizedPartialMatchRegex &&
                normalizedPartialMatchRegex.test(normalizeUmlauts(titleLower)))
            ) {
              wordScore = Math.max(wordScore, 30)
              wordMatched = true
              if (isOriginalWord) {
                originalWordsMatched.add(word)
              } else {
                synonymWordsMatched.add(word)
              }
              matchedFields.add('title')
            }

            // Reference Number
            if (
              exactMatchRegex.test(refLower) ||
              (normalizedExactMatchRegex &&
                normalizedExactMatchRegex.test(normalizeUmlauts(refLower)))
            ) {
              wordScore = Math.max(wordScore, 90)
              wordMatched = true
              if (isOriginalWord) {
                exactWordMatches++
                originalWordsMatched.add(word)
              } else {
                synonymWordsMatched.add(word)
              }
              matchedFields.add('reference')
            } else if (
              partialMatchRegex.test(refLower) ||
              (normalizedPartialMatchRegex &&
                normalizedPartialMatchRegex.test(normalizeUmlauts(refLower)))
            ) {
              wordScore = Math.max(wordScore, 20)
              wordMatched = true
              if (isOriginalWord) {
                originalWordsMatched.add(word)
              } else {
                synonymWordsMatched.add(word)
              }
              matchedFields.add('reference')
            }

            // Description
            if (
              exactMatchRegex.test(descLower) ||
              (normalizedExactMatchRegex &&
                normalizedExactMatchRegex.test(normalizeUmlauts(descLower)))
            ) {
              wordScore = Math.max(wordScore, 40)
              wordMatched = true
              if (isOriginalWord) {
                exactWordMatches++
                originalWordsMatched.add(word)
              } else {
                synonymWordsMatched.add(word)
              }
              matchedFields.add('description')
            } else if (
              partialMatchRegex.test(descLower) ||
              (normalizedPartialMatchRegex &&
                normalizedPartialMatchRegex.test(normalizeUmlauts(descLower)))
            ) {
              wordScore = Math.max(wordScore, 10)
              wordMatched = true
              if (isOriginalWord) {
                originalWordsMatched.add(word)
              } else {
                synonymWordsMatched.add(word)
              }
              matchedFields.add('description')
            }

            relevanceScore += wordScore
          }

          // INTELLIGENT: Ein Watch passt zur Suche wenn:
          // 1. Mindestens ein Original-Wort gefunden wurde ODER
          // 2. Mindestens ein Synonym gefunden wurde UND relevanceScore > 0
          // Dies ermöglicht es, dass "motorrad" auch Yamaha-Motorräder findet
          const hasOriginalMatch = originalWordsMatched.size > 0
          const hasSynonymMatch = synonymWordsMatched.size > 0

          // Bonus für alle Original-Wörter gefunden
          if (originalWordsMatched.size === queryWords.length && queryWords.length > 1) {
            relevanceScore += 200
          }

          // Bonus wenn sowohl Original als auch Synonyme gefunden wurden
          if (hasOriginalMatch && hasSynonymMatch) {
            relevanceScore += 150
          }

          // Bonus für viele exakte Wort-Übereinstimmungen
          if (exactWordMatches >= queryWords.length && queryWords.length > 1) {
            relevanceScore += 300
          }

          // Bonus für Matches in mehreren Feldern
          if (matchedFields.size > 1) {
            relevanceScore += matchedFields.size * 20
          }

          // Bonus für Synonym-Matches (zeigt dass die Suche intelligent war)
          if (hasSynonymMatch && !hasOriginalMatch) {
            relevanceScore += 50 // Bonus für intelligente Synonym-Erkennung
          }

          // WICHTIG: matches wird basierend auf Relevanz gesetzt
          // Ein Artikel passt zur Suche wenn:
          // - Mindestens ein Original-Wort ODER Synonym gefunden wurde
          // - UND relevanceScore > 0
          matches = relevanceScore > 0 && (hasOriginalMatch || hasSynonymMatch)
        }

        // Booster-Bonus wird NUR nach KI-Relevanz-Prüfung hinzugefügt
        // Wird später in der Pipeline hinzugefügt, wenn KI-Relevanz bestätigt ist
        // Hier nur den Basis-Score zurückgeben

        return { article, relevanceScore, matches, boosters }
      })

      // KI-basierte Relevanz-Prüfung für präzise Ergebnisse
      // Nur bei mehrdeutigen Begriffen (z.B. "Maus") für bessere Performance
      const shouldUseAI = needsAIRelevanceCheck(q)
      const topCandidates = articlesWithScore
        .filter(item => item.matches || item.relevanceScore > 0)
        .slice(0, shouldUseAI ? 30 : 0) // Prüfe max. 30 Artikel mit KI

      let articlesWithAIRelevance = topCandidates.map(item => ({
        ...item,
        aiRelevance: 1.0, // Default: relevant
        combinedScore: item.relevanceScore,
      }))

      // Batch-KI-Prüfung nur wenn nötig und OpenAI verfügbar
      if (shouldUseAI && topCandidates.length > 0 && process.env.OPENAI_API_KEY) {
        const articlesForAI = topCandidates.map(item => ({
          title: item.article.title || '',
          description: item.article.description || '',
          brand: item.article.brand || undefined,
        }))

        const aiRelevances = await checkRelevanceBatchWithAI(q, articlesForAI)

        articlesWithAIRelevance = topCandidates.map((item, index) => {
          const aiRelevance = aiRelevances[index] || 1.0
          const combinedScore = item.relevanceScore * aiRelevance

          return {
            ...item,
            aiRelevance,
            combinedScore,
          }
        })
      }

      // Filtere Artikel mit niedriger KI-Relevanz (< 0.5)
      // Dies entfernt irrelevante Ergebnisse wie "Headset" bei Suche nach "Maus"
      const relevantArticles = articlesWithAIRelevance
        .filter(item => {
          // Wenn OpenAI nicht verfügbar (aiRelevance = 1.0), nutze traditionellen Score
          if (item.aiRelevance >= 0.99) {
            return item.matches || item.relevanceScore > 0
          }
          // Mit OpenAI: Nur Artikel mit Relevanz > 0.5 (ausgewogener Threshold)
          return item.aiRelevance > 0.5
        })
        .map(item => {
          // Füge Booster-Bonus NUR hinzu, wenn Artikel relevant ist (nach KI-Prüfung)
          let finalScore = item.combinedScore || item.relevanceScore
          
          if (item.aiRelevance > 0.5) {
            // Artikel ist relevant - jetzt Booster-Bonus hinzufügen
            if (item.boosters.includes('super-boost')) {
              finalScore += 10000
            } else if (item.boosters.includes('turbo-boost')) {
              finalScore += 5000
            } else if (item.boosters.includes('boost')) {
              finalScore += 2000
            }
          }
          // Wenn nicht relevant (aiRelevance <= 0.5), kein Booster-Bonus

          return {
            ...item,
            finalScore,
          }
        })

      // Füge restliche Artikel hinzu (die nicht mit KI geprüft wurden)
      const remainingArticles = articlesWithScore
        .filter(item => !topCandidates.includes(item))
        .filter(item => item.matches || item.relevanceScore > 0)

      // Füge Booster-Bonus zu restlichen Artikeln hinzu (die nicht mit KI geprüft wurden)
      const remainingArticlesWithBoost = remainingArticles.map(item => {
        let finalScore = item.relevanceScore
        
        // Booster-Bonus nur wenn Artikel relevant ist
        if (item.matches || item.relevanceScore > 0) {
          if (item.boosters.includes('super-boost')) {
            finalScore += 10000
          } else if (item.boosters.includes('turbo-boost')) {
            finalScore += 5000
          } else if (item.boosters.includes('boost')) {
            finalScore += 2000
          }
        }

        return {
          ...item,
          finalScore,
        }
      })

      // Kombiniere und sortiere nach finalScore (inkl. Booster-Bonus für relevante Artikel)
      articles = [...relevantArticles, ...remainingArticlesWithBoost]
        .sort((a, b) => {
          // Sortiere nach finalScore (inkl. Booster-Bonus)
          const scoreA = 'finalScore' in a ? (a as any).finalScore : a.relevanceScore
          const scoreB = 'finalScore' in b ? (b as any).finalScore : b.relevanceScore

          if (scoreB !== scoreA) {
            return scoreB - scoreA
          }
          return (
            new Date(b.article.createdAt).getTime() -
            new Date(a.article.createdAt).getTime()
          )
        })
        .map(item => item.article)
    } else if (category) {
      // Nur Kategorie-Filter ohne Suchbegriff
      // Sortiere nach Booster-Priorität
      const getBoostPriority = (boosters: string[]): number => {
        if (boosters.includes('super-boost')) return 4
        if (boosters.includes('turbo-boost')) return 3
        if (boosters.includes('boost')) return 2
        return 1
      }

      articles = articles.sort((a, b) => {
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
          return priorityB - priorityA
        }

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    }

    // Konvertiere Bilder von JSON String zu Array und berechne aktuellen Preis
    let articlesWithImages = articles
      .map((article: any) => {
        try {
          const highestBid = article.bids?.[0]
          const currentPrice = highestBid ? highestBid.amount : article.price || 0

          // Parse boosters
          let boosters: string[] = []
          try {
            if (article.boosters) {
              if (Array.isArray(article.boosters)) {
                boosters = article.boosters
              } else if (typeof article.boosters === 'string') {
                boosters = JSON.parse(article.boosters)
              }
            }
          } catch (e) {
            boosters = []
          }

          // Parse images sicher
          let images: string[] = []
          try {
            if (article.images) {
              if (Array.isArray(article.images)) {
                images = article.images
              } else if (typeof article.images === 'string') {
                if (article.images.trim().startsWith('[') || article.images.trim().startsWith('{')) {
                  images = JSON.parse(article.images)
                } else if (article.images.trim().startsWith('http')) {
                  images = [article.images]
                } else {
                  try {
                    images = JSON.parse(article.images)
                  } catch {
                    images = article.images.trim() ? [article.images] : []
                  }
                }
              }
            }
          } catch (e) {
            if (
              article.images &&
              typeof article.images === 'string' &&
              article.images.trim().startsWith('http')
            ) {
              images = [article.images]
            } else {
              images = []
            }
          }

          // Extrahiere Kategorie-Slugs für Filterung
          const categorySlugs =
            article.categories?.map((cat: any) => cat.category?.slug).filter(Boolean) || []

          return {
            id: article.id,
            title: article.title || '',
            description: article.description || '',
            brand: article.brand || '',
            model: article.model || '',
            price: currentPrice,
            buyNowPrice: article.buyNowPrice || null,
            condition: article.condition || '',
            year: article.year || null,
            images: images,
            boosters: boosters,
            isAuction: article.isAuction || false,
            auctionEnd: article.auctionEnd || null,
            auctionStart: article.auctionStart || null,
            city: article.seller?.city || null,
            postalCode: article.seller?.postalCode || null,
            bids: article.bids || [],
            createdAt: article.createdAt,
            updatedAt: article.updatedAt,
            sellerId: article.sellerId,
            seller: article.seller
              ? {
                  city: article.seller.city,
                  postalCode: article.seller.postalCode,
                }
              : null,
            categorySlugs: categorySlugs,
          }
        } catch (e) {
          console.error('Error processing article:', article?.id, e)
          return null
        }
      })
      .filter((w: any) => {
        if (w === null) {
          return false
        }
        // DEBUG: Check if Lacoste article passed mapping
        if (w.id === 'cmipseh3y0001bbm7ew1n8atm') {
          console.log(`[SEARCH] ✅ Lacoste article passed mapping filter`)
          console.log(`[SEARCH]   Title: ${w.title}`)
          console.log(`[SEARCH]   Images: ${w.images?.length || 0}`)
          console.log(`[SEARCH]   CategorySlugs: ${w.categorySlugs?.join(', ') || 'none'}`)
        }
        return true
      })

    // OPTIMIERT: Preis-Filter bereits in DB-Query angewendet
    // Keine zusätzliche Filterung nötig (außer für Auktionen mit Geboten)

    // Kategorie-Filterung: Wenn Kategorie gesetzt ist, filtere nach Kategorie-Verknüpfung ODER Keywords
    // WICHTIG: Wenn keine Artikel mit Kategorie-Verknüpfung gefunden werden, verwende IMMER Keyword-Fallback
    if (category) {
      const beforeFilter = articlesWithImages.length
      const categorySlug = category.toLowerCase().trim()
      const categoryVariants = [
        categorySlug,
        category,
        category.toLowerCase(),
        category.toUpperCase(),
        categorySlug.replace(/-/g, '_'),
        categorySlug.replace(/_/g, '-'),
      ]

      // Prüfe zuerst, ob Artikel mit Kategorie-Verknüpfung vorhanden sind
      const articlesWithCategoryLink = articlesWithImages.filter(article => {
        if (!article) return false
        return article.categorySlugs?.some((slug: string) => {
          const slugLower = slug?.toLowerCase().trim()
          return categoryVariants.some(variant => {
            const variantLower = variant.toLowerCase().trim()
            return slugLower === variantLower
          })
        })
      })

      // Wenn keine Artikel mit Kategorie-Verknüpfung gefunden wurden, verwende IMMER Keyword-Fallback
      if (articlesWithCategoryLink.length === 0) {
        const keywords = categoryKeywords[categorySlug] || []

        articlesWithImages = articlesWithImages.filter(article => {
          if (!article) return false
          const searchText =
            `${article.brand || ''} ${article.model || ''} ${article.title || ''} ${article.description || ''}`.toLowerCase()
          const matchesKeywords = keywords.some(keyword =>
            searchText.includes(keyword.toLowerCase())
          )

          if (matchesKeywords) {
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
        // Verwende normale Filterung mit Kategorie-Verknüpfung + Fallback
        articlesWithImages = articlesWithImages.filter(article => {
          if (!article) return false
          // Prüfe ob der Artikel eine Kategorie-Verknüpfung hat
          const hasCategoryLink = article.categorySlugs?.some((slug: string) => {
            const slugLower = slug?.toLowerCase().trim()
            return categoryVariants.some(variant => {
              const variantLower = variant.toLowerCase().trim()
              return slugLower === variantLower
            })
          })

          if (hasCategoryLink) {
            // Wenn Subkategorie angegeben, filtere auch danach
            if (subcategory) {
              const subcatLower = subcategory.toLowerCase()
              const searchText =
                `${article.brand || ''} ${article.model || ''} ${article.title || ''} ${article.description || ''}`.toLowerCase()
              return searchText.includes(subcatLower)
            }
            return true
          }

          // Fallback: Prüfe ob der Artikel basierend auf Keywords zur Kategorie passt
          const keywords = categoryKeywords[categorySlug] || []
          if (keywords.length > 0) {
            if (!article) return false
            const searchText =
              `${article.brand || ''} ${article.model || ''} ${article.title || ''} ${article.description || ''}`.toLowerCase()
            const matchesKeywords = keywords.some(keyword =>
              searchText.includes(keyword.toLowerCase())
            )

            if (matchesKeywords) {
              // Wenn Subkategorie angegeben, filtere auch danach
              if (subcategory) {
                const subcatLower = subcategory.toLowerCase()
                return searchText.includes(subcatLower)
              }
              return true
            }
          }

          return false
        })
      }
    } else if (subcategory) {
      // Nur Subkategorie ohne Hauptkategorie
      const subcatLower = subcategory.toLowerCase()
      articlesWithImages = articlesWithImages.filter(article => {
        if (!article) return false
        const searchText =
          `${article.brand} ${article.model} ${article.title} ${article.description || ''}`.toLowerCase()
        return searchText.includes(subcatLower)
      })
    }

    // Hilfsfunktion für Booster-Priorität
    const getBoostPriority = (boosters: string[]): number => {
      if (boosters.includes('super-boost')) return 4
      if (boosters.includes('turbo-boost')) return 3
      if (boosters.includes('boost')) return 2
      return 1
    }

    // Sortierung anwenden (Booster-Priorität hat IMMER Vorrang)
    if (sortBy === 'relevance') {
      articlesWithImages = articlesWithImages.sort((a, b) => {
        if (!a || !b) return 0
        const priorityA = getBoostPriority(a.boosters || [])
        const priorityB = getBoostPriority(b.boosters || [])

        if (priorityA !== priorityB) {
          return priorityB - priorityA
        }

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    } else if (sortBy === 'ending') {
      articlesWithImages = articlesWithImages.sort((a, b) => {
        if (!a || !b) return 0
        const priorityA = getBoostPriority(a.boosters || [])
        const priorityB = getBoostPriority(b.boosters || [])

        if (priorityA !== priorityB) {
          return priorityB - priorityA
        }

        if (!a.auctionEnd && !b.auctionEnd) return 0
        if (!a.auctionEnd) return 1
        if (!b.auctionEnd) return -1
        return new Date(a.auctionEnd).getTime() - new Date(b.auctionEnd).getTime()
      })
    } else if (sortBy === 'newest') {
      articlesWithImages = articlesWithImages.sort((a, b) => {
        if (!a || !b) return 0
        const priorityA = getBoostPriority(a.boosters || [])
        const priorityB = getBoostPriority(b.boosters || [])

        if (priorityA !== priorityB) {
          return priorityB - priorityA
        }

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    } else if (sortBy === 'price-low') {
      articlesWithImages = articlesWithImages.sort((a, b) => {
        if (!a || !b) return 0
        const priorityA = getBoostPriority(a.boosters || [])
        const priorityB = getBoostPriority(b.boosters || [])

        if (priorityA !== priorityB) {
          return priorityB - priorityA
        }

        return a.price - b.price
      })
    } else if (sortBy === 'price-high') {
      articlesWithImages = articlesWithImages.sort((a, b) => {
        if (!a || !b) return 0
        const priorityA = getBoostPriority(a.boosters || [])
        const priorityB = getBoostPriority(b.boosters || [])

        if (priorityA !== priorityB) {
          return priorityB - priorityA
        }

        return b.price - a.price
      })
    } else if (sortBy === 'bids') {
      articlesWithImages = articlesWithImages.sort((a, b) => {
        if (!a || !b) return 0
        const priorityA = getBoostPriority(a.boosters || [])
        const priorityB = getBoostPriority(b.boosters || [])

        if (priorityA !== priorityB) {
          return priorityB - priorityA
        }

        const bidsA = a.bids?.length || 0
        const bidsB = b.bids?.length || 0
        return bidsB - bidsA
      })
    } else {
      // Standard: Nach Booster-Priorität sortieren
      articlesWithImages = articlesWithImages.sort((a, b) => {
        if (!a || !b) return 0
        const priorityA = getBoostPriority(a.boosters || [])
        const priorityB = getBoostPriority(b.boosters || [])

        if (priorityA !== priorityB) {
          return priorityB - priorityA
        }

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    }

    // Limit und Offset anwenden
    const limitedArticles = articlesWithImages.slice(offset, offset + limit)

    return NextResponse.json(
      {
        watches: limitedArticles, // Backward compatibility: API response still uses 'watches'
        total: articlesWithImages.length,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate', // No caching to ensure fresh results
          'X-Content-Type-Options': 'nosniff',
        },
      }
    )
  } catch (error: any) {
    console.error('[SEARCH] Search error:', error)
    console.error('[SEARCH] Error stack:', error?.stack)
    return NextResponse.json(
      {
        error: 'Ein Fehler ist aufgetreten bei der Suche',
        message: error?.message || String(error),
        watches: [],
      },
      { status: 500 }
    )
  }
}
