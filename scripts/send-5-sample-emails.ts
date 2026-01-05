// Lade Umgebungsvariablen mit dotenv VOR dem Import
import { config } from 'dotenv'
config() // Lädt .env Datei

// Jetzt importieren, nachdem die Umgebungsvariablen geladen wurden
import {
  getEmailVerificationEmail,
  getPurchaseConfirmationEmail,
  getReviewNotificationEmail,
  getSaleNotificationEmail,
  getVerificationApprovalEmail,
  sendEmail,
} from '../src/lib/email'

const TEST_EMAIL = 'lucasrodrigues.gafner@outlook.com'
const BASE_URL = process.env.NEXTAUTH_URL || 'https://helvenda.ch'

// Hilfsfunktion für Verzögerung (um Rate-Limiting zu vermeiden)
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function sendSampleEmails() {
  console.log('📧 Sende 5 Beispiel-E-Mails im neuen Watch-Out Style...\n')
  console.log(`Empfänger: ${TEST_EMAIL}\n`)

  const testData = {
    userName: 'Lucas',
    sellerName: 'Max Mustermann',
    buyerName: 'Anna Schmidt',
    articleTitle: 'Rolex Submariner Date 2020',
    watchId: 'test-watch-123',
    purchaseId: 'test-purchase-456',
    verificationUrl: `${BASE_URL}/verify-email?token=test-token-123`,
    finalPrice: 12500,
    shippingCost: 15,
    answerContent:
      'Ja, die Uhr ist noch mit Box und Papieren. Sie wurde nie poliert und ist im Top-Zustand.',
  }

  const results: Array<{ name: string; success: boolean; error?: string }> = []

  // 1. E-Mail-Verifizierung
  try {
    console.log('📧 Sende E-Mail-Verifizierung...')
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
    console.log('✅ E-Mail-Verifizierung gesendet\n')
    await delay(1000)
  } catch (error: any) {
    results.push({ name: 'E-Mail-Verifizierung', success: false, error: error.message })
    console.error('❌ E-Mail-Verifizierung:', error.message, '\n')
  }

  // 2. Verifizierungs-Bestätigung
  try {
    console.log('📧 Sende Verifizierungs-Bestätigung...')
    const { subject, html, text } = getVerificationApprovalEmail(testData.userName)
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    results.push({ name: 'Verifizierungs-Bestätigung', success: true })
    console.log('✅ Verifizierungs-Bestätigung gesendet\n')
    await delay(1000)
  } catch (error: any) {
    results.push({ name: 'Verifizierungs-Bestätigung', success: false, error: error.message })
    console.error('❌ Verifizierungs-Bestätigung:', error.message, '\n')
  }

  // 3. Verkaufsbenachrichtigung
  try {
    console.log('📧 Sende Verkaufsbenachrichtigung...')
    const { subject, html, text } = getSaleNotificationEmail(
      testData.sellerName,
      testData.buyerName,
      testData.articleTitle,
      testData.finalPrice,
      'auction',
      testData.watchId
    )
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    results.push({ name: 'Verkaufsbenachrichtigung', success: true })
    console.log('✅ Verkaufsbenachrichtigung gesendet\n')
    await delay(1000)
  } catch (error: any) {
    results.push({ name: 'Verkaufsbenachrichtigung', success: false, error: error.message })
    console.error('❌ Verkaufsbenachrichtigung:', error.message, '\n')
  }

  // 4. Bewertungsbenachrichtigung
  try {
    console.log('📧 Sende Bewertungsbenachrichtigung...')
    const { subject, html, text } = getReviewNotificationEmail(
      testData.sellerName,
      'positive',
      testData.buyerName
    )
    await sendEmail({
      to: TEST_EMAIL,
      subject,
      html,
      text,
    })
    results.push({ name: 'Bewertungsbenachrichtigung', success: true })
    console.log('✅ Bewertungsbenachrichtigung gesendet\n')
    await delay(1000)
  } catch (error: any) {
    results.push({ name: 'Bewertungsbenachrichtigung', success: false, error: error.message })
    console.error('❌ Bewertungsbenachrichtigung:', error.message, '\n')
  }

  // 5. Kaufbestätigung
  try {
    console.log('📧 Sende Kaufbestätigung...')
    const { subject, html, text } = getPurchaseConfirmationEmail(
      testData.buyerName,
      testData.sellerName,
      testData.articleTitle,
      testData.finalPrice,
      testData.shippingCost,
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
    results.push({ name: 'Kaufbestätigung', success: true })
    console.log('✅ Kaufbestätigung gesendet\n')
    await delay(1000)
  } catch (error: any) {
    results.push({ name: 'Kaufbestätigung', success: false, error: error.message })
    console.error('❌ Kaufbestätigung:', error.message, '\n')
  }

  // Zusammenfassung
  console.log('='.repeat(60))
  console.log('📊 ZUSAMMENFASSUNG')
  console.log('='.repeat(60))

  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  console.log(`\n✅ Erfolgreich: ${successful}/5`)
  console.log(`❌ Fehlgeschlagen: ${failed}/5\n`)

  if (failed > 0) {
    console.log('Fehlgeschlagene E-Mails:')
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`  ❌ ${r.name}: ${r.error}`)
      })
  }

  console.log(`\n📧 Alle E-Mails wurden an ${TEST_EMAIL} gesendet!`)
  console.log('='.repeat(60) + '\n')
}

// Script ausführen
sendSampleEmails()
  .then(() => {
    console.log('✅ Test abgeschlossen!')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Fehler beim Test:', error)
    process.exit(1)
  })
