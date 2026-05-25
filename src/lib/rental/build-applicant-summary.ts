import type { CreditCheckResult } from '@/lib/rental/types'
import { isCreditCheckResult } from '@/lib/rental/types'
import { housingSituationLineDe } from '@/lib/tenant-profile/housing'
import {
  employmentSummaryDe,
  incomeCategoryLabelDe,
} from '@/lib/tenant-profile/labels'
import type { CurrentHousingSituation, EmploymentStatus, IncomeCategory } from '@prisma/client'

function betreibungsSummary(requiresCreditCheck: boolean, creditCheckResult: unknown): string | null {
  if (!requiresCreditCheck) return null
  if (!creditCheckResult || !isCreditCheckResult(creditCheckResult)) return null
  const r = creditCheckResult as CreditCheckResult
  return r.hasEntries ?
      `Betreibungsregister: ${r.entryCount} Einträge`
    : 'Betreibungsregister: keine Einträge'
}

/**
 * Kurz-Zusammenfassung für Vermieter-Mails (ersetzt leeres Motivationsschreiben).
 */
export function buildApplicantSummaryForLandlord(params: {
  employmentStatus: EmploymentStatus
  employer: string | null
  jobTitle: string | null
  employedSince: Date | null
  monthlyIncomeCategory: IncomeCategory
  householdTotalPersons: number
  householdChildrenCount: number
  currentHousingSituation?: CurrentHousingSituation | null
  currentHousingSince?: Date | null
  requiresCreditCheck: boolean
  creditCheckResult: unknown
}): string {
  const parts: string[] = [
    employmentSummaryDe(
      params.employmentStatus,
      params.employer,
      params.jobTitle,
      params.employedSince
    ),
    `Haushalt: ${params.householdTotalPersons} ${params.householdTotalPersons === 1 ? 'Person' : 'Personen'}${
      params.householdChildrenCount > 0 ?
        `, ${params.householdChildrenCount} ${params.householdChildrenCount === 1 ? 'Kind' : 'Kinder'}`
      : ''
    }`,
    `Einkommen (Kategorie): ${incomeCategoryLabelDe(params.monthlyIncomeCategory)}`,
  ]
  const housing = housingSituationLineDe(params.currentHousingSituation, params.currentHousingSince)
  if (housing) parts.push(housing)
  const credit = betreibungsSummary(params.requiresCreditCheck, params.creditCheckResult)
  if (credit) parts.push(credit)
  return parts.join(' · ')
}
