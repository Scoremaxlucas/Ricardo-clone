/**
 * Email Sender
 *
 * Zentrale Funktion zum Versenden von E-Mails via Resend oder SMTP Fallback
 */

import { injectUnsubscribeLink } from './base-template'
import { getFromEmail, resend, transporter } from './config'
import { sanitizeEmailHtmlLinks, sanitizeEmailTextLinks } from './url-safety'

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  /** If provided, an unsubscribe link is automatically added to the email footer */
  userId?: string
  /** Override the default From address (e.g. 'Helvenda <noreply@helvenda.ch>') */
  from?: string
  /** Optional BCC (Resend/SMTP) */
  bcc?: string | string[]
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  method?: 'resend' | 'smtp'
  error?: string
  statusCode?: number
}

function normalizeBcc(bcc: string | string[] | undefined): string[] | undefined {
  if (bcc === undefined) return undefined
  const list = Array.isArray(bcc) ? bcc : [bcc]
  const cleaned = list.map(s => s.trim()).filter(Boolean)
  return cleaned.length ? cleaned : undefined
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  userId,
  from,
  bcc,
}: SendEmailOptions): Promise<SendEmailResult> {
  // Auto-inject unsubscribe link if userId is provided
  if (userId) {
    try {
      html = injectUnsubscribeLink(html, userId)
    } catch {
      // Silently fail — don't break email sending
    }
  }

  // Final safeguard: sanitize all outbound links in the email HTML.
  html = sanitizeEmailHtmlLinks(html)
  if (text) {
    text = sanitizeEmailTextLinks(text)
  }

  console.log('\n📧 ===== E-MAIL-VERSAND START =====')
  console.log(`[sendEmail] Empfänger: ${to}`)
  console.log(`[sendEmail] Betreff: ${subject}`)
  console.log(`[sendEmail] Resend Client vorhanden: ${resend ? '✅ Ja' : '❌ Nein'}`)

  // Priorität 1: Resend (professionell, skalierbar)
  if (resend) {
    try {
      const fromEmail = from || getFromEmail()

      console.log(`[sendEmail] Versende E-Mail via Resend:`)
      console.log(`  From: ${fromEmail}`)
      console.log(`  To: ${to}`)

      const bccList = normalizeBcc(bcc)
      const replyTo = process.env.RESEND_REPLY_TO || 'support@helvenda.ch'
      const result = await resend.emails.send({
        from: fromEmail,
        to: [to],
        replyTo: [replyTo],
        ...(bccList?.length ? { bcc: bccList } : {}),
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
        headers: {
          'X-Priority': '3',
          'X-MSMail-Priority': 'Normal',
        },
      })

      if (result.error) {
        console.error('❌ Resend Fehler (SMTP-Fallback wird versucht):', result.error)
        // Nicht returnen — oft Domain/Absender nur bei Resend falsch, SMTP liefert trotzdem.
      } else {
        console.log('✅ E-Mail via Resend erfolgreich versendet!')
        console.log(`   Message ID: ${result.data?.id}`)
        console.log('📧 ===== E-MAIL-VERSAND ERFOLGREICH =====\n')
        return { success: true, messageId: result.data?.id, method: 'resend' }
      }
    } catch (error) {
      console.error('❌ Resend Exception:', error)
    }
  }

  // Priorität 2: SMTP Fallback
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      console.log('[sendEmail] Versuche SMTP Fallback...')
      const bccList = normalizeBcc(bcc)
      const smtpFrom = from || process.env.SMTP_FROM || process.env.SMTP_USER
      const replyTo = process.env.RESEND_REPLY_TO || 'support@helvenda.ch'
      const info = await transporter.sendMail({
        from: smtpFrom.includes('<') ? smtpFrom : `Helvenda <${smtpFrom}>`,
        replyTo,
        to,
        ...(bccList?.length ? { bcc: bccList } : {}),
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
      })

      console.log('✅ E-Mail via SMTP erfolgreich versendet!')
      console.log(`   Message ID: ${info.messageId}`)
      return { success: true, messageId: info.messageId, method: 'smtp' }
    } catch (error) {
      console.error('❌ SMTP Fehler:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SMTP Fehler',
        method: 'smtp',
      }
    }
  }

  console.error('❌ Kein E-Mail-Service konfiguriert')
  return {
    success: false,
    error: 'Kein E-Mail-Service konfiguriert (weder Resend noch SMTP)',
  }
}
