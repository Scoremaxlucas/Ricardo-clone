// Lade Umgebungsvariablen aus .env VOR dem Import
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.join(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8')
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^([^=:#]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        let value = match[2].trim()
        // Entferne Anführungszeichen
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1)
        }
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    }
  })
}

// Jetzt importieren, nachdem die Umgebungsvariablen geladen wurden
import { sendEmail } from '../src/lib/email'
import {
  getEmailVerificationEmail,
  getSaleNotificationEmail,
  getAnswerNotificationEmail,
  getPurchaseConfirmationEmail,
  getPaymentRequestEmail,
  getFirstReminderEmail,
  getSecondReminderEmail,
  getFinalReminderEmail,
  getInvoiceNotificationEmail,
  getVerificationApprovalEmail,
  getReviewNotificationEmail,
  getContactDeadlineWarningEmail,
  getPaymentReminderEmail,
  getDisputeOpenedEmail,
  getDisputeResolvedEmail,
  getBidConfirmationEmail,
  getOutbidNotificationEmail,
  getBidNotificationEmail,
  getAuctionEndWonEmail,
  getAuctionEndLostEmail,
  getAuctionEndSellerEmail,
  getPaymentReceivedEmail,
  getShippingNotificationEmail,
  getShippingReminderEmail,
  getPriceOfferReceivedEmail,
  getPriceOfferAcceptedEmail,
  getListingConfirmationEmail,
  getReviewRequestBuyerEmail,
  getReviewRequestSellerEmail,
} from '../src/lib/email'

const TEST_EMAIL = 'lucasrodrigues.gafner@outlook.com'
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3002'

