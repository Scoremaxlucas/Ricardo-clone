import { brandsByCategory } from '@/data/brands'
import { authOptions } from '@/lib/auth'
import { categoryKeywords } from '@/lib/search-synonyms'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * KI-Suchassistent API Route
 *
 * Versteht natürliche Sprache und extrahiert Filter für die Suche
 * Nutzt OpenAI GPT-4o für intelligente Filter-Extraktion
 */

interface ExtractedFilters {
  query?: string
  category?: string
  brand?: string
  minPrice?: number
  maxPrice?: number
  condition?: string
  isAuction?: boolean
  postalCode?: string
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Nachricht erforderlich' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      // Fallback: Pattern-Matching ohne OpenAI
      return handlePatternMatching(message, conversationHistory)
    }

    // Sammle alle verfügbaren Marken für den Prompt
    const allBrands = Object.values(brandsByCategory).flat()
    const uniqueBrands = Array.from(new Set(allBrands)).slice(0, 200) // Limit für Token-Effizienz

    // Sammle alle Kategorien
    const categories = Object.keys(categoryKeywords)

    const systemPrompt = `Du bist ein hochintelligenter Suchassistent für einen Online-Marktplatz (ähnlich wie Ricardo.ch).

Deine Aufgabe:
1. Verstehe die Absicht des Nutzers aus seiner Nachricht (auch implizite Wünsche)
2. Extrahiere ALLE relevanten Filter-Parameter präzise
3. Antworte IMMER im JSON-Format mit folgender Struktur:
{
  "filters": {
    "query": "Hauptsuchbegriff oder null",
    "category": "Kategorie-Slug (exakt aus Liste) oder null",
    "brand": "Markenname (exakt aus Liste) oder null",
    "minPrice": Zahl oder null,
    "maxPrice": Zahl oder null,
    "condition": "neu|sehr_gut|gut|akzeptabel oder null",
    "isAuction": true|false|null,
    "postalCode": "4-stellige Postleitzahl oder null"
  },
  "response": "Freundliche, natürliche Antwort auf Deutsch (max. 2 Sätze)",
  "needsClarification": true|false,
  "clarificationQuestion": "Präzise Frage wenn needsClarification true"
}

VERFÜGBARE KATEGORIEN (nutze exakt diese Slugs):
${categories.map(cat => `- ${cat}`).join('\n')}

VERFÜGBARE MARKEN (Beispiele - nutze exakten Namen):
${uniqueBrands.slice(0, 100).join(', ')}

ZUSTÄNDE: neu, sehr_gut, gut, akzeptabel

INTELLIGENTE BEISPIELE:
1. "Ich suche eine Rolex Uhr unter 5000 Franken"
   → {"filters": {"query": "Rolex", "brand": "Rolex", "maxPrice": 5000, "category": "uhren-schmuck"}, "response": "Ich suche Rolex Uhren unter 5000 CHF für dich.", "needsClarification": false}

2. "Zeig mir Motorräder in Zürich"
   → {"filters": {"category": "auto-motorrad", "postalCode": "8000", "query": "Motorrad"}, "response": "Ich zeige dir Motorräder in Zürich.", "needsClarification": false}

3. "Laptop unter 1000 CHF, neu"
   → {"filters": {"query": "Laptop", "category": "computer-netzwerk", "maxPrice": 1000, "condition": "neu"}, "response": "Ich suche neue Laptops unter 1000 CHF.", "needsClarification": false}

4. "Was hast du?"
   → {"filters": {}, "response": "Ich kann dir helfen, Produkte zu finden!", "needsClarification": true, "clarificationQuestion": "Wonach suchst du genau? Zum Beispiel eine Marke (z.B. Rolex, Apple), eine Kategorie (z.B. Uhren, Laptops) oder ein bestimmtes Produkt?"}

5. "iPhone 15 Pro Max"
   → {"filters": {"query": "iPhone 15 Pro Max", "brand": "Apple", "category": "handy-telefon"}, "response": "Ich suche iPhone 15 Pro Max für dich.", "needsClarification": false}

WICHTIGE REGELN:
- Antworte IMMER auf Deutsch
- Sei freundlich, natürlich und hilfreich
- Extrahiere Marken NUR wenn sie in der Liste sind (nutze Fuzzy-Matching für Varianten wie "iPhone" → "Apple")
- Bei Städtenamen: Konvertiere zu Postleitzahl (Zürich → 8000, Bern → 3000, Basel → 4000, etc.)
- Bei Preis: Erkenne "unter", "bis", "maximal", "weniger als" → maxPrice
- Bei Preis: Erkenne "über", "ab", "mindestens", "mehr als" → minPrice
- Bei unklaren Anfragen: Stelle präzise, hilfreiche Fragen
- Ignoriere irrelevante Informationen
- Nutze Kontext aus conversationHistory wenn vorhanden`

    const userPrompt = `Nutzer-Nachricht: "${message}"

${conversationHistory.length > 0 ? `Vorherige Konversation:\n${conversationHistory.map((m: any) => `${m.role}: ${m.content}`).join('\n')}` : ''}

Extrahiere Filter und antworte im JSON-Format.`

    // Rufe OpenAI API auf
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
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
        temperature: 0.3, // Niedrig für präzise Filter-Extraktion
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('OpenAI API Fehler:', error)
      // Fallback zu Pattern-Matching
      return handlePatternMatching(message, conversationHistory)
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content?.trim() || '{}'

    let parsedResponse: {
      filters: ExtractedFilters
      response: string
      needsClarification: boolean
      clarificationQuestion?: string
    }

    try {
      parsedResponse = JSON.parse(aiResponse)
    } catch (e) {
      console.error('Fehler beim Parsen der AI-Antwort:', e)
      return handlePatternMatching(message, conversationHistory)
    }

    // Führe Suche mit extrahierten Filtern durch
    const searchParams = new URLSearchParams()

    if (parsedResponse.filters.query) {
      searchParams.append('q', parsedResponse.filters.query)
    }
    if (parsedResponse.filters.category) {
      searchParams.append('category', parsedResponse.filters.category)
    }
    if (parsedResponse.filters.brand) {
      searchParams.append('brand', parsedResponse.filters.brand)
    }
    if (parsedResponse.filters.minPrice) {
      searchParams.append('minPrice', parsedResponse.filters.minPrice.toString())
    }
    if (parsedResponse.filters.maxPrice) {
      searchParams.append('maxPrice', parsedResponse.filters.maxPrice.toString())
    }
    if (parsedResponse.filters.condition) {
      searchParams.append('condition', parsedResponse.filters.condition)
    }
    if (
      parsedResponse.filters.isAuction !== null &&
      parsedResponse.filters.isAuction !== undefined
    ) {
      searchParams.append('isAuction', parsedResponse.filters.isAuction.toString())
    }
    if (parsedResponse.filters.postalCode) {
      searchParams.append('postalCode', parsedResponse.filters.postalCode)
    }
    searchParams.append('limit', '20')
    searchParams.append('sortBy', 'relevance')

    // Rufe Search-API auf (intern über fetch für bessere Kompatibilität)
    let searchResults: any = { watches: [], total: 0 }

    try {
      // Nutze interne URL für Server-Side Fetch
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
      const host = request.headers.get('host') || 'localhost:3002'
      const searchUrl = `${protocol}://${host}/api/watches/search?${searchParams.toString()}`

      const searchResponse = await fetch(searchUrl, {
        headers: {
          'Content-Type': 'application/json',
          // Forward Authorization falls vorhanden
          ...(request.headers.get('authorization') && {
            authorization: request.headers.get('authorization')!,
          }),
        },
        cache: 'no-store', // Immer frische Ergebnisse
      })

      if (searchResponse.ok) {
        searchResults = await searchResponse.json()
      } else {
        console.error('Search-API Fehler:', searchResponse.status, await searchResponse.text())
      }
    } catch (error) {
      console.error('Fehler bei Search-API:', error)
      // Bei Fehler: Leere Ergebnisse zurückgeben, aber trotzdem Antwort zeigen
    }

    return NextResponse.json({
      message: parsedResponse.response,
      filters: parsedResponse.filters,
      results: {
        watches: searchResults.watches || [],
        total: searchResults.total || 0,
      },
      needsClarification: parsedResponse.needsClarification,
      clarificationQuestion: parsedResponse.clarificationQuestion,
    })
  } catch (error: any) {
    console.error('Fehler bei KI-Suchassistent:', error)
    return NextResponse.json(
      {
        error: 'Fehler bei der Verarbeitung',
        message: 'Entschuldigung, es ist ein Fehler aufgetreten. Bitte versuche es erneut.',
      },
      { status: 500 }
    )
  }
}

