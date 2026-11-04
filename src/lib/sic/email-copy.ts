import { SIC_DEBT_EXTRACT_ORDER_URL } from '@/lib/sic/config'
import {
  getSicModule,
  SIC_MODULES,
  sicSealRequirementLabel,
  type SicModuleId,
} from '@/lib/sic/modules'

/** «1 von 4 steht drauf» — die Zeile, die nach der ersten Freigabe zählt. */
export function sicStandsOnDocLine(verifiedCount: number): string {
  return `${verifiedCount} von ${SIC_MODULES.length} steht drauf`
}

export function sicCertificateReadyCopy(opts: {
  moduleKind: SicModuleId
  verifiedCount: number
  firstVerification: boolean
  pdfReady: boolean
  /** Betreibung + Ausweis geprüft: Zertifikat mit Siegel. Sonst ohne Siegel — gültig ist es so oder so. */
  sealReady?: boolean
  /** Null: ausgestellt, aber ohne Frist, bis der neue Betreibungsauszug geprüft ist. */
  validUntil: string | null
}): { subject: string; heading: string; preheader: string; paragraphs: string[] } {
  const title = getSicModule(opts.moduleKind).title
  const validity = opts.validUntil
    ? `Gültig bis ${opts.validUntil}.`
    : 'Gültig wird das Zertifikat wieder mit dem geprüften neuen Betreibungsauszug.'
  const onDoc = sicStandsOnDocLine(opts.verifiedCount)
  const moreOpen = opts.verifiedCount < SIC_MODULES.length
  const sealReady = opts.sealReady === true
  const sealNeed = sicSealRequirementLabel()

  if (opts.firstVerification && opts.pdfReady) {
    const paragraphs = sealReady
      ? [
          `Dein Mieter-Zertifikat ist bereit — mit Siegel. ${onDoc}.`,
          `Geprüft ist «${title}». ${validity}`,
          'Lade das PDF herunter und leg es der nächsten Bewerbung bei. Eine Zusage versprechen wir nicht.',
        ]
      : [
          `Dein Mieter-Zertifikat ist bereit. ${onDoc}.`,
          `Geprüft ist «${title}». ${validity}`,
          `Es ist gültig für alles, was geprüft ist — leg es der Bewerbung bei. Das Siegel kommt dazu, sobald ${sealNeed} geprüft sind. Eine Zusage versprechen wir nicht.`,
        ]
    if (moreOpen) {
      paragraphs.push(
        'Angaben mit Unterschrift Dritter — etwa die Referenz vom Vermieter — dürfen länger dauern.'
      )
    }
    return {
      subject: 'Dein Mieter-Zertifikat ist bereit',
      heading: 'Dein Mieter-Zertifikat ist bereit',
      preheader: onDoc,
      paragraphs,
    }
  }

  if (opts.firstVerification && !opts.pdfReady) {
    return {
      subject: 'Erste Angabe geprüft',
      heading: 'Die erste Angabe ist geprüft',
      preheader: onDoc,
      paragraphs: [
        `${onDoc} — für das PDF fehlt noch dein Name, das ist in einer Minute erledigt.`,
        `Geprüft ist «${title}». ${validity}`,
      ],
    }
  }

  const paragraphs = [
    `Die Angabe «${title}» ist geprüft und steht auf deinem Zertifikat.`,
    `Aktueller Stand: ${onDoc}. ${validity}`,
  ]
  if (opts.pdfReady) {
    paragraphs.push(
      sealReady
        ? 'Lade das aktuelle PDF herunter und leg es der Bewerbung bei.'
        : `Lade das aktuelle PDF herunter und leg es der Bewerbung bei. Das Siegel kommt dazu, sobald ${sealNeed} geprüft sind.`
    )
  } else {
    paragraphs.push(
      'Für das PDF fehlt noch dein Name auf dem Dokument — das ist in einer Minute erledigt.'
    )
  }

  return {
    subject: `«${title}» geprüft — Zertifikat aktualisiert`,
    heading: 'Dein Zertifikat wurde aktualisiert',
    preheader: `${title} geprüft — ${onDoc}`,
    paragraphs,
  }
}

export type SicUploadReminderItem = {
  title: string
  before: string
  link?: { label: string; url: string }
  after?: string
}

export type SicUploadReminderOpts = {
  /** new: noch nichts geprüft. valid: Zertifikat gilt schon. other: ausgestellt, gilt gerade nicht. */
  state?: 'new' | 'valid' | 'other'
  couple?: boolean
  /** Siegel steht schon (auch bei einem gerade neu eingereichten Nachweis): dann nicht damit werben. */
  sealHeld?: boolean
}

