import Anthropic from '@anthropic-ai/sdk'
import { coerceAnthropicListingModel } from '@/lib/rental/anthropic-model'
import { SIC_INCOME_BANDS, sicFactFields, type SicFacts } from '@/lib/sic/facts'
import type { SicModuleId } from '@/lib/sic/modules'

/**
 * Liest die Prüffelder aus einem hochgeladenen Nachweis vor.
 *
 * Das ist ausdrücklich **nur eine Vorbefüllung**: der Prüfer sieht das Dokument
 * daneben, korrigiert und bestätigt. Freigegeben wird nie automatisch. Damit
 * bleibt die Prüfung eine menschliche Entscheidung, ohne sechs bis zehn Felder
 * pro Modul abtippen zu müssen.
 */

const MODEL = coerceAnthropicListingModel(process.env.SIC_DOCUMENT_PARSE_MODEL)

const BASE_RULES = `Du liest ein schweizerisches Dokument und extrahierst nur die verlangten Felder.
Antworte ausschliesslich mit einem JSON-Objekt, ohne weiteren Text.
Felder, die im Dokument nicht klar erkennbar sind, lässt du weg — erfinde nichts.
Datumsfelder im Format YYYY-MM-DD.
Gib niemals den vollständigen Dokumenttext zurück.`

function promptFor(moduleId: SicModuleId): string {
  if (moduleId === 'BONITAET') {
    return `${BASE_RULES}
Dokument: Auszug aus dem Betreibungsregister.
{
  "extractDate": "YYYY-MM-DD",
  "office": "Name des ausstellenden Betreibungsamts",
  "hasOpenProceedings": true/false
}
hasOpenProceedings: true, wenn offene Betreibungen, Zahlungsbefehle oder Pfändungen aufgeführt sind.`
  }

  if (moduleId === 'ARBEIT_EINKOMMEN') {
    const bands = SIC_INCOME_BANDS.map(b => `"${b.value}" = ${b.label}`).join(', ')
    return `${BASE_RULES}
Dokument: Arbeitgeberbestätigung und/oder Lohnabrechnung.
{
  "incomeBand": "einer der folgenden Werte",
  "employmentType": "unbefristet" | "befristet" | "probezeit",
  "employedSince": "YYYY-MM-DD",
  "employerName": "Firmenname",
  "noticeGiven": true/false
}
incomeBand bezieht sich auf den Bruttojahreslohn: ${bands}.
Rechne einen Monatslohn mit 12 hoch; einen 13. Monatslohn zählst du mit, wenn er ausgewiesen ist.
noticeGiven: true, wenn eine Kündigung ausgesprochen wurde.`
  }

  if (moduleId === 'ZUVERLAESSIGKEIT') {
    return `${BASE_RULES}
Dokument: Referenz des bisherigen Vermieters.
{
  "tenancyFrom": "YYYY-MM-DD",
  "tenancyTo": "YYYY-MM-DD",
  "paymentBehaviour": "always_on_time" | "mostly_on_time",
  "rentOnTime": true/false,
  "damages": true/false,
  "wouldReRent": true/false
}
tenancyTo weglassen, wenn das Mietverhältnis noch läuft.
paymentBehaviour: "always_on_time" nur, wenn die Miete ausdrücklich stets fristgerecht bezahlt wurde.`
  }

  return `${BASE_RULES}
Dokument: amtlicher Ausweis (Pass, Identitätskarte oder Aufenthaltsbewilligung).
{
  "documentType": "ch_pass" | "ch_id" | "permit_c" | "permit_b" | "permit_l" | "other",
  "validUntil": "YYYY-MM-DD"
}
validUntil weglassen, wenn der Ausweis kein Ablaufdatum trägt.`
}

/** Inhaltliche Warnungen für den Prüfer — führen zur Ablehnung, nicht zu einer Zeile. */
export type SicParseWarning = string

export type SicParseOutcome =
  | { ok: true; facts: SicFacts; warnings: SicParseWarning[] }
  | { ok: false; error: 'not_configured' | 'api' | 'parse' }

function extractJsonObject(text: string): Record<string, unknown> | null {
  const trimmed = text.trim()
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  try {
    const parsed = JSON.parse(trimmed.slice(start, end + 1))
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null
  } catch {
    return null
  }
}

function warningsFor(moduleId: SicModuleId, raw: Record<string, unknown>): SicParseWarning[] {
  const warnings: SicParseWarning[] = []
  if (moduleId === 'BONITAET' && raw.hasOpenProceedings === true) {
    warnings.push('Im Auszug sind offene Betreibungen erkennbar — Freigabe prüfen.')
  }
  if (moduleId === 'ARBEIT_EINKOMMEN' && raw.noticeGiven === true) {
    warnings.push('Auf der Bestätigung ist eine Kündigung vermerkt — Freigabe prüfen.')
  }
  if (moduleId === 'ZUVERLAESSIGKEIT') {
    if (raw.wouldReRent === false) {
      warnings.push('Der bisherige Vermieter würde nicht erneut vermieten — Freigabe prüfen.')
    }
    if (raw.rentOnTime === false) {
      warnings.push('Die Miete wurde nicht durchgehend fristgerecht bezahlt — Freigabe prüfen.')
    }
    if (raw.damages === true) {
      warnings.push('Es sind Schäden oder Beanstandungen vermerkt — Freigabe prüfen.')
    }
  }
  return warnings
}

/** Nur bekannte Feldwerte übernehmen; alles andere verwerfen. */
function pickKnownFields(moduleId: SicModuleId, raw: Record<string, unknown>): SicFacts {
  const facts: SicFacts = {}
  for (const field of sicFactFields(moduleId)) {
    const value = raw[field.key]
    if (typeof value === 'string' && value.trim()) {
      facts[field.key] = value.trim().slice(0, 200)
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      facts[field.key] = String(value)
    }
  }
  return facts
}

export async function parseSicDocumentFacts(opts: {
  moduleId: SicModuleId
  fileBase64: string
  mediaType: string
}): Promise<SicParseOutcome> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'not_configured' }

  const isPdf = opts.mediaType === 'application/pdf'
  const supportedImage = ['image/jpeg', 'image/png', 'image/webp'].includes(opts.mediaType)
  if (!isPdf && !supportedImage) return { ok: false, error: 'parse' }

  try {
    const client = new Anthropic({
      apiKey,
      defaultHeaders: { 'anthropic-beta': 'pdfs-2024-09-25' },
    })

    const documentBlock =
      isPdf ?
        ({
          type: 'document' as const,
          source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: opts.fileBase64 },
        })
      : ({
          type: 'image' as const,
          source: {
            type: 'base64' as const,
            media_type: opts.mediaType as 'image/jpeg' | 'image/png' | 'image/webp',
            data: opts.fileBase64,
          },
        })

    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      system: promptFor(opts.moduleId),
      messages: [
        {
          role: 'user',
          content: [documentBlock, { type: 'text', text: 'Gib nur das JSON-Objekt zurück.' }],
        },
      ],
    })

    const block = msg.content.find(b => b.type === 'text')
    if (!block || block.type !== 'text') return { ok: false, error: 'parse' }

    const raw = extractJsonObject(block.text)
    if (!raw) return { ok: false, error: 'parse' }

    return {
      ok: true,
      facts: pickKnownFields(opts.moduleId, raw),
      warnings: warningsFor(opts.moduleId, raw),
    }
  } catch (err) {
    console.error('[sic/parse-document]', err)
    return { ok: false, error: 'api' }
  }
}
