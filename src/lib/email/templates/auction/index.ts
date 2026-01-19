/**
 * Auction Email Templates
 */

import { getEmailBaseUrl } from '../../config'
import { getHelvendaEmailTemplate } from '../../base-template'

/**
 * Gebotsbestätigung für Käufer
 */
export function getBidConfirmationEmail(
  buyerName: string,
  articleTitle: string,
  bidAmount: number,
  watchId: string
) {
  const baseUrl = getEmailBaseUrl()
  const articleUrl = `${baseUrl}/products/${watchId}`
  const subject = `Gebotsbestätigung - ${articleTitle}`

  const html = getHelvendaEmailTemplate({
    title: 'Gebotsbestätigung',
    greeting: `Hallo ${buyerName},`,
    content: `
      <p>Ihr Gebot wurde erfolgreich abgegeben!</p>
      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Artikel:</strong> ${articleTitle}</p>
        <p style="margin: 8px 0 0 0;"><strong>Ihr Gebot:</strong> CHF ${bidAmount.toFixed(2)}</p>
      </div>
      <p>Wir benachrichtigen Sie, wenn Sie überboten werden oder die Auktion endet.</p>
    `,
    buttonText: 'Auktion ansehen',
    buttonUrl: articleUrl,
  })

  return { subject, html }
}

/**
 * Überboten-Benachrichtigung
 */
export function getOutbidNotificationEmail(
  buyerName: string,
  articleTitle: string,
  currentBid: number,
  watchId: string
) {
  const baseUrl = getEmailBaseUrl()
  const articleUrl = `${baseUrl}/products/${watchId}`
  const subject = `Sie wurden überboten - ${articleTitle}`

  const html = getHelvendaEmailTemplate({
    title: 'Sie wurden überboten',
    greeting: `Hallo ${buyerName},`,
    content: `
      <p>Ein anderer Käufer hat ein höheres Gebot abgegeben.</p>
      <div style="background-color: #fef2f2; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444;">
        <p style="margin: 0;"><strong>Artikel:</strong> ${articleTitle}</p>
        <p style="margin: 8px 0 0 0;"><strong>Aktuelles Höchstgebot:</strong> CHF ${currentBid.toFixed(2)}</p>
      </div>
      <p>Bieten Sie erneut, um den Artikel nicht zu verpassen!</p>
    `,
    buttonText: 'Jetzt höher bieten',
    buttonUrl: articleUrl,
  })

  return { subject, html }
}

/**
 * Auktion gewonnen - Käufer
 */
export function getAuctionEndWonEmail(
  buyerName: string,
  articleTitle: string,
  finalPrice: number,
  watchId: string,
  purchaseId?: string
) {
  const baseUrl = getEmailBaseUrl()
  const purchasesUrl = purchaseId
    ? `${baseUrl}/my-watches/buying/purchased?purchase=${purchaseId}`
    : `${baseUrl}/my-watches/buying/purchased`
  const subject = `Herzlichen Glückwunsch! Sie haben gewonnen - ${articleTitle}`

  const html = getHelvendaEmailTemplate({
    title: 'Sie haben gewonnen! 🎉',
    greeting: `Hallo ${buyerName},`,
    content: `
      <p>Herzlichen Glückwunsch! Sie haben die Auktion gewonnen.</p>
      <div style="background-color: #ecfdf5; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
        <p style="margin: 0;"><strong>Artikel:</strong> ${articleTitle}</p>
        <p style="margin: 8px 0 0 0;"><strong>Endpreis:</strong> CHF ${finalPrice.toFixed(2)}</p>
      </div>
      <p>Schließen Sie jetzt den Kauf ab, um den Artikel zu erhalten.</p>
    `,
    buttonText: 'Zum Kauf',
    buttonUrl: purchasesUrl,
  })

  return { subject, html }
}

/**
 * Auktion beendet - Verkäufer
 */
export function getAuctionEndSellerEmail(
  sellerName: string,
  articleTitle: string,
  finalPrice: number,
  winnerName: string,
  watchId: string,
  purchaseId?: string
) {
  const baseUrl = getEmailBaseUrl()
  const salesUrl = purchaseId
    ? `${baseUrl}/my-watches/selling/sold?purchase=${purchaseId}`
    : `${baseUrl}/my-watches/selling/sold`
  const subject = `Ihre Auktion wurde beendet - ${articleTitle}`

  const html = getHelvendaEmailTemplate({
    title: 'Auktion beendet',
    greeting: `Hallo ${sellerName},`,
    content: `
      <p>Ihre Auktion wurde erfolgreich beendet!</p>
      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Artikel:</strong> ${articleTitle}</p>
        <p style="margin: 8px 0 0 0;"><strong>Endpreis:</strong> CHF ${finalPrice.toFixed(2)}</p>
        <p style="margin: 8px 0 0 0;"><strong>Gewinner:</strong> ${winnerName}</p>
      </div>
      <p>Sobald der Käufer bezahlt hat, werden Sie benachrichtigt.</p>
    `,
    buttonText: 'Verkäufe ansehen',
    buttonUrl: salesUrl,
  })

  return { subject, html }
}

/**
 * Auktion verloren - Käufer (nicht gewonnen)
 */
export function getAuctionEndLostEmail(
  buyerName: string,
  articleTitle: string,
  winningBid: number,
  watchId: string
) {
  const baseUrl = getEmailBaseUrl()
  const articleUrl = `${baseUrl}/products/${watchId}`
  const subject = `Auktion beendet - ${articleTitle}`

  const html = getHelvendaEmailTemplate({
    title: 'Auktion beendet',
    greeting: `Hallo ${buyerName},`,
    content: `
      <p>Die Auktion für "${articleTitle}" ist beendet.</p>
      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Artikel:</strong> ${articleTitle}</p>
        <p style="margin: 8px 0 0 0;"><strong>Gewinngebot:</strong> CHF ${winningBid.toFixed(2)}</p>
      </div>
      <p>Leider haben Sie diese Auktion nicht gewonnen. Schauen Sie sich unsere anderen Angebote an!</p>
    `,
    buttonText: 'Weitere Angebote ansehen',
    buttonUrl: `${baseUrl}/search`,
  })

  return { subject, html }
}

/**
 * Neues Gebot - Verkäufer-Benachrichtigung
 */
export function getBidNotificationEmail(
  sellerName: string,
  articleTitle: string,
  bidAmount: number,
  bidderName: string,
  watchId: string
) {
  const baseUrl = getEmailBaseUrl()
  const articleUrl = `${baseUrl}/products/${watchId}`
  const subject = `Neues Gebot auf ${articleTitle}`

  const html = getHelvendaEmailTemplate({
    title: 'Neues Gebot eingegangen',
    greeting: `Hallo ${sellerName},`,
    content: `
      <p>Es wurde ein neues Gebot auf Ihren Artikel abgegeben.</p>
      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Artikel:</strong> ${articleTitle}</p>
        <p style="margin: 8px 0 0 0;"><strong>Gebot:</strong> CHF ${bidAmount.toFixed(2)}</p>
        <p style="margin: 8px 0 0 0;"><strong>Bieter:</strong> ${bidderName}</p>
      </div>
    `,
    buttonText: 'Auktion ansehen',
    buttonUrl: articleUrl,
  })

  return { subject, html }
}
