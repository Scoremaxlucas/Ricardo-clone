import Anthropic from '@anthropic-ai/sdk'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { coerceAnthropicListingModel } from '@/lib/rental/anthropic-model'
import { runAdminListingIngest, type AdminIngestMode } from '@/lib/rental/listing-ingest-orchestrator'
import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const MODES = new Set<AdminIngestMode>(['url', 'text', 'images_text', 'combined'])

const TEXT_INGEST_SYSTEM = `Du analysierst Informationen zu einer Schweizer Mietwohnung.
Extrahiere alle verfügbaren Informationen. Antworte NUR mit einem JSON-Objekt, absolut kein anderer Text, keine Backticks, kein Markdown:
{
  "title": "",
  "description": "",
  "address": "",
  "zip": "",
  "city": "",
  "canton": "",
  "rooms": null,
  "areaSqm": null,
  "floor": null,
  "rentPerMonth": null,
  "utilitiesPerMonth": null,
  "depositAmount": null,
  "availableFrom": "",
  "features": [],
  "landlordName": "",
  "landlordContact": "",
  "confidence": "high"
}
Regeln:
- Alle CHF-Beträge als Ganzzahl ohne Formatierung (3200 nicht 3'200)
- rooms als Dezimalzahl (3.5)
- availableFrom als YYYY-MM-DD, falls "per sofort" dann heutiges Datum
- canton als 2-Buchstaben Kürzel
- features als Array von deutschen Strings
- Felder die nicht erkennbar sind: null oder leer`

function ingestModel(): string {
  return coerceAnthropicListingModel(process.env.ANTHROPIC_INGEST_MODEL)
}

function coerceFiniteNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const cleaned = v
      .replace(/'/g, '')
      .replace(/\u2019/g, '')
      .replace(/\s/g, '')
      .replace(/CHF/gi, '')
      .replace(/fr\.?/gi, '')
      .replace(',', '.')
    const m = cleaned.match(/-?\d+(\.\d+)?/)
    if (!m) return null
    const n = parseFloat(m[0])
    return Number.isFinite(n) ? n : null
  }
  return null
}

function coerceChfInt(v: unknown): number | null {
  const n = coerceFiniteNumber(v)
  return n == null ? null : Math.round(n)
}

function normalizeTextIngestData(raw: Record<string, unknown>): Record<string, unknown> {
  const features = Array.isArray(raw.features) ? raw.features.filter((x): x is string => typeof x === 'string') : []
  const conf = raw.confidence
  const confidence =
    conf === 'high' || conf === 'medium' || conf === 'low' ? conf : 'high'
  return {
    title: typeof raw.title === 'string' ? raw.title : '',
    description: typeof raw.description === 'string' ? raw.description : '',
    address: typeof raw.address === 'string' ? raw.address : '',
    zip: typeof raw.zip === 'string' ? raw.zip.replace(/\D/g, '').slice(0, 4) : '',
    city: typeof raw.city === 'string' ? raw.city : '',
    canton: typeof raw.canton === 'string' ? raw.canton.trim().toUpperCase().slice(0, 2) : '',
    rooms: coerceFiniteNumber(raw.rooms),
    areaSqm: coerceFiniteNumber(raw.areaSqm),
    floor: coerceFiniteNumber(raw.floor),
    rentPerMonth: coerceChfInt(raw.rentPerMonth),
    utilitiesPerMonth: coerceChfInt(raw.utilitiesPerMonth),
    depositAmount: coerceChfInt(raw.depositAmount),
    availableFrom: typeof raw.availableFrom === 'string' ? raw.availableFrom.trim() : '',
    features,
    landlordName: typeof raw.landlordName === 'string' ? raw.landlordName : '',
    landlordContact: typeof raw.landlordContact === 'string' ? raw.landlordContact : '',
    confidence,
  }
}

