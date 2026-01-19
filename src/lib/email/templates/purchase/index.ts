/**
 * Purchase Email Templates
 */

import { getEmailBaseUrl } from '../../config'
import { getHelvendaEmailTemplate } from '../../base-template'

/**
 * Kaufbestätigung für Käufer
 */
export function getPurchaseConfirmationEmail(
  buyerName: string,
  sellerName: string,
  watchTitle: string,
  price: number,
  shippingCost?: number,
  purchaseType?: 'auction' | 'buy-now',
  purchaseId?: string,
  watchId?: string,
  paymentInfo?: any,
  imageUrl?: string,
  sellerRating?: number,
  sellerReviewCount?: number
) {
  const baseUrl = getEmailBaseUrl()
  const purchasesUrl = `${baseUrl}/my-watches/buying/purchased`
  const subject = `Kaufbestätigung - ${watchTitle}`

  const purchaseTypeText = purchaseType === 'auction' ? 'Auktion' : 'Sofortkauf'
  const totalPrice = shippingCost ? price + shippingCost : price
  const shippingInfo = shippingCost
    ? `<p style="margin: 8px 0 0 0;"><strong>Versandkosten:</strong> CHF ${shippingCost.toFixed(2)}</p>
       <p style="margin: 8px 0 0 0;"><strong>Gesamtpreis:</strong> CHF ${totalPrice.toFixed(2)}</p>`
    : ''

  const sellerInfo = sellerRating && sellerReviewCount
    ? `<p style="margin: 8px 0 0 0;"><strong>Verkäufer-Bewertung:</strong> ${sellerRating.toFixed(1)}/5 (${sellerReviewCount} Bewertungen)</p>`
    : ''

  const imageSection = imageUrl
    ? `<div style="text-align: center; margin: 20px 0;">
        <img src="${imageUrl}" alt="${watchTitle}" style="max-width: 300px; border-radius: 8px; margin: 0 auto;" />
      </div>`
    : ''

  const paymentInfoSection = paymentInfo
    ? `<div style="background-color: #fef9c3; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b;">
        <p style="margin: 0; font-weight: 600;">Zahlungsinformationen:</p>
        ${paymentInfo.qrCode ? `<p style="margin: 8px 0 0 0;"><strong>QR-Referenz:</strong> ${paymentInfo.qrReference || 'N/A'}</p>` : ''}
        ${paymentInfo.iban ? `<p style="margin: 8px 0 0 0;"><strong>IBAN:</strong> ${paymentInfo.iban}</p>` : ''}
        ${paymentInfo.reference ? `<p style="margin: 8px 0 0 0;"><strong>Referenz:</strong> ${paymentInfo.reference}</p>` : ''}
      </div>`
    : ''

  const html = getHelvendaEmailTemplate({
    title: 'Kaufbestätigung',
    greeting: `Hallo ${buyerName},`,
    content: `
      <p>Vielen Dank für Ihren Kauf!</p>
      ${imageSection}
      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Artikel:</strong> ${watchTitle}</p>
        <p style="margin: 8px 0 0 0;"><strong>Preis:</strong> CHF ${price.toFixed(2)}</p>
        ${shippingInfo}
        <p style="margin: 8px 0 0 0;"><strong>Verkäufer:</strong> ${sellerName}</p>
        ${sellerInfo}
        <p style="margin: 8px 0 0 0;"><strong>Verkaufstyp:</strong> ${purchaseTypeText}</p>
        ${purchaseId ? `<p style="margin: 8px 0 0 0; font-size: 12px; color: #9ca3af;">Bestellnr.: ${purchaseId}</p>` : ''}
      </div>
      ${paymentInfoSection}
      <p>Der Verkäufer wurde benachrichtigt und wird sich bei Ihnen melden.</p>
    `,
    buttonText: 'Meine Käufe',
    buttonUrl: purchasesUrl,
  })

  return { subject, html }
}

/**
 * Zahlungsaufforderung
 */
export function getPaymentRequestEmail(
  buyerName: string,
  watchTitle: string,
  amount: number,
  sellerName: string,
  paymentDeadline: string,
  purchaseId: string
) {
  const baseUrl = getEmailBaseUrl()
  const purchasesUrl = `${baseUrl}/my-watches/buying/purchased`
  const subject = `Zahlungsaufforderung - ${watchTitle}`

  const html = getHelvendaEmailTemplate({
    title: 'Zahlungsaufforderung',
    greeting: `Hallo ${buyerName},`,
    content: `
      <p>Bitte bezahlen Sie Ihren Kauf.</p>
      <div style="background-color: #fef9c3; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b;">
        <p style="margin: 0;"><strong>Artikel:</strong> ${watchTitle}</p>
        <p style="margin: 8px 0 0 0;"><strong>Betrag:</strong> CHF ${amount.toFixed(2)}</p>
        <p style="margin: 8px 0 0 0;"><strong>Verkäufer:</strong> ${sellerName}</p>
        <p style="margin: 8px 0 0 0;"><strong>Fällig bis:</strong> ${paymentDeadline}</p>
      </div>
    `,
    buttonText: 'Jetzt bezahlen',
    buttonUrl: purchasesUrl,
  })

  return { subject, html }
}

/**
 * Kontaktfrist-Warnung
 */
