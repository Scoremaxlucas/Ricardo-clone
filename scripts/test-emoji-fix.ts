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
  getFirstReminderEmail,
  getInvoiceNotificationEmail,
  getAuctionEndWonEmail,
  getReviewNotificationEmail,
} from '../src/lib/email'

const TEST_EMAIL = 'lucasrodrigues.gafner@outlook.com'
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3002'

// Hilfsfunktion für Verzögerung (um Rate-Limiting zu vermeiden)
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function testEmojiFix() {
  console.log('📧 Starte Test-Versand von 5 E-Mails mit korrigierten Emojis...\n')
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

  // 1. Verkaufsbenachrichtigung (mit ✓ statt 🎉)
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
    console.log('✅ Verkaufsbenachrichtigung gesendet (✓ statt 🎉)')
    await delay(600)
  } catch (error: any) {
    console.error('❌ Verkaufsbenachrichtigung:', error.message)
    await delay(600)
  }

  // 2. Erste Zahlungserinnerung (mit [!] statt ⚠️)
  try {
    const { subject, html, text } = getFirstReminderEmail(
      testData.userName,
      testData.invoiceNumber,
      testData.total,
      testData.dueDate,
      testData.invoiceId
    )
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    console.log('✅ Erste Zahlungserinnerung gesendet ([!] statt ⚠️)')
    await delay(600)
  } catch (error: any) {
    console.error('❌ Erste Zahlungserinnerung:', error.message)
    await delay(600)
  }

  // 3. Rechnungsbenachrichtigung (mit [Rechnung] statt 📄)
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
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    console.log('✅ Rechnungsbenachrichtigung gesendet ([Rechnung] statt 📄)')
    await delay(600)
  } catch (error: any) {
    console.error('❌ Rechnungsbenachrichtigung:', error.message)
    await delay(600)
  }

  // 4. Auktionsende-Gewonnen (mit ✓ statt 🎉)
  try {
    const { subject, html, text } = getAuctionEndWonEmail(
      testData.buyerName,
      testData.articleTitle,
      testData.winningBid,
      testData.watchId,
      testData.purchaseId
    )
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    console.log('✅ Auktionsende-Gewonnen gesendet (✓ statt 🎉)')
    await delay(600)
  } catch (error: any) {
    console.error('❌ Auktionsende-Gewonnen:', error.message)
    await delay(600)
  }

  // 5. Bewertungsbenachrichtigung (mit [+] statt 👍)
  try {
    const { subject, html, text } = getReviewNotificationEmail(
      testData.userName,
      'positive',
      testData.buyerName
    )
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    console.log('✅ Bewertungsbenachrichtigung gesendet ([+] statt 👍)')
    await delay(600)
  } catch (error: any) {
    console.error('❌ Bewertungsbenachrichtigung:', error.message)
    await delay(600)
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ 5 E-Mails mit korrigierten Emojis erfolgreich versendet!')
  console.log('='.repeat(60) + '\n')
  console.log('📋 Emoji-Ersetzungen:')
  console.log('   🎉 → ✓ (für Erfolgsmeldungen)')
  console.log('   ⚠️ → [!] (für Warnungen)')
  console.log('   📄 → [Rechnung] (für Rechnungen)')
  console.log('   ✅ → ✓ (für Bestätigungen)')
  console.log('   👍 → [+] (für positive Bewertungen)')
  console.log('   😐 → [=] (für neutrale Bewertungen)')
  console.log('   👎 → [-] (für negative Bewertungen)')
  console.log('')
}

// Script ausführen
testEmojiFix()
  .then(() => {
    console.log('✅ Test abgeschlossen!')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Fehler beim Test:', error)
    process.exit(1)
  })
