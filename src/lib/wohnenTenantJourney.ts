/**
 * Gemeinsame Logik für Mieter-Journey auf wohnen.helvenda.ch
 * (Startseiten-CTA, Navbar, Fortschritt) — eine Quelle der Wahrheit für „was ist der nächste sinnvolle Schritt?“.
 */

import { formatTenantBonusChf } from '@/lib/wohnen/pricing'

const TENANT_BONUS = formatTenantBonusChf()
const TENANT_BONUS_BULLET = `${TENANT_BONUS} Einzugsbonus bei Einzug`
const TENANT_BONUS_SHORT_BULLET = `${TENANT_BONUS} Einzugsbonus`

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

/** Fortschritt auf der Wohnen-Startseite — steuert Hero, Footer und Listing-Intro. */
export type WohnenJourneyStage =
  | 'anonymous'
  | 'profile_incomplete'
  | 'credit_pending'
  | 'credit_needed'
  | 'certificate_needed'
  | 'ready'

export type WohnenHomeHero = {
  line1: string
  line2: string
  subtext: string
  /** Mobile-Vorteilszeilen unter dem CTA */
  bullets: string[]
}

export type WohnenHomeFooterTenant = {
  body: string
}

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

export function deriveWohnenJourneyStage(args: {
  signedIn: boolean
  profile: WohnenJourneyProfile
  hasActiveCertificate: boolean
}): WohnenJourneyStage {
  if (!args.signedIn) return 'anonymous'
  if (!args.profile || !args.profile.isComplete) return 'profile_incomplete'
  if (creditPendingReview(args.profile)) return 'credit_pending'
  if (!creditApprovedValid(args.profile)) return 'credit_needed'
  if (!args.hasActiveCertificate) return 'certificate_needed'
  return 'ready'
}

/**
 * Hero-Texte: abhängig von Journey-Stand und Bestand — keine „Inserate kommen noch“-Widersprüche.
 */
export function deriveWohnenHomeHero(args: {
  stage: WohnenJourneyStage
  activeCount: number
}): WohnenHomeHero {
  const { stage, activeCount } = args
  const inventoryNarrow = activeCount <= 14

  if (stage === 'ready') {
    const helvendaZusatz =
      activeCount > 0 ?
        inventoryNarrow ?
          ` Zusätzlich auf Helvenda: ${activeCount.toLocaleString('de-CH')} passende Inserate unter Meine Matches — dort bewirbst du dich mit einem Klick.`
        : ' Auf Helvenda findest du passende Inserate und bewirbst dich mit einem Klick.'
      : ''
    return {
      line1: 'Dein Helvenda-Zertifikat ist aktiv.',
      line2: 'Fair mieten. Ohne Abo-Pflicht.',
      subtext: `Mit deinem Zertifikat bewirbst du dich auch ausserhalb von Helvenda — bei Homegate, per E-Mail oder direkt beim Vermieter.${helvendaZusatz}`,
      bullets: ['Zertifikat aktiv', TENANT_BONUS_BULLET, 'Kein Pflicht-Abo'],
    }
  }

  if (stage === 'certificate_needed') {
    return {
      line1: 'Dein Helvenda-Zertifikat.',
      line2: 'Überall einsetzbar.',
      subtext:
        'Mit deinem geprüften Betreibungsregister stellst du das Helvenda-Zertifikat aus — und nutzt es auch für Bewerbungen ausserhalb von Helvenda.',
      bullets: ['Register geprüft', 'Auch für externe Bewerbungen', TENANT_BONUS_SHORT_BULLET],
    }
  }

  if (stage === 'credit_pending') {
    return {
      line1: 'Fast geschafft.',
      line2: 'Register wird geprüft.',
      subtext:
        'Dein Betreibungsregisterauszug ist in Prüfung. Inserate kannst du schon ansehen — bewerben und das Helvenda-Zertifikat folgen nach Freigabe.',
      bullets: ['Profil erfasst', 'Prüfung läuft', TENANT_BONUS_SHORT_BULLET],
    }
  }

  if (stage === 'credit_needed') {
    return {
      line1: 'Verifiziert bewerben.',
      line2: 'Register hochladen.',
      subtext:
        'Lade deinen Betreibungsregisterauszug hoch — Basis für das Helvenda-Zertifikat und Bewerbungen mit einem Klick.',
      bullets: ['Kostenlos für Mieter', 'Geprüfter Auszug', TENANT_BONUS_SHORT_BULLET],
    }
  }

  if (stage === 'profile_incomplete') {
    return {
      line1: 'Dein Mieterprofil.',
      line2: 'Der nächste Schritt.',
      subtext:
        'Mit vollständigem Profil und Suchpräferenzen siehst du passende Inserate — und kannst dich später verifiziert bewerben.',
      bullets: ['Kostenlos für Mieter', 'Suchpräferenzen', TENANT_BONUS_SHORT_BULLET],
    }
  }

  // anonymous
  if (inventoryNarrow) {
    return {
      line1: 'Dein Helvenda-Zertifikat.',
      line2: 'Fair mieten. Ohne Abo-Pflicht.',
      subtext:
        activeCount > 0 ?
          `Erhalte das Helvenda-Zertifikat für Bewerbungen — auch ausserhalb von Helvenda${activeCount <= 14 ? `. Aktuell ${activeCount.toLocaleString('de-CH')} Inserate auf Helvenda` : ''}.`
        : 'Erhalte das Helvenda-Zertifikat für Bewerbungen — auch ausserhalb von Helvenda.',
      bullets: [TENANT_BONUS_BULLET, 'Zertifikat für externe Bewerbungen', 'Kein Pflicht-Abo'],
    }
  }

  return {
    line1: 'Wohnung finden.',
    line2: 'Ohne Abo. Ohne Abzocke.',
    subtext:
      'Erhalte das Helvenda-Zertifikat für Bewerbungen — auch ausserhalb von Helvenda — und bewirb dich verifiziert mit einem Klick.',
    bullets: [TENANT_BONUS_BULLET, 'Verifizierte Bewerbungen', 'Kein Pflicht-Abo'],
  }
}

