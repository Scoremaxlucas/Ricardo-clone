import type { RentalListingLandlordInitial } from '@/lib/rental/rental-landlord-initial'

import { ingestOptionalText } from '@/lib/rental/ingest-optional-text'
import { ImportSource } from '@prisma/client'
import type { ImportListingAiResult } from '@/lib/rental/listing-url-import-types'

function normalizeCanton(c: string): string {
  const x = c.trim().toUpperCase()
  return x.length === 2 ? x : ''
}

function buildDescriptionExtras(ai: ImportListingAiResult): string {
  const parts: string[] = []
  if (ai.features?.length) {
    parts.push(`Ausstattung: ${ai.features.join(', ')}`)
  }
  if (ai.utilitiesPerMonth != null && Number.isFinite(ai.utilitiesPerMonth)) {
    parts.push(`Nebenkosten (laut Inserat): ca. CHF ${Math.round(ai.utilitiesPerMonth)} / Monat`)
  }
  if (ai.depositAmount != null && Number.isFinite(ai.depositAmount)) {
    parts.push(`Kaution (laut Inserat): ca. CHF ${Math.round(ai.depositAmount)}`)
  }
  return parts.length ? `\n\n${parts.join('\n')}` : ''
}

/** AI-Import → Formular-Initialwerte für `RentalListingLandlordForm`. */
export function mapAiImportToRentalLandlordInitial(ai: ImportListingAiResult): RentalListingLandlordInitial {
  const canton = normalizeCanton(ai.canton || '') || 'ZH'
  const zip = (ai.zip || '').replace(/\D/g, '').slice(0, 4)
  const rooms =
    ai.rooms != null && Number.isFinite(Number(ai.rooms)) ? Math.min(5, Number(ai.rooms)) : 3
  const areaSqm =
    ai.areaSqm != null && Number.isFinite(Number(ai.areaSqm)) ? Math.max(1, Math.round(Number(ai.areaSqm))) : 50
  const floor =
    ai.floor != null && Number.isFinite(Number(ai.floor)) ? Math.round(Number(ai.floor)) : null
  const rentPerMonth =
    ai.rentPerMonth != null && Number.isFinite(Number(ai.rentPerMonth))
      ? Math.max(0, Math.round(Number(ai.rentPerMonth)))
      : 0
  const utilitiesPerMonth =
    ai.utilitiesPerMonth != null && Number.isFinite(Number(ai.utilitiesPerMonth))
      ? Math.round(Number(ai.utilitiesPerMonth))
      : null
  const depositAmount =
    ai.depositAmount != null && Number.isFinite(Number(ai.depositAmount))
      ? Math.round(Number(ai.depositAmount))
      : null
  const avail = /^\d{4}-\d{2}-\d{2}$/.test((ai.availableFrom || '').trim()) ? ai.availableFrom.trim() : ''
  const baseDesc = (ai.description || '').trim()
  const extras = buildDescriptionExtras(ai)
  let description = (baseDesc + extras).trim()
  if (description.length < 50) {
    description = `${description}\n\n(Daten per Import übernommen — bitte prüfen und ergänzen.)`.trim()
  }
  if (description.length > 11800) {
    description = `${description.slice(0, 11800)}…`
  }

  return {
    title: (ai.title || '').trim().slice(0, 200) || 'Mietwohnung',
    description,
    address: ingestOptionalText(ai.address).slice(0, 500),
    zip,
    city: (ai.city || '').trim().slice(0, 120),
    canton,
    rooms,
    areaSqm,
    floor,
    rentPerMonth,
    utilitiesPerMonth,
    depositAmount,
    availableFrom: avail || new Date().toISOString().slice(0, 10),
    requiresCreditCheck: true,
    photos: [],
    /** Nicht sofort «live»: Aktivierung läuft über Speichern/Aktivieren mit erreichbarer Vermieter-Mail. */
    status: 'archived',
    listingExpiresOn: null,
    landlordNotifyEmail: null,
    importedFrom: null,
    importSource: ImportSource.IMPORTED,
  }
}
