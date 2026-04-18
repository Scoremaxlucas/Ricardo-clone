import { MatchPropertySource } from '@prisma/client'
import { ensureLandlordAccountForUser } from './landlord-account'
import { insertMatchingPropertyForLandlord } from './insert-matching-property'
import { parseWizardRowFromFlat, type RowParseResult } from './import-row-map'
import { matchingPropertyWizardSchema, type MatchingPropertyWizardInput } from './property-wizard-schema'

export type BulkImportRowError = { index: number; message: string }

export type BulkImportMatchingPropertiesResult = {
  createdIds: string[]
  errors: BulkImportRowError[]
}

/**
 * Validiert flache Zeilen und legt passende `MatchingProperty`-Einträge an.
 * `source` ist `csv` (Datei-Import) oder `api` (Feed/API).
 */
export async function bulkImportMatchingProperties(opts: {
  userId: string
  flatRows: Record<string, string>[]
  source: MatchPropertySource
}): Promise<BulkImportMatchingPropertiesResult> {
  const { userId, flatRows, source } = opts
  const landlordAccountId = await ensureLandlordAccountForUser(userId)

  const createdIds: string[] = []
  const errors: BulkImportRowError[] = []

  for (let i = 0; i < flatRows.length; i++) {
    const row = flatRows[i]
    const parsed: RowParseResult = parseWizardRowFromFlat(row)
    if (!parsed.ok) {
      errors.push({ index: i + 1, message: parsed.message })
      continue
    }
    const v: MatchingPropertyWizardInput = parsed.data
    try {
      const { id } = await insertMatchingPropertyForLandlord({
        landlordAccountId,
        v,
        source,
      })
      createdIds.push(id)
    } catch (e) {
      console.error('bulkImportMatchingProperties row', i + 1, e)
      errors.push({ index: i + 1, message: 'Speichern fehlgeschlagen.' })
    }
  }

  return { createdIds, errors }
}

/**
 * Feed/API: JSON-Objekte mit denselben Feldern wie der Property-Wizard (camelCase).
 */
export async function bulkImportMatchingPropertiesFromJsonItems(opts: {
  userId: string
  items: unknown[]
  source: MatchPropertySource
}): Promise<BulkImportMatchingPropertiesResult> {
  const { userId, items, source } = opts
  const landlordAccountId = await ensureLandlordAccountForUser(userId)

  const createdIds: string[] = []
  const errors: BulkImportRowError[] = []

  for (let i = 0; i < items.length; i++) {
    const parsed = matchingPropertyWizardSchema.safeParse(items[i])
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      const path = first?.path?.length ? String(first.path[0]) : 'item'
      errors.push({ index: i + 1, message: `${path}: ${first?.message ?? 'Ungültig'}` })
      continue
    }
    const v: MatchingPropertyWizardInput = parsed.data
    try {
      const { id } = await insertMatchingPropertyForLandlord({
        landlordAccountId,
        v,
        source,
      })
      createdIds.push(id)
    } catch (e) {
      console.error('bulkImportMatchingPropertiesFromJsonItems row', i + 1, e)
      errors.push({ index: i + 1, message: 'Speichern fehlgeschlagen.' })
    }
  }

  return { createdIds, errors }
}
