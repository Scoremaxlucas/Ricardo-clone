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

      const systemPrompt = `Du bist ein professioneller Verkaufsassistent für einen Online-Marktplatz.
Erstelle präzise, vertrauenswürdige Artikelbeschreibungen basierend auf Bildern.

Anforderungen:
- Professionell und vertrauenswürdig
- 3-5 Sätze
- Auf Deutsch
- Erwähne wichtige Details die auf dem Bild erkennbar sind (Zustand, Besonderheiten, Marke, Modell)
- Keine Übertreibungen
- Format: Fließtext, keine Bullet Points`

      const userPrompt = `Analysiere dieses Bild und erstelle eine professionelle Artikelbeschreibung.

${title ? `Titel: ${title}` : ''}
${category ? `Kategorie: ${category}` : ''}
${subcategory ? `Unterkategorie: ${subcategory}` : ''}
${brand ? `Marke: ${brand}` : ''}
${model ? `Modell: ${model}` : ''}
${condition ? `Zustand: ${condition}` : ''}

Beschreibe das Produkt genau wie es auf dem Bild zu sehen ist.`

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
          max_tokens: 300,
          temperature: 0.7,
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
    const prompt = `Erstelle eine professionelle, verkaufsfördernde Artikelbeschreibung für einen Online-Marktplatz.

Artikel-Details:
- Titel: ${title}
${category ? `- Kategorie: ${category}` : ''}
${subcategory ? `- Unterkategorie: ${subcategory}` : ''}
${brand ? `- Marke: ${brand}` : ''}
${model ? `- Modell: ${model}` : ''}
${condition ? `- Zustand: ${condition}` : ''}

Anforderungen:
- Professionell und vertrauenswürdig
- 3-5 Sätze
- Auf Deutsch
- Erwähne wichtige Details (Zustand, Besonderheiten)
- Keine Übertreibungen
- Format: Fließtext, keine Bullet Points

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
              'Du bist ein professioneller Verkaufsassistent für einen Online-Marktplatz. Erstelle präzise, vertrauenswürdige Artikelbeschreibungen.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 200,
        temperature: 0.7,
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