export function deriveWohnenHomeFooterTenant(args: { stage: WohnenJourneyStage }): WohnenHomeFooterTenant {
  switch (args.stage) {
    case 'ready':
      return { body: 'Kein Formular. Kein Abo.\nDein Nachweis gilt überall — unabhängig vom Inserate-Bestand.' }
    case 'certificate_needed':
      return { body: 'Kein Formular. Kein Abo.\nNachweis ausstellen — dann überall bewerben.' }
    case 'credit_pending':
      return { body: 'Kein Formular. Kein Abo.\nInserate ansehen — bewerben nach Register-Freigabe.' }
    case 'credit_needed':
      return { body: 'Kein Formular. Kein Abo.\nRegister hochladen — dann verifiziert bewerben.' }
    case 'profile_incomplete':
      return { body: 'Kein Formular. Kein Abo.\nProfil vervollständigen — dann Matches und Bewerbungen.' }
    default:
      return { body: 'Kein Formular. Kein Abo.\nEinmal verifiziert — überall ernsthaft bewerben.' }
  }
}

/** Optionaler Satz unter „Aktuelle Wohnungen“ — ohne „kommt noch“-Redundanz im Hero. */
export function deriveWohnenListingsSectionSub(args: {
  stage: WohnenJourneyStage
  activeCount: number
}): string | null {
  const { stage, activeCount } = args
  if (activeCount === 0) {
    return stage === 'ready' ?
        'Sobald etwas zu deinem Profil passt, erscheint es hier und unter Meine Matches.'
      : 'Passende Wohnungen erscheinen hier, sobald sie zu deinem Profil passen.'
  }
  if (stage === 'ready') {
    return `Zusätzlich auf Helvenda: ${activeCount.toLocaleString('de-CH')} passende Inserate zu deinem Profil.`
  }
  if (activeCount <= 14) {
    return `Aktuell ${activeCount.toLocaleString('de-CH')} Inserate — das Angebot wird laufend ergänzt.`
  }
  return null
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
        'Damit prüfen wir deine Bonität — Voraussetzung für verifizierte Bewerbungen und das Helvenda-Zertifikat.',
      secondaryHref: '/wohnungen',
      secondaryLabel: 'Wohnungen durchsuchen',
      footerTenantHref: '/wohnungen',
      footerTenantLabel: 'Wohnungen durchsuchen →',
    }
  }

  if (!hasActiveCertificate) {
    return {
      primaryHref: '/zertifikat',
      primaryLabel: 'Zertifikat ausstellen',
      primaryHint:
        'Dein Helvenda-Zertifikat — auch für Bewerbungen bei anderen Portalen oder direkt beim Vermieter.',
      secondaryHref: '/meine-matches',
      secondaryLabel: 'Zu meinen Matches',
      footerTenantHref: '/meine-matches',
      footerTenantLabel: 'Meine Matches ansehen →',
    }
  }

  return {
    primaryHref: '/zertifikat',
    primaryLabel: 'Zum Helvenda-Zertifikat',
    primaryHint:
      'Dein Vorteil bei jeder Bewerbung — auch ausserhalb von Helvenda.',
    secondaryHref: '/meine-matches',
    secondaryLabel: 'Meine Matches',
    footerTenantHref: '/zertifikat',
    footerTenantLabel: 'Qualitätsnachweis öffnen →',
  }
}
