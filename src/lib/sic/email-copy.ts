import { getSicModule, SIC_MODULES, sicSealRequirementLabel, type SicModuleId } from '@/lib/sic/modules'

/** «1 von 4 steht drauf» — die Zeile, die nach der ersten Freigabe zählt. */
export function sicStandsOnDocLine(verifiedCount: number): string {
  return `${verifiedCount} von ${SIC_MODULES.length} steht drauf`
}

export function sicCertificateReadyCopy(opts: {
  moduleKind: SicModuleId
  verifiedCount: number
  firstVerification: boolean
  pdfReady: boolean
  /** Betreibung + Ausweis: Urkunde. Sonst Stand der Prüfung. */
  sealReady?: boolean
  validUntil: string
}): { subject: string; heading: string; preheader: string; paragraphs: string[] } {
  const title = getSicModule(opts.moduleKind).title
  const onDoc = sicStandsOnDocLine(opts.verifiedCount)
  const moreOpen = opts.verifiedCount < SIC_MODULES.length
  const sealReady = opts.sealReady === true
  const sealNeed = sicSealRequirementLabel()

  if (opts.firstVerification && opts.pdfReady) {
    const paragraphs = sealReady ?
      [
        `Das Mieter-Zertifikat ist bereit. ${onDoc}.`,
        `Geprüft ist «${title}». Gültig bis ${opts.validUntil}.`,
        'Lade das PDF herunter und leg es der nächsten Bewerbung bei. Nicht geprüfte Angaben stehen nicht auf dem Dokument. Eine Zusage versprechen wir nicht.',
      ]
    : [
        `Der Stand der Prüfung ist als PDF bereit. ${onDoc}.`,
        `Geprüft ist «${title}». Gültig bis ${opts.validUntil}.`,
        `Das ist noch kein Mieter-Zertifikat. Dafür müssen ${sealNeed} geprüft sein. Du kannst den Stand trotzdem beilegen — der Vermieter sieht den Umfang auf dem Dokument. Eine Zusage versprechen wir nicht.`,
      ]
    if (moreOpen) {
      paragraphs.push(
        'Angaben mit Unterschrift Dritter — etwa die Referenz vom Vermieter — dürfen länger dauern.'
      )
    }
    return {
      subject: sealReady ? 'Dein Mieter-Zertifikat ist bereit' : 'Dein Stand der Prüfung ist bereit',
      heading: sealReady ? 'Dein Mieter-Zertifikat ist bereit' : 'Der Stand der Prüfung ist bereit',
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
    sealReady ?
      `Die Angabe «${title}» ist geprüft und steht auf deinem Zertifikat.`
    : `Die Angabe «${title}» ist geprüft und steht auf dem Stand der Prüfung.`,
    `Aktueller Stand: ${onDoc}. Gültig bis ${opts.validUntil}.`,
  ]
  if (opts.pdfReady) {
    paragraphs.push(
      sealReady ?
        'Lade das aktuelle PDF herunter und leg es der Bewerbung bei. Nicht geprüfte Angaben stehen nicht auf dem Dokument.'
      : `Lade den Stand der Prüfung herunter. Das Mieter-Zertifikat gibt es, sobald ${sealNeed} geprüft sind.`
    )
  } else {
    paragraphs.push('Für das PDF fehlt noch dein Name auf dem Dokument — das ist in einer Minute erledigt.')
  }

  return {
    subject: sealReady ? `«${title}» geprüft — Zertifikat aktualisiert` : `«${title}» geprüft — Stand aktualisiert`,
    heading: sealReady ? 'Dein Zertifikat wurde aktualisiert' : 'Der Stand der Prüfung wurde aktualisiert',
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
    footnote: 'Diese Nachricht geht an die bisherige Adresse, damit eine Änderung nicht unbemerkt bleibt.',
  }
}