// Hilfsfunktion für Verzögerung (um Rate-Limiting zu vermeiden)
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function testAllEmails() {
  console.log('📧 Starte Test-Versand aller E-Mail-Benachrichtigungen...\n')
  console.log(`Empfänger: ${TEST_EMAIL}\n`)
  console.log('⏳ Warte 1 Sekunde zwischen E-Mails (Rate-Limit: 2/Sekunde)...\n')

  const results: Array<{ name: string; success: boolean; error?: string }> = []

  // Test-Daten
  const testData = {
    userName: 'Lucas Rodrigues',
    sellerName: 'Max Mustermann',
    buyerName: 'Anna Schmidt',
    articleTitle: 'Rolex Submariner 2020',
    articleNumber: 'ART-2024-001',
    watchId: 'test-watch-id-123',
    purchaseId: 'test-purchase-id-456',
    invoiceId: 'test-invoice-id-789',
    invoiceNumber: 'REV-2024-001',
    bidAmount: 1500.0,
    currentHighestBid: 1600.0,
    winningBid: 1700.0,
    paymentAmount: 1500.0,
    total: 165.0,
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    lateFeeAmount: 10.0,
    trackingNumber: 'CH123456789',
    trackingProvider: 'Post',
    offerAmount: 1400.0,
    verificationUrl: `${BASE_URL}/verify-email?token=test-token-123`,
    answerContent: 'Ja, der Artikel ist noch verfügbar und in sehr gutem Zustand.',
    reviewRating: 5,
    reviewComment: 'Sehr zufrieden mit dem Kauf!',
    resolution: 'Der Dispute wurde zu Gunsten des Käufers gelöst.',
  }

  // 1. E-Mail-Verifizierung
  try {
    const { subject, html, text } = getEmailVerificationEmail(
      testData.userName,
      testData.verificationUrl
    )
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    results.push({ name: 'E-Mail-Verifizierung', success: true })
    await delay(600)
    console.log('✅ E-Mail-Verifizierung gesendet')
    await delay(600) // Rate-Limit: 2/Sekunde
  } catch (error: any) {
    results.push({ name: 'E-Mail-Verifizierung', success: false, error: error.message })
    console.error('❌ E-Mail-Verifizierung:', error.message)
    // Nächste E-Mail
  }

  // 2. Verkaufsbenachrichtigung
  try {
    const { subject, html, text } = getSaleNotificationEmail(
      testData.sellerName,
      testData.buyerName,
      testData.articleTitle,
      testData.paymentAmount,
      'auction',
      testData.watchId
    )
    // Nächste E-Mail
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    results.push({ name: 'Verkaufsbenachrichtigung', success: true })
    await delay(600)
    console.log('✅ Verkaufsbenachrichtigung gesendet')
    await delay(600) // Rate-Limit: 2/Sekunde
    // Nächste E-Mail
  } catch (error: any) {
    results.push({ name: 'Verkaufsbenachrichtigung', success: false, error: error.message })
    console.error('❌ Verkaufsbenachrichtigung:', error.message)
  }

  // 3. Antwort-Benachrichtigung
  try {
    const { subject, html, text } = getAnswerNotificationEmail(
      testData.buyerName,
      testData.sellerName,
      testData.articleTitle,
      testData.answerContent,
      testData.watchId,
      false
    )
    // Nächste E-Mail
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    results.push({ name: 'Antwort-Benachrichtigung', success: true })
    await delay(600)
    console.log('✅ Antwort-Benachrichtigung gesendet')
    await delay(600) // Rate-Limit: 2/Sekunde
    // Nächste E-Mail
  } catch (error: any) {
    results.push({ name: 'Antwort-Benachrichtigung', success: false, error: error.message })
    console.error('❌ Antwort-Benachrichtigung:', error.message)
  }

  // 4. Kaufbestätigung
  try {
    const { subject, html, text } = getPurchaseConfirmationEmail(
      testData.buyerName,
      testData.sellerName,
      testData.articleTitle,
      testData.paymentAmount,
      5.0, // shippingCost
      'buy-now',
      testData.purchaseId,
      testData.watchId
    )
    // Nächste E-Mail
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    results.push({ name: 'Kaufbestätigung', success: true })
    await delay(600)
    console.log('✅ Kaufbestätigung gesendet')
    await delay(600) // Rate-Limit: 2/Sekunde
    // Nächste E-Mail
  } catch (error: any) {
    results.push({ name: 'Kaufbestätigung', success: false, error: error.message })
    console.error('❌ Kaufbestätigung:', error.message)
  }

  // 5. Zahlungsaufforderung
  try {
    const { subject, html, text } = getPaymentRequestEmail(
      testData.userName,
      testData.invoiceNumber,
      testData.total,
      testData.dueDate,
      testData.invoiceId
    )
    // Nächste E-Mail
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    results.push({ name: 'Zahlungsaufforderung', success: true })
    await delay(600)
    console.log('✅ Zahlungsaufforderung gesendet')
    await delay(600) // Rate-Limit: 2/Sekunde
    // Nächste E-Mail
  } catch (error: any) {
    results.push({ name: 'Zahlungsaufforderung', success: false, error: error.message })
    console.error('❌ Zahlungsaufforderung:', error.message)
  }

  // 6. Erste Zahlungserinnerung
  try {
    const { subject, html, text } = getFirstReminderEmail(
      testData.userName,
      testData.invoiceNumber,
      testData.total,
      testData.dueDate,
      testData.invoiceId
    )
    // Nächste E-Mail
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    results.push({ name: 'Erste Zahlungserinnerung', success: true })
    await delay(600)
    console.log('✅ Erste Zahlungserinnerung gesendet')
    await delay(600) // Rate-Limit: 2/Sekunde
    // Nächste E-Mail
  } catch (error: any) {
    results.push({ name: 'Erste Zahlungserinnerung', success: false, error: error.message })
    console.error('❌ Erste Zahlungserinnerung:', error.message)
  }

  // 7. Zweite Zahlungserinnerung
  try {
    const { subject, html, text } = getSecondReminderEmail(
      testData.userName,
      testData.invoiceNumber,
      testData.total,
      testData.lateFeeAmount,
      testData.dueDate,
      testData.invoiceId
    )
    // Nächste E-Mail
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    results.push({ name: 'Zweite Zahlungserinnerung', success: true })
    await delay(600)
    console.log('✅ Zweite Zahlungserinnerung gesendet')
    await delay(600) // Rate-Limit: 2/Sekunde
    // Nächste E-Mail
  } catch (error: any) {
    results.push({ name: 'Zweite Zahlungserinnerung', success: false, error: error.message })
    console.error('❌ Zweite Zahlungserinnerung:', error.message)
  }

  // 8. Finale Mahnung
  try {
    const { subject, html, text } = getFinalReminderEmail(
      testData.userName,
      testData.invoiceNumber,
      testData.total,
      testData.lateFeeAmount,
      testData.dueDate,
      testData.invoiceId
    )
    // Nächste E-Mail
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    results.push({ name: 'Finale Mahnung', success: true })
    await delay(600)
    console.log('✅ Finale Mahnung gesendet')
    await delay(600) // Rate-Limit: 2/Sekunde
    // Nächste E-Mail
  } catch (error: any) {
    results.push({ name: 'Finale Mahnung', success: false, error: error.message })
    console.error('❌ Finale Mahnung:', error.message)
  }

  // 9. Rechnungsbenachrichtigung
  try {
    const { subject, html, text } = getInvoiceNotificationEmail(
      testData.userName,
      testData.invoiceNumber,
      testData.total,
      [
        {
          description: 'Verkaufsgebühr - Rolex Submariner 2020',
          quantity: 1,
          price: 150.0,
          total: 150.0,
        },
        {
          description: 'MwSt. (7.7%)',
          quantity: 1,
          price: 11.55,
          total: 11.55,
        },
      ],
      testData.dueDate,
      testData.invoiceId
    )
    // Nächste E-Mail
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    results.push({ name: 'Rechnungsbenachrichtigung', success: true })
    await delay(600)
    console.log('✅ Rechnungsbenachrichtigung gesendet')
    await delay(600) // Rate-Limit: 2/Sekunde
    // Nächste E-Mail
  } catch (error: any) {
    results.push({ name: 'Rechnungsbenachrichtigung', success: false, error: error.message })
    console.error('❌ Rechnungsbenachrichtigung:', error.message)
  }

  // 10. Verifizierungs-Bestätigung
  try {
    const { subject, html, text } = getVerificationApprovalEmail(testData.userName)
    // Nächste E-Mail
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    results.push({ name: 'Verifizierungs-Bestätigung', success: true })
    await delay(600)
    console.log('✅ Verifizierungs-Bestätigung gesendet')
    await delay(600) // Rate-Limit: 2/Sekunde
    // Nächste E-Mail
  } catch (error: any) {
    results.push({ name: 'Verifizierungs-Bestätigung', success: false, error: error.message })
    console.error('❌ Verifizierungs-Bestätigung:', error.message)
  }

  // 11. Bewertungsbenachrichtigung
  try {
    const { subject, html, text } = getReviewNotificationEmail(
      testData.sellerName,
      testData.buyerName,
      testData.articleTitle,
      testData.reviewRating,
      testData.reviewComment,
      testData.watchId
    )
    // Nächste E-Mail
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    results.push({ name: 'Bewertungsbenachrichtigung', success: true })
    await delay(600)
    console.log('✅ Bewertungsbenachrichtigung gesendet')
    await delay(600) // Rate-Limit: 2/Sekunde
    // Nächste E-Mail
  } catch (error: any) {
    results.push({ name: 'Bewertungsbenachrichtigung', success: false, error: error.message })
    console.error('❌ Bewertungsbenachrichtigung:', error.message)
  }

  // 12. Kontaktfrist-Warnung
  try {
    const { subject, html, text } = getContactDeadlineWarningEmail(
      testData.userName,
      testData.articleTitle,
      testData.purchaseId
    )
    // Nächste E-Mail
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    results.push({ name: 'Kontaktfrist-Warnung', success: true })
    await delay(600)
    console.log('✅ Kontaktfrist-Warnung gesendet')
    await delay(600) // Rate-Limit: 2/Sekunde
    // Nächste E-Mail
  } catch (error: any) {
    results.push({ name: 'Kontaktfrist-Warnung', success: false, error: error.message })
    console.error('❌ Kontaktfrist-Warnung:', error.message)
  }

  // 13. Zahlungserinnerung
  try {
    const { subject, html, text } = getPaymentReminderEmail(
      testData.userName,
      testData.articleTitle,
      testData.paymentAmount,
      testData.purchaseId
    )
    // Nächste E-Mail
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    results.push({ name: 'Zahlungserinnerung', success: true })
    await delay(600)
    console.log('✅ Zahlungserinnerung gesendet')
    await delay(600) // Rate-Limit: 2/Sekunde
    // Nächste E-Mail
  } catch (error: any) {
    results.push({ name: 'Zahlungserinnerung', success: false, error: error.message })
    console.error('❌ Zahlungserinnerung:', error.message)
  }

  // 14. Dispute eröffnet
  try {
    const { subject, html, text } = getDisputeOpenedEmail(
      testData.userName,
      testData.articleTitle,
      'Artikel entspricht nicht der Beschreibung',
      'buyer',
      testData.purchaseId
    )
    // Nächste E-Mail
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    results.push({ name: 'Dispute eröffnet', success: true })
    await delay(600)
    console.log('✅ Dispute eröffnet gesendet')
    await delay(600) // Rate-Limit: 2/Sekunde
    // Nächste E-Mail
  } catch (error: any) {
    results.push({ name: 'Dispute eröffnet', success: false, error: error.message })
    console.error('❌ Dispute eröffnet:', error.message)
  }

  // 15. Dispute gelöst
  try {
    const { subject, html, text } = getDisputeResolvedEmail(
      testData.userName,
      testData.articleTitle,
      testData.resolution,
      'buyer',
      testData.purchaseId
    )
    // Nächste E-Mail
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    results.push({ name: 'Dispute gelöst', success: true })
    await delay(600)
    console.log('✅ Dispute gelöst gesendet')
    await delay(600) // Rate-Limit: 2/Sekunde
    // Nächste E-Mail
  } catch (error: any) {
    results.push({ name: 'Dispute gelöst', success: false, error: error.message })
    console.error('❌ Dispute gelöst:', error.message)
  }

  // 16. Gebotsbestätigung
  try {
    const { subject, html, text } = getBidConfirmationEmail(
      testData.buyerName,
      testData.articleTitle,
      testData.bidAmount,
      testData.watchId
    )
    // Nächste E-Mail
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    results.push({ name: 'Gebotsbestätigung', success: true })
    await delay(600)
    console.log('✅ Gebotsbestätigung gesendet')
    await delay(600) // Rate-Limit: 2/Sekunde
    // Nächste E-Mail
  } catch (error: any) {
    results.push({ name: 'Gebotsbestätigung', success: false, error: error.message })
    console.error('❌ Gebotsbestätigung:', error.message)
  }

  // 17. Überboten-Benachrichtigung
  try {
    const { subject, html, text } = getOutbidNotificationEmail(
      testData.buyerName,
      testData.articleTitle,
      testData.currentHighestBid,
      testData.watchId
    )
    // Nächste E-Mail
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    results.push({ name: 'Überboten-Benachrichtigung', success: true })
    await delay(600)
    console.log('✅ Überboten-Benachrichtigung gesendet')
    await delay(600) // Rate-Limit: 2/Sekunde
    // Nächste E-Mail
  } catch (error: any) {
    results.push({ name: 'Überboten-Benachrichtigung', success: false, error: error.message })
    console.error('❌ Überboten-Benachrichtigung:', error.message)
  }

  // 18. Gebotsbenachrichtigung
  try {
    const { subject, html, text } = getBidNotificationEmail(
      testData.sellerName,
      testData.articleTitle,
      testData.bidAmount,
      testData.buyerName,
      testData.watchId
    )
    // Nächste E-Mail
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    results.push({ name: 'Gebotsbenachrichtigung', success: true })
    await delay(600)
    console.log('✅ Gebotsbenachrichtigung gesendet')
    await delay(600) // Rate-Limit: 2/Sekunde
    // Nächste E-Mail
  } catch (error: any) {
    results.push({ name: 'Gebotsbenachrichtigung', success: false, error: error.message })
    console.error('❌ Gebotsbenachrichtigung:', error.message)
  }

  // 19. Auktionsende-Gewonnen
  try {
    const { subject, html, text } = getAuctionEndWonEmail(
      testData.buyerName,
      testData.articleTitle,
      testData.winningBid,
      testData.watchId,
      testData.purchaseId
    )
    // Nächste E-Mail
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    results.push({ name: 'Auktionsende-Gewonnen', success: true })
    await delay(600)
    console.log('✅ Auktionsende-Gewonnen gesendet')
    await delay(600) // Rate-Limit: 2/Sekunde
    // Nächste E-Mail
  } catch (error: any) {
    results.push({ name: 'Auktionsende-Gewonnen', success: false, error: error.message })
    console.error('❌ Auktionsende-Gewonnen:', error.message)
  }

  // 20. Auktionsende-Nicht-Gewonnen
  try {
    const { subject, html, text } = getAuctionEndLostEmail(
      testData.buyerName,
      testData.articleTitle,
      testData.winningBid,
      testData.watchId
    )
    // Nächste E-Mail
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    results.push({ name: 'Auktionsende-Nicht-Gewonnen', success: true })
    await delay(600)
    console.log('✅ Auktionsende-Nicht-Gewonnen gesendet')
    await delay(600) // Rate-Limit: 2/Sekunde
    // Nächste E-Mail
  } catch (error: any) {
    results.push({ name: 'Auktionsende-Nicht-Gewonnen', success: false, error: error.message })
    console.error('❌ Auktionsende-Nicht-Gewonnen:', error.message)
  }

  // 21. Auktionsende-Verkäufer
  try {
    const { subject, html, text } = getAuctionEndSellerEmail(
      testData.sellerName,
      testData.articleTitle,
      testData.winningBid,
      testData.buyerName,
      testData.watchId,
      testData.purchaseId
    )
    // Nächste E-Mail
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    results.push({ name: 'Auktionsende-Verkäufer', success: true })
    await delay(600)
    console.log('✅ Auktionsende-Verkäufer gesendet')
    await delay(600) // Rate-Limit: 2/Sekunde
    // Nächste E-Mail
  } catch (error: any) {
    results.push({ name: 'Auktionsende-Verkäufer', success: false, error: error.message })
    console.error('❌ Auktionsende-Verkäufer:', error.message)
  }

  // 22. Zahlungseingangsbestätigung
  try {
    const { subject, html, text } = getPaymentReceivedEmail(
      testData.sellerName,
      testData.articleTitle,
      testData.paymentAmount,
      testData.buyerName,
      testData.purchaseId
    )
    // Nächste E-Mail
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    results.push({ name: 'Zahlungseingangsbestätigung', success: true })
    await delay(600)
    console.log('✅ Zahlungseingangsbestätigung gesendet')
    await delay(600) // Rate-Limit: 2/Sekunde
    // Nächste E-Mail
  } catch (error: any) {
    results.push({ name: 'Zahlungseingangsbestätigung', success: false, error: error.message })
    console.error('❌ Zahlungseingangsbestätigung:', error.message)
  }

  // 23. Versandbenachrichtigung
  try {
    const { subject, html, text } = getShippingNotificationEmail(
      testData.buyerName,
      testData.articleTitle,
      testData.trackingNumber,
      testData.trackingProvider,
      testData.purchaseId
    )
    // Nächste E-Mail
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    results.push({ name: 'Versandbenachrichtigung', success: true })
    await delay(600)
    console.log('✅ Versandbenachrichtigung gesendet')
    await delay(600) // Rate-Limit: 2/Sekunde
    // Nächste E-Mail
  } catch (error: any) {
    results.push({ name: 'Versandbenachrichtigung', success: false, error: error.message })
    console.error('❌ Versandbenachrichtigung:', error.message)
  }

  // 24. Versandaufforderung
  try {
    const { subject, html, text } = getShippingReminderEmail(
      testData.sellerName,
      testData.articleTitle,
      testData.buyerName,
      testData.purchaseId
    )
    // Nächste E-Mail
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    results.push({ name: 'Versandaufforderung', success: true })
    await delay(600)
    console.log('✅ Versandaufforderung gesendet')
    await delay(600) // Rate-Limit: 2/Sekunde
    // Nächste E-Mail
  } catch (error: any) {
    results.push({ name: 'Versandaufforderung', success: false, error: error.message })
    console.error('❌ Versandaufforderung:', error.message)
  }

  // 25. Preisvorschlag erhalten
  try {
    const { subject, html, text } = getPriceOfferReceivedEmail(
      testData.sellerName,
      testData.articleTitle,
      testData.offerAmount,
      testData.buyerName,
      testData.watchId
    )
    // Nächste E-Mail
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    results.push({ name: 'Preisvorschlag erhalten', success: true })
    await delay(600)
    console.log('✅ Preisvorschlag erhalten gesendet')
    await delay(600) // Rate-Limit: 2/Sekunde
    // Nächste E-Mail
  } catch (error: any) {
    results.push({ name: 'Preisvorschlag erhalten', success: false, error: error.message })
    console.error('❌ Preisvorschlag erhalten:', error.message)
  }

  // 26. Preisvorschlag akzeptiert
  try {
    const { subject, html, text } = getPriceOfferAcceptedEmail(
      testData.buyerName,
      testData.articleTitle,
      testData.offerAmount,
      testData.watchId,
      testData.purchaseId
    )
    // Nächste E-Mail
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    results.push({ name: 'Preisvorschlag akzeptiert', success: true })
    await delay(600)
    console.log('✅ Preisvorschlag akzeptiert gesendet')
    await delay(600) // Rate-Limit: 2/Sekunde
    // Nächste E-Mail
  } catch (error: any) {
    results.push({ name: 'Preisvorschlag akzeptiert', success: false, error: error.message })
    console.error('❌ Preisvorschlag akzeptiert:', error.message)
  }

  // 27. Angebotsbestätigung
  try {
    const { subject, html, text } = getListingConfirmationEmail(
      testData.sellerName,
      testData.articleTitle,
      testData.articleNumber,
      testData.watchId
    )
    // Nächste E-Mail
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    results.push({ name: 'Angebotsbestätigung', success: true })
    await delay(600)
    console.log('✅ Angebotsbestätigung gesendet')
    await delay(600) // Rate-Limit: 2/Sekunde
    // Nächste E-Mail
  } catch (error: any) {
    results.push({ name: 'Angebotsbestätigung', success: false, error: error.message })
    console.error('❌ Angebotsbestätigung:', error.message)
  }

  // 28. Bewertungsaufforderung (Käufer)
  try {
    const { subject, html, text } = getReviewRequestBuyerEmail(
      testData.buyerName,
      testData.articleTitle,
      testData.sellerName,
      testData.purchaseId
    )
    // Nächste E-Mail
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    results.push({ name: 'Bewertungsaufforderung (Käufer)', success: true })
    await delay(600)
    console.log('✅ Bewertungsaufforderung (Käufer) gesendet')
    await delay(600) // Rate-Limit: 2/Sekunde
    // Nächste E-Mail
  } catch (error: any) {
    results.push({ name: 'Bewertungsaufforderung (Käufer)', success: false, error: error.message })
    console.error('❌ Bewertungsaufforderung (Käufer):', error.message)
  }

  // 29. Bewertungsaufforderung (Verkäufer)
  try {
    const { subject, html, text } = getReviewRequestSellerEmail(
      testData.sellerName,
      testData.articleTitle,
      testData.buyerName,
      testData.purchaseId
    )
    // Nächste E-Mail
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    results.push({ name: 'Bewertungsaufforderung (Verkäufer)', success: true })
    await delay(600)
    console.log('✅ Bewertungsaufforderung (Verkäufer) gesendet')
    await delay(600) // Rate-Limit: 2/Sekunde
    // Nächste E-Mail
  } catch (error: any) {
    results.push({
      name: 'Bewertungsaufforderung (Verkäufer)',
      success: false,
      error: error.message,
    })
    console.error('❌ Bewertungsaufforderung (Verkäufer):', error.message)
  }

  // Zusammenfassung
  console.log('\n' + '='.repeat(60))
  console.log('📊 ZUSAMMENFASSUNG')
  console.log('='.repeat(60))

  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  console.log(`\n✅ Erfolgreich: ${successful}/${results.length}`)
  console.log(`❌ Fehlgeschlagen: ${failed}/${results.length}\n`)

  if (failed > 0) {
    console.log('Fehlgeschlagene E-Mails:')
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`  ❌ ${r.name}: ${r.error}`)
      })
  }

  console.log('\n📧 Alle E-Mails wurden an', TEST_EMAIL, 'gesendet!')
  console.log('='.repeat(60) + '\n')
}

// Script ausführen
testAllEmails()
  .then(() => {
    console.log('✅ Test abgeschlossen!')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Fehler beim Test:', error)
    process.exit(1)
  })
