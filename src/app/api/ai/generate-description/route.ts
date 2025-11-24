import { NextRequest, NextResponse } from 'next/server'

/**
 * AUTOMATISCHE BESCHREIBUNGS-GENERIERUNG (wie Ricardo AI)
 * 
 * Nutzt OpenAI GPT API um automatische, professionelle Artikelbeschreibungen zu generieren
 */

export async function POST(request: NextRequest) {
  try {
    const { title, category, subcategory, brand, model, condition, imageBase64 } = await request.json()

    if (!title) {
      return NextResponse.json(
        { error: 'Titel ist erforderlich' },
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

    // Erstelle Prompt für GPT
    const prompt = `Erstelle eine professionelle, verkaufsfördernde Artikelbeschreibung für einen Online-Marktplatz (ähnlich wie Ricardo.ch).

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
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Kostengünstig und schnell
        messages: [
          {
            role: 'system',
            content: 'Du bist ein professioneller Verkaufsassistent für einen Online-Marktplatz. Erstelle präzise, vertrauenswürdige Artikelbeschreibungen.'
          },
          {
            role: 'user',
            content: prompt
          }
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
    return NextResponse.json(
      { error: 'Fehler bei der Beschreibungsgenerierung' },
      { status: 500 }
    )
  }
}
















