import type { AdminIngestOrchestratorResult } from '@/lib/rental/listing-ingest-orchestrator'

export const RENTAL_LISTING_INGEST_DRAFT_VERSION = 1 as const

/** Gespeichert in `RentalListingIngestDraft.draftPayload` (JSON). */
export type RentalListingIngestDraftPayloadV1 =
  | {
      version: typeof RENTAL_LISTING_INGEST_DRAFT_VERSION
      kind: 'orchestrator'
      sourceUrl: string
      orchestrator: AdminIngestOrchestratorResult
    }
  | {
      version: typeof RENTAL_LISTING_INGEST_DRAFT_VERSION
      kind: 'url_invalid'
      sourceUrl: string
      message: string
    }

export function parseIngestDraftPayload(raw: unknown): RentalListingIngestDraftPayloadV1 | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (o.version !== RENTAL_LISTING_INGEST_DRAFT_VERSION) return null
  if (o.kind === 'url_invalid' && typeof o.sourceUrl === 'string' && typeof o.message === 'string') {
    return o as RentalListingIngestDraftPayloadV1
  }
  if (o.kind === 'orchestrator' && typeof o.sourceUrl === 'string' && o.orchestrator && typeof o.orchestrator === 'object') {
    return o as RentalListingIngestDraftPayloadV1
  }
  return null
}
