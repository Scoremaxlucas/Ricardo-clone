import type { SeekerOnboardingSnapshot } from './seeker-account'

export type SeekerCompletenessSection = {
  id: 'search' | 'household' | 'employment' | 'financial' | 'documents'
  label: string
  percent: number
  done: boolean
}

/**
 * Grobe Profilvollständigkeit für UI (0–100) und Checkliste.
 */
export function computeSeekerProfileCompleteness(s: SeekerOnboardingSnapshot): {
  totalPercent: number
  sections: SeekerCompletenessSection[]
} {
  const sp = s.searchProfile
  const hasSearch =
    sp != null &&
    (Boolean(sp.cantonPreference?.trim()) || Boolean(sp.postalCodesWanted?.trim())) &&
    (sp.budgetMin != null || sp.budgetMax != null) &&
    (sp.minRooms != null || sp.maxRooms != null)
  const searchPct = hasSearch ? 100 : 0

  const hh = s.household
  const hasHousehold = hh != null && hh.adults >= 1
  const householdPct = hasHousehold ? 100 : 0

  const em = s.employment
  const hasEmployment = Boolean(em?.employmentStatus?.trim())
  const employmentPct = hasEmployment ? 100 : 0

  const fi = s.financial
  const hasFinancial = Boolean(fi?.monthlyNetIncomeBand?.trim())
  const financialPct = hasFinancial ? 100 : 0

  const hasDoc = s.documents.some(d => d.kind === 'id_proof' || d.kind === 'income')
  const documentsPct = hasDoc ? 100 : 0

  const sections: SeekerCompletenessSection[] = [
    { id: 'search', label: 'Suchkriterien', percent: searchPct, done: hasSearch },
    { id: 'household', label: 'Haushalt', percent: householdPct, done: hasHousehold },
    { id: 'employment', label: 'Beruf / Anstellung', percent: employmentPct, done: hasEmployment },
    { id: 'financial', label: 'Finanzen (Band)', percent: financialPct, done: hasFinancial },
    { id: 'documents', label: 'Nachweise (Ausweis oder Einkommen)', percent: documentsPct, done: hasDoc },
  ]

  const totalPercent = Math.round(sections.reduce((a, x) => a + x.percent, 0) / sections.length)

  return { totalPercent, sections }
}
