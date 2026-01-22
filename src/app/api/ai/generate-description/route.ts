import { NextRequest, NextResponse } from 'next/server'

/**
 * KI-BESCHREIBUNGS-GENERIERUNG
 *
 * Nutzt OpenAI GPT-4 Vision API um professionelle Artikelbeschreibungen zu generieren
 * Unterstützt sowohl Text-basierte als auch Bild-basierte Generierung
 */

export async function POST(request: NextRequest) {
  try {
    const { title, category, subcategory, brand, model, condition, imageBase64 } =
      await request.json()

    // Entweder Titel ODER Bild muss vorhanden sein
    if (!title && !imageBase64) {
      return NextResponse.json(
        { error: 'Titel oder Bild ist erforderlich' },
        { status: 400 }
      )
    }

    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      return NextResponse.json({ error: 'OpenAI API Key nicht konfiguriert' }, { status: 500 })
    }

    // Wenn Bild vorhanden, nutze GPT-4 Vision für bessere Beschreibung
    if (imageBase64) {
      const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')

      const systemPrompt = `Du erstellst kurze, sachliche Artikelbeschreibungen für einen Online-Marktplatz.

Anforderungen:
- 1-2 Sätze, knapp und faktenbasiert
- Auf Deutsch
- Nur erkennbare Fakten: Marke, Modell, Zustand, ggf. Farbe/Material
- Keine Werbesprache, keine Übertreibungen, keine Superlative
- Neutrale Formulierung`

      const userPrompt = `Analysiere das Bild und erstelle eine kurze, sachliche Beschreibung.

${title ? `Titel: ${title}` : ''}
${category ? `Kategorie: ${category}` : ''}
${subcategory ? `Unterkategorie: ${subcategory}` : ''}
${brand ? `Marke: ${brand}` : ''}
${model ? `Modell: ${model}` : ''}
${condition ? `Zustand: ${condition}` : ''}

Nur Fakten, die auf dem Bild erkennbar sind. Keine Werbesprache.`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o', // GPT-4 Vision für Bild-Analyse
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
          max_tokens: 150,
          temperature: 0.3,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('OpenAI GPT-4 Vision API Fehler:', error)
        // Fallback zu Text-basierter Generierung
      } else {
        const data = await response.json()
        const description = data.choices[0]?.message?.content?.trim() || ''

        return NextResponse.json({
          description,
          model: 'gpt-4o-vision',
        })
      }
    }

    // Text-basierte Generierung (Fallback oder wenn kein Bild vorhanden)
    const prompt = `Erstelle eine kurze, sachliche Artikelbeschreibung.

Artikel-Details:
- Titel: ${title}
${category ? `- Kategorie: ${category}` : ''}
${subcategory ? `- Unterkategorie: ${subcategory}` : ''}
${brand ? `- Marke: ${brand}` : ''}
${model ? `- Modell: ${model}` : ''}
${condition ? `- Zustand: ${condition}` : ''}

Anforderungen:
- 1-2 Sätze, knapp und faktenbasiert
- Auf Deutsch
- Nur Fakten (Zustand, Besonderheiten), keine Werbesprache

Beschreibung:`

    // Rufe OpenAI API auf
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Kostengünstig und schnell
        messages: [
          {
            role: 'system',
            content:
              'Du erstellst kurze, sachliche Artikelbeschreibungen. 1-2 Sätze, nur Fakten, keine Werbesprache.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 120,
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('OpenAI API Fehler:', error)
      return NextResponse.json(
        { error: 'Fehler bei der Beschreibungsgenerierung' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const description = data.choices[0]?.message?.content?.trim() || ''

    return NextResponse.json({
      description,
      model: 'gpt-4o-mini',
    })
  } catch (error) {
    console.error('Fehler bei Beschreibungsgenerierung:', error)
    return NextResponse.json({ error: 'Fehler bei der Beschreibungsgenerierung' }, { status: 500 })
  }
}
