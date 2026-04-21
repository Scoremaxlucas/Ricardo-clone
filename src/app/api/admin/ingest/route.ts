import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { anthropicListingModelCandidates } from '@/lib/rental/anthropic-model'
import { runAdminListingIngest, type AdminIngestMode } from '@/lib/rental/listing-ingest-orchestrator'
import { assertUrlSafeForServerFetch } from '@/lib/rental/listing-url-import-server'
import { getServerSession } from 'next-auth/next'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const EXTRACTION_SYSTEM_PROMPT = `Du bist ein Experte für Schweizer Immobilieninserate.
Deine Aufgabe: Extrahiere strukturierte Daten aus beliebigem Text über Mietwohnungen oder aus Screenshots/Fotos von Inserats-Seiten.
Der Text kann aus E-Mails, WhatsApp-Nachrichten, Inseraten, oder anderen Quellen stammen; Bilder können z. B. von Tutti, Homegate oder Social Media stammen.
Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt.
KEINE Backticks, KEIN Markdown, KEIN erklärender Text, NUR das JSON-Objekt selbst.

Pflichtformat der Antwort:
{
  "title": "Aussagekräftiger Titel der Wohnung",
  "description": "Vollständige Beschreibung auf Deutsch",
  "address": "Strassenname und Hausnummer",
  "zip": "4-stellige Schweizer PLZ",
  "city": "Ortsname",
  "canton": "2-Buchstaben Kürzel z.B. ZH BE GE BS",
  "rooms": 3.5,
  "areaSqm": 90,
  "floor": null,
  "rentPerMonth": 3200,
  "utilitiesPerMonth": 300,
  "depositAmount": null,
  "availableFrom": "2026-04-22",
  "features": ["Balkon", "Lift", "Parkettboden"],
  "landlordName": "",
  "landlordContact": "email@beispiel.ch",
  "confidence": "high"
}

Strikte Regeln:
- title: Falls nicht explizit angegeben, erstelle einen aus Zimmeranzahl + Ort (z.B. "3.5-Zimmer-Wohnung in Zürich-Wollishofen")
- description: Schreibe eine saubere deutsche Beschreibung basierend auf allen verfügbaren Infos. Mindestens 80 Zeichen.
- address: Nur Strasse + Nummer, OHNE PLZ und Stadt
- zip: Nur die 4-stellige Zahl als String
- city: Nur der Ortsname ohne Kanton
- canton: Leite aus PLZ oder Ortsname ab (8xxx = ZH, 3xxx = BE, 12xx = GE, etc.)
- rooms: Dezimalzahl (3.5 nicht "3.5 Zimmer")
- areaSqm: Nur die Zahl ohne Einheit
- rentPerMonth: Nur der Nettomietzins ohne NK, als Ganzzahl ohne Apostrophe
- utilitiesPerMonth: Nebenkosten/Akonto als Ganzzahl, null falls nicht angegeben
- depositAmount: Kaution als Ganzzahl, null falls nicht angegeben
- availableFrom: ISO-Datum YYYY-MM-DD. Falls "per sofort" oder "sofort": heutiges Datum. Falls "nach Vereinbarung": null
- features: Array mit deutschen Strings. Erkenne: Balkon, Terrasse, Garten, Lift, Parkettboden, Einbauküche, Kellerabteil, Parkplatz, Waschmaschine, Tumbler, Geschirrspüler, Badewanne, Dusche, Glasfaser, Minergie
- landlordContact: E-Mail oder Telefonnummer des Vermieters falls vorhanden
- confidence: "high" wenn mind. 5 Felder gefüllt, "medium" wenn 3-4, "low" wenn weniger`

function abortAfter(ms: number): AbortSignal {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(ms)
  }
  const ac = new AbortController()
  setTimeout(() => ac.abort(), ms)
  return ac.signal
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
      .replace(/m²|m2|qm/gi, '')
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

/** Nach JSON.parse: Zahlen/Strings vereinheitlichen (KI liefert oft Strings). */
function normalizeExtractedPayload(raw: Record<string, unknown>): Record<string, unknown> {
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
    availableFrom:
      raw.availableFrom === null || raw.availableFrom === undefined
        ? ''
        : typeof raw.availableFrom === 'string'
          ? raw.availableFrom.trim()
          : '',
    features,
    landlordName: typeof raw.landlordName === 'string' ? raw.landlordName : '',
    landlordContact: typeof raw.landlordContact === 'string' ? raw.landlordContact : '',
    confidence,
  }
}

