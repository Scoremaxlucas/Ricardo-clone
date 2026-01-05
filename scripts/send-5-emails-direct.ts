// Direct email sending script with proper Resend initialization
import { config } from 'dotenv'
config()

import { Resend } from 'resend'
import {
  getEmailVerificationEmail,
  getPurchaseConfirmationEmail,
  getReviewNotificationEmail,
  getSaleNotificationEmail,
  getVerificationApprovalEmail,
} from '../src/lib/email'

const TEST_EMAIL = 'lucasrodrigues.gafner@outlook.com'
const BASE_URL = process.env.NEXTAUTH_URL || 'https://helvenda.ch'

// Initialize Resend client directly
const resendApiKey = process.env.RESEND_API_KEY
if (!resendApiKey) {
  console.error('❌ RESEND_API_KEY not found in environment variables')
  process.exit(1)
}

const resend = new Resend(resendApiKey)
const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function sendEmailDirect(subject: string, html: string, text: string) {
  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: [TEST_EMAIL],
      subject,
      html,
      text,
    })

    if (result.error) {
      throw new Error(result.error.message || 'Unknown Resend error')
    }

    return { success: true, messageId: result.data?.id }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to send email')
  }
}

async function sendSampleEmails() {
  console.log('📧 Sending 5 sample emails in Watch-Out style...\n')
  console.log(`From: ${fromEmail}`)
  console.log(`To: ${TEST_EMAIL}\n`)

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
  }

  const results: Array<{ name: string; success: boolean; error?: string; messageId?: string }> = []

  // 1. E-Mail-Verifizierung
  try {
    console.log('📧 Sending Email Verification...')
    const email = getEmailVerificationEmail(testData.userName, testData.verificationUrl)
    const result = await sendEmailDirect(email.subject, email.html, email.text)
    results.push({ name: 'Email Verification', success: true, messageId: result.messageId })
    console.log(`✅ Sent! Message ID: ${result.messageId}\n`)
    await delay(1000)
  } catch (error: any) {
    results.push({ name: 'Email Verification', success: false, error: error.message })
    console.error(`❌ Failed: ${error.message}\n`)
  }

  // 2. Verifizierungs-Bestätigung
  try {
    console.log('📧 Sending Verification Approval...')
    const email = getVerificationApprovalEmail(testData.userName)
    const result = await sendEmailDirect(email.subject, email.html, email.text)
    results.push({ name: 'Verification Approval', success: true, messageId: result.messageId })
    console.log(`✅ Sent! Message ID: ${result.messageId}\n`)
    await delay(1000)
  } catch (error: any) {
    results.push({ name: 'Verification Approval', success: false, error: error.message })
    console.error(`❌ Failed: ${error.message}\n`)
  }

  // 3. Verkaufsbenachrichtigung
  try {
    console.log('📧 Sending Sale Notification...')
    const email = getSaleNotificationEmail(
      testData.sellerName,
      testData.buyerName,
      testData.articleTitle,
      testData.finalPrice,
      'auction',
      testData.watchId
    )
    const result = await sendEmailDirect(email.subject, email.html, email.text)
    results.push({ name: 'Sale Notification', success: true, messageId: result.messageId })
    console.log(`✅ Sent! Message ID: ${result.messageId}\n`)
    await delay(1000)
  } catch (error: any) {
    results.push({ name: 'Sale Notification', success: false, error: error.message })
    console.error(`❌ Failed: ${error.message}\n`)
  }

  // 4. Bewertungsbenachrichtigung
  try {
    console.log('📧 Sending Review Notification...')
    const email = getReviewNotificationEmail(testData.sellerName, 'positive', testData.buyerName)
    const result = await sendEmailDirect(email.subject, email.html, email.text)
    results.push({ name: 'Review Notification', success: true, messageId: result.messageId })
    console.log(`✅ Sent! Message ID: ${result.messageId}\n`)
    await delay(1000)
  } catch (error: any) {
    results.push({ name: 'Review Notification', success: false, error: error.message })
    console.error(`❌ Failed: ${error.message}\n`)
  }

  // 5. Kaufbestätigung
  try {
    console.log('📧 Sending Purchase Confirmation...')
    const email = getPurchaseConfirmationEmail(
      testData.buyerName,
      testData.sellerName,
      testData.articleTitle,
      testData.finalPrice,
      testData.shippingCost,
      'buy-now',
      testData.purchaseId,
      testData.watchId
    )
    const result = await sendEmailDirect(email.subject, email.html, email.text)
    results.push({ name: 'Purchase Confirmation', success: true, messageId: result.messageId })
    console.log(`✅ Sent! Message ID: ${result.messageId}\n`)
    await delay(1000)
  } catch (error: any) {
    results.push({ name: 'Purchase Confirmation', success: false, error: error.message })
    console.error(`❌ Failed: ${error.message}\n`)
  }

  // Summary
  console.log('='.repeat(60))
  console.log('📊 SUMMARY')
  console.log('='.repeat(60))
  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  console.log(`\n✅ Successful: ${successful}/5`)
  console.log(`❌ Failed: ${failed}/5\n`)

  if (failed > 0) {
    console.log('Failed emails:')
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`  ❌ ${r.name}: ${r.error}`)
      })
  }

  console.log(`\n📧 Check your inbox at ${TEST_EMAIL}!`)
  console.log('='.repeat(60) + '\n')
}

sendSampleEmails()
  .then(() => {
    console.log('✅ Done!')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
