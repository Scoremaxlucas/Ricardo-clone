/**
 * Notification Email Templates
 */

import { getEmailBaseUrl } from '../../config'
import { getHelvendaEmailTemplate } from '../../base-template'

/**
 * Verkaufsbenachrichtigung für Verkäufer
 */
export function getSaleNotificationEmail(
  sellerName: string,
  buyerName: string,
  watchTitle: string,
  price: number,
  watchId: string
) {
  const baseUrl = getEmailBaseUrl()
  const salesUrl = `${baseUrl}/meine-verkaeufe`
  const subject = `Ihr Artikel wurde verkauft - ${watchTitle}`

  const html = getHelvendaEmailTemplate({
    title: 'Verkauf erfolgreich! 🎉',
    greeting: `Hallo ${sellerName},`,
    content: `
      <p>Herzlichen Glückwunsch! Ihr Artikel wurde verkauft.</p>
      <div style="background-color: #ecfdf5; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
        <p style="margin: 0;"><strong>Verkaufter Artikel:</strong> ${watchTitle}</p>
        <p style="margin: 8px 0 0 0;"><strong>Preis:</strong> CHF ${price.toFixed(2)}</p>
        <p style="margin: 8px 0 0 0;"><strong>Käufer:</strong> ${buyerName}</p>
      </div>
      <p>Bitte bereiten Sie den Versand vor, sobald die Zahlung eingegangen ist.</p>
    `,
    buttonText: 'Verkäufe verwalten',
    buttonUrl: salesUrl,
  })

  return { subject, html }
}

/**
 * Bewertungsbenachrichtigung
 */
export function getReviewNotificationEmail(
  recipientName: string,
  reviewerName: string,
  rating: number,
  comment: string,
  watchTitle: string
) {
  const baseUrl = getEmailBaseUrl()
  const profileUrl = `${baseUrl}/profil`
  const subject = `Neue Bewertung erhalten`

  const stars = '⭐'.repeat(rating)

  const html = getHelvendaEmailTemplate({
    title: 'Neue Bewertung erhalten',
    greeting: `Hallo ${recipientName},`,
    content: `
      <p>Sie haben eine neue Bewertung erhalten.</p>
      <div style="background-color: #fef9c3; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0; font-size: 24px;">${stars}</p>
        <p style="margin: 12px 0 0 0;"><strong>Von:</strong> ${reviewerName}</p>
        <p style="margin: 8px 0 0 0;"><strong>Artikel:</strong> ${watchTitle}</p>
        ${comment ? `<p style="margin: 12px 0 0 0; font-style: italic;">"${comment}"</p>` : ''}
      </div>
    `,
    buttonText: 'Profil ansehen',
    buttonUrl: profileUrl,
  })

  return { subject, html }
}

/**
 * Versandbenachrichtigung
 */
export function getShippingNotificationEmail(
  buyerName: string,
  watchTitle: string,
  trackingNumber?: string,
  trackingUrl?: string
) {
  const baseUrl = getEmailBaseUrl()
  const purchasesUrl = `${baseUrl}/meine-kaeufe`
  const subject = `Ihr Artikel wurde versendet - ${watchTitle}`

  const html = getHelvendaEmailTemplate({
    title: 'Artikel versendet 📦',
    greeting: `Hallo ${buyerName},`,
    content: `
      <p>Gute Nachrichten! Ihr Artikel wurde versendet.</p>
      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Artikel:</strong> ${watchTitle}</p>
        ${
          trackingNumber
            ? `<p style="margin: 8px 0 0 0;"><strong>Tracking:</strong> ${trackingNumber}</p>`
            : ''
        }
      </div>
      ${
        trackingUrl
          ? `<p><a href="${trackingUrl}" style="color: #0f766e;">Sendung verfolgen →</a></p>`
          : ''
      }
    `,
    buttonText: 'Käufe ansehen',
    buttonUrl: purchasesUrl,
  })

  return { subject, html }
}

/**
 * Zahlungseingang Bestätigung
 */
export function getPaymentReceivedEmail(
  sellerName: string,
  watchTitle: string,
  amount: number,
  buyerName: string
) {
  const baseUrl = getEmailBaseUrl()
  const salesUrl = `${baseUrl}/meine-verkaeufe`
  const subject = `Zahlung erhalten - ${watchTitle}`

  const html = getHelvendaEmailTemplate({
    title: 'Zahlung erhalten ✅',
    greeting: `Hallo ${sellerName},`,
    content: `
      <p>Die Zahlung für Ihren Artikel wurde bestätigt.</p>
      <div style="background-color: #ecfdf5; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
        <p style="margin: 0;"><strong>Artikel:</strong> ${watchTitle}</p>
        <p style="margin: 8px 0 0 0;"><strong>Betrag:</strong> CHF ${amount.toFixed(2)}</p>
        <p style="margin: 8px 0 0 0;"><strong>Käufer:</strong> ${buyerName}</p>
      </div>
      <p>Bitte versenden Sie den Artikel jetzt an den Käufer.</p>
    `,
    buttonText: 'Versand vorbereiten',
    buttonUrl: salesUrl,
  })

  return { subject, html }
}

