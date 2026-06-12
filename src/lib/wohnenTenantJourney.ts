/**
 * Gemeinsame Logik für Mieter-Journey auf wohnen.helvenda.ch
 * (Startseiten-CTA, Navbar, Fortschritt) — eine Quelle der Wahrheit für „was ist der nächste sinnvolle Schritt?“.
 */

import { formatTenantBonusChf } from '@/lib/wohnen/pricing'

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
  /** Nur für anonyme Besucher — sonst leer, um Redundanz zu vermeiden. */
  bullets: string[]
  /** Bonus-Pill im Hero; bei ready steckt der Bonus im Subtext. */
  showBonusPill: boolean
}

/** Cert-Block unter dem Hero: bei ready redundant (Zertifikat ist schon aktiv). */
export function shouldShowCertBlockOnHome(stage: WohnenJourneyStage): boolean {
  return stage !== 'ready'
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

  const bonus = formatTenantBonusChf()

  if (stage === 'ready') {
    const subtext =
      activeCount > 0 ?
        `Bewirb dich mit einem Klick auf Helvenda — oder nutze dein Zertifikat bei Homegate, per E-Mail oder direkt beim Vermieter. Bei Einzug: ${bonus} von uns.`
      : `Dein Zertifikat ist aktiv und überall einsetzbar — auch wenn heute noch wenig auf Helvenda passt. Bei Einzug über Helvenda erhältst du ${bonus} von uns.`
    return {
      line1: 'Du bist bereit.',
      line2: 'Jetzt die passende Wohnung finden.',
      subtext,
      bullets: [],
      showBonusPill: false,
    }
  }

  if (stage === 'certificate_needed') {
    return {
      line1: 'Dein Helvenda-Zertifikat.',
      line2: 'Überall einsetzbar.',
      subtext:
        'Mit deinem geprüften Betreibungsregister stellst du das Helvenda-Zertifikat aus — und nutzt es auch für Bewerbungen ausserhalb von Helvenda.',
      bullets: [],
      showBonusPill: true,
    }
  }

  if (stage === 'credit_pending') {
    return {
      line1: 'Fast geschafft.',
      line2: 'Register wird geprüft.',
      subtext:
        'Dein Betreibungsregisterauszug ist in Prüfung. Inserate kannst du schon ansehen — bewerben und das Helvenda-Zertifikat folgen nach Freigabe.',
      bullets: [],
      showBonusPill: true,
    }
  }

  if (stage === 'credit_needed') {
    return {
      line1: 'Verifiziert bewerben.',
      line2: 'Register hochladen.',
      subtext:
        'Lade deinen Betreibungsregisterauszug hoch — Basis für das Helvenda-Zertifikat und Bewerbungen mit einem Klick.',
      bullets: [],
      showBonusPill: true,
    }
  }

  if (stage === 'profile_incomplete') {
    return {
      line1: 'Dein Mieterprofil.',
      line2: 'Der nächste Schritt.',
      subtext:
        'Mit vollständigem Profil und Suchpräferenzen siehst du passende Inserate — und kannst dich später verifiziert bewerben.',
      bullets: [],
      showBonusPill: true,
    }
  }

  // anonymous — Cold-Start: Zertifikat trägt, Inserate folgen.
  if (inventoryNarrow) {
    return {
      line1: 'Dein Helvenda-Zertifikat.',
      line2: 'Auch ausserhalb von Helvenda.',
      subtext:
        'Mit deinem Zertifikat bewirbst du dich überall — bei Homegate, per E-Mail oder direkt beim Vermieter. Auf Helvenda wächst das Angebot laufend.',
      bullets: ['Geprüftes Register', 'Kein Pflicht-Abo'],
      showBonusPill: true,
    }
  }

  // anonymous — Standard: Bedarf zuerst, Zertifikat als Hebel direkt mitgenannt.
  return {
    line1: 'Wohnung finden.',
    line2: 'Mit dem Helvenda-Zertifikat.',
    subtext:
      'Verifiziert bewerben mit einem Klick — und mit deinem Zertifikat überzeugst du auch Vermieter ausserhalb von Helvenda.',
    bullets: ['Geprüftes Register', 'Kein Pflicht-Abo'],
    showBonusPill: true,
  }
}

export function deriveWohnenHomeFooterTenant(args: { stage: WohnenJourneyStage }): WohnenHomeFooterTenant {
  switch (args.stage) {
    case 'ready':
      return {
        body: `Bewirb dich auf Helvenda — bei Einzug ${formatTenantBonusChf()} von uns.\nDein Zertifikat gilt auch ausserhalb von Helvenda.`,
      }
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
    primaryHref: '/meine-matches',
    primaryLabel: 'Meine Matches ansehen',
    secondaryHref: '/zertifikat',
    secondaryLabel: 'Zertifikat anzeigen',
    footerTenantHref: '/meine-matches',
    footerTenantLabel: 'Zu meinen Matches →',
  }
}
