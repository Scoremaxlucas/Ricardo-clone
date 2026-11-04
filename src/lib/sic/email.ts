import { sendEmail } from '@/lib/email/sender'
import { SIC_COLORS } from '@/lib/sic/brand'
import {
  SIC_BRAND_NAME,
  SIC_DEBT_EXTRACT_ORDER_URL,
  SIC_OPERATOR,
  SIC_REVIEW_SLA,
  SIC_SUPPORT_EMAIL,
  sicFromAddress,
  sicPaths,
  sicUrl,
} from '@/lib/sic/config'
import {
  sicCertificateReadyCopy,
  sicEmailChangeConfirmCopy,
  sicEmailChangeNoticeCopy,
  sicMagicLinkEmailCopy,
  sicUploadReminderCopy,
  type SicMagicLinkMailSource,
  type SicUploadReminderItem,
  type SicUploadReminderOpts,
} from '@/lib/sic/email-copy'
import { getSicModule, SIC_RENEWAL_FEE_CHF, type SicModuleId } from '@/lib/sic/modules'
import { sicSwissDate } from '@/lib/sic/validity'

const ACTION = SIC_COLORS.action
const NAVY = SIC_COLORS.navy
const PAPER = SIC_COLORS.paper
const HAIRLINE = SIC_COLORS.hairline
const INK = '#0f172a'
const MUTED = '#64748b'

async function sicMail(opts: { to: string; subject: string; html: string; text: string }) {
  const result = await sendEmail({
    ...opts,
    from: sicFromAddress(),
    replyTo: SIC_SUPPORT_EMAIL,
  })
  if (!result.success) {
    throw new Error(result.error || 'SIC mail failed')
  }
  return result
}