function reminderItem(id: SicModuleId, couple: boolean): SicUploadReminderItem {
  const title = getSicModule(id).title
  if (id === 'AUFENTHALT') {
    return {
      title,
      before: couple ? 'Foto oder Scan hochladen, für jede Person.' : 'Foto oder Scan hochladen.',
    }
  }
  if (id === 'BONITAET') {
    return {
      title,
      before: couple ? 'Für jede Person ' : '',
      link: {
        label: couple ? 'online bestellen' : 'Online bestellen',
        url: SIC_DEBT_EXTRACT_ORDER_URL,
      },
      after: ' und hochladen.',
    }
  }
  if (id === 'ARBEIT_EINKOMMEN') {
    return {
      title,
      before: couple
        ? 'Lohnabrechnung und Formular für den Arbeitgeber, je Person. Ist eine Person nicht angestellt, genügt für sie ein Beleg wie die Ausbildungsbestätigung. Seid ihr beide nicht angestellt, vermerkst du das mit einem Klick.'
        : 'Lohnabrechnung und Formular für den Arbeitgeber. Nicht angestellt? Das vermerkst du mit einem Klick.',
    }
  }
  return {
    title,
    before:
      'Formular für deinen bisherigen Vermieter. Keinen bisherigen Vermieter? Auch das vermerkst du mit einem Klick.',
  }
}

/**
 * Eine Erinnerung pro Zertifikat. Führt zum nächsten Schritt statt aufzuzählen, was fehlt:
 * zuerst was man selbst beschaffen kann, danach was eine Unterschrift Dritter braucht.
 */
export function sicUploadReminderCopy(
  moduleKinds: SicModuleId | SicModuleId[],
  opts: SicUploadReminderOpts = {}
): {
  subject: string
  heading: string
  preheader: string
  intro: string
  groups: { heading: string; items: SicUploadReminderItem[] }[]
  buttonText: string
} {
  const kinds = Array.isArray(moduleKinds) ? moduleKinds : [moduleKinds]
  const couple = opts.couple === true
  const state = opts.state ?? 'new'
  // Katalog-Reihenfolge ist Betreibung vor Ausweis; der Ausweis geht aber am schnellsten.
  const selfIds = (['AUFENTHALT', 'BONITAET'] as const).filter(id => kinds.includes(id))
  const thirdIds = (['ARBEIT_EINKOMMEN', 'ZUVERLAESSIGKEIT'] as const).filter(id =>
    kinds.includes(id)
  )
  const selfItems = selfIds.map(id => reminderItem(id, couple))
  const thirdItems = thirdIds.map(id => reminderItem(id, couple))

  // Das Siegel gehört zum letzten Nachweis, der dafür fehlt.
  if (!opts.sealHeld && selfItems.length > 0) {
    const last = selfItems[selfItems.length - 1]
    const seal = `Mit ${sicSealRequirementLabel()} bekommt dein Zertifikat das Siegel.`
    if (last.link) last.after = `${last.after ?? ''} ${seal}`
    else last.before = `${last.before} ${seal}`
  }

  const both = selfItems.length > 0 && thirdItems.length > 0
  const groups = [
    ...(selfItems.length > 0
      ? [{ heading: both ? 'Am schnellsten geht es so:' : 'Das fehlt noch:', items: selfItems }]
      : []),
    ...(thirdItems.length > 0
      ? [{ heading: both ? 'Danach, wenn du so weit bist:' : 'Das fehlt noch:', items: thirdItems }]
      : []),
  ]

  const copy = {
    new: {
      subject: 'Dein Zertifikat: der nächste Schritt',
      heading: 'Starte mit einem Nachweis',
      intro:
        'Dein Mieter-Zertifikat gilt ab der ersten geprüften Angabe. Du musst also nicht warten, bis alles beisammen ist.',
    },
    valid: {
      subject: 'Dein Zertifikat: das fehlt noch',
      heading: 'Dein Zertifikat gilt bereits',
      intro:
        'Mit diesen Angaben wird es stärker. Jede wird einzeln geprüft, du kannst sie also nacheinander hochladen.',
    },
    other: {
      subject: 'Dein Zertifikat: das fehlt noch',
      heading: 'Noch offene Nachweise',
      intro: 'Jeder Nachweis wird einzeln geprüft, du kannst sie also nacheinander hochladen.',
    },
  }[state]

  return {
    ...copy,
    preheader: copy.intro,
    groups,
    buttonText: 'Nachweis hochladen',
  }
}

export type SicMagicLinkMailSource = 'self' | 'support' | 'checkout'