/**
 * Preisvorschlag erhalten
 */
export function getPriceOfferReceivedEmail(
  sellerName: string,
  watchTitle: string,
  offerAmount: number,
  buyerName: string,
  watchId: string
) {
  const baseUrl = getEmailBaseUrl()
  const watchUrl = `${baseUrl}/watches/${watchId}`
  const subject = `Neuer Preisvorschlag für ${watchTitle}`

  const html = getHelvendaEmailTemplate({
    title: 'Neuer Preisvorschlag',
    greeting: `Hallo ${sellerName},`,
    content: `
      <p>Sie haben einen Preisvorschlag erhalten.</p>
      <div style="background-color: #fef9c3; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Artikel:</strong> ${watchTitle}</p>
        <p style="margin: 8px 0 0 0;"><strong>Vorgeschlagener Preis:</strong> CHF ${offerAmount.toFixed(2)}</p>
        <p style="margin: 8px 0 0 0;"><strong>Von:</strong> ${buyerName}</p>
      </div>
      <p>Antworten Sie innerhalb von 48 Stunden.</p>
    `,
    buttonText: 'Angebot ansehen',
    buttonUrl: watchUrl,
  })

  return { subject, html }
}

/**
 * Preisvorschlag angenommen
 */
export function getPriceOfferAcceptedEmail(
  buyerName: string,
  watchTitle: string,
  acceptedPrice: number,
  watchId: string
) {
  const baseUrl = getEmailBaseUrl()
  const checkoutUrl = `${baseUrl}/checkout?watchId=${watchId}`
  const subject = `Ihr Preisvorschlag wurde angenommen - ${watchTitle}`

  const html = getHelvendaEmailTemplate({
    title: 'Preisvorschlag angenommen! 🎉',
    greeting: `Hallo ${buyerName},`,
    content: `
      <p>Gute Nachrichten! Der Verkäufer hat Ihren Preisvorschlag angenommen.</p>
      <div style="background-color: #ecfdf5; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
        <p style="margin: 0;"><strong>Artikel:</strong> ${watchTitle}</p>
        <p style="margin: 8px 0 0 0;"><strong>Vereinbarter Preis:</strong> CHF ${acceptedPrice.toFixed(2)}</p>
      </div>
      <p>Schließen Sie jetzt den Kauf ab!</p>
    `,
    buttonText: 'Zum Checkout',
    buttonUrl: checkoutUrl,
  })

  return { subject, html }
}

/**
 * Neue Nachricht erhalten
 */
export function getAnswerNotificationEmail(
  recipientName: string,
  senderName: string,
  watchTitle: string,
  messagePreview: string,
  conversationUrl: string
) {
  const subject = `Neue Nachricht von ${senderName}`

  const html = getHelvendaEmailTemplate({
    title: 'Neue Nachricht',
    greeting: `Hallo ${recipientName},`,
    content: `
      <p>Sie haben eine neue Nachricht erhalten.</p>
      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Von:</strong> ${senderName}</p>
        <p style="margin: 8px 0 0 0;"><strong>Betreff:</strong> ${watchTitle}</p>
        <p style="margin: 12px 0 0 0; font-style: italic; color: #6b7280;">"${messagePreview.substring(0, 100)}${messagePreview.length > 100 ? '...' : ''}"</p>
      </div>
    `,
    buttonText: 'Nachricht lesen',
    buttonUrl: conversationUrl,
  })

  return { subject, html }
}

/**
 * Suchabo - Treffer gefunden
 */
export function getSearchMatchFoundEmail(
  userName: string,
  searchQuery: string,
  matchCount: number,
  searchUrl: string
) {
  const subject = `${matchCount} neue Treffer für "${searchQuery}"`

  const html = getHelvendaEmailTemplate({
    title: 'Neue Suchergebnisse',
    greeting: `Hallo ${userName},`,
    content: `
      <p>Es gibt neue Artikel, die zu Ihrer Suche passen!</p>
      <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #3b82f6;">
        <p style="margin: 0;"><strong>Suchbegriff:</strong> "${searchQuery}"</p>
        <p style="margin: 8px 0 0 0;"><strong>Neue Treffer:</strong> ${matchCount} Artikel</p>
      </div>
    `,
    buttonText: 'Artikel ansehen',
    buttonUrl: searchUrl,
  })

  return { subject, html }
}
