import { sendEmail } from '@/lib/email/sender'
import { getFromEmail } from '@/lib/email/config'
import { SIC_BRAND_NAME, sicPaths, sicUrl } from '@/lib/sic/config'
import { getSicModule, type SicModuleId } from '@/lib/sic/modules'

const ACCENT = '#0f2b5e'
const INK = '#0f172a'
const MUTED = '#64748b'

function sicFromAddress(): string {
  return process.env.SIC_FROM_EMAIL || getFromEmail()
}

/** Minimalistisches, seriöses Template für Swiss Immo Cert (kein Marketplace-Branding). */
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
         <a href="${buttonUrl}" style="display:inline-block;background:${ACCENT};color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;padding:14px 30px;border-radius:10px;">${buttonText}</a>
       </td></tr>`
    : ''

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${INK};">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
        <tr><td style="padding:32px 40px 8px;">
          <div style="font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:${ACCENT};font-weight:700;">${SIC_BRAND_NAME}</div>
        </td></tr>
        <tr><td style="padding:8px 40px 0;">
          <h1 style="margin:0;font-size:22px;font-weight:700;color:${INK};">${heading}</h1>
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
        <tr><td style="padding:20px 40px;border-top:1px solid #e2e8f0;font-size:12px;line-height:1.6;color:#94a3b8;">
          Diese Nachricht wurde automatisch von ${SIC_BRAND_NAME} versendet. Fragen? Antworte einfach auf diese E-Mail.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendSicMagicLinkEmail(email: string, url: string) {
  const html = sicEmailShell({
    preheader: 'Dein Anmeldelink für Swiss Immo Cert',
    heading: 'Anmeldung bei Swiss Immo Cert',
    bodyHtml: `<p style="margin:0 0 12px;">Klicke auf den Button, um dich sicher und ohne Passwort anzumelden. Der Link ist 30 Minuten gültig und nur einmal verwendbar.</p>`,
    buttonText: 'Jetzt anmelden',
    buttonUrl: url,
    footnoteHtml:
      'Falls du diese Anmeldung nicht angefordert hast, kannst du diese E-Mail ignorieren. Es wird kein Zugriff gewährt, solange der Link nicht geöffnet wird.',
  })

  return sendEmail({
    to: email,
    from: sicFromAddress(),
    subject: 'Dein Anmeldelink für Swiss Immo Cert',
    html,
    text: `Anmeldung bei ${SIC_BRAND_NAME}\n\nMit diesem Link anmelden (30 Minuten gültig, einmalig):\n${url}`,
  })
}

export async function sendSicModuleReviewEmail(opts: {
  email: string
  moduleKind: SicModuleId
  action: 'approve' | 'reject'
  note?: string | null
  /** Frischer Magic-Link (bevorzugt gegenüber nackter Workspace-URL). */
  magicLinkUrl?: string
}) {
  const title = getSicModule(opts.moduleKind).title
  const buttonUrl = opts.magicLinkUrl || sicUrl(sicPaths.certificateWorkspace)
  const approved = opts.action === 'approve'

  const html = sicEmailShell({
    preheader: approved ? `Modul ${title} freigegeben` : `Modul ${title} — Nacharbeit nötig`,
    heading: approved ? `Modul «${title}» freigegeben` : `Modul «${title}» abgelehnt`,
    bodyHtml: approved ?
      `<p style="margin:0 0 12px;">Gute Nachricht: Das Modul <strong>${title}</strong> wurde geprüft und freigegeben. Es erscheint jetzt auf deinem Zertifikat.</p>
       <p style="margin:0;">Melde dich mit dem Button an, um dein Zertifikat zu öffnen.</p>`
    : `<p style="margin:0 0 12px;">Leider konnten wir das Modul <strong>${title}</strong> noch nicht freigeben.</p>
       ${opts.note ? `<p style="margin:0 0 12px;"><strong>Grund:</strong> ${escapeHtml(opts.note)}</p>` : ''}
       <p style="margin:0;">Bitte melde dich an und reich einen gültigen Nachweis nach.</p>`,
    buttonText: 'Zum Zertifikat anmelden',
    buttonUrl,
    footnoteHtml: opts.magicLinkUrl
      ? 'Der Anmeldelink ist 30 Minuten gültig und nur einmal verwendbar. Danach kannst du unter «Mein Zertifikat» einen neuen anfordern.'
      : undefined,
  })

  return sendEmail({
    to: opts.email,
    from: sicFromAddress(),
    subject: approved ?
      `${SIC_BRAND_NAME}: Modul «${title}» freigegeben`
    : `${SIC_BRAND_NAME}: Modul «${title}» — Nacharbeit nötig`,
    html,
    text: approved ?
      `Modul «${title}» wurde freigegeben.\n\nAnmelden: ${buttonUrl}`
    : `Modul «${title}» wurde abgelehnt.${opts.note ? `\nGrund: ${opts.note}` : ''}\n\nAnmelden: ${buttonUrl}`,
  })
}

export async function sendSicExpiryReminderEmail(opts: {
  email: string
  daysLeft: number
  expiresAt: Date
  magicLinkUrl?: string
}) {
  const dateStr = opts.expiresAt.toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const buttonUrl = opts.magicLinkUrl || sicUrl(sicPaths.certificateWorkspace)
  const html = sicEmailShell({
    preheader: `Dein Zertifikat läuft in ${opts.daysLeft} Tagen ab`,
    heading: `Gültigkeit endet in ${opts.daysLeft} Tagen`,
    bodyHtml: `<p style="margin:0 0 12px;">Dein Swiss-Immo-Cert-Zertifikat läuft am <strong>${dateStr}</strong> ab.</p>
      <p style="margin:0;">Verlängere rechtzeitig, damit Vermieter weiterhin ein gültiges Zertifikat sehen.</p>`,
    buttonText: 'Zum Zertifikat',
    buttonUrl,
  })
  return sendEmail({
    to: opts.email,
    from: sicFromAddress(),
    subject: `${SIC_BRAND_NAME}: Zertifikat läuft in ${opts.daysLeft} Tagen ab`,
    html,
    text: `Dein Zertifikat läuft am ${dateStr} ab (${opts.daysLeft} Tage).\n\n${buttonUrl}`,
  })
}

export async function sendSicUploadReminderEmail(opts: {
  email: string
  moduleTitle: string
  magicLinkUrl?: string
}) {
  const buttonUrl = opts.magicLinkUrl || sicUrl(sicPaths.certificateWorkspace)
  const html = sicEmailShell({
    preheader: `Nachweise fehlen für «${opts.moduleTitle}»`,
    heading: 'Nachweise noch ausstehend',
    bodyHtml: `<p style="margin:0 0 12px;">Für das Modul <strong>${escapeHtml(opts.moduleTitle)}</strong> fehlen noch Nachweise.</p>
      <p style="margin:0;">Lade die Belege hoch, damit wir prüfen und freigeben können.</p>`,
    buttonText: 'Nachweise hochladen',
    buttonUrl,
  })
  return sendEmail({
    to: opts.email,
    from: sicFromAddress(),
    subject: `${SIC_BRAND_NAME}: Nachweise fehlen — «${opts.moduleTitle}»`,
    html,
    text: `Für «${opts.moduleTitle}» fehlen noch Nachweise.\n\n${buttonUrl}`,
  })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
