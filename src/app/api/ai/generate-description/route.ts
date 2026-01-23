import { imageInputToBase64 } from '@/lib/ai-image-utils'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * KI-BESCHREIBUNGS-GENERIERUNG
 * Unterstützt Bild (base64 oder URL) und/oder Titel + Metadaten.
 */
export async function POST(request: NextRequest) {
  try {
    const { title, category, subcategory, brand, model, condition, imageBase64 } =
      await request.json()

    if (!title && !imageBase64) {
      return NextResponse.json(
        { error: 'Titel oder Bild ist erforderlich' },
        { status: 400 }
      )
    }

    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API Key nicht konfiguriert' },
        { status: 500 }
      )
    }

    const systemPrompt = `Du erstellst kurze, sachliche Artikelbeschreibungen für einen Online-Marktplatz.

Anforderungen:
- 1-2 Sätze, knapp und faktenbasiert
- Auf Deutsch
- Nur erkennbare Fakten: Marke, Modell, Zustand, ggf. Farbe/Material
- Keine Werbesprache, keine Übertreibungen, keine Superlative
- Neutrale Formulierung`

    // 1. Versuche Bild-basierte Generierung (GPT-4 Vision)
    if (imageBase64) {
      try {
        const base64Data = await imageInputToBase64(imageBase64)

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
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: systemPrompt },
              {
                role: 'user',
                content: [
                  { type: 'text', text: userPrompt },
                  {
                    type: 'image_url',
                    image_url: { url: `data:image/jpeg;base64,${base64Data}` },
                  },
                ],
              },
            ],
            max_tokens: 150,
            temperature: 0.3,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const description = data.choices[0]?.message?.content?.trim() || ''
          if (description) {
            return NextResponse.json({ description, model: 'gpt-4o-vision' })
          }
        }
        const errBody = await response.json().catch(() => ({}))
        console.warn('[generate-description] Vision failed, falling back to text:', errBody?.error?.message)
      } catch (visionErr: any) {
        console.warn('[generate-description] Vision error, falling back to text:', visionErr?.message)
      }
    }

    // 2. Text-basierte Generierung (Fallback oder nur Titel)
    if (!title) {
      return NextResponse.json(
        { error: 'Für die Beschreibung werden Titel oder Bild benötigt.' },
        { status: 400 }
      )
    }

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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Du erstellst kurze, sachliche Artikelbeschreibungen. 1-2 Sätze, nur Fakten, keine Werbesprache.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 120,
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      const msg = err?.error?.message || err?.message || 'Fehler bei der Beschreibungsgenerierung'
      console.error('[generate-description] OpenAI error:', msg)
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    const data = await response.json()
    const description = data.choices[0]?.message?.content?.trim() || ''

    return NextResponse.json({ description, model: 'gpt-4o-mini' })
  } catch (error: any) {
    console.error('[generate-description] Error:', error)
    const msg = error?.message || 'Fehler bei der Beschreibungsgenerierung'
    return NextResponse.json(
      { error: msg },
      { status: msg.includes('zu groß') || msg.includes('Kein Bild') ? 400 : 500 }
    )
  }
}
