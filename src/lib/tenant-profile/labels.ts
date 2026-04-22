import type { CreditCheckStatus, EmploymentStatus, IncomeCategory } from '@prisma/client'

const EMPLOYMENT: Record<EmploymentStatus, string> = {
  EMPLOYED: 'Angestellt',
  SELF_EMPLOYED: 'Selbständig',
  STUDENT: 'Student/in',
  RETIRED: 'Pensioniert',
  UNEMPLOYED: 'Stellensuchend',
  OTHER: 'Andere',
}

const INCOME: Record<IncomeCategory, string> = {
  UNDER_3000: "Unter CHF 3'000",
  FROM_3000_TO_4000: "CHF 3'000 – 4'000",
  FROM_4000_TO_5500: "CHF 4'000 – 5'500",
  FROM_5500_TO_7000: "CHF 5'500 – 7'000",
  FROM_7000_TO_9000: "CHF 7'000 – 9'000",
  ABOVE_9000: "Über CHF 9'000",
}

export function employmentLabelDe(s: EmploymentStatus): string {
  return EMPLOYMENT[s] ?? s
}

export function incomeCategoryLabelDe(c: IncomeCategory): string {
  return INCOME[c] ?? c
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
