import { sendEmail } from '@/lib/email/sender'
import { SIC_COLORS } from '@/lib/sic/brand'
import { SIC_BRAND_NAME, SIC_REVIEW_SLA, SIC_SUPPORT_EMAIL, sicFromAddress, sicPaths, sicUrl } from '@/lib/sic/config'
import {
  sicCertificateReadyCopy,
  sicMagicLinkEmailCopy,
  sicUploadReminderCopy,
  type SicMagicLinkMailSource,
} from '@/lib/sic/email-copy'
import { getSicModule, type SicModuleId } from '@/lib/sic/modules'

const ACTION = SIC_COLORS.action
const NAVY = SIC_COLORS.navy
const PAPER = SIC_COLORS.paper
const HAIRLINE = SIC_COLORS.hairline
const INK = '#0f172a'
const MUTED = '#64748b'

function sicMail(opts: { to: string; subject: string; html: string; text: string }) {
  return sendEmail({
    ...opts,
    from: sicFromAddress(),
    replyTo: SIC_SUPPORT_EMAIL,
  })
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
        <tr><td style="padding:20px 40px;border-top:1px solid ${HAIRLINE};font-size:12px;line-height:1.6;color:#94a3b8;">
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
    buttonText: 'Jetzt anmelden',
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
  'Der Anmeldelink ist 30 Minuten gültig und nur einmal verwendbar. Danach kannst du unter «Mein Zertifikat» einen neuen anfordern.'

/**
 * Freigabe: das Zertifikat ist ab der ersten geprüften Angabe abrufbar —
 * genau der Moment, in dem jemand das Dokument zum ersten Mal weiterschickt.
 */
export async function sendSicCertificateReadyEmail(opts: {
  email: string
  moduleKind: SicModuleId
  certificateCode: string
  verifiedCount: number
  expiresAt: Date
  firstVerification: boolean
  /** Ohne Namen auf dem Zertifikat gibt es noch kein PDF. */
  pdfReady: boolean
  magicLinkUrl?: string
}) {
  const buttonUrl = opts.magicLinkUrl || sicUrl(sicPaths.certificateWorkspace)
  const validUntil = opts.expiresAt.toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const copy = sicCertificateReadyCopy({
    moduleKind: opts.moduleKind,
    verifiedCount: opts.verifiedCount,
    firstVerification: opts.firstVerification,
    pdfReady: opts.pdfReady,
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
    subject: `${SIC_BRAND_NAME}: ${copy.subject}`,
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
    subject: `${SIC_BRAND_NAME}: «${title}» — Nachweis bitte nachreichen`,
    html: sicEmailShell({
      preheader: `${title} — Nacharbeit nötig`,
      heading: `«${title}»: bitte nachreichen`,
      bodyHtml: `<p style="margin:0 0 12px;">Für die Angabe <strong>${escapeHtml(title)}</strong> konnten wir noch nicht freigeben.</p>
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
    subject: `${SIC_BRAND_NAME}: Unterlagen angekommen`,
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
  const dateStr = opts.purgeAt.toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return sicMail({
    to: opts.email,
    subject: `${SIC_BRAND_NAME}: Unterlagen werden am ${dateStr} gelöscht`,
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

export async function sendSicExpiryReminderEmail(opts: {
  email: string
  daysLeft: number
  expiresAt: Date
}) {
  const dateStr = opts.expiresAt.toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const buttonUrl = sicUrl(sicPaths.renew)
  const html = sicEmailShell({
    preheader: `Dein Zertifikat läuft in ${opts.daysLeft} Tagen ab`,
    heading: `Gültigkeit endet in ${opts.daysLeft} Tagen`,
    bodyHtml: `<p style="margin:0 0 12px;">Dein ${SIC_BRAND_NAME}-Zertifikat läuft am <strong>${dateStr}</strong> ab.</p>
      <p style="margin:0 0 12px;">Für die Verlängerung brauchst du einen frischen Auszug vom Betreibungsamt — dessen Alter ist der Grund für die Gültigkeitsdauer. Alles andere bleibt stehen.</p>
      <p style="margin:0;">Bist du angemeldet, geht es mit einem Klick zur Zahlung. Sonst zuerst der Anmeldelink auf der Seite — danach dieselbe Verlängerung.</p>`,
    buttonText: 'Jetzt verlängern',
    buttonUrl,
  })
  return sicMail({
    to: opts.email,
    subject: `${SIC_BRAND_NAME}: Zertifikat läuft in ${opts.daysLeft} Tagen ab`,
    html,
    text: `Dein Zertifikat läuft am ${dateStr} ab (${opts.daysLeft} Tage).\n\nJetzt verlängern: ${buttonUrl}`,
  })
}

export async function sendSicUploadReminderEmail(opts: {
  email: string
  moduleKind: SicModuleId
  magicLinkUrl?: string
}) {
  const buttonUrl = opts.magicLinkUrl || sicUrl(sicPaths.certificateWorkspace)
  const copy = sicUploadReminderCopy(opts.moduleKind)
  const title = getSicModule(opts.moduleKind).title
  const bodyHtml = copy.paragraphs
    .map((p, i) =>
      i === copy.paragraphs.length - 1
        ? `<p style="margin:0;">${escapeHtml(p)}</p>`
        : `<p style="margin:0 0 12px;">${escapeHtml(p)}</p>`
    )
    .join('')
  return sicMail({
    to: opts.email,
    subject: `${SIC_BRAND_NAME}: Noch offen — «${title}»`,
    html: sicEmailShell({
      preheader: copy.preheader,
      heading: copy.heading,
      bodyHtml,
      buttonText: 'Nachweise hochladen',
      buttonUrl,
    }),
    text: `${copy.paragraphs.join('\n\n')}\n\n${buttonUrl}`,
  })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