const LISTING_EXTRACT_TOOL = {
  name: 'submit_swiss_rental_listing' as const,
  description:
    'Pflicht-Ausgabe: alle erkannten Felder eines Schweizer Mietwohnungsinserats als strukturiertes Objekt.',
  input_schema: {
    type: 'object' as const,
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      address: { type: 'string' },
      zip: { type: 'string' },
      city: { type: 'string' },
      canton: { type: 'string' },
      rooms: { type: 'number' },
      areaSqm: { type: 'number' },
      floor: { type: 'number' },
      rentPerMonth: { type: 'number' },
      utilitiesPerMonth: { type: 'number' },
      depositAmount: { type: 'number' },
      availableFrom: { type: 'string' },
      features: { type: 'array', items: { type: 'string' } },
      landlordName: { type: 'string' },
      landlordContact: { type: 'string' },
      confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    },
    required: ['title', 'description', 'confidence'],
  },
}

type AnthropicNonStreamMessage = { content: Array<{ type: string; text?: string; name?: string; input?: unknown }> }

function joinTextBlocks(message: AnthropicNonStreamMessage): string {
  return message.content
    .filter((b): b is { type: 'text'; text: string } => b.type === 'text' && typeof b.text === 'string')
    .map(b => b.text)
    .join('\n')
    .trim()
}

/** Freitext-JSON der KI parsen (Fallback wenn kein tool_use). */
function parseAnthropicJsonRobust(rawText: string): Record<string, unknown> {
  let s = rawText
    .replace(/^\uFEFF/, '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  const tryParse = (chunk: string): Record<string, unknown> => {
    const trimmed = chunk.replace(/,(\s*[}\]])/g, '$1').trim()
    const parsed = JSON.parse(trimmed) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Not a JSON object')
    }
    return parsed as Record<string, unknown>
  }

  try {
    return tryParse(s)
  } catch {
    /* continue */
  }

  const first = s.indexOf('{')
  const last = s.lastIndexOf('}')
  if (first >= 0 && last > first) {
    try {
      return tryParse(s.slice(first, last + 1))
    } catch {
      /* continue */
    }
  }

  throw new Error(`JSON.parse failed; snippet: ${s.slice(0, 280)}`)
}

function isAnthropicModelNotFound(error: unknown): boolean {
  const s = String(error)
  return s.includes('not_found_error') || (s.includes('404') && s.includes('model'))
}

