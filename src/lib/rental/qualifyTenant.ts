import type { RentalListing, TenantProfile } from '@prisma/client'

export type QualificationIssue = {
  code: string
  message: string
  action: string
  actionUrl: string
  blocking: boolean
}

export type QualificationResult = {
  qualified: boolean
  reasons: QualificationIssue[]
}

/** Konservative Untergrenze pro Band für die 3×-Miete-Prüfung (Netto/Monat). */
export const INCOME_MINIMUMS: Record<string, number> = {
  UNDER_3000: 2900,
  FROM_3000_TO_4000: 3900,
  FROM_4000_TO_5500: 5200,
  FROM_5500_TO_7000: 6800,
  FROM_7000_TO_9000: 8800,
  FROM_9000_TO_12000: 10500,
  FROM_12000_TO_16000: 13800,
  FROM_16000_TO_22000: 19000,
  FROM_22000_TO_30000: 26000,
  FROM_30000_TO_45000: 38000,
  FROM_45000_TO_65000: 55000,
  FROM_65000_TO_90000: 78000,
  ABOVE_90000: 95000,
}

export function qualifyTenant(
  profile: TenantProfile,
  listing: Pick<RentalListing, 'rentPerMonth' | 'utilitiesPerMonth'>
): QualificationResult {
  const issues: QualificationIssue[] = []

  if (!profile.isComplete) {
    issues.push({
      code: 'PROFILE_INCOMPLETE',
      message: 'Dein Profil ist noch nicht vollständig.',
      action: 'Profil vervollständigen',
      actionUrl: '/profil/erstellen',
      blocking: true,
    })
  }

  if (profile.isComplete && !profile.contactPhone?.trim()) {
    issues.push({
      code: 'CONTACT_PHONE_MISSING',
      message: 'Bitte hinterlege eine Telefonnummer in deinem Mieterprofil — Vermieter können dich so zuverlässig erreichen.',
      action: 'Profil bearbeiten',
      actionUrl: '/profil/bearbeiten',
      blocking: true,
    })
  }

  if (profile.creditCheckStatus !== 'APPROVED') {
    const messageMap: Record<string, string> = {
      NONE: 'Du hast noch keinen Betreibungsregisterauszug hochgeladen.',
      PENDING: 'Dein Betreibungsregisterauszug wird noch geprüft.',
      PENDING_MANUAL_REVIEW: 'Dein Betreibungsregisterauszug wird manuell geprüft.',
      REJECTED: 'Dein Betreibungsregisterauszug wurde abgelehnt.',
      EXPIRED: 'Dein Betreibungsregisterauszug ist abgelaufen.',
    }
    issues.push({
      code: 'CREDIT_CHECK_MISSING',
      message: messageMap[profile.creditCheckStatus] ?? 'Betreibungsregisterauszug fehlt.',
      action:
        profile.creditCheckStatus === 'NONE' ||
        profile.creditCheckStatus === 'REJECTED' ||
        profile.creditCheckStatus === 'EXPIRED'
          ? 'Jetzt hochladen'
          : 'Status prüfen',
      actionUrl: '/profil/betreibungsregister',
      blocking: true,
    })
  }

  if (
    profile.creditCheckStatus === 'APPROVED' &&
    profile.creditCheckExpiresAt &&
    new Date(profile.creditCheckExpiresAt) < new Date()
  ) {
    issues.push({
      code: 'CREDIT_CHECK_EXPIRED',
      message: `Dein Betreibungsregisterauszug ist am ${new Date(
        profile.creditCheckExpiresAt
      ).toLocaleDateString('de-CH')} abgelaufen.`,
      action: 'Neuen Auszug hochladen',
      actionUrl: '/profil/betreibungsregister',
      blocking: true,
    })
  }

  if (profile.isComplete && profile.monthlyIncomeCategory) {
    const monthlyIncome = INCOME_MINIMUMS[profile.monthlyIncomeCategory] ?? 0
    const totalRent = listing.rentPerMonth + (listing.utilitiesPerMonth ?? 0)
    const requiredIncome = totalRent * 3

    if (monthlyIncome < requiredIncome) {
      issues.push({
        code: 'INCOME_TOO_LOW',
        message: `Für diese Wohnung (CHF ${totalRent}/Monat inkl. NK) wird ein Nettoeinkommen von mind. CHF ${requiredIncome.toLocaleString('de-CH')}/Monat empfohlen.`,
        action: 'Einkommen aktualisieren',
        actionUrl: '/profil/bearbeiten',
        blocking: true,
      })
    }
  }

  return {
    qualified: issues.filter(i => i.blocking).length === 0,
    reasons: issues,
  }
}