/** Anmeldelink: selbst angefordert, vom Support nachgeschickt, oder direkt nach der Zahlung. */
export function sicMagicLinkEmailCopy(source: SicMagicLinkMailSource): {
  subject: string
  heading: string
  preheader: string
  paragraphs: string[]
  footnote: string
  buttonText: string
} {
  if (source === 'support') {
    return {
      subject: 'Dein Anmeldelink für Swiss Immo Cert',
      heading: 'Dein Anmeldelink',
      preheader: 'Neuer Anmeldelink für dein Zertifikat',
      paragraphs: [
        'Hier ist ein neuer Anmeldelink für dein Zertifikat. Öffne ihn und tippe auf der Seite auf «Anmelden» — erst dann wirst du eingeloggt. So bleibt der Link gültig, wenn dein Mailprogramm ihn vorsorglich öffnet. Er ist 30 Minuten gültig und nur einmal verwendbar.',
        'Ist er abgelaufen, forderst du unter «Mein Zertifikat» jederzeit einen neuen an.',
      ],
      footnote: 'Falls du uns nicht geschrieben hast, kannst du diese E-Mail ignorieren.',
      buttonText: 'Anmeldeseite öffnen',
    }
  }
  if (source === 'checkout') {
    return {
      subject: 'Dieser Link öffnet dein Zertifikat',
      heading: 'Dein Zertifikat',
      preheader: 'Dieser Link öffnet dein Zertifikat',
      paragraphs: [
        'Dieser Link öffnet dein Zertifikat. Tippe auf der Seite auf «Anmelden» — erst dann wirst du eingeloggt. So bleibt der Link gültig, wenn dein Mailprogramm ihn vorsorglich öffnet.',
        'Der Link ist 30 Minuten gültig. Auf dem Gerät, mit dem du bezahlt hast, bleibst du sieben Tage angemeldet. Ist der Link abgelaufen, forderst du unter «Mein Zertifikat» jederzeit einen neuen an.',
      ],
      footnote: 'Falls du nicht bei uns bezahlt hast, kannst du diese E-Mail ignorieren.',
      buttonText: 'Zertifikat öffnen',
    }
  }
  return {
    subject: 'Dein Anmeldelink für Swiss Immo Cert',
    heading: 'Anmeldung bei Swiss Immo Cert',
    preheader: 'Dein Anmeldelink für Swiss Immo Cert',
    paragraphs: [
      'Öffne den Link und tippe auf der Seite auf «Anmelden». Erst dieser Klick loggt dich ein — so bleibt der Link gültig, wenn dein Mailprogramm ihn vorsorglich öffnet. Er ist 30 Minuten gültig und nur einmal verwendbar.',
      'Vorlagen und Uploads dürfen über Tage dauern. Ist der Link abgelaufen, forderst du unter «Mein Zertifikat» jederzeit einen neuen an.',
    ],
    footnote:
      'Falls du diese Anmeldung nicht angefordert hast, kannst du diese E-Mail ignorieren. Es wird kein Zugriff gewährt, solange du nicht auf «Anmelden» tippst.',
    buttonText: 'Anmeldeseite öffnen',
  }
}

/** Neue Adresse: Bestätigungsknopf, nicht GET-Verbrauch. */
export function sicEmailChangeConfirmCopy(): {
  subject: string
  heading: string
  preheader: string
  paragraphs: string[]
  footnote: string
  buttonText: string
} {
  return {
    subject: 'Neue E-Mail für dein Zertifikat bestätigen',
    heading: 'E-Mail-Adresse bestätigen',
    preheader: 'Tippe auf Bestätigen, damit die neue Adresse gilt',
    paragraphs: [
      'Du möchtest dein Zertifikat auf diese E-Mail-Adresse umstellen. Öffne den Link und tippe auf «Bestätigen». Erst dieser Klick ändert die Adresse — so bleibt die Anfrage gültig, wenn dein Mailprogramm die Seite vorsorglich öffnet.',
      'Der Link ist 30 Minuten gültig. Danach kannst du die Änderung unter «Mein Zertifikat» erneut anfordern — solange du noch angemeldet bist.',
    ],
    footnote:
      'Falls du diese Änderung nicht angefordert hast, kannst du diese E-Mail ignorieren. Die Adresse ändert sich erst, wenn du auf «Bestätigen» tippst.',
    buttonText: 'Bestätigungsseite öffnen',
  }
}

/** Bisherige Adresse: Mitteilung, kein Bestätigungslink. */
export function sicEmailChangeNoticeCopy(newEmail: string): {
  subject: string
  heading: string
  preheader: string
  paragraphs: string[]
  footnote: string
} {
  return {
    subject: 'E-Mail-Änderung für dein Zertifikat angefordert',
    heading: 'Änderung der E-Mail-Adresse',
    preheader: 'Die neue Adresse gilt erst nach der Bestätigung',
    paragraphs: [
      `Für dein Zertifikat wurde eine neue E-Mail angegeben: ${newEmail}. Die Änderung gilt erst, wenn diese Adresse bestätigt wird.`,
      'Warst du das nicht, schreib uns. Die bisherige Adresse bleibt gültig, bis die neue bestätigt ist.',
    ],
    footnote:
      'Diese Nachricht geht an die bisherige Adresse, damit eine Änderung nicht unbemerkt bleibt.',
  }
}
