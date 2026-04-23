import type { CreditCheckStatus, RentalApplicationStatus } from '@prisma/client'
import Anthropic from '@anthropic-ai/sdk'
import { coerceAnthropicListingModel } from '@/lib/rental/anthropic-model'
import type { CreditCheckResult } from './types'
import { isCreditCheckResult } from './types'

const SYSTEM_PROMPT = `Du analysierst einen Schweizer Betreibungsregisterauszug.
Extrahiere ausschliesslich folgende Informationen und antworte NUR mit einem JSON-Objekt, ohne jeglichen weiteren Text:
{
  "isValid": true/false,
  "issueDate": "YYYY-MM-DD",
  "isRecent": true/false,
  "hasEntries": true/false,
  "entryCount": 0,
  "totalAmountCategory": "none" | "low" | "medium" | "high",
  "fullName": "",
  "canton": ""
}
totalAmountCategory: none = keine Schulden, low = unter CHF 1000, medium = CHF 1000-5000, high = über CHF 5000.
isRecent: true wenn Ausstellungsdatum max. 3 Monate zurückliegt.
Gib niemals den vollständigen Dokumenttext zurück. Nur dieses JSON.`

const MODEL = coerceAnthropicListingModel(process.env.RENTAL_CREDIT_CHECK_MODEL)

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

export type ParseOutcome =
  | { ok: true; result: CreditCheckResult }
  | { ok: false; error: 'api' | 'parse' | 'shape' }

/**
 * Sendet PDF (Base64) an Anthropic und parst das JSON-Ergebnis.
 */
export async function parseCreditCheckFromPdfBase64(pdfBase64: string): Promise<ParseOutcome> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
  if (!apiKey) {
    return { ok: false, error: 'api' }
  }

  try {
    const client = new Anthropic({
      apiKey,
      defaultHeaders: { 'anthropic-beta': 'pdfs-2024-09-25' },
    })

    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: pdfBase64,
              },
            },
            {
              type: 'text',
              text: 'Analysiere das Dokument und gib nur das JSON-Objekt zurück.',
            },
          ],
        },
      ],
    })

    const block = msg.content.find(b => b.type === 'text')
    if (!block || block.type !== 'text') {
      return { ok: false, error: 'parse' }
    }

    const parsed = extractJsonObject(block.text)
    if (!parsed || !isCreditCheckResult(parsed)) {
      return { ok: false, error: 'shape' }
    }

    return { ok: true, result: parsed }
  } catch (e) {
    console.error('[parseCreditCheck]', e)
    return { ok: false, error: 'api' }
  }
}

export function applicationStatusFromCreditParse(outcome: ParseOutcome): RentalApplicationStatus {
  if (!outcome.ok) {
    return 'pending_manual_review'
  }
  const r = outcome.result
  if (!r.isValid || !r.isRecent) {
    return 'rejected'
  }
  return 'approved'
}

/** Status für TenantProfile nach Anthropic-Auswertung (Miet-Bewerbungen nutzen weiter `applicationStatusFromCreditParse`). */
export function tenantCreditCheckStatusFromParse(outcome: ParseOutcome): CreditCheckStatus {
  if (!outcome.ok) {
    // API-Fehler, unleserliche Antwort oder Schema-Mismatch → manuelle Prüfung statt harter Ablehnung
    return 'PENDING_MANUAL_REVIEW'
  }
  if (!outcome.result.isValid || !outcome.result.isRecent) {
    return 'REJECTED'
  }
  return 'APPROVED'
}
