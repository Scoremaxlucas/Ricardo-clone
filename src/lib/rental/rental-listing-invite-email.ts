import { multilingualTransactionalNoticeHtml, multilingualTransactionalNoticePlaintext } from '@/lib/email/transactional-multilingual-notice'
import { sendEmail } from '@/lib/email/sender'
import { WOHNEN_SITE_ORIGIN } from '@/lib/site-urls'

export async function sendRentalListingInviteEmail(params: { to: string; token: string }): Promise<{ ok: boolean; error?: string }> {
  const link = `${WOHNEN_SITE_ORIGIN}/einladung-inserat/${encodeURIComponent(params.token)}`
  const subject = 'Helvenda Wohnungen — Inserat-Link einreichen'
  const html = `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8" /></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#1e293b;">
  <p>Guten Tag</p>
  <p>du wurdest eingeladen, einen <strong>Link zum Mietinserat</strong> bei Helvenda Wohnungen einzureichen.
  Wir übernehmen die Daten automatisch — falls etwas fehlt, kümmert sich unser Team.</p>
  <p style="margin:24px 0;">
    <a href="${link}" style="display:inline-block;background:#18a87c;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700;">
      Link jetzt eintragen
    </a>
  </p>
  <p style="font-size:14px;color:#64748b;">Oder diese Adresse im Browser öffnen:<br/><span style="word-break:break-all;">${link}</span></p>
  <p style="font-size:13px;color:#94a3b8;">Der Link ist persönlich und zeitlich begrenzt. Bitte nicht weitergeben.</p>
  <p style="margin-top:28px;font-size:13px;color:#64748b;">Freundliche Grüsse<br/>Helvenda Wohnungen</p>
  ${multilingualTransactionalNoticeHtml('wohnungen', 'light')}
</body>
</html>`
  const text = `Guten Tag\n\ndu wurdest eingeladen, einen Link zum Mietinserat einzureichen:\n${link}\n\nFreundliche Grüsse\nHelvenda Wohnungen${multilingualTransactionalNoticePlaintext('wohnungen')}`

  const res = await sendEmail({ to: params.to, subject, html, text })
  if (!res.success) return { ok: false, error: res.error || 'E-Mail-Versand fehlgeschlagen' }
  return { ok: true }
}
