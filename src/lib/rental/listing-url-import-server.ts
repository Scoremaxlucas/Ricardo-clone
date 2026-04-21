import dns from 'node:dns/promises'
import net from 'node:net'
import Anthropic from '@anthropic-ai/sdk'
import { coerceAnthropicListingModel } from '@/lib/rental/anthropic-model'
import { htmlToListingPlainText } from './listing-url-import-html'
import type { ImportListingAiResult } from './listing-url-import-types'

const USER_AGENT =
  'Mozilla/5.0 (compatible; HelvendarBot/1.0; +https://wohnen.helvenda.ch)'
const FETCH_TIMEOUT_MS = 10_000
const MODEL = coerceAnthropicListingModel(process.env.ANTHROPIC_LISTING_IMPORT_MODEL)

export const LISTING_IMPORT_SYSTEM_PROMPT = `Du analysierst den Textinhalt einer Schweizer Mietwohnungs-Inserat-Seite.
Extrahiere alle verfügbaren Informationen und antworte NUR mit einem JSON-Objekt, ohne jeglichen weiteren Text, Erklärungen oder Markdown-Backticks.

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
  "originalPlatform": "",
  "confidence": "high" | "medium" | "low"
}

Regeln:
- Alle Beträge in CHF als Ganzzahl (z.B. 2100, nicht "CHF 2'100.-")
- rooms als Dezimalzahl (z.B. 3.5)
- availableFrom als "YYYY-MM-DD" falls vorhanden, sonst leerer String
- canton als 2-Buchstaben Kürzel (ZH, BE, GE, etc.) falls erkennbar
- features: Array von Strings wie ["Balkon", "Parkplatz", "Einbauküche"]
- originalPlatform: erkannter Plattformname (z.B. "Homegate", "ImmoScout24", "Tutti", "Privat")
- confidence: "high" wenn die meisten Felder gefüllt, "medium" wenn ca. die Hälfte, "low" wenn wenig gefunden
- Felder die nicht erkennbar sind: null oder leerer String lassen — niemals raten oder erfinden`

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

function isPrivateOrReservedIpv4(parts: number[]): boolean {
  if (parts.length !== 4 || parts.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return true
  const [a, b] = parts
  if (a === 0 || a === 127) return true
  if (a === 10) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 169 && b === 254) return true
  if (a === 100 && b >= 64 && b <= 127) return true
  if (a === 192 && b === 0 && parts[2] === 0) return true
  if (a === 255 && b === 255 && parts[2] === 255 && parts[3] === 255) return true
  return false
}

function isPrivateOrReservedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(x => Number.parseInt(x, 10))
    return isPrivateOrReservedIpv4(parts)
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase()
    if (lower === '::1') return true
    if (lower.startsWith('fe80:')) return true
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true
    if (lower.startsWith('::ffff:')) {
      const v4 = lower.slice(7)
      if (net.isIPv4(v4)) {
        const parts = v4.split('.').map(x => Number.parseInt(x, 10))
        return isPrivateOrReservedIpv4(parts)
      }
    }
    return false
  }
  return true
}

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '0.0.0.0',
  'metadata.google.internal',
  'metadata.goog',
])

export async function assertUrlSafeForServerFetch(rawUrl: string): Promise<URL> {
  let u: URL
  try {
    u = new URL(rawUrl.trim())
  } catch {
    throw new Error('INVALID_URL')
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error('INVALID_URL')
  }
  const host = u.hostname.toLowerCase()
  if (!host || BLOCKED_HOSTNAMES.has(host)) {
    throw new Error('BLOCKED_HOST')
  }
  if (host === '127.0.0.1' || host === '[::1]' || host === '::1') {
    throw new Error('BLOCKED_HOST')
  }
  if (net.isIPv4(host) || net.isIPv6(host.replace(/^\[|\]$/g, ''))) {
    const ip = host.startsWith('[') ? host.slice(1, -1) : host
    if (isPrivateOrReservedIp(ip)) throw new Error('BLOCKED_HOST')
    return u
  }
  let records: { address: string; family: number }[]
  try {
    records = await dns.lookup(host, { all: true, verbatim: true })
  } catch {
    throw new Error('DNS_FAILED')
  }
  if (!records.length) throw new Error('DNS_FAILED')
  for (const r of records) {
    if (isPrivateOrReservedIp(r.address)) {
      throw new Error('BLOCKED_HOST')
    }
  }
  return u
}

export async function fetchListingHtml(url: URL): Promise<{ html: string; status: number }> {
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
      signal: ac.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'de-CH,de;q=0.9,en;q=0.8',
      },
    })
    const buf = await res.arrayBuffer()
    const html = new TextDecoder('utf-8', { fatal: false }).decode(buf)
    return { html, status: res.status }
  } finally {
    clearTimeout(t)
  }
}

export { htmlToListingPlainText } from './listing-url-import-html'

function isImportListingAiResult(x: unknown): x is ImportListingAiResult {
  if (x == null || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  const conf = o.confidence
  if (conf !== 'high' && conf !== 'medium' && conf !== 'low') return false
  if (!Array.isArray(o.features)) return false
  return true
}

export async function extractListingFromPlainText(plainText: string): Promise<ImportListingAiResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
  if (!apiKey) return null

  const client = new Anthropic({ apiKey })
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 1000,
    system: LISTING_IMPORT_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [{ type: 'text', text: `Seiteninhalt:\n\n${plainText}` }],
      },
    ],
  })
  const block = msg.content.find(b => b.type === 'text')
  if (!block || block.type !== 'text') return null
  const parsed = extractJsonObject(block.text)
  if (!isImportListingAiResult(parsed)) return null
  return parsed
}
