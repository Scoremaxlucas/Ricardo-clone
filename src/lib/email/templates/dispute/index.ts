/**
 * Dispute Email Templates
 */

import { getEmailBaseUrl } from '../../config'
import { getHelvendaEmailTemplate } from '../../base-template'

/**
 * Streitfall eröffnet
 */
export function getDisputeOpenedEmail(
  recipientName: string,
  openerName: string,
  watchTitle: string,
  reason: string,
  description: string,
  role: 'buyer' | 'seller',
  sellerResponseDeadline?: Date,
  purchaseId?: string
) {
  const baseUrl = getEmailBaseUrl()
  const disputeUrl = role === 'buyer' 
    ? `${baseUrl}/my-watches/buying/purchased${purchaseId ? `?purchase=${purchaseId}` : ''}`
    : `${baseUrl}/my-watches/selling/sold${purchaseId ? `?purchase=${purchaseId}` : ''}`
  const subject = `Streitfall eröffnet - ${watchTitle}`

  const deadlineText = sellerResponseDeadline && role === 'seller'
    ? `<p style="margin-top: 16px; font-weight: 600; color: #dc2626;">⏰ WICHTIG: Sie haben bis zum ${sellerResponseDeadline.toLocaleDateString('de-CH')} Zeit, Stellung zu nehmen. Ohne Ihre Stellungnahme wird der Fall automatisch eskaliert.</p>`
    : ''

  const html = getHelvendaEmailTemplate({
    title: 'Streitfall eröffnet',
    greeting: `Hallo ${recipientName},`,
    content: `
      <p>${openerName} hat einen Streitfall eröffnet.</p>
      <div style="background-color: #fef2f2; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444;">
        <p style="margin: 0;"><strong>Artikel:</strong> ${watchTitle}</p>
        <p style="margin: 8px 0 0 0;"><strong>${role === 'buyer' ? 'Verkäufer' : 'Käufer'}:</strong> ${openerName}</p>
        <p style="margin: 8px 0 0 0;"><strong>Grund:</strong> ${reason}</p>
        ${description ? `<p style="margin: 12px 0 0 0;"><strong>Beschreibung:</strong> ${description}</p>` : ''}
      </div>
      ${deadlineText}
      <p>Bitte warten Sie auf die Bearbeitung durch unser Support-Team.</p>
    `,
    buttonText: 'Streitfall ansehen',
    buttonUrl: disputeUrl,
  })

  return { subject, html }
}

/**
 * Streitfall eskaliert
 */
export function getDisputeEscalatedEmail(
  userName: string,
  watchTitle: string,
  purchaseId: string,
  role: 'buyer' | 'seller'
) {
  const baseUrl = getEmailBaseUrl()
  const url = role === 'buyer' ? `${baseUrl}/my-watches/buying/purchased` : `${baseUrl}/my-watches/selling/sold`
  const subject = `Streitfall eskaliert - ${watchTitle}`

  const html = getHelvendaEmailTemplate({
    title: 'Streitfall eskaliert',
    greeting: `Hallo ${userName},`,
    content: `
      <p>Der Streitfall wurde an unser Support-Team eskaliert.</p>
      <div style="background-color: #fff7ed; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f97316;">
        <p style="margin: 0;"><strong>Artikel:</strong> ${watchTitle}</p>
        <p style="margin: 8px 0 0 0;"><strong>Fall-Nr.:</strong> ${purchaseId}</p>
      </div>
      <p>Unser Team wird sich innerhalb von 2-3 Werktagen bei Ihnen melden.</p>
    `,
    buttonText: 'Status prüfen',
    buttonUrl: url,
  })

  return { subject, html }
}

/**
 * Streitfall gelöst
 */
