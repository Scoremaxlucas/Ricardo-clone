import { NextRequest, NextResponse } from 'next/server'

/**
 * KI-TITEL-GENERIERUNG BASIEREND AUF BILD
 *
 * Nutzt GPT-4 Vision um einen präzisen, verkaufsfördernden Titel zu generieren
 * Ähnlich wie bei Ricardo: Nur Vorschlag, keine automatische Ausfüllung
 */

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, category, subcategory, context } = await request.json()

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

    const systemPrompt = `Du bist ein Experte für die Erstellung von verkaufsfördernden Produkttiteln für einen Online-Marktplatz.

Erstelle präzise, informative Titel die:
- Das Produkt genau beschreiben
- Wichtige Details enthalten (Marke, Modell, Zustand wenn erkennbar)
- Suchmaschinen-optimiert sind
- Maximal 80 Zeichen lang sind
- Auf Deutsch sind

Beispiele:
- "Elektrofahrrad Trek Powerfly FS 9.7 E-Bike 2023"
- "Vintage Rolex Submariner 16610 Automatik-Uhr"
- "Samsung Galaxy S23 Ultra 256GB Schwarz Neu"`

    const userPrompt = `Analysiere dieses Bild und erstelle einen präzisen, verkaufsfördernden Produkttitel.

${category ? `Kategorie: ${category}` : ''}
${subcategory ? `Unterkategorie: ${subcategory}` : ''}
${context ? `Zusätzlicher Kontext: ${context}` : ''}

Erkenne:
- Was ist das Produkt genau?
- Welche Marke (falls erkennbar)?
- Welches Modell (falls erkennbar)?
- Welcher Zustand (falls erkennbar)?
- Besondere Merkmale?

Antworte NUR mit dem Titel, keine weiteren Erklärungen.`

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
        max_tokens: 100,
        temperature: 0.5, // Balance zwischen Kreativität und Präzision
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('OpenAI API Fehler:', error)
      return NextResponse.json(
        { error: 'Fehler bei der Titel-Generierung' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const title = data.choices[0]?.message?.content?.trim() || ''

    return NextResponse.json({
      title,
      model: 'gpt-4o-vision',
    })
  } catch (error: any) {
    console.error('Fehler bei Titel-Generierung:', error)
    return NextResponse.json(
      { error: 'Fehler bei der Titel-Generierung: ' + error.message },
      { status: 500 }
    )
  }
}

