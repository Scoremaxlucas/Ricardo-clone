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
      `Du kannst dich jetzt bewerben. ${onDoc}.`,
      `Geprüft ist «${title}». Gültig bis ${opts.validUntil}.`,
      'Lade das PDF herunter und leg es der Bewerbung bei. Nicht geprüfte Angaben stehen nicht auf dem Dokument.',
    ]
    if (moreOpen) {
      paragraphs.push(
        'Angaben mit Unterschrift Dritter — etwa die Referenz vom Vermieter — dürfen länger dauern. Du kannst das PDF trotzdem schon beilegen.'
      )
    }
    return {
      subject: 'Du kannst dich jetzt bewerben',
      heading: 'Du kannst dich jetzt bewerben',
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
    paragraphs.push('Lade das aktuelle PDF herunter. Nicht geprüfte Angaben stehen nicht auf dem Dokument.')
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