async function extractListingFromAnthropic(
  anthropic: Anthropic,
  userContent: string | Anthropic.ContentBlockParam[]
): Promise<Record<string, unknown>> {
  const models = anthropicListingModelCandidates(process.env.ANTHROPIC_INGEST_MODEL)
  let lastError: unknown
  for (let i = 0; i < models.length; i++) {
    const model = models[i]
    try {
      const msg = (await anthropic.messages.create({
        model,
        max_tokens: 8192,
        stream: false,
        system: EXTRACTION_SYSTEM_PROMPT,
        tools: [LISTING_EXTRACT_TOOL as unknown as Anthropic.Messages.Tool],
        tool_choice: { type: 'tool', name: LISTING_EXTRACT_TOOL.name },
        messages: [{ role: 'user', content: userContent }],
      })) as AnthropicNonStreamMessage

      for (const block of msg.content) {
        if (block.type === 'tool_use' && block.name === LISTING_EXTRACT_TOOL.name) {
          const inp = block.input
          if (inp && typeof inp === 'object' && !Array.isArray(inp)) {
            return inp as Record<string, unknown>
          }
        }
      }

      const joined = joinTextBlocks(msg)
      if (!joined) {
        throw new Error('Anthropic: kein tool_use und kein Text-Block in der Antwort')
      }
      return parseAnthropicJsonRobust(joined)
    } catch (e) {
      if (isAnthropicModelNotFound(e) && i < models.length - 1) {
        console.warn('[INGEST] Modell nicht verfügbar:', model, '→ Fallback:', models[i + 1])
        lastError = e
        continue
      }
      throw e
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

const SCREENSHOT_MAX_FILES = 5
const SCREENSHOT_MAX_BYTES = 10 * 1024 * 1024

type VisionMediaType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

function inferVisionMediaType(file: File): VisionMediaType | null {
  const type = (file.type || '').toLowerCase().split(';')[0].trim()
  if (type === 'image/jpeg' || type === 'image/jpg') return 'image/jpeg'
  if (type === 'image/png') return 'image/png'
  if (type === 'image/webp') return 'image/webp'
  if (type === 'image/gif') return 'image/gif'
  const n = file.name.toLowerCase()
  if (n.endsWith('.jpg') || n.endsWith('.jpeg')) return 'image/jpeg'
  if (n.endsWith('.png')) return 'image/png'
  if (n.endsWith('.webp')) return 'image/webp'
  if (n.endsWith('.gif')) return 'image/gif'
  if (type === 'image/heic' || type === 'image/heif' || n.endsWith('.heic') || n.endsWith('.heif')) {
    return null
  }
  return null
}

async function handleScreenshotIngest(
  anthropic: Anthropic,
  formData: FormData
): Promise<NextResponse> {
  const raw = formData.getAll('images')
  const files = raw.filter((x): x is File => typeof File !== 'undefined' && x instanceof File)

  if (files.length === 0) {
    return NextResponse.json(
      { success: false, message: 'Bitte mindestens einen Screenshot hochladen.', fallback: true },
      { status: 200 }
    )
  }
  if (files.length > SCREENSHOT_MAX_FILES) {
    return NextResponse.json(
      { success: false, message: `Maximal ${SCREENSHOT_MAX_FILES} Screenshots erlaubt.`, fallback: true },
      { status: 200 }
    )
  }

  const imageBlocks: Anthropic.ContentBlockParam[] = []
  for (const file of files) {
    if (file.size > SCREENSHOT_MAX_BYTES) {
      return NextResponse.json(
        { success: false, message: 'Bild zu gross. Max. 10MB pro Screenshot.', fallback: true },
        { status: 200 }
      )
    }
    const mediaType = inferVisionMediaType(file)
    if (!mediaType) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Nur JPG, PNG, WebP und GIF erlaubt. HEIC: bitte auf dem iPhone als JPG exportieren (Teilen → «Als JPEG speichern»).',
          fallback: true,
        },
        { status: 200 }
      )
    }
    const buf = Buffer.from(await file.arrayBuffer())
    imageBlocks.push({
      type: 'image',
      source: { type: 'base64', media_type: mediaType, data: buf.toString('base64') },
    })
  }

  const n = imageBlocks.length
  const caption = `Analysiere diese ${n} Screenshot(s) eines Schweizer Mietwohnungsinserats.
Extrahiere ALLE sichtbaren Informationen: Titel, Adresse, PLZ, Ort, Zimmer, Fläche, Miete, Nebenkosten, Kaution, Verfügbarkeit, Ausstattung, Kontaktinfos.
Nutze das vorgegebene Tool «submit_swiss_rental_listing» mit allen erkannten Feldern.`

  imageBlocks.push({ type: 'text', text: caption })

  try {
    console.log('[INGEST] Screenshot flow, images:', n)
    const parsed = await extractListingFromAnthropic(anthropic, imageBlocks)
    const data = normalizeExtractedPayload(parsed)
    return NextResponse.json({
      success: true,
      data,
      images: [] as string[],
      source: 'screenshot',
    })
  } catch (error) {
    console.error('[INGEST] Screenshot vision error:', error)
    return NextResponse.json(
      {
        success: false,
        message:
          'Screenshot konnte nicht analysiert werden. Bitte versuche es mit einem klareren Screenshot oder als JPG/PNG.',
        details: String(error),
        fallback: true,
      },
      { status: 200 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!(await isAdmin(session))) {
    return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
  }
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
  }

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

  const anthropic = new Anthropic({ apiKey })

  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    let formData: FormData
    try {
      formData = await request.formData()
    } catch (e) {
      console.error('[INGEST] multipart parse error:', e)
      return NextResponse.json(
        {
          success: false,
          message:
            'Upload konnte nicht gelesen werden. Bitte weniger oder kleinere Dateien versuchen (max. 10 MB pro Bild, bis zu 5 Bilder).',
          fallback: true,
        },
        { status: 200 }
      )
    }
    const formType = formData.get('type')
    if (formType === 'screenshot') {
      return await handleScreenshotIngest(anthropic, formData)
    }
    return NextResponse.json(
      { success: false, message: 'Unbekannter Formular-Typ.', fallback: true },
      { status: 200 }
    )
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const type = typeof body.type === 'string' ? body.type : undefined
  const modeField = typeof body.mode === 'string' ? body.mode : undefined
  const text = typeof body.text === 'string' ? body.text : ''
  const url = typeof body.url === 'string' ? body.url.trim() : ''

  const resolvedType: 'text' | 'url' | undefined =
    type === 'text' || type === 'url'
      ? type
      : modeField === 'text'
        ? 'text'
        : modeField === 'url'
          ? 'url'
          : undefined

  // ——— TEXT ———
  if (resolvedType === 'text') {
    if (!text || text.trim().length < 10) {
      return NextResponse.json({ success: false, error: 'Text zu kurz oder leer' }, { status: 400 })
    }
    const t = text.trim()
    console.log('[INGEST] Text flow started, length:', t.length)
    try {
      console.log('Sending to Anthropic (tool + JSON fallback)…')
      const parsed = await extractListingFromAnthropic(
        anthropic,
        `Extrahiere alle Wohnungsdaten aus folgendem Text:\n\n${t.slice(0, 12000)}`
      )
      const data = normalizeExtractedPayload(parsed)
      console.log('[INGEST] Parsed result keys:', Object.keys(data).join(', '))
      return NextResponse.json({
        success: true,
        data,
        images: [] as string[],
        source: 'text',
      })
    } catch (error) {
      console.error('[INGEST] Text flow error:', error)
      console.error('Ingest detailed error:', error)
      console.error('Error stack:', error instanceof Error ? error.stack : 'no stack')
      return NextResponse.json(
        {
          success: false,
          error: 'AI_PARSE_FAILED',
          message: 'Analyse fehlgeschlagen. Bitte versuche es erneut oder fülle das Formular manuell aus.',
          details: String(error),
          fallback: true,
        },
        { status: 200 }
      )
    }
  }

  // ——— URL ———
  if (resolvedType === 'url') {
    if (!url) {
      return NextResponse.json({ error: 'URL fehlt' }, { status: 400 })
    }
    console.log('[INGEST] URL flow started:', url)

    let pageText = ''
    let imageUrls: string[] = []
    let blocked = false

    try {
      const safe = await assertUrlSafeForServerFetch(url)
      const fetchUrl = safe.toString()
      const response = await fetch(fetchUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'de-CH,de;q=0.9,en;q=0.8',
        },
        signal: abortAfter(10_000),
      })

      if (response.status === 403 || response.status === 429 || response.status === 401) {
        blocked = true
      } else if (response.status === 404 || response.status === 410) {
        return NextResponse.json(
          {
            success: false,
            error: 'URL_NOT_FOUND',
            message: 'Diese Seite existiert nicht mehr (404). Die Wohnung ist möglicherweise vergeben.',
            fallback: true,
          },
          { status: 200 }
        )
      } else {
        const html = await response.text()
        pageText = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 8000)

        const imgMatches = Array.from(
          html.matchAll(/<img[^>]+(?:src|data-src)=["']([^"']+)["'][^>]*>/gi)
        )
        for (const match of imgMatches) {
          const src = match[1]
          const lower = src.toLowerCase()
          if (
            src.startsWith('http') &&
            (lower.includes('.jpg') ||
              lower.includes('.jpeg') ||
              lower.includes('.png') ||
              lower.includes('.webp')) &&
            !lower.includes('icon') &&
            !lower.includes('logo') &&
            !lower.includes('1x1') &&
            !lower.includes('pixel')
          ) {
            imageUrls.push(src)
          }
        }

        const jsonLdMatches = Array.from(
          html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
        )
        for (const match of jsonLdMatches) {
          try {
            const jsonStr = JSON.stringify(JSON.parse(match[1]))
            const urlMatches = Array.from(
              jsonStr.matchAll(/https?:\/\/[^\s"'\\]+\.(?:jpg|jpeg|png|webp)/gi)
            )
            for (const urlMatch of urlMatches) {
              imageUrls.push(urlMatch[0])
            }
          } catch {
            /* ignore */
          }
        }

        imageUrls = Array.from(new Set(imageUrls)).slice(0, 10)
      }
    } catch (fetchError) {
      console.error('[INGEST] Fetch error:', fetchError)
      blocked = true
    }

    if (blocked || pageText.trim().length < 50) {
      return NextResponse.json({
        success: false,
        error: 'BLOCKED',
        message:
          'Diese Plattform blockiert automatischen Zugriff. Bitte kopiere den Inseratstext und nutze Option B "Text einfügen".',
        blocked: true,
        urlDetected: url,
        images: imageUrls,
        fallback: true,
      })
    }

    try {
      const parsed = await extractListingFromAnthropic(
        anthropic,
        `Extrahiere alle Wohnungsdaten aus folgendem Seiteninhalt:\n\nURL: ${url}\n\n${pageText}`
      )
      const data = normalizeExtractedPayload(parsed)
      return NextResponse.json({
        success: true,
        data,
        images: imageUrls,
        source: 'url',
      })
    } catch (error) {
      console.error('[INGEST] URL Anthropic error:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'AI_PARSE_FAILED',
          message: 'Analyse fehlgeschlagen.',
          details: String(error),
          blocked: false,
          images: imageUrls,
          fallback: true,
        },
        { status: 200 }
      )
    }
  }

  // ——— Legacy: Bild+Text / URL+Bild (Orchestrator) ———
  const mode = body.mode
  if (typeof mode === 'string' && (mode === 'images_text' || mode === 'combined')) {
    try {
      const result = await runAdminListingIngest(session.user.id, {
        mode: mode as AdminIngestMode,
        url: typeof body.url === 'string' ? body.url : undefined,
        text: typeof body.text === 'string' ? body.text : undefined,
        imageUrls: Array.isArray(body.imageUrls)
          ? body.imageUrls.filter((x): x is string => typeof x === 'string')
          : undefined,
      })
      return NextResponse.json({ success: true, ...result })
    } catch (error) {
      console.error('Ingest orchestrator error:', error)
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

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}
