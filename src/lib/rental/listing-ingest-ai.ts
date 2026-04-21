import Anthropic from '@anthropic-ai/sdk'
import { ANTHROPIC_CLAUDE_SONNET_4, coerceAnthropicListingModel } from '@/lib/rental/anthropic-model'
import type { ImportListingAiResult } from '@/lib/rental/listing-url-import-types'

/** Kanonischer Ingest-Modellname (ohne fehlerhafte Env-Overrides). */
export const ADMIN_INGEST_MODEL = ANTHROPIC_CLAUDE_SONNET_4

function ingestAnthropicModel(): string {
  return coerceAnthropicListingModel(process.env.ANTHROPIC_INGEST_MODEL)
}

export type AdminIngestAiRow = ImportListingAiResult & {
  landlordName?: string
  landlordContact?: string
}

export type VisionExtract = {
  rooms: number | null
  condition: 'modern' | 'renovated' | 'standard' | 'older'
  features: string[]
  description: string
}

const VISION_SYSTEM = `Du siehst Fotos einer Mietwohnung. Extrahiere alle sichtbaren Informationen:
Zimmeranzahl falls erkennbar, Zustand, sichtbare Ausstattung (Balkon, Einbauküche etc.),
Stil (modern/renoviert/älter). Antworte NUR mit JSON ohne Backticks:
{
  "rooms": null,
  "condition": "modern|renovated|standard|older",
  "features": [],
  "description": "kurze Beschreibung basierend auf Bildern"
}
Felder die nicht erkennbar sind: null oder leer. condition immer eines der vier Werte.`

const EXTENDED_TEXT_SYSTEM = `Du analysierst Informationen zu einer Schweizer Mietwohnung aus beliebigen Quellen
(Inserat-Text, E-Mail, WhatsApp-Nachricht, etc.).
Extrahiere alle verfügbaren Informationen. Antworte NUR mit JSON ohne Backticks:
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
  "originalPlatform": "",
  "confidence": "high|medium|low"
}
Felder die nicht erkennbar sind: null oder leer — niemals erfinden.
availableFrom als YYYY-MM-DD.
canton als 2-Buchstaben Kürzel (ZH, BE, GE etc.).
Betreäge in CHF als Ganzzahl. rooms als Dezimalzahl.`

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim()
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  try {
    return JSON.parse(trimmed.slice(start, end + 1))
  } catch {
    return null
  }
}

function isConfidence(x: unknown): x is 'high' | 'medium' | 'low' {
  return x === 'high' || x === 'medium' || x === 'low'
}

function normalizeAdminRow(o: Record<string, unknown>): AdminIngestAiRow {
  const conf = isConfidence(o.confidence) ? o.confidence : 'low'
  const features = Array.isArray(o.features) ? o.features.filter((x): x is string => typeof x === 'string') : []
  return {
    title: typeof o.title === 'string' ? o.title : '',
    description: typeof o.description === 'string' ? o.description : '',
    address: typeof o.address === 'string' ? o.address : '',
    zip: typeof o.zip === 'string' ? o.zip : '',
    city: typeof o.city === 'string' ? o.city : '',
    canton: typeof o.canton === 'string' ? o.canton : '',
    rooms: typeof o.rooms === 'number' && Number.isFinite(o.rooms) ? o.rooms : null,
    areaSqm: typeof o.areaSqm === 'number' && Number.isFinite(o.areaSqm) ? o.areaSqm : null,
    floor: typeof o.floor === 'number' && Number.isFinite(o.floor) ? o.floor : null,
    rentPerMonth: typeof o.rentPerMonth === 'number' && Number.isFinite(o.rentPerMonth) ? o.rentPerMonth : null,
    utilitiesPerMonth:
      typeof o.utilitiesPerMonth === 'number' && Number.isFinite(o.utilitiesPerMonth) ? o.utilitiesPerMonth : null,
    depositAmount: typeof o.depositAmount === 'number' && Number.isFinite(o.depositAmount) ? o.depositAmount : null,
    availableFrom: typeof o.availableFrom === 'string' ? o.availableFrom : '',
    features,
    originalPlatform: typeof o.originalPlatform === 'string' ? o.originalPlatform : '',
    confidence: conf,
    landlordName: typeof o.landlordName === 'string' ? o.landlordName : '',
    landlordContact: typeof o.landlordContact === 'string' ? o.landlordContact : '',
  }
}

