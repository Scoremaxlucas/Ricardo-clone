// Preview script - saves email HTML to files for viewing
import * as fs from 'fs'
import * as path from 'path'
import {
  getEmailVerificationEmail,
  getPurchaseConfirmationEmail,
  getReviewNotificationEmail,
  getSaleNotificationEmail,
  getVerificationApprovalEmail,
} from '../src/lib/email'

const BASE_URL = 'https://helvenda.ch'
const OUTPUT_DIR = path.join(process.cwd(), 'email-previews')

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

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

console.log('📧 Generating 5 email previews...\n')

// 1. E-Mail-Verifizierung
const email1 = getEmailVerificationEmail(testData.userName, testData.verificationUrl)
fs.writeFileSync(path.join(OUTPUT_DIR, '1-email-verification.html'), email1.html)
console.log('✅ 1. Email Verification → email-previews/1-email-verification.html')

// 2. Verifizierungs-Bestätigung
const email2 = getVerificationApprovalEmail(testData.userName)
fs.writeFileSync(path.join(OUTPUT_DIR, '2-verification-approved.html'), email2.html)
console.log('✅ 2. Verification Approved → email-previews/2-verification-approved.html')

// 3. Verkaufsbenachrichtigung
const email3 = getSaleNotificationEmail(
  testData.sellerName,
  testData.buyerName,
  testData.articleTitle,
  testData.finalPrice,
  'auction',
  testData.watchId
)
fs.writeFileSync(path.join(OUTPUT_DIR, '3-sale-notification.html'), email3.html)
console.log('✅ 3. Sale Notification → email-previews/3-sale-notification.html')

// 4. Bewertungsbenachrichtigung
const email4 = getReviewNotificationEmail(testData.sellerName, 'positive', testData.buyerName)
fs.writeFileSync(path.join(OUTPUT_DIR, '4-review-notification.html'), email4.html)
console.log('✅ 4. Review Notification → email-previews/4-review-notification.html')

// 5. Kaufbestätigung
const email5 = getPurchaseConfirmationEmail(
  testData.buyerName,
  testData.sellerName,
  testData.articleTitle,
  testData.finalPrice,
  testData.shippingCost,
  'buy-now',
  testData.purchaseId,
  testData.watchId
)
fs.writeFileSync(path.join(OUTPUT_DIR, '5-purchase-confirmation.html'), email5.html)
console.log('✅ 5. Purchase Confirmation → email-previews/5-purchase-confirmation.html')

// Create index file
const indexHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Helvenda Email Previews</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; background: #f5f5f5; }
    h1 { color: #0f766e; }
    .email-list { list-style: none; padding: 0; }
    .email-list li { margin: 16px 0; }
    .email-list a { display: inline-block; padding: 12px 24px; background: #0f766e; color: white; text-decoration: none; border-radius: 8px; }
    .email-list a:hover { background: #0d9488; }
  </style>
</head>
<body>
  <h1>📧 Helvenda Email Previews (Watch-Out Style)</h1>
  <ul class="email-list">
    <li><a href="1-email-verification.html">1. Email Verification</a></li>
    <li><a href="2-verification-approved.html">2. Verification Approved</a></li>
    <li><a href="3-sale-notification.html">3. Sale Notification</a></li>
    <li><a href="4-review-notification.html">4. Review Notification</a></li>
    <li><a href="5-purchase-confirmation.html">5. Purchase Confirmation</a></li>
  </ul>
</body>
</html>
`
fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), indexHtml)

console.log('\n📁 All email previews saved to: email-previews/')
console.log('🌐 Open email-previews/index.html in your browser to view them!\n')
