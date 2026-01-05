// Comprehensive email deliverability test script
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

// Get email configuration (with display name support)
const rawFromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
const fromEmail = rawFromEmail.includes('<') ? rawFromEmail : `Helvenda <${rawFromEmail}>`
const replyTo = process.env.RESEND_REPLY_TO || 'support@helvenda.ch'

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function sendEmailDirect(subject: string, html: string, text: string) {
  try {
    const result = await resend.emails.send({
      from: fromEmail,
      replyTo: replyTo, // NEW: Reply-To header for deliverability
      to: [TEST_EMAIL],
      subject,
      html,
      text,
      headers: {
        'X-Mailer': 'Helvenda Mailer',
      },
    })

    if (result.error) {
      throw new Error(result.error.message || 'Unknown Resend error')
    }

    return { success: true, messageId: result.data?.id }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to send email')
  }
}

async function checkCriticalIssues() {
  console.log('🔍 Checking for critical issues...\n')

  const issues: string[] = []
  const warnings: string[] = []

  // Check 1: API Key
  if (!resendApiKey) {
    issues.push('❌ RESEND_API_KEY is not set')
  } else if (!resendApiKey.startsWith('re_')) {
    issues.push('⚠️ RESEND_API_KEY format looks incorrect (should start with "re_")')
  } else {
    console.log('✅ RESEND_API_KEY is set and format looks correct')
  }

  // Check 2: From Email
  if (!process.env.RESEND_FROM_EMAIL) {
    warnings.push('⚠️ RESEND_FROM_EMAIL not set (using default onboarding@resend.dev)')
  } else {
    const from = process.env.RESEND_FROM_EMAIL
    if (from.includes('noreply')) {
      issues.push('❌ RESEND_FROM_EMAIL contains "noreply" - this triggers spam filters!')
    } else if (from.includes('hello@') || from.includes('info@') || from.includes('support@')) {
      console.log('✅ RESEND_FROM_EMAIL uses friendly address (good for deliverability)')
    } else {
      warnings.push('⚠️ Consider using hello@helvenda.ch or info@helvenda.ch instead of ' + from)
    }
  }

  // Check 3: Reply-To
  if (!process.env.RESEND_REPLY_TO) {
    warnings.push('⚠️ RESEND_REPLY_TO not set (using default support@helvenda.ch)')
  } else {
    console.log('✅ RESEND_REPLY_TO is set')
  }

  // Check 4: DNS Records (basic check via dig)
  console.log('\n🔍 Checking DNS records...')
  try {
    const { execSync } = require('child_process')

    // Check SPF
    try {
      const spfResult = execSync('dig TXT helvenda.ch +short', { encoding: 'utf-8', timeout: 5000 })
      if (spfResult.includes('resend.com')) {
        console.log('✅ SPF record includes Resend')
      } else {
        warnings.push('⚠️ SPF record may not include Resend - check DNS')
      }
    } catch (e) {
      warnings.push('⚠️ Could not verify SPF record (dig command failed)')
    }

    // Check DMARC
    try {
      const dmarcResult = execSync('dig TXT _dmarc.helvenda.ch +short', {
        encoding: 'utf-8',
        timeout: 5000,
      })
      if (dmarcResult.includes('DMARC1')) {
        console.log('✅ DMARC record found')
      } else {
        warnings.push('⚠️ DMARC record not found - add it to Cloudflare DNS')
      }
    } catch (e) {
      warnings.push('⚠️ Could not verify DMARC record (dig command failed)')
    }

    // Check DKIM
    try {
      const dkimResult = execSync('dig TXT resend._domainkey.helvenda.ch +short', {
        encoding: 'utf-8',
        timeout: 5000,
      })
      if (dkimResult.includes('MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQ')) {
        console.log('✅ DKIM record found')
      } else {
        warnings.push('⚠️ DKIM record not found or incorrect')
      }
    } catch (e) {
      warnings.push('⚠️ Could not verify DKIM record (dig command failed)')
    }
  } catch (e) {
    warnings.push('⚠️ DNS verification skipped (dig not available)')
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  if (issues.length > 0) {
    console.log('❌ CRITICAL ISSUES:')
    issues.forEach(issue => console.log(`  ${issue}`))
  }
  if (warnings.length > 0) {
    console.log('\n⚠️ WARNINGS:')
    warnings.forEach(warning => console.log(`  ${warning}`))
  }
  if (issues.length === 0 && warnings.length === 0) {
    console.log('✅ No critical issues found!')
  }
  console.log('='.repeat(60) + '\n')

  return { issues, warnings }
}

async function sendSampleEmails() {
  console.log('📧 Sending 5 test emails with new deliverability settings...\n')
  console.log(`From: ${fromEmail}`)
  console.log(`Reply-To: ${replyTo}`)
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
  console.log('📊 EMAIL SENDING SUMMARY')
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
  console.log('💡 Also check spam/junk folder to verify deliverability improvements')
  console.log('='.repeat(60) + '\n')

  return results
}

async function main() {
  console.log('🚀 Email Deliverability Test\n')
  console.log('='.repeat(60) + '\n')

  // Step 1: Check for critical issues
  const { issues, warnings } = await checkCriticalIssues()

  // Step 2: Send test emails
  const results = await sendSampleEmails()

  // Final summary
  console.log('='.repeat(60))
  console.log('📋 FINAL SUMMARY')
  console.log('='.repeat(60))
  console.log(`Critical Issues: ${issues.length}`)
  console.log(`Warnings: ${warnings.length}`)
  console.log(`Emails Sent: ${results.filter(r => r.success).length}/5`)
  console.log('='.repeat(60) + '\n')

  if (issues.length > 0) {
    console.log('⚠️ Please fix critical issues before deploying to production!\n')
    process.exit(1)
  }
}

main()
  .then(() => {
    console.log('✅ Test complete!')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
