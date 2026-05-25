import type { CurrentHousingSituation, IncomeCategory, TenantProfile } from '@prisma/client'
import type { CreditCheckResult } from '@/lib/rental/types'
import { isCreditCheckResult } from '@/lib/rental/types'

/** Repräsentative Monatsbrutto-CHF pro Einkommenskategorie (untere Bandgrenze / Plafond) für 3x-Mietregel. */
const INCOME_REPRESENTATIVE_CHF: Record<IncomeCategory, number> = {
  UNDER_2000: 2000,
  UNDER_3000: 3000,
  FROM_2000_TO_3000: 3000,
  FROM_3000_TO_4000: 4000,
  FROM_4000_TO_5000: 5000,
  FROM_4000_TO_5500: 5500,
  FROM_5000_TO_7000: 7000,
  FROM_5500_TO_7000: 7000,
  FROM_7000_TO_9000: 9000,
  FROM_9000_TO_12000: 12000,
  FROM_12000_TO_15000: 15000,
  FROM_12000_TO_16000: 16000,
  FROM_15000_TO_20000: 20000,
  FROM_16000_TO_22000: 22000,
  FROM_20000_TO_30000: 30000,
  FROM_22000_TO_30000: 30000,
  FROM_30000_TO_50000: 50000,
  FROM_30000_TO_45000: 45000,
  FROM_45000_TO_65000: 65000,
  FROM_65000_TO_90000: 90000,
  ABOVE_50000: 50000,
  ABOVE_90000: 90000,
}

export function generateCertificateCode(): string {
  const year = new Date().getFullYear()
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const random = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `HLV-${year}-${random}`
}

export function checkCertificateEligibility(profile: TenantProfile): { eligible: boolean; reason?: string } {
  if (!profile.isComplete) {
    return { eligible: false, reason: 'PROFILE_INCOMPLETE' }
  }
  if (profile.creditCheckStatus !== 'APPROVED') {
    return { eligible: false, reason: 'CREDIT_CHECK_NOT_APPROVED' }
  }
  if (!profile.creditCheckExpiresAt || new Date(profile.creditCheckExpiresAt) < new Date()) {
    return { eligible: false, reason: 'CREDIT_CHECK_EXPIRED' }
  }
  if (!profile.currentHousingSituation || !profile.currentHousingSince) {
    return { eligible: false, reason: 'HOUSING_INCOMPLETE' }
  }
  return { eligible: true }
}

export function calculateMaxRent(incomeCategory: IncomeCategory | string): number {
  const key = incomeCategory as IncomeCategory
  const income = INCOME_REPRESENTATIVE_CHF[key] ?? 0
  return Math.floor(income / 3)
}

export type CreditCertificateDisplayStatus = 'CLEAR' | 'ENTRIES_PRESENT'

export function creditDisplayStatusFromResult(result: CreditCheckResult | null): CreditCertificateDisplayStatus {
  if (!result) return 'CLEAR'
  if (result.hasEntries || result.entryCount > 0) return 'ENTRIES_PRESENT'
  return 'CLEAR'
}

export function parseCreditResult(json: unknown): CreditCheckResult | null {
  if (!json || typeof json !== 'object') return null
  return isCreditCheckResult(json) ? json : null
}

export function creditCheckSnapshotDate(profile: TenantProfile, result: CreditCheckResult | null): Date {
  if (result?.issueDate) {
    const d = new Date(result.issueDate)
    if (!Number.isNaN(d.getTime())) return d
  }
  if (profile.creditCheckUploadedAt) return profile.creditCheckUploadedAt
  return new Date()
}

export type CertificateSnapshotInput = {
  profile: TenantProfile
  creditResult: CreditCheckResult | null
  certificateCode: string
  version: number
  expiresAt: Date
}

export function buildCertificateSnapshotFields(input: CertificateSnapshotInput) {
  const { profile, creditResult, certificateCode, version, expiresAt } = input
  const creditDisplay = creditDisplayStatusFromResult(creditResult)
  const entryCount = creditResult?.entryCount ?? 0
  const canton = (creditResult?.canton ?? 'CH').trim().slice(0, 8).toUpperCase()
  const incomeQualifiesUpTo = calculateMaxRent(profile.monthlyIncomeCategory)

  return {
    certificateCode,
    version,
    verifiedFirstName: profile.firstName.trim(),
    verifiedLastName: profile.lastName.trim(),
    verifiedAddress: profile.currentAddress.trim(),
    verifiedCity: profile.currentCity.trim(),
    verifiedZip: profile.currentZip.trim(),
    verifiedHousingSituation: profile.currentHousingSituation as CurrentHousingSituation,
    verifiedHousingSince: profile.currentHousingSince!,
    verifiedEmploymentStatus: profile.employmentStatus,
    verifiedEmployer: profile.employer?.trim() || null,
    verifiedIncomeCategory: profile.monthlyIncomeCategory,
    verifiedCreditCheckStatus: creditDisplay,
    verifiedCreditCheckDate: creditCheckSnapshotDate(profile, creditResult),
    verifiedCreditCheckCanton: canton,
    verifiedCreditEntryCount: entryCount,
    incomeQualifiesUpTo,
    expiresAt,
  }
}
