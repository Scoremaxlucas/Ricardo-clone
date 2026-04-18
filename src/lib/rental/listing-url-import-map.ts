import type { MatchingPropertyWizardSnapshot } from '@/lib/matching/landlord-matching-properties'
import type { ImportListingAiResult } from './listing-url-import-types'

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

export function mapAiImportToWizardSnapshot(ai: ImportListingAiResult): {
  snapshot: MatchingPropertyWizardSnapshot
  filledFieldCount: number
  cantonFromAi: boolean
} {
  const canton = normalizeCanton(ai.canton || '')
  const zip = (ai.zip || '').replace(/\D/g, '').slice(0, 4)
  const roomsStr =
    ai.rooms != null && Number.isFinite(Number(ai.rooms)) ? String(Number(ai.rooms)) : ''
  const areaSqmStr =
    ai.areaSqm != null && Number.isFinite(Number(ai.areaSqm)) ? String(Math.round(Number(ai.areaSqm))) : ''
  const floorStr =
    ai.floor != null && Number.isFinite(Number(ai.floor)) ? String(Math.round(Number(ai.floor))) : ''
  const rentStr =
    ai.rentPerMonth != null && Number.isFinite(Number(ai.rentPerMonth))
      ? String(Math.round(Number(ai.rentPerMonth)))
      : ''
  const avail = /^\d{4}-\d{2}-\d{2}$/.test((ai.availableFrom || '').trim()) ? ai.availableFrom.trim() : ''
  const baseDesc = (ai.description || '').trim()
  const extras = buildDescriptionExtras(ai)
  let description = (baseDesc + extras).trim()
  if (description.length > 11800) {
    description = `${description.slice(0, 11800)}…`
  }

  const cantonFromAi = Boolean(canton)
  const snap: MatchingPropertyWizardSnapshot = {
    title: (ai.title || '').trim().slice(0, 200),
    description,
    addressLine: (ai.address || '').trim().slice(0, 500),
    zip,
    city: (ai.city || '').trim().slice(0, 120),
    canton: canton || 'ZH',
    rooms: roomsStr,
    areaSqm: areaSqmStr,
    floor: floorStr,
    rentPerMonth: rentStr,
    availableFrom: avail,
    availableTo: '',
    petPolicyNote: '',
    allowPets: true,
    status: 'draft',
  }

  let filled = 0
  const bump = (v: unknown) => {
    if (v == null) return
    if (typeof v === 'string' && v.trim() === '') return
    if (typeof v === 'number' && !Number.isFinite(v)) return
    filled += 1
  }
  bump(ai.title)
  bump(ai.description)
  bump(ai.address)
  bump(ai.zip)
  bump(ai.city)
  bump(ai.canton)
  bump(ai.rooms)
  bump(ai.areaSqm)
  bump(ai.floor)
  bump(ai.rentPerMonth)
  bump(ai.utilitiesPerMonth)
  bump(ai.depositAmount)
  bump(ai.availableFrom)
  if (ai.features?.length) filled += 1
  bump(ai.originalPlatform)

  return { snapshot: snap, filledFieldCount: filled, cantonFromAi }
}
