/**
 * Email Sender
 *
 * Zentrale Funktion zum Versenden von E-Mails via Resend oder SMTP Fallback
 */

import { getFromEmail, resend, transporter } from './config'

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  method?: 'resend' | 'smtp'
  error?: string
  statusCode?: number
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailOptions): Promise<SendEmailResult> {
  console.log('\n📧 ===== E-MAIL-VERSAND START =====')
  console.log(`[sendEmail] Empfänger: ${to}`)
  console.log(`[sendEmail] Betreff: ${subject}`)
  console.log(`[sendEmail] Resend Client vorhanden: ${resend ? '✅ Ja' : '❌ Nein'}`)

  // Priorität 1: Resend (professionell, skalierbar)
  if (resend) {
    try {
      const fromEmail = getFromEmail()

      console.log(`[sendEmail] Versende E-Mail via Resend:`)
      console.log(`  From: ${fromEmail}`)
      console.log(`  To: ${to}`)

      const result = await resend.emails.send({
        from: fromEmail,
        to: [to],
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
        headers: {
          'X-Priority': '3',
          'X-MSMail-Priority': 'Normal',
        },
      })

      if (result.error) {
        console.error('❌ Resend Fehler:', result.error)
        return {
          success: false,
          error: result.error.message || `Resend Fehler: ${result.error.statusCode || 'Unknown'}`,
          method: 'resend',
          statusCode: result.error.statusCode ?? undefined,
        }
      }

      console.log('✅ E-Mail via Resend erfolgreich versendet!')
      console.log(`   Message ID: ${result.data?.id}`)
      console.log('📧 ===== E-MAIL-VERSAND ERFOLGREICH =====\n')
      return { success: true, messageId: result.data?.id, method: 'resend' }
    } catch (error) {
      console.error('❌ Resend Exception:', error)
    }
  }

  // Priorität 2: SMTP Fallback
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      console.log('[sendEmail] Versuche SMTP Fallback...')
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
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
