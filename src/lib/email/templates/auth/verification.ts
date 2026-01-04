/**
 * Auth Email Templates - Verification
 */

import { getEmailBaseUrl } from '../../config'
import { getHelvendaEmailTemplate } from '../../base-template'

/**
 * E-Mail für E-Mail-Verifizierung (neuer Benutzer)
 */
export function getEmailVerificationEmail(userName: string, verificationUrl: string) {
  const subject = 'Bestätigen Sie Ihre E-Mail-Adresse'

  const html = getHelvendaEmailTemplate({
    title: 'E-Mail bestätigen',
    greeting: `Hallo ${userName || 'Willkommen'},`,
    content: `
      <p>Vielen Dank für Ihre Registrierung bei Helvenda!</p>
      <p style="margin-top: 16px;">Um Ihre Registrierung abzuschließen und alle Funktionen nutzen zu können, bestätigen Sie bitte Ihre E-Mail-Adresse.</p>
      <p style="margin-top: 16px; font-size: 14px; color: #9ca3af;">Der Link ist 24 Stunden gültig.</p>
    `,
    buttonText: 'E-Mail bestätigen',
    buttonUrl: verificationUrl,
  })

  return { subject, html }
}

/**
 * E-Mail nach erfolgreicher Verifizierung
 */
export function getVerificationApprovalEmail(userName: string, userEmail: string) {
  const baseUrl = getEmailBaseUrl()
  const subject = 'Willkommen bei Helvenda - Konto aktiviert!'

  const html = getHelvendaEmailTemplate({
    title: 'Konto aktiviert! 🎉',
    greeting: `Hallo ${userName || 'Willkommen'},`,
    content: `
      <p>Herzlichen Glückwunsch! Ihr Konto wurde erfolgreich aktiviert.</p>
      <p style="margin-top: 16px;">Sie können jetzt:</p>
      <ul style="text-align: left; margin-top: 12px; padding-left: 20px;">
        <li>Artikel zum Verkauf anbieten</li>
        <li>Artikel kaufen und auf Auktionen bieten</li>
        <li>Nachrichten mit anderen Nutzern austauschen</li>
        <li>Ihre Favoriten speichern</li>
      </ul>
    `,
    buttonText: 'Jetzt starten',
    buttonUrl: baseUrl,
  })

  return { subject, html }
}