export async function extractAdminIngestFromPlainText(plainText: string): Promise<AdminIngestAiRow | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
  if (!apiKey) return null
  const trimmed = plainText.trim()
  if (!trimmed) return null

  const client = new Anthropic({ apiKey })
  const msg = await client.messages.create({
    model: ingestAnthropicModel(),
    max_tokens: 2800,
    system: EXTENDED_TEXT_SYSTEM,
    messages: [
      {
        role: 'user',
        content: [{ type: 'text', text: `Inhalt:\n\n${trimmed.slice(0, 12000)}` }],
      },
    ],
  })
  const block = msg.content.find(b => b.type === 'text')
  if (!block || block.type !== 'text') return null
  const parsed = extractJsonObject(block.text)
  if (!parsed || typeof parsed !== 'object') return null
  return normalizeAdminRow(parsed as Record<string, unknown>)
}

export async function extractFromVisionImages(
  parts: { base64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' }[]
): Promise<VisionExtract | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
  if (!apiKey || parts.length === 0) return null
  const client = new Anthropic({ apiKey })
  const content: Anthropic.ContentBlockParam[] = []
  for (const p of parts) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: p.mediaType, data: p.base64 },
    })
  }
  content.push({
    type: 'text',
    text: 'Analysiere die Bilder gemäss Systemanweisung.',
  })
  const msg = await client.messages.create({
    model: ingestAnthropicModel(),
    max_tokens: 1200,
    system: VISION_SYSTEM,
    messages: [{ role: 'user', content }],
  })
  const block = msg.content.find(b => b.type === 'text')
  if (!block || block.type !== 'text') return null
  const parsed = extractJsonObject(block.text)
  if (!parsed || typeof parsed !== 'object') return null
  const o = parsed as Record<string, unknown>
  const cond = o.condition
  const condition =
    cond === 'modern' || cond === 'renovated' || cond === 'standard' || cond === 'older' ? cond : 'standard'
  const features = Array.isArray(o.features) ? o.features.filter((x): x is string => typeof x === 'string') : []
  const description = typeof o.description === 'string' ? o.description : ''
  const rooms = typeof o.rooms === 'number' && Number.isFinite(o.rooms) ? o.rooms : null
  return { rooms, condition, features, description }
}

export function mergeVisionIntoListing(base: AdminIngestAiRow, vision: VisionExtract | null): AdminIngestAiRow {
  if (!vision) return base
  const extra = [
    vision.description.trim(),
    vision.features.length ? `Aus den Fotos: ${vision.features.join(', ')}` : '',
    `Zustand (visuell): ${vision.condition}`,
    vision.rooms != null ? `Zimmer (Schätzung aus Fotos): ${vision.rooms}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')
  const desc = [base.description.trim(), extra].filter(Boolean).join('\n\n').trim()
  const mergedFeatures = Array.from(new Set([...base.features, ...vision.features]))
  const rooms = base.rooms ?? vision.rooms
  return {
    ...base,
    description: desc || base.description,
    features: mergedFeatures,
    rooms,
    confidence: base.confidence === 'high' ? base.confidence : 'medium',
  }
}

export function emptyAdminIngestRow(): AdminIngestAiRow {
  return {
    title: '',
    description:
      'Automatische Analyse lieferte keine ausreichenden Daten. Bitte alle Felder manuell prüfen und ergänzen (mindestens 50 Zeichen in der Beschreibung).',
    address: '',
    zip: '',
    city: '',
    canton: '',
    rooms: null,
    areaSqm: null,
    floor: null,
    rentPerMonth: null,
    utilitiesPerMonth: null,
    depositAmount: null,
    availableFrom: '',
    features: [],
    originalPlatform: '',
    confidence: 'low',
    landlordName: '',
    landlordContact: '',
  }
}