/** Minimalistisches, seriöses Template für Swiss Immo Cert. */
export function sicEmailShell(opts: {
  preheader?: string
  heading: string
  bodyHtml: string
  buttonText?: string
  buttonUrl?: string
  footnoteHtml?: string
}): string {
  const { preheader, heading, bodyHtml, buttonText, buttonUrl, footnoteHtml } = opts
  const button =
    buttonText && buttonUrl ?
      `<tr><td style="padding:8px 0 4px;">
         <a href="${buttonUrl}" style="display:inline-block;background:${ACTION};color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;padding:14px 30px;border-radius:10px;">${buttonText}</a>
       </td></tr>`
    : ''

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:${PAPER};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${INK};">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;border:1px solid ${HAIRLINE};overflow:hidden;">
        <tr><td style="padding:32px 40px 8px;">
          <div style="font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:${NAVY};font-weight:700;">${SIC_BRAND_NAME}</div>
        </td></tr>
        <tr><td style="padding:8px 40px 0;">
          <h1 style="margin:0;font-size:22px;font-weight:700;color:${NAVY};">${heading}</h1>
        </td></tr>
        <tr><td style="padding:16px 40px 8px;font-size:15px;line-height:1.65;color:#334155;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:8px 40px 24px;">
          <table role="presentation" cellpadding="0" cellspacing="0">${button}</table>
        </td></tr>
        ${
          footnoteHtml ?
            `<tr><td style="padding:0 40px 28px;font-size:13px;line-height:1.6;color:${MUTED};">${footnoteHtml}</td></tr>`
          : ''
        }
        <tr><td style="padding:20px 40px;border-top:1px solid ${HAIRLINE};font-size:12px;line-height:1.6;color:${MUTED};">
          Diese Nachricht wurde automatisch von ${SIC_BRAND_NAME} versendet. Fragen: ${SIC_SUPPORT_EMAIL}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendSicMagicLinkEmail(
  email: string,
  url: string,
  source: SicMagicLinkMailSource = 'self'
) {
  const copy = sicMagicLinkEmailCopy(source)
  const html = sicEmailShell({
    preheader: copy.preheader,
    heading: copy.heading,
    bodyHtml: copy.paragraphs
      .map((p, i) => `<p style="margin:${i === 0 ? '0 0 12px' : '0'};">${p}</p>`)
      .join(''),
    buttonText: copy.buttonText,
    buttonUrl: url,
    footnoteHtml: copy.footnote,
  })

  return sicMail({
    to: email,
    subject: copy.subject,
    html,
    text: `${copy.heading}\n\n${copy.paragraphs.join('\n\n')}\n\n${url}\n\n${copy.footnote}`,
  })
}

const MAGIC_LINK_FOOTNOTE =
  'Der Anmeldelink ist 30 Minuten gültig und nur einmal verwendbar. Auf der Seite tippst du auf «Anmelden» — erst dann wirst du eingeloggt. Danach kannst du unter «Mein Zertifikat» einen neuen anfordern.'

/**
 * Freigabe: das Zertifikat ist ab der ersten geprüften Angabe abrufbar —
 * genau der Moment, in dem jemand das Dokument zum ersten Mal weiterschickt.
 */
export async function sendSicCertificateReadyEmail(opts: {
  email: string
  moduleKind: SicModuleId
  certificateCode: string
  verifiedCount: number
  expiresAt: Date | null
  firstVerification: boolean
  /** Ohne Namen auf dem Zertifikat gibt es noch kein PDF. */
  pdfReady: boolean
  /** Betreibung + Ausweis geprüft — dann trägt das Zertifikat das Siegel. */
  sealReady?: boolean
  magicLinkUrl?: string
}) {
  const buttonUrl = opts.magicLinkUrl || sicUrl(sicPaths.certificateWorkspace)
  const validUntil = opts.expiresAt ? fmtSicDate(opts.expiresAt) : null
  const copy = sicCertificateReadyCopy({
    moduleKind: opts.moduleKind,
    verifiedCount: opts.verifiedCount,
    firstVerification: opts.firstVerification,
    pdfReady: opts.pdfReady,
    sealReady: opts.sealReady === true,
    validUntil,
  })
  const bodyHtml = copy.paragraphs
    .map((p, i) =>
      i === copy.paragraphs.length - 1
        ? `<p style="margin:0;">${escapeHtml(p)}</p>`
        : `<p style="margin:0 0 12px;">${escapeHtml(p)}</p>`
    )
    .join('')

  return sicMail({
    to: opts.email,
    subject: copy.subject,
    html: sicEmailShell({
      preheader: copy.preheader,
      heading: copy.heading,
      bodyHtml,
      buttonText: opts.pdfReady ? 'Zertifikat öffnen' : 'Namen ergänzen',
      buttonUrl,
      footnoteHtml: opts.magicLinkUrl ? MAGIC_LINK_FOOTNOTE : undefined,
    }),
    text: `${copy.paragraphs.join('\n\n')}\n\n${opts.pdfReady ? 'Zertifikat öffnen' : 'Namen ergänzen'}: ${buttonUrl}`,
  })
}

export async function sendSicModuleRejectedEmail(opts: {
  email: string
  moduleKind: SicModuleId
  note?: string | null
  magicLinkUrl?: string
}) {
  const title = getSicModule(opts.moduleKind).title
  const buttonUrl = opts.magicLinkUrl || sicUrl(sicPaths.certificateWorkspace)

  return sicMail({
    to: opts.email,
    subject: `«${title}» — Nachweis bitte nachreichen`,
    html: sicEmailShell({
      preheader: `${title} — Nacharbeit nötig`,
      heading: `«${title}»: bitte nachreichen`,
      bodyHtml: `<p style="margin:0 0 12px;">Die Angabe <strong>${escapeHtml(title)}</strong> konnten wir noch nicht freigeben.</p>
        ${opts.note ? `<p style="margin:0 0 12px;"><strong>Grund:</strong> ${escapeHtml(opts.note)}</p>` : ''}
        <p style="margin:0;">Reich einen passenden Nachweis nach — dein Anspruch darauf bleibt bestehen, es gibt keine Frist und keine zusätzlichen Kosten.</p>`,
      buttonText: 'Nachweis nachreichen',
      buttonUrl,
      footnoteHtml: opts.magicLinkUrl ? MAGIC_LINK_FOOTNOTE : undefined,
    }),
    text: `«${title}» konnte nicht freigegeben werden.${opts.note ? `\nGrund: ${opts.note}` : ''}\n\nNachreichen: ${buttonUrl}`,
  })
}

/** Nach dem ersten Upload: bestätigt, dass die Unterlagen angekommen sind. */
export async function sendSicDocumentsReceivedEmail(opts: {
  email: string
  moduleTitle: string
  magicLinkUrl?: string
}) {
  const buttonUrl = opts.magicLinkUrl || sicUrl(sicPaths.certificateWorkspace)
  return sicMail({
    to: opts.email,
    subject: 'Unterlagen angekommen',
    html: sicEmailShell({
      preheader: 'Wir haben deine Unterlagen erhalten',
      heading: 'Unterlagen angekommen',
      bodyHtml: `<p style="margin:0 0 12px;">Wir haben deinen Nachweis für <strong>${escapeHtml(opts.moduleTitle)}</strong> erhalten und schauen ihn an — ${SIC_REVIEW_SLA}.</p>
        <p style="margin:0;">Du bekommst eine E-Mail, sobald die Angabe auf deinem Zertifikat steht. Bis dahin kannst du weitere Unterlagen nachreichen.</p>`,
      buttonText: 'Zum Zertifikat',
      buttonUrl,
      footnoteHtml: opts.magicLinkUrl ? MAGIC_LINK_FOOTNOTE : undefined,
    }),
    text: `Wir haben deinen Nachweis für «${opts.moduleTitle}» erhalten und prüfen ihn ${SIC_REVIEW_SLA}.\n\n${buttonUrl}`,
  })
}

/** Vorwarnung, bevor die Unterlagen eines unfertigen Zertifikats gelöscht werden. */
export async function sendSicDocsPurgeWarningEmail(opts: {
  email: string
  purgeAt: Date
  magicLinkUrl?: string
}) {
  const buttonUrl = opts.magicLinkUrl || sicUrl(sicPaths.certificateWorkspace)
  const dateStr = sicSwissDate(opts.purgeAt)
  return sicMail({
    to: opts.email,
    subject: `Unterlagen werden am ${dateStr} gelöscht`,
    html: sicEmailShell({
      preheader: `Unterlagen werden am ${dateStr} gelöscht`,
      heading: 'Deine Unterlagen werden gelöscht',
      bodyHtml: `<p style="margin:0 0 12px;">Dein Zertifikat ist seit einer Weile unfertig. Aus Datenschutzgründen löschen wir die hochgeladenen Unterlagen am <strong>${dateStr}</strong>.</p>
        <p style="margin:0 0 12px;">Was du bezahlt hast, bleibt dir: die gekauften Angaben verfallen nicht. Du kannst die Nachweise jederzeit neu hochladen.</p>
        <p style="margin:0;">Wenn du jetzt fertig wirst, bleibt alles wie es ist.</p>`,
      buttonText: 'Jetzt abschliessen',
      buttonUrl,
      footnoteHtml: opts.magicLinkUrl ? MAGIC_LINK_FOOTNOTE : undefined,
    }),
    text: `Deine hochgeladenen Unterlagen werden am ${dateStr} gelöscht. Gekaufte Angaben verfallen nicht.\n\n${buttonUrl}`,
  })
}

function sicDaysLabel(days: number): string {
  return days === 1 ? '1 Tag' : `${days} Tagen`
}

export async function sendSicExpiryReminderEmail(opts: {
  email: string
  daysLeft: number
  expiresAt: Date
  /** Grund ist der Ausweis, nicht der Auszug: neuer Ausweis statt Verlängerung. */
  causedById?: boolean
}) {
  const dateStr = sicSwissDate(opts.expiresAt)
  if (opts.causedById) {
    const idUrl = sicUrl(sicPaths.certificateWorkspace)
    return sicMail({
      to: opts.email,
      subject: `Dein Ausweis läuft in ${sicDaysLabel(opts.daysLeft)} ab`,
      html: sicEmailShell({
        preheader: `Neuen Ausweis einreichen — kostenlos`,
        heading: `Dein Ausweis läuft in ${sicDaysLabel(opts.daysLeft)} ab`,
        bodyHtml: `<p style="margin:0 0 12px;">Dein Zertifikat gilt bis <strong>${dateStr}</strong>, weil dann der geprüfte Ausweis abläuft. Dein Betreibungsauszug trägt länger.</p>
      <p style="margin:0;">Reich den neuen Ausweis ein, sobald du ihn hast — kostenlos, keine Verlängerung nötig. Nach der Prüfung gilt das Zertifikat wieder bis zum Ende des Auszugs.</p>`,
        buttonText: 'Neuen Ausweis einreichen',
        buttonUrl: idUrl,
      }),
      text: `Dein Zertifikat gilt bis ${dateStr}, weil dann dein Ausweis abläuft. Neuen Ausweis kostenlos einreichen: ${idUrl}`,
    })
  }
  const buttonUrl = sicUrl(sicPaths.renew)
  const left = sicDaysLabel(opts.daysLeft)
  const html = sicEmailShell({
    preheader: `Gültig bis ${dateStr}`,
    heading: `Dein Zertifikat gilt noch ${left}`,
    bodyHtml: `<p style="margin:0 0 12px;">Es läuft am <strong>${dateStr}</strong> ab. Bewirbst du dich danach noch, verlängere es rechtzeitig.</p>
      <p style="margin:0;">Dafür brauchst du einen neuen <a href="${SIC_DEBT_EXTRACT_ORDER_URL}" style="color:${NAVY};font-weight:600;">Auszug vom Betreibungsamt</a>, die Verlängerung kostet CHF ${SIC_RENEWAL_FEE_CHF}.–. Der Rest bleibt stehen, ausser er ist veraltet: Lohn und Arbeitsstelle nach zwölf Monaten, ein abgelaufener Ausweis.</p>`,
    buttonText: 'Jetzt verlängern',
    buttonUrl,
  })
  return sicMail({
    to: opts.email,
    subject: `Dein Zertifikat gilt noch ${left}`,
    html,
    text: `Dein Zertifikat läuft am ${dateStr} ab (noch ${left}). Für die Verlängerung (CHF ${SIC_RENEWAL_FEE_CHF}.–) brauchst du einen neuen Auszug vom Betreibungsamt: ${SIC_DEBT_EXTRACT_ORDER_URL}\n\nJetzt verlängern: ${buttonUrl}`,
  })
}

/**
 * Eine Erinnerung pro Zertifikat mit allen fehlenden Nachweisen — nie eine Mail pro Angabe.
 */
export async function sendSicUploadReminderEmail(
  opts: {
    email: string
    moduleKinds: SicModuleId[]
    magicLinkUrl?: string
  } & SicUploadReminderOpts
) {
  if (opts.moduleKinds.length === 0) {
    throw new Error('sendSicUploadReminderEmail: keine Module übergeben')
  }
  const buttonUrl = opts.magicLinkUrl || sicUrl(sicPaths.certificateWorkspace)
  const copy = sicUploadReminderCopy(opts.moduleKinds, opts)
  const itemHtml = (i: SicUploadReminderItem) => {
    const link =
      i.link ?
        `<a href="${i.link.url}" style="color:${NAVY};font-weight:600;">${escapeHtml(i.link.label)}</a>`
      : ''
    return `<li style="margin:0 0 8px;"><strong style="color:${NAVY};">${escapeHtml(i.title)}:</strong> ${escapeHtml(i.before)}${link}${escapeHtml(i.after ?? '')}</li>`
  }
  const itemText = (i: SicUploadReminderItem) =>
    `- ${i.title}: ${i.before}${i.link ? `${i.link.label} (${i.link.url})` : ''}${i.after ?? ''}`
  const bodyHtml = [
    `<p style="margin:0 0 16px;">${escapeHtml(copy.intro)}</p>`,
    ...copy.groups.map(
      g =>
        `<p style="margin:0 0 8px;font-weight:600;color:${NAVY};">${escapeHtml(g.heading)}</p><ul style="margin:0 0 16px;padding-left:20px;">${g.items.map(itemHtml).join('')}</ul>`
    ),
  ].join('')
  const text = [copy.intro, ...copy.groups.map(g => `${g.heading}\n${g.items.map(itemText).join('\n')}`)].join('\n\n')
  return sicMail({
    to: opts.email,
    subject: copy.subject,
    html: sicEmailShell({
      preheader: copy.preheader,
      heading: copy.heading,
      bodyHtml,
      buttonText: copy.buttonText,
      buttonUrl,
    }),
    text: `${copy.heading}\n\n${text}\n\n${buttonUrl}`,
  })
}

export async function sendSicEmailChangeConfirmEmail(email: string, url: string) {
  const copy = sicEmailChangeConfirmCopy()
  const html = sicEmailShell({
    preheader: copy.preheader,
    heading: copy.heading,
    bodyHtml: copy.paragraphs
      .map((p, i) => `<p style="margin:${i === 0 ? '0 0 12px' : '0'};">${p}</p>`)
      .join(''),
    buttonText: copy.buttonText,
    buttonUrl: url,
    footnoteHtml: copy.footnote,
  })
  return sicMail({
    to: email,
    subject: copy.subject,
    html,
    text: `${copy.heading}\n\n${copy.paragraphs.join('\n\n')}\n\n${url}\n\n${copy.footnote}`,
  })
}

export async function sendSicEmailChangeNoticeEmail(oldEmail: string, newEmail: string) {
  const copy = sicEmailChangeNoticeCopy(newEmail)
  const html = sicEmailShell({
    preheader: copy.preheader,
    heading: copy.heading,
    bodyHtml: copy.paragraphs
      .map((p, i) => `<p style="margin:${i === 0 ? '0 0 12px' : '0'};">${escapeHtml(p)}</p>`)
      .join(''),
    footnoteHtml: copy.footnote,
  })
  return sicMail({
    to: oldEmail,
    subject: copy.subject,
    html,
    text: `${copy.heading}\n\n${copy.paragraphs.join('\n\n')}\n\n${copy.footnote}`,
  })
}

function fmtSicDate(d: Date): string {
  return sicSwissDate(d)
}

function fmtSicChf(amount: number): string {
  return `CHF ${amount.toFixed(2)}`
}

const OPERATOR_LINE = `${SIC_OPERATOR.legalName}, ${SIC_OPERATOR.street}, ${SIC_OPERATOR.zip} ${SIC_OPERATOR.city}, UID ${SIC_OPERATOR.uid}`

/** Quittung nach der Zahlung: Betrag, Leistung, Datum, Anbieterin. Der Zugangslink kommt separat. */
export async function sendSicPaymentReceiptEmail(opts: {
  email: string
  amountChf: number
  isRenewal: boolean
  paidAt: Date
  paymentId: string
}) {
  const item = opts.isRenewal ? 'Verlängerung Mieter-Zertifikat' : 'Mieter-Zertifikat, Komplettpaket'
  const dateStr = fmtSicDate(opts.paidAt)
  const amount = fmtSicChf(opts.amountChf)
  return sicMail({
    to: opts.email,
    subject: `Zahlungsbestätigung ${amount}`,
    html: sicEmailShell({
      preheader: `Zahlung über ${amount} erhalten`,
      heading: 'Zahlung erhalten',
      bodyHtml: `<p style="margin:0 0 12px;">Danke, wir haben deine Zahlung erhalten.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;margin:0 0 12px;">
          <tr><td style="padding:4px 0;color:${MUTED};">Leistung</td><td style="padding:4px 0;text-align:right;">${item}</td></tr>
          <tr><td style="padding:4px 0;color:${MUTED};">Datum</td><td style="padding:4px 0;text-align:right;">${dateStr}</td></tr>
          <tr><td style="padding:4px 0;color:${MUTED};">Referenz</td><td style="padding:4px 0;text-align:right;">${escapeHtml(opts.paymentId)}</td></tr>
          <tr><td style="padding:8px 0 0;font-weight:700;border-top:1px solid ${HAIRLINE};">Total</td><td style="padding:8px 0 0;text-align:right;font-weight:700;border-top:1px solid ${HAIRLINE};">${amount}</td></tr>
        </table>
        <p style="margin:0;">Den Link zu deinem Dossier schicken wir dir in einer separaten E-Mail.</p>`,
      footnoteHtml: escapeHtml(OPERATOR_LINE),
    }),
    text: `Zahlung erhalten\n\n${item}\nDatum: ${dateStr}\nReferenz: ${opts.paymentId}\nTotal: ${amount}\n\n${OPERATOR_LINE}`,
  })
}

export async function sendSicExpiredEmail(opts: { email: string; expiredAt: Date; causedById?: boolean }) {
  const dateStr = fmtSicDate(opts.expiredAt)
  if (opts.causedById) {
    const idUrl = sicUrl(sicPaths.certificateWorkspace)
    return sicMail({
      to: opts.email,
      subject: 'Zertifikat abgelaufen — neuer Ausweis genügt',
      html: sicEmailShell({
        preheader: `Abgelaufen am ${dateStr}, weil der Ausweis abgelaufen ist`,
        heading: 'Dein Ausweis ist abgelaufen',
        bodyHtml: `<p style="margin:0 0 12px;">Dein Zertifikat endete am <strong>${dateStr}</strong>, weil der geprüfte Ausweis abgelaufen ist. Dein Betreibungsauszug ist noch aktuell.</p>
        <p style="margin:0;">Reich den neuen Ausweis ein — kostenlos. Nach der Prüfung gilt das Zertifikat wieder.</p>`,
        buttonText: 'Neuen Ausweis einreichen',
        buttonUrl: idUrl,
      }),
      text: `Dein Zertifikat ist am ${dateStr} abgelaufen, weil dein Ausweis abgelaufen ist. Neuen Ausweis kostenlos einreichen: ${idUrl}`,
    })
  }
  const buttonUrl = sicUrl(sicPaths.renew)
  return sicMail({
    to: opts.email,
    subject: 'Zertifikat abgelaufen',
    html: sicEmailShell({
      preheader: `Abgelaufen am ${dateStr}`,
      heading: 'Dein Zertifikat ist abgelaufen',
      bodyHtml: `<p style="margin:0 0 12px;">Die Gültigkeit deines Zertifikats endete am <strong>${dateStr}</strong>. Vermieter sehen auf der Prüfseite jetzt «abgelaufen».</p>
        <p style="margin:0;">Mit einem frischen Auszug vom Betreibungsamt verlängerst du für CHF ${SIC_RENEWAL_FEE_CHF}.–. Die übrigen geprüften Angaben bleiben, soweit sie nicht veraltet sind.</p>`,
      buttonText: 'Verlängern',
      buttonUrl,
    }),
    text: `Dein Zertifikat ist am ${dateStr} abgelaufen. Verlängern: ${buttonUrl}`,
  })
}

export async function sendSicRefundEmail(opts: {
  email: string
  amountChf: number | null
  moduleKinds?: SicModuleId[]
}) {
  const what =
    opts.moduleKinds && opts.moduleKinds.length > 0 ?
      `für «${opts.moduleKinds.map(id => getSicModule(id).title).join('», «')}»`
    : 'deiner Zahlung'
  const amount = opts.amountChf != null ? ` über <strong>${fmtSicChf(opts.amountChf)}</strong>` : ''
  const amountText = opts.amountChf != null ? ` über ${fmtSicChf(opts.amountChf)}` : ''
  return sicMail({
    to: opts.email,
    subject: 'Rückerstattung veranlasst',
    html: sicEmailShell({
      preheader: 'Rückerstattung veranlasst',
      heading: 'Rückerstattung veranlasst',
      bodyHtml: `<p style="margin:0 0 12px;">Wir haben eine Rückerstattung ${what}${amount} veranlasst.</p>
        <p style="margin:0;">Je nach Zahlungsmittel erscheint der Betrag innert 5 bis 10 Arbeitstagen wieder auf deinem Konto.</p>`,
      footnoteHtml: escapeHtml(OPERATOR_LINE),
    }),
    text: `Wir haben eine Rückerstattung ${what.replace(/[«»]/g, '"')}${amountText} veranlasst. Gutschrift je nach Zahlungsmittel innert 5 bis 10 Arbeitstagen.`,
  })
}

/**
 * Widerruf. Nach einer vollen Rückerstattung kann man unter derselben Adresse neu
 * anlegen. Bei einem Widerruf wegen Missbrauchs (AGB §8) gibt es diesen Weg nicht.
 */
export async function sendSicRevokedEmail(opts: { email: string; certificateCode: string; afterRefund?: boolean }) {
  const next =
    opts.afterRefund ?
      'Nach der vollständigen Rückerstattung ist das Zertifikat nicht mehr gültig. Ein neues kannst du jederzeit unter derselben E-Mail-Adresse anlegen.'
    : `Bei Fragen dazu erreichst du uns unter ${SIC_SUPPORT_EMAIL}.`
  const buttonUrl = sicUrl(sicPaths.certificateWorkspace)
  return sicMail({
    to: opts.email,
    subject: 'Zertifikat widerrufen',
    html: sicEmailShell({
      preheader: 'Dein Zertifikat wurde widerrufen',
      heading: 'Zertifikat widerrufen',
      bodyHtml: `<p style="margin:0 0 12px;">Dein Zertifikat <strong>${escapeHtml(opts.certificateCode)}</strong> wurde widerrufen. Vermieter sehen auf der Prüfseite jetzt «widerrufen», das PDF ist nicht mehr abrufbar.</p>
        <p style="margin:0;">${escapeHtml(next)}</p>`,
      ...(opts.afterRefund ? { buttonText: 'Neues Zertifikat anlegen', buttonUrl } : {}),
    }),
    text: `Dein Zertifikat ${opts.certificateCode} wurde widerrufen. ${next}${opts.afterRefund ? `\n\n${buttonUrl}` : ''}`,
  })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