async function handlePlainTextIngest(inputText: string): Promise<NextResponse> {
  console.log('TEXT INPUT received, length:', inputText?.length)
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        error: 'NO_API_KEY',
        message: 'Anthropic API Key fehlt (Server-Konfiguration).',
        fallback: true,
      },
      { status: 200 }
    )
  }

  const client = new Anthropic({ apiKey })
  console.log('Sending to Anthropic...')
  const message = await client.messages.create({
    model: ingestModel(),
    max_tokens: 4096,
    system: TEXT_INGEST_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Analysiere diesen Text eines Schweizer Mietwohnungsinserats und extrahiere alle Informationen. Antworte NUR mit einem JSON-Objekt ohne Backticks oder andere Zeichen davor oder danach:\n\n${inputText.slice(0, 12000)}`,
      },
    ],
  })

  const responseText =
    message.content[0]?.type === 'text' ? message.content[0].text : ''
  console.log(
    'Anthropic response:',
    JSON.stringify({
      id: message.id,
      model: message.model,
      stopReason: message.stop_reason,
      textLength: responseText.length,
      textPreview: responseText.slice(0, 500),
    })
  )

  const cleanJson = responseText
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(cleanJson)
  } catch {
    const start = cleanJson.indexOf('{')
    const end = cleanJson.lastIndexOf('}')
    if (start === -1 || end === -1 || end <= start) {
      console.error('JSON parse failed. Raw response:', responseText)
      return NextResponse.json(
        {
          success: false,
          error: 'PARSE_FAILED',
          message: 'Die KI-Antwort enthielt kein gültiges JSON.',
          rawResponse: responseText.slice(0, 8000),
          fallback: true,
        },
        { status: 200 }
      )
    }
    try {
      parsed = JSON.parse(cleanJson.slice(start, end + 1))
    } catch {
      console.error('JSON parse failed. Raw response:', responseText)
      return NextResponse.json(
        {
          success: false,
          error: 'PARSE_FAILED',
          message: 'Die KI-Antwort enthielt kein gültiges JSON.',
          rawResponse: responseText.slice(0, 8000),
          fallback: true,
        },
        { status: 200 }
      )
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    console.error('JSON parse failed. Raw response:', responseText)
    return NextResponse.json(
      {
        success: false,
        error: 'PARSE_FAILED',
        message: 'Die KI-Antwort enthielt kein gültiges JSON.',
        rawResponse: responseText.slice(0, 8000),
        fallback: true,
      },
      { status: 200 }
    )
  }

  const data = normalizeTextIngestData(parsed as Record<string, unknown>)
  console.log('Parsed result:', JSON.stringify(data))

  return NextResponse.json({
    success: true,
    data,
    images: [] as string[],
  })
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!(await isAdmin(session))) {
      return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
    }
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ message: 'Ungültiger Body' }, { status: 400 })
    }
    console.log('Ingest API called with:', JSON.stringify(body))
    const b = body as Record<string, unknown>

    const textPayload = typeof b.text === 'string' ? b.text.trim() : ''
    const modeStr = typeof b.mode === 'string' ? b.mode : ''
    const useDedicatedTextIngest =
      textPayload.length > 0 &&
      (b.type === 'text' || modeStr === 'text') &&
      modeStr !== 'images_text' &&
      modeStr !== 'combined' &&
      modeStr !== 'url'

    if (useDedicatedTextIngest) {
      return await handlePlainTextIngest(textPayload)
    }

    const mode = b.mode
    if (typeof mode !== 'string' || !MODES.has(mode as AdminIngestMode)) {
      return NextResponse.json({ message: 'Ungültiger Modus' }, { status: 400 })
    }

    try {
      const result = await runAdminListingIngest(session.user.id, {
        mode: mode as AdminIngestMode,
        url: typeof b.url === 'string' ? b.url : undefined,
        text: typeof b.text === 'string' ? b.text : undefined,
        imageUrls: Array.isArray(b.imageUrls) ? b.imageUrls.filter((x): x is string => typeof x === 'string') : undefined,
      })
      return NextResponse.json({ success: true, ...result })
    } catch (error) {
      console.error('Ingest detailed error:', error)
      console.error('Error stack:', error instanceof Error ? error.stack : 'no stack')
      return NextResponse.json(
        {
          success: false,
          error: 'INGEST_EXCEPTION',
          message:
            'Die automatische Analyse ist fehlgeschlagen. Bitte die Daten manuell eingeben oder später erneut versuchen.',
          fallback: true,
        },
        { status: 200 }
      )
    }
  } catch (error) {
    console.error('Ingest outer error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'no stack')
    return NextResponse.json(
      {
        success: false,
        error: 'INGEST_EXCEPTION',
        message:
          'Die automatische Analyse ist fehlgeschlagen. Bitte die Daten manuell eingeben oder später erneut versuchen.',
        fallback: true,
      },
      { status: 200 }
    )
  }
}
