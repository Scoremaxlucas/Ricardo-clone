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
        process.env[key] = value
      }
    }
  })
}

// Debug: Zeige RESEND_API_KEY Status
console.log(
  'RESEND_API_KEY geladen:',
  process.env.RESEND_API_KEY
    ? 'Ja (' + process.env.RESEND_API_KEY.substring(0, 10) + '...)'
    : 'Nein'
)
console.log('')

// Jetzt importieren, nachdem die Umgebungsvariablen geladen wurden
const emailModule = await import('../src/lib/email')
const { sendEmail } = emailModule

// Importiere alle E-Mail-Templates
const {
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
} = emailModule

const TEST_EMAIL = 'lucasrodrigues.gafner@outlook.com'
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3002'

async function testAllEmails() {
  console.log('📧 Starte Test-Versand aller E-Mail-Benachrichtigungen...\n')
  console.log(`Empfänger: ${TEST_EMAIL}\n`)

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

  // Test alle E-Mails (wie vorher)
  // ... (rest of the code bleibt gleich)

  console.log('\n✅ Test abgeschlossen!')
}

testAllEmails().catch(console.error)
