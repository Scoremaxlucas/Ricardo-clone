import { isSicIdDocumentExpired, readSicFacts } from '@/lib/sic/facts'
import { addCalendarMonths } from '@/lib/sic/validity'
import type { SicModuleId } from '@/lib/sic/modules'

/**
 * Verlängerung heisst inhaltlich: frischer Betreibungsauszug. Dessen Alter ist
 * der Grund für die drei Monate Gültigkeit. Was nicht altert, bleibt stehen.
 *
 * - Betreibungsauszug: immer neu.
 * - Lohn & Arbeitsstelle: neu, wenn die Prüfung älter als ein Jahr ist.
 * - Ausweis: neu, nur wenn er abgelaufen ist.
 * - Referenz vom Vermieter: betrifft die Vergangenheit, bleibt dauerhaft.
 */
export const SIC_EMPLOYMENT_RECHECK_MONTHS = 12

export type RenewalModuleInput = {
  moduleKind: SicModuleId
  status: string
  reviewedAt: Date | null
  verifiedFacts?: unknown
}

/** Welche der vorhandenen Module eine Verlängerung zurück auf «Unterlagen fehlen» setzt. */
export function modulesResetByRenewal(modules: RenewalModuleInput[], now = new Date()): SicModuleId[] {
  const reset: SicModuleId[] = []

  for (const m of modules) {
    if (m.moduleKind === 'BONITAET') {
      reset.push(m.moduleKind)
      continue
    }
    if (m.moduleKind === 'ARBEIT_EINKOMMEN') {
      const staleFrom = m.reviewedAt ? addCalendarMonths(m.reviewedAt, SIC_EMPLOYMENT_RECHECK_MONTHS) : null
      if (!staleFrom || staleFrom.getTime() <= now.getTime()) reset.push(m.moduleKind)
      continue
    }
    if (m.moduleKind === 'AUFENTHALT') {
      const facts = readSicFacts('AUFENTHALT', m.verifiedFacts)
      if (isSicIdDocumentExpired(facts, now)) reset.push(m.moduleKind)
      continue
    }
    // ZUVERLAESSIGKEIT bleibt.
  }

  return reset
}
