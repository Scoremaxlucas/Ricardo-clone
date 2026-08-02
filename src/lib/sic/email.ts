import { sendEmail } from '@/lib/email/sender'
import { getFromEmail } from '@/lib/email/config'
import { SIC_BRAND_NAME } from '@/lib/sic/config'

const ACCENT = '#0f766e'
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
          Diese Nachricht wurde automatisch von ${SIC_BRAND_NAME} versendet. Fragen? Antworten Sie einfach auf diese E-Mail.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendSicMagicLinkEmail(email: string, url: string) {
  const html = sicEmailShell({
    preheader: 'Ihr Anmeldelink für Swiss Immo Cert',
    heading: 'Anmeldung bei Swiss Immo Cert',
    bodyHtml: `<p style="margin:0 0 12px;">Klicken Sie auf den Button, um sich sicher und ohne Passwort anzumelden. Der Link ist 30 Minuten gültig und nur einmal verwendbar.</p>`,
    buttonText: 'Jetzt anmelden',
    buttonUrl: url,
    footnoteHtml:
      'Falls Sie diese Anmeldung nicht angefordert haben, können Sie diese E-Mail ignorieren. Es wird kein Zugriff gewährt, solange der Link nicht geöffnet wird.',
  })

  return sendEmail({
    to: email,
    from: sicFromAddress(),
    subject: 'Ihr Anmeldelink für Swiss Immo Cert',
    html,
    text: `Anmeldung bei ${SIC_BRAND_NAME}\n\nMit diesem Link anmelden (30 Minuten gültig, einmalig):\n${url}`,
  })
}