export function getDisputeResolvedEmail(
  userName: string,
  otherPartyName: string,
  watchTitle: string,
  resolution: string,
  role: 'buyer' | 'seller',
  outcome: 'initiator' | 'loser',
  canRelist?: boolean
) {
  const baseUrl = getEmailBaseUrl()
  const url = role === 'buyer' ? `${baseUrl}/my-watches/buying/purchased` : `${baseUrl}/my-watches/selling/sold`
  const subject = `Streitfall gelöst - ${watchTitle}`

  const outcomeColor = outcome === 'initiator' ? '#10b981' : '#f59e0b'
  const outcomeBg = outcome === 'initiator' ? '#ecfdf5' : '#fff7ed'
  const outcomeTitle = outcome === 'initiator' ? '✅ Streitfall erfolgreich gelöst' : '⚠️ Streitfall gelöst'

  const relistInfo = canRelist
    ? `<p style="margin-top: 16px; font-weight: 600; color: #10b981;">📦 Der Artikel steht wieder als aktiver Artikel zum Verkauf.</p>`
    : ''

  const html = getHelvendaEmailTemplate({
    title: outcomeTitle,
    greeting: `Hallo ${userName},`,
    content: `
      <p>Der Streitfall wurde gelöst.</p>
      <div style="background-color: ${outcomeBg}; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid ${outcomeColor};">
        <p style="margin: 0;"><strong>Artikel:</strong> ${watchTitle}</p>
        <p style="margin: 8px 0 0 0;"><strong>${role === 'buyer' ? 'Verkäufer' : 'Käufer'}:</strong> ${otherPartyName}</p>
        <p style="margin: 8px 0 0 0;"><strong>Entscheidung:</strong> ${resolution}</p>
      </div>
      ${relistInfo}
    `,
    buttonText: 'Details ansehen',
    buttonUrl: url,
  })

  return { subject, html }
}

/**
 * Rückerstattung erforderlich
 */
export function getRefundRequiredEmail(
  sellerName: string,
  buyerName: string,
  watchTitle: string,
  refundAmount: number,
  refundDeadline: Date,
  purchaseId?: string,
  refundNote?: string
) {
  const baseUrl = getEmailBaseUrl()
  const disputeUrl = purchaseId
    ? `${baseUrl}/disputes/${purchaseId}`
    : `${baseUrl}/my-watches/selling/sold`
  const subject = `Rückerstattung erforderlich - ${watchTitle}`

  const deadlineFormatted = refundDeadline.toLocaleDateString('de-CH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const html = getHelvendaEmailTemplate({
    title: 'Rückerstattung erforderlich',
    greeting: `Hallo ${sellerName},`,
    content: `
      <p>Sie müssen eine Rückerstattung durchführen.</p>
      <div style="background-color: #fef2f2; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444;">
        <p style="margin: 0;"><strong>Artikel:</strong> ${watchTitle}</p>
        <p style="margin: 8px 0 0 0;"><strong>Käufer:</strong> ${buyerName}</p>
        <p style="margin: 8px 0 0 0;"><strong>Betrag:</strong> CHF ${refundAmount.toFixed(2)}</p>
        <p style="margin: 8px 0 0 0;"><strong>Frist:</strong> ${deadlineFormatted}</p>
        ${refundNote ? `<p style="margin: 8px 0 0 0;"><strong>Hinweis:</strong> ${refundNote}</p>` : ''}
      </div>
      <p style="font-weight: 600; color: #dc2626;">Bitte führen Sie die Rückerstattung innerhalb der Frist durch.</p>
    `,
    buttonText: 'Zum Dispute',
    buttonUrl: disputeUrl,
  })

  return { subject, html }
}

/**
 * Verkäufer-Warnung (bei mehreren Beschwerden)
 */
export function getSellerWarningEmail(
  sellerName: string,
  warningCount: number,
  reason: string,
  watchTitle?: string,
  purchaseId?: string
) {
  const baseUrl = getEmailBaseUrl()
  const salesUrl = purchaseId
    ? `${baseUrl}/my-watches/selling/sold?purchase=${purchaseId}`
    : `${baseUrl}/my-watches/selling/sold`
  const subject = `Wichtige Warnung zu Ihrem Konto`

  const watchInfo = watchTitle
    ? `<p style="margin: 8px 0 0 0;"><strong>Betroffener Artikel:</strong> ${watchTitle}</p>`
    : ''

  const html = getHelvendaEmailTemplate({
    title: `Warnung (${warningCount}/3)`,
    greeting: `Hallo ${sellerName},`,
    content: `
      <p>Sie haben eine Warnung für Ihr Verkäuferkonto erhalten.</p>
      <div style="background-color: #fef2f2; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444;">
        <p style="margin: 0;"><strong>Grund:</strong> ${reason}</p>
        ${watchInfo}
        <p style="margin: 8px 0 0 0;"><strong>Warnungen:</strong> ${warningCount} von 3</p>
      </div>
      <p style="color: #ef4444; font-weight: 500;">Bei 3 Warnungen wird Ihr Konto gesperrt.</p>
      <p>Bitte beachten Sie unsere Richtlinien, um weitere Verstöße zu vermeiden.</p>
    `,
    buttonText: 'Zu meinen Verkäufen',
    buttonUrl: salesUrl,
  })

  return { subject, html }
}
