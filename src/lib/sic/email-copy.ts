import { getSicModule, SIC_MODULES, type SicModuleId } from '@/lib/sic/modules'

/** «1 von 4 steht drauf» — die Zeile, die nach der ersten Freigabe zählt. */
export function sicStandsOnDocLine(verifiedCount: number): string {
  return `${verifiedCount} von ${SIC_MODULES.length} steht drauf`
}

export function sicCertificateReadyCopy(opts: {
  moduleKind: SicModuleId
  verifiedCount: number
  firstVerification: boolean
  pdfReady: boolean
  validUntil: string
}): { subject: string; heading: string; preheader: string; paragraphs: string[] } {
  const title = getSicModule(opts.moduleKind).title
  const onDoc = sicStandsOnDocLine(opts.verifiedCount)
  const moreOpen = opts.verifiedCount < SIC_MODULES.length

  if (opts.firstVerification && opts.pdfReady) {
    const paragraphs = [
      `Das PDF ist bereit. ${onDoc}.`,
      `Geprüft ist «${title}». Gültig bis ${opts.validUntil}.`,
      'Lade das PDF herunter und leg es der nächsten Bewerbung bei — damit der Vermieter geprüfte Angaben in der Hand hat, auf die er sich stützen kann. Nicht geprüfte Angaben stehen nicht auf dem Dokument. Eine Zusage versprechen wir nicht.',
    ]
    if (moreOpen) {
      paragraphs.push(
        'Angaben mit Unterschrift Dritter — etwa die Referenz vom Vermieter — dürfen länger dauern. Du kannst das PDF trotzdem schon beilegen.'
      )
    }
    return {
      subject: 'Dein PDF ist bereit',
      heading: 'Dein PDF ist bereit',
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
        `Geprüft ist «${title}». Gültig bis ${opts.validUntil}.`,
      ],
    }
  }

  const paragraphs = [
    `Die Angabe «${title}» ist geprüft und steht auf deinem Zertifikat.`,
    `Aktueller Stand: ${onDoc}. Gültig bis ${opts.validUntil}.`,
  ]
  if (opts.pdfReady) {
    paragraphs.push(
      'Lade das aktuelle PDF herunter und leg es der Bewerbung bei. Der Vermieter sieht, was geprüft ist — und kann sich darauf stützen. Nicht geprüfte Angaben stehen nicht auf dem Dokument.'
    )
  } else {
    paragraphs.push('Für das PDF fehlt noch dein Name auf dem Zertifikat — das ist in einer Minute erledigt.')
  }

  return {
    subject: `«${title}» geprüft — Zertifikat aktualisiert`,
    heading: 'Dein Zertifikat wurde aktualisiert',
    preheader: `${title} geprüft — ${onDoc}`,
    paragraphs,
  }
}

export function sicUploadReminderCopy(moduleKind: SicModuleId): {
  heading: string
  preheader: string
  paragraphs: string[]
} {
  const def = getSicModule(moduleKind)
  if (def.selfObtainable) {
    return {
      heading: 'Nachweis noch offen',
      preheader: `Noch offen: ${def.title}`,
      paragraphs: [
        `Für «${def.title}» fehlt noch der Upload. Das Dokument hast du selbst — oft innerhalb eines Tages.`,
        'Lade es hoch, sobald es vorliegt.',
      ],
    }
  }
  return {
    heading: 'Nachweis noch offen',
    preheader: `Noch offen: ${def.title}`,
    paragraphs: [
      `Für «${def.title}» fehlt noch die unterzeichnete Vorlage. Eine Unterschrift Dritter darf ein paar Tage dauern.`,
      'Lade sie hoch, sobald sie vorliegt.',
    ],
  }
}

export type SicMagicLinkMailSource = 'self' | 'support'

/** Anmeldelink: selbst angefordert oder vom Support nachgeschickt. */
export function sicMagicLinkEmailCopy(source: SicMagicLinkMailSource): {
  subject: string
  heading: string
  preheader: string
  paragraphs: string[]
  footnote: string
} {
  if (source === 'support') {
    return {
      subject: 'Dein Anmeldelink für Swiss Immo Cert',
      heading: 'Dein Anmeldelink',
      preheader: 'Neuer Anmeldelink für dein Zertifikat',
      paragraphs: [
        'Hier ist ein neuer Anmeldelink für dein Zertifikat. Er ist 30 Minuten gültig und nur einmal verwendbar.',
        'Ist er abgelaufen, forderst du unter «Mein Zertifikat» jederzeit einen neuen an.',
      ],
      footnote: 'Falls du uns nicht geschrieben hast, kannst du diese E-Mail ignorieren.',
    }
  }
  return {
    subject: 'Dein Anmeldelink für Swiss Immo Cert',
    heading: 'Anmeldung bei Swiss Immo Cert',
    preheader: 'Dein Anmeldelink für Swiss Immo Cert',
    paragraphs: [
      'Klicke auf den Button, um dich ohne Passwort anzumelden. Dieser Link ist 30 Minuten gültig und nur einmal verwendbar.',
      'Vorlagen und Uploads dürfen über Tage dauern. Ist der Link abgelaufen, forderst du unter «Mein Zertifikat» jederzeit einen neuen an.',
    ],
    footnote:
      'Falls du diese Anmeldung nicht angefordert hast, kannst du diese E-Mail ignorieren. Es wird kein Zugriff gewährt, solange der Link nicht geöffnet wird.',
  }
}
