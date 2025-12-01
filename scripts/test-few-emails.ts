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

// Jetzt importieren, nachdem die Umgebungsvariablen geladen wurden
import { sendEmail } from '../src/lib/email'
import {
  getSaleNotificationEmail,
  getVerificationApprovalEmail,
  getPurchaseConfirmationEmail,
  getBidConfirmationEmail,
  getPriceOfferReceivedEmail,
} from '../src/lib/email'

const TEST_EMAIL = 'lucasrodrigues.gafner@outlook.com'
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3002'

// Hilfsfunktion für Verzögerung (um Rate-Limiting zu vermeiden)
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function testFewEmails() {
  console.log('📧 Starte Test-Versand von 5 korrigierten E-Mails...\n')
  console.log(`Empfänger: ${TEST_EMAIL}\n`)
  console.log('⏳ Warte 1 Sekunde zwischen E-Mails (Rate-Limit: 2/Sekunde)...\n')

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

  // 1. Verkaufsbenachrichtigung
  try {
    const { subject, html, text } = getSaleNotificationEmail(
      testData.sellerName,
      testData.buyerName,
      testData.articleTitle,
      testData.paymentAmount,
      'auction',
      testData.watchId
    )
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    console.log('✅ Verkaufsbenachrichtigung gesendet')
    await delay(600)
  } catch (error: any) {
    console.error('❌ Verkaufsbenachrichtigung:', error.message)
    await delay(600)
  }

  // 2. Verifizierungs-Bestätigung
  try {
    const { subject, html, text } = getVerificationApprovalEmail(testData.userName, TEST_EMAIL)
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    console.log('✅ Verifizierungs-Bestätigung gesendet')
    await delay(600)
  } catch (error: any) {
    console.error('❌ Verifizierungs-Bestätigung:', error.message)
    await delay(600)
  }

  // 3. Kaufbestätigung
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
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    console.log('✅ Kaufbestätigung gesendet')
    await delay(600)
  } catch (error: any) {
    console.error('❌ Kaufbestätigung:', error.message)
    await delay(600)
  }

  // 4. Gebotsbestätigung
  try {
    const { subject, html, text } = getBidConfirmationEmail(
      testData.buyerName,
      testData.articleTitle,
      testData.bidAmount,
      testData.watchId
    )
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    console.log('✅ Gebotsbestätigung gesendet')
    await delay(600)
  } catch (error: any) {
    console.error('❌ Gebotsbestätigung:', error.message)
    await delay(600)
  }

  // 5. Preisvorschlag erhalten
  try {
    const { subject, html, text } = getPriceOfferReceivedEmail(
      testData.sellerName,
      testData.articleTitle,
      testData.offerAmount,
      testData.buyerName,
      testData.watchId
    )
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    console.log('✅ Preisvorschlag erhalten gesendet')
    await delay(600)
  } catch (error: any) {
    console.error('❌ Preisvorschlag erhalten:', error.message)
    await delay(600)
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ 5 korrigierte E-Mails erfolgreich versendet!')
  console.log('='.repeat(60) + '\n')
}

// Script ausführen
testFewEmails()
  .then(() => {
    console.log('✅ Test abgeschlossen!')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Fehler beim Test:', error)
    process.exit(1)
  })
