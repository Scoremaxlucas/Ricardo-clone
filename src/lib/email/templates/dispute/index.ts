/**
 * Dispute Email Templates
 */

import { getEmailBaseUrl } from '../../config'
import { getHelvendaEmailTemplate } from '../../base-template'

/**
 * Streitfall eröffnet - Verkäufer
 */
export function getDisputeOpenedEmail(
  sellerName: string,
  watchTitle: string,
  reason: string,
  buyerName: string,
  purchaseId: string
) {
  const baseUrl = getEmailBaseUrl()
  const disputeUrl = `${baseUrl}/meine-verkaeufe`
  const subject = `Streitfall eröffnet - ${watchTitle}`

  const html = getHelvendaEmailTemplate({
    title: 'Streitfall eröffnet',
    greeting: `Hallo ${sellerName},`,
    content: `
      <p>Der Käufer hat einen Streitfall eröffnet.</p>
      <div style="background-color: #fef2f2; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444;">
        <p style="margin: 0;"><strong>Artikel:</strong> ${watchTitle}</p>
        <p style="margin: 8px 0 0 0;"><strong>Käufer:</strong> ${buyerName}</p>
        <p style="margin: 8px 0 0 0;"><strong>Grund:</strong> ${reason}</p>
      </div>
      <p>Bitte antworten Sie innerhalb von 48 Stunden.</p>
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
  const url = role === 'buyer' ? `${baseUrl}/meine-kaeufe` : `${baseUrl}/meine-verkaeufe`
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
  watchTitle: string,
  resolution: string,
  role: 'buyer' | 'seller'
) {
  const baseUrl = getEmailBaseUrl()
  const url = role === 'buyer' ? `${baseUrl}/meine-kaeufe` : `${baseUrl}/meine-verkaeufe`
  const subject = `Streitfall gelöst - ${watchTitle}`

  const html = getHelvendaEmailTemplate({
    title: 'Streitfall gelöst',
    greeting: `Hallo ${userName},`,
    content: `
      <p>Der Streitfall wurde gelöst.</p>
      <div style="background-color: #ecfdf5; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
        <p style="margin: 0;"><strong>Artikel:</strong> ${watchTitle}</p>
        <p style="margin: 8px 0 0 0;"><strong>Entscheidung:</strong> ${resolution}</p>
      </div>
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
  watchTitle: string,
  refundAmount: number,
  reason: string
) {
  const baseUrl = getEmailBaseUrl()
  const salesUrl = `${baseUrl}/meine-verkaeufe`
  const subject = `Rückerstattung erforderlich - ${watchTitle}`

  const html = getHelvendaEmailTemplate({
    title: 'Rückerstattung erforderlich',
    greeting: `Hallo ${sellerName},`,
    content: `
      <p>Sie müssen eine Rückerstattung durchführen.</p>
      <div style="background-color: #fef2f2; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444;">
        <p style="margin: 0;"><strong>Artikel:</strong> ${watchTitle}</p>
        <p style="margin: 8px 0 0 0;"><strong>Betrag:</strong> CHF ${refundAmount.toFixed(2)}</p>
        <p style="margin: 8px 0 0 0;"><strong>Grund:</strong> ${reason}</p>
      </div>
      <p>Bitte führen Sie die Rückerstattung innerhalb von 5 Werktagen durch.</p>
    `,
    buttonText: 'Rückerstattung veranlassen',
    buttonUrl: salesUrl,
  })

  return { subject, html }
}

/**
 * Verkäufer-Warnung (bei mehreren Beschwerden)
 */
export function getSellerWarningEmail(
  sellerName: string,
  warningCount: number,
  reason: string
) {
  const baseUrl = getEmailBaseUrl()
  const guidelinesUrl = `${baseUrl}/richtlinien`
  const subject = `Wichtige Warnung zu Ihrem Konto`

  const html = getHelvendaEmailTemplate({
    title: `Warnung (${warningCount}/3)`,
    greeting: `Hallo ${sellerName},`,
    content: `
      <p>Sie haben eine Warnung für Ihr Verkäuferkonto erhalten.</p>
      <div style="background-color: #fef2f2; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444;">
        <p style="margin: 0;"><strong>Grund:</strong> ${reason}</p>
        <p style="margin: 8px 0 0 0;"><strong>Warnungen:</strong> ${warningCount} von 3</p>
      </div>
      <p style="color: #ef4444; font-weight: 500;">Bei 3 Warnungen wird Ihr Konto gesperrt.</p>
      <p>Bitte lesen Sie unsere Richtlinien, um weitere Verstöße zu vermeiden.</p>
    `,
    buttonText: 'Richtlinien lesen',
    buttonUrl: guidelinesUrl,
  })

  return { subject, html }
}
