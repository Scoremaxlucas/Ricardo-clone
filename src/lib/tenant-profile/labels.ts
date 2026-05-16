import type { CreditCheckStatus, EmploymentStatus, HouseholdPets, IncomeCategory } from '@prisma/client'

const EMPLOYMENT: Record<EmploymentStatus, string> = {
  EMPLOYED: 'Angestellt',
  SELF_EMPLOYED: 'Selbständig',
  STUDENT: 'Student/in',
  RETIRED: 'Pensioniert',
  UNEMPLOYED: 'Stellensuchend',
  OTHER: 'Andere',
}

const INCOME: Record<IncomeCategory, string> = {
  UNDER_2000: "Unter CHF 2'000",
  UNDER_3000: "Unter CHF 3'000",
  FROM_2000_TO_3000: "CHF 2'000 – 3'000",
  FROM_3000_TO_4000: "CHF 3'000 – 4'000",
  FROM_4000_TO_5000: "CHF 4'000 – 5'000",
  FROM_4000_TO_5500: "CHF 4'000 – 5'500",
  FROM_5000_TO_7000: "CHF 5'000 – 7'000",
  FROM_5500_TO_7000: "CHF 5'500 – 7'000",
  FROM_7000_TO_9000: "CHF 7'000 – 9'000",
  FROM_9000_TO_12000: "CHF 9'000 – 12'000",
  FROM_12000_TO_15000: "CHF 12'000 – 15'000",
  FROM_12000_TO_16000: "CHF 12'000 – 16'000",
  FROM_15000_TO_20000: "CHF 15'000 – 20'000",
  FROM_16000_TO_22000: "CHF 16'000 – 22'000",
  FROM_20000_TO_30000: "CHF 20'000 – 30'000",
  FROM_22000_TO_30000: "CHF 22'000 – 30'000",
  FROM_30000_TO_50000: "CHF 30'000 – 50'000",
  FROM_30000_TO_45000: "CHF 30'000 – 45'000",
  FROM_45000_TO_65000: "CHF 45'000 – 65'000",
  FROM_65000_TO_90000: "CHF 65'000 – 90'000",
  ABOVE_50000: "Über CHF 50'000",
  ABOVE_90000: "Über CHF 90'000",
}

const PETS: Record<HouseholdPets, string> = {
  UNSPECIFIED: 'Keine Haustiere',
  NONE: 'Keine Haustiere',
  HAS_PETS: 'Mit Haustieren',
}

export function employmentLabelDe(s: EmploymentStatus): string {
  return EMPLOYMENT[s] ?? s
}

export function incomeCategoryLabelDe(c: IncomeCategory): string {
  return INCOME[c] ?? c
}

/** Wie incomeCategoryLabelDe, mit expliziter Monats-Einheit (Haushaltsnetto). */
export function incomeCategoryMonthlyLabelDe(c: IncomeCategory): string {
  return `${incomeCategoryLabelDe(c)} / Monat`
}

export function householdPetsLabelDe(p: HouseholdPets): string {
  return PETS[p] ?? p
}

export function creditCheckStatusLabelDe(s: CreditCheckStatus): string {
  switch (s) {
    case 'NONE':
      return 'Noch kein Auszug'
    case 'PENDING':
      return 'Wird geprüft'
    case 'PENDING_MANUAL_REVIEW':
      return 'Manuelle Prüfung'
    case 'APPROVED':
      return 'Genehmigt'
    case 'REJECTED':
      return 'Abgelehnt'
    case 'EXPIRED':
      return 'Abgelaufen'
    default:
      return s
  }
}

/** Lesbare Zeile Beschäftigung (für Profil-Übersicht). */
export function employmentSummaryDe(
  status: EmploymentStatus,
  employer: string | null,
  jobTitle: string | null,
  employedSince: Date | null
): string {
  const base = employmentLabelDe(status)
  if (status !== 'EMPLOYED' && status !== 'SELF_EMPLOYED') {
    return base
  }
  const company = employer?.trim() || 'Unbekannt'
  let tail = ` bei ${company}`
  if (jobTitle?.trim()) {
    tail += ` (${jobTitle.trim()})`
  }
  if (employedSince) {
    const d = new Date(employedSince)
    if (!Number.isNaN(d.getTime())) {
      tail += ` seit ${d.toLocaleDateString('de-CH', { month: 'long', year: 'numeric' })}`
    }
  }
  return `${base}${tail}`
}