/**
 * Fallback: Pattern-Matching ohne OpenAI
 */
function handlePatternMatching(message: string, conversationHistory: any[]): NextResponse {
  const lowerMessage = message.toLowerCase()
  const filters: ExtractedFilters = {}

  // Extrahiere Marke
  const allBrands = Object.values(brandsByCategory).flat()
  for (const brand of allBrands) {
    if (lowerMessage.includes(brand.toLowerCase())) {
      filters.brand = brand
      filters.query = brand
      break
    }
  }

  // Extrahiere Preis
  const priceMatch = lowerMessage.match(/(?:unter|bis|max|maximal|weniger als)\s*(\d+)/i)
  if (priceMatch) {
    filters.maxPrice = parseInt(priceMatch[1])
  }

  const minPriceMatch = lowerMessage.match(/(?:über|ab|min|mindestens|mehr als)\s*(\d+)/i)
  if (minPriceMatch) {
    filters.minPrice = parseInt(minPriceMatch[1])
  }

  // Extrahiere Kategorie
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        filters.category = category
        if (!filters.query) {
          filters.query = keyword
        }
        break
      }
    }
    if (filters.category) break
  }

  // Extrahiere Zustand
  if (lowerMessage.includes('neu')) {
    filters.condition = 'neu'
  } else if (lowerMessage.includes('sehr gut') || lowerMessage.includes('sehrgut')) {
    filters.condition = 'sehr_gut'
  } else if (lowerMessage.includes('gut')) {
    filters.condition = 'gut'
  }

  // Extrahiere Auktion
  if (lowerMessage.includes('auktion') || lowerMessage.includes('bieten')) {
    filters.isAuction = true
  }

  // Extrahiere Postleitzahl (4-stellig)
  const plzMatch = lowerMessage.match(/\b\d{4}\b/)
  if (plzMatch) {
    filters.postalCode = plzMatch[0]
  }

  const hasFilters = Object.keys(filters).length > 0

  return NextResponse.json({
    message: hasFilters
      ? `Ich habe ${Object.keys(filters).length} Filter gefunden. Suche nach passenden Artikeln...`
      : 'Ich kann dir helfen, Produkte zu finden. Wonach suchst du genau?',
    filters,
    results: {
      watches: [],
      total: 0,
    },
    needsClarification: !hasFilters,
    clarificationQuestion: hasFilters
      ? undefined
      : 'Bitte beschreibe, wonach du suchst. Zum Beispiel: "Rolex Uhr unter 5000 CHF" oder "Motorrad in Zürich"',
  })
}
