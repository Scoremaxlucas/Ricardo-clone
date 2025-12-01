import { NextRequest, NextResponse } from 'next/server'

/**
 * GPT-4 VISION BILDERKENNUNG
 *
 * Nutzt OpenAI GPT-4 Vision für deutlich bessere und genauere Bilderkennung
 * Besonders gut für komplexe Objekte wie Elektrofahrräder, Mopeds, etc.
 */

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, context } = await request.json()

    if (!imageBase64) {
      return NextResponse.json({ error: 'Kein Bild bereitgestellt' }, { status: 400 })
    }

    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API Key nicht konfiguriert' },
        { status: 500 }
      )
    }

    // Entferne Data-URL Prefix falls vorhanden
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')

    // Validierung: Prüfe ob base64Data vorhanden und nicht leer
    if (!base64Data || base64Data.length < 100) {
      return NextResponse.json(
        { error: 'Ungültiges Bild-Format oder Bild zu klein' },
        { status: 400 }
      )
    }

    console.log(`[classify-vision] Bild empfangen, Größe: ${Math.round(base64Data.length / 1024)} KB`)

    // Erstelle detaillierten Prompt für GPT-4 Vision mit FOKUS auf präzise Erkennung
    const systemPrompt = `Du bist ein Experte für die Klassifizierung von Produkten für einen Online-Marktplatz.

Deine Aufgabe ist es, Produkte auf Bildern GENAU zu erkennen und zu kategorisieren.

KRITISCHE UNTERSCHEIDUNGEN (SEHR WICHTIG!):
- ELEKTROFAHRRAD (E-Bike): Hat PEDALE sichtbar, Akku/Batterie sichtbar (oft am Rahmen), elektrischer Motor (oft am Hinterrad oder Tretlager), sieht aus wie ein NORMALES FAHRRAD mit zusätzlicher Elektronik. Rahmen ähnelt Fahrrad-Rahmen.
- MOPED: KEINE Pedale (oder nur Stützpedale), Motor sichtbar (oft am Rahmen oder Hinterrad), kleiner als Motorrad, Sitzposition wie Motorrad, KEIN Fahrrad-Rahmen.
- MOTORRAD: Größer als Moped, Motor deutlich sichtbar, KEINE Pedale, Sitzposition wie Motorrad, KEIN Fahrrad-Rahmen.
- FAHRRAD: Nur Pedale, KEIN Motor sichtbar, KEIN Akku sichtbar, klassischer Fahrrad-Rahmen.

WEITERE WICHTIGE UNTERSCHEIDUNGEN:
- Smartphone vs. Tablet: Smartphone ist kleiner, wird in einer Hand gehalten. Tablet ist größer, flacher.
- Laptop vs. Notebook: Laptop ist größer (15"+), Notebook ist kleiner (13" oder weniger).
- Kamera vs. Smartphone: Kamera hat Objektiv, größer, separate Komponenten.
- Uhr vs. Schmuck: Uhr hat Zifferblatt, Zeiger, Armband. Schmuck ist dekorativ ohne Funktion.

Antworte IMMER im folgenden JSON-Format:
{
  "category": "kategorie-slug",
  "subcategory": "Unterkategorie Name",
  "productName": "Präziser Produktname (z.B. 'Elektrofahrrad Trek Powerfly' NICHT 'Moped')",
  "confidence": 95,
  "description": "Kurze Beschreibung des erkannten Produkts",
  "suggestedTitle": "Vorschlag für Artikel-Titel (max 80 Zeichen)",
  "suggestedDescription": "Vorschlag für Artikel-Beschreibung (2-3 Sätze, professionell)",
  "keyFeatures": ["Feature 1", "Feature 2", "Feature 3"]
}

Verwende die folgenden Kategorien (nur diese!):
- auto-motorrad: Auto & Motorrad (NUR für Autos, Motorräder, Mopeds - NICHT für E-Bikes!)
- fahrraeder: Fahrräder (inkl. Elektrofahrräder/E-Bikes)
- elektronik: Elektronik (Smartphones, Laptops, Tablets, Kameras, etc.)
- kleidung-accessoires: Kleidung & Accessoires
- haushalt-wohnen: Haushalt & Wohnen
- sport-freizeit: Sport & Freizeit
- buecher-filme-musik: Bücher, Filme & Musik
- spielzeug-basteln: Spielzeug & Basteln
- tiere: Tiere
- garten-pflanzen: Garten & Pflanzen
- jobs-karriere: Jobs & Karriere
- dienstleistungen: Dienstleistungen

WICHTIG:
- Analysiere das Bild SEHR GENAU
- Prüfe ALLE Details (Pedale, Motor, Akku, Rahmen-Form, Größe)
- Bei Unsicherheit zwischen ähnlichen Produkten: Wähle die Kategorie die am besten passt basierend auf den VISUELLEN Merkmalen
- Elektrofahrräder gehören IMMER zu "fahrraeder", NICHT zu "auto-motorrad"!

Sei EXTREM präzise bei der Unterscheidung zwischen ähnlichen Produkten!`

    const userPrompt = `Analysiere dieses Bild genau und erkenne das Produkt.

${context ? `Kontext: ${context}` : ''}

Erkenne:
1. Was ist das Produkt genau? (z.B. "Elektrofahrrad" NICHT "Moped")
2. Welche Kategorie passt am besten?
3. Welche Unterkategorie?
4. Generiere einen präzisen Produktnamen
5. Generiere einen verkaufsfördernden Titel
6. Generiere eine kurze Beschreibung

Antworte NUR im JSON-Format wie oben spezifiziert.`

    // Rufe OpenAI GPT-4 Vision API auf
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o', // GPT-4 Vision für beste Genauigkeit
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userPrompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Data}`,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.3, // Niedrige Temperatur für präzise Erkennung
        response_format: { type: 'json_object' }, // Erzwinge JSON-Antwort
      }),
    })

    if (!response.ok) {
      let errorMessage = 'Fehler bei der Bilderkennung mit GPT-4 Vision'
      try {
        const error = await response.json()
        console.error('OpenAI GPT-4 Vision API Fehler:', error)
        errorMessage = error.error?.message || error.message || errorMessage
      } catch (e) {
        const errorText = await response.text()
        console.error('OpenAI GPT-4 Vision API Fehler (Text):', errorText)
        errorMessage = `HTTP ${response.status}: ${errorText.substring(0, 200)}`
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      )
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: 'Keine Antwort von GPT-4 Vision' },
        { status: 500 }
      )
    }

    try {
      const result = JSON.parse(content)

      return NextResponse.json({
        ...result,
        model: 'gpt-4o-vision',
        confidence: result.confidence || 90,
      })
    } catch (parseError) {
      console.error('Fehler beim Parsen der GPT-4 Vision Antwort:', parseError)
      console.error('Roh-Antwort:', content)
      return NextResponse.json(
        { error: 'Ungültige Antwort von GPT-4 Vision' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Fehler bei GPT-4 Vision Erkennung:', error)
    console.error('Fehler-Stack:', error.stack)
    return NextResponse.json(
      {
        error: 'Fehler bei der Bilderkennung: ' + (error.message || String(error)),
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