export function getContactDeadlineWarningEmail(
  userName: string,
  watchTitle: string,
  deadline: string,
  role: 'buyer' | 'seller'
) {
  const baseUrl = getEmailBaseUrl()
  const url = role === 'buyer' ? `${baseUrl}/my-watches/buying/purchased` : `${baseUrl}/my-watches/selling/sold`
  const subject = `Wichtig: Kontaktfrist läuft ab - ${watchTitle}`

  const content =
    role === 'buyer'
      ? `<p>Bitte kontaktieren Sie den Verkäufer, um die Zahlung zu arrangieren.</p>`
      : `<p>Der Käufer hat Sie noch nicht kontaktiert. Bitte überprüfen Sie Ihre Nachrichten.</p>`

  const html = getHelvendaEmailTemplate({
    title: 'Kontaktfrist läuft ab',
    greeting: `Hallo ${userName},`,
    content: `
      ${content}
      <div style="background-color: #fef2f2; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444;">
        <p style="margin: 0;"><strong>Artikel:</strong> ${watchTitle}</p>
        <p style="margin: 8px 0 0 0;"><strong>Frist:</strong> ${deadline}</p>
      </div>
      <p>Nach Ablauf der Frist kann der Kauf storniert werden.</p>
    `,
    buttonText: role === 'buyer' ? 'Verkäufer kontaktieren' : 'Nachrichten prüfen',
    buttonUrl: url,
  })

  return { subject, html }
}

/**
 * Zahlungserinnerung
 */
export function getPaymentReminderEmail(
  buyerName: string,
  watchTitle: string,
  amount: number,
  daysOverdue: number
) {
  const baseUrl = getEmailBaseUrl()
  const purchasesUrl = `${baseUrl}/my-watches/buying/purchased`
  const subject = `Zahlungserinnerung - ${watchTitle}`

  let urgency = ''
  let bgColor = '#fef9c3'
  let borderColor = '#f59e0b'

  if (daysOverdue > 14) {
    urgency = 'Letzte Mahnung!'
    bgColor = '#fef2f2'
    borderColor = '#ef4444'
  } else if (daysOverdue > 7) {
    urgency = 'Zweite Erinnerung'
    bgColor = '#fff7ed'
    borderColor = '#f97316'
  } else {
    urgency = 'Erste Erinnerung'
  }

  const html = getHelvendaEmailTemplate({
    title: urgency,
    greeting: `Hallo ${buyerName},`,
    content: `
      <p>Ihre Zahlung ist seit ${daysOverdue} Tagen ausstehend.</p>
      <div style="background-color: ${bgColor}; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid ${borderColor};">
        <p style="margin: 0;"><strong>Artikel:</strong> ${watchTitle}</p>
        <p style="margin: 8px 0 0 0;"><strong>Ausstehend:</strong> CHF ${amount.toFixed(2)}</p>
      </div>
      <p>Bitte begleichen Sie die Zahlung umgehend.</p>
    `,
    buttonText: 'Jetzt bezahlen',
    buttonUrl: purchasesUrl,
  })

  return { subject, html }
}

/**
 * Rechnungsbenachrichtigung
 */
export function getInvoiceNotificationEmail(
  sellerName: string,
  invoiceNumber: string,
  amount: number,
  dueDate: string
) {
  const baseUrl = getEmailBaseUrl()
  const invoicesUrl = `${baseUrl}/meine-rechnungen`
  const subject = `Neue Rechnung - ${invoiceNumber}`

  const html = getHelvendaEmailTemplate({
    title: 'Neue Rechnung',
    greeting: `Hallo ${sellerName},`,
    content: `
      <p>Sie haben eine neue Rechnung erhalten.</p>
      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Rechnungsnr.:</strong> ${invoiceNumber}</p>
        <p style="margin: 8px 0 0 0;"><strong>Betrag:</strong> CHF ${amount.toFixed(2)}</p>
        <p style="margin: 8px 0 0 0;"><strong>Fällig am:</strong> ${dueDate}</p>
      </div>
    `,
    buttonText: 'Rechnung ansehen',
    buttonUrl: invoicesUrl,
  })

  return { subject, html }
}

/**
 * Artikel erfolgreich eingestellt
 */
export function getListingConfirmationEmail(
  sellerName: string,
  watchTitle: string,
  price: number,
  watchId: string
) {
  const baseUrl = getEmailBaseUrl()
  const watchUrl = `${baseUrl}/products/${watchId}`
  const subject = `Artikel eingestellt - ${watchTitle}`

  const html = getHelvendaEmailTemplate({
    title: 'Artikel eingestellt ✅',
    greeting: `Hallo ${sellerName},`,
    content: `
      <p>Ihr Artikel wurde erfolgreich eingestellt!</p>
      <div style="background-color: #ecfdf5; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
        <p style="margin: 0;"><strong>Artikel:</strong> ${watchTitle}</p>
        <p style="margin: 8px 0 0 0;"><strong>Preis:</strong> CHF ${price.toFixed(2)}</p>
      </div>
      <p>Ihr Artikel ist jetzt für alle Käufer sichtbar.</p>
    `,
    buttonText: 'Artikel ansehen',
    buttonUrl: watchUrl,
  })

  return { subject, html }
}
