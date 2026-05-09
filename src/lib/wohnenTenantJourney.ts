/**
 * Gemeinsame Logik für Mieter-Journey auf wohnen.helvenda.ch
 * (Startseiten-CTA, Navbar, Fortschritt) — eine Quelle der Wahrheit für „was ist der nächste sinnvolle Schritt?“.
 */

export type WohnenHomeCta = {
  primaryHref: string
  primaryLabel: string
  /** Kurzer Satz unter dem Hero-CTA: Warum genau dieser Schritt. */
  primaryHint?: string
  secondaryHref?: string
  secondaryLabel?: string
  /** Grüner Footer-Block „Für Mietende“ — eigener Text, oft näher an Entdecken als am Hero-Schwerpunkt. */
  footerTenantHref: string
  footerTenantLabel: string
}

export type WohnenJourneyProfile = {
  isComplete: boolean
  creditCheckStatus: string
  creditCheckExpiresAt: Date | null
} | null

export function creditApprovedValid(
  profile: { creditCheckStatus: string; creditCheckExpiresAt: Date | null } | null,
  now: Date = new Date()
): boolean {
  if (!profile) return false
  if (profile.creditCheckStatus !== 'APPROVED') return false
  const exp = profile.creditCheckExpiresAt
  return Boolean(exp && exp.getTime() > now.getTime())
}

export function creditPendingReview(profile: { creditCheckStatus: string } | null): boolean {
  if (!profile) return false
  return (
    profile.creditCheckStatus === 'PENDING' || profile.creditCheckStatus === 'PENDING_MANUAL_REVIEW'
  )
}

/**
 * Hero- und Footer-CTAs auf der Wohnen-Startseite (angemeldete Nutzer).
 */
export function deriveWohnenHomeCta(args: {
  profile: WohnenJourneyProfile
  hasActiveCertificate: boolean
}): WohnenHomeCta {
  const { profile, hasActiveCertificate } = args
  const pending = creditPendingReview(profile)

  if (!profile || !profile.isComplete) {
    const primaryHref = !profile ? '/profil/erstellen' : '/profil/bearbeiten'
    const primaryLabel = !profile ? 'Profil erstellen' : 'Profil vervollständigen'
    return {
      primaryHref,
      primaryLabel,
      primaryHint:
        'Mit Profil und Suchpräferenzen zeigen wir dir passende Inserate — und bereiten verifizierte Bewerbungen vor.',
      secondaryHref: '/wohnungen',
      secondaryLabel: 'Zuerst Wohnungen ansehen',
      footerTenantHref: '/wohnungen',
      footerTenantLabel: 'Wohnungen durchsuchen →',
    }
  }

  if (pending) {
    return {
      primaryHref: '/meine-matches',
      primaryLabel: 'Zu meinen Matches',
      primaryHint:
        'Dein Betreibungsregisterauszug wird geprüft. Passende Inserate kannst du schon ansehen; bewerben geht nach Freigabe.',
      secondaryHref: '/profil/betreibungsregister',
      secondaryLabel: 'Upload & Status',
      footerTenantHref: '/wohnungen',
      footerTenantLabel: 'Alle Wohnungen →',
    }
  }

  if (!creditApprovedValid(profile)) {
    return {
      primaryHref: '/profil/betreibungsregister',
      primaryLabel: 'Betreibungsregister hochladen',
      primaryHint:
        'Damit prüfen wir deine Bonität — Voraussetzung für verifizierte Bewerbungen und den Helvenda-Qualitätsnachweis.',
      secondaryHref: '/wohnungen',
      secondaryLabel: 'Wohnungen durchsuchen',
      footerTenantHref: '/wohnungen',
      footerTenantLabel: 'Wohnungen durchsuchen →',
    }
  }

  if (!hasActiveCertificate) {
    return {
      primaryHref: '/zertifikat',
      primaryLabel: 'Qualitätsnachweis ausstellen',
      primaryHint:
        'PDF mit Prüfcode — für Bewerbungen auch bei anderen Portalen oder direkt beim Vermieter.',
      secondaryHref: '/meine-matches',
      secondaryLabel: 'Zu meinen Matches',
      footerTenantHref: '/meine-matches',
      footerTenantLabel: 'Meine Matches ansehen →',
    }
  }

  return {
    primaryHref: '/meine-matches',
    primaryLabel: 'Meine Matches ansehen',
    primaryHint: 'Passende Wohnungen auf einen Blick — mit einem Klick bewerben, wenn du verifiziert bist.',
    secondaryHref: '/wohnungen',
    secondaryLabel: 'Alle Inserate',
    footerTenantHref: '/wohnungen',
    footerTenantLabel: 'Wohnungen durchsuchen →',
  }
}
