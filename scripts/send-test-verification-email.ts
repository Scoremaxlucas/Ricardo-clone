#!/usr/bin/env tsx

/**
 * Script zum Versenden einer Test-Verifizierungs-E-Mail
 *
 * Verwendung:
 *   npm run test-verification-email -- --email lucasrodrigues.gafner@outlook.com
 */

import { prisma } from '../src/lib/prisma'
import { sendEmail, getEmailVerificationEmail } from '../src/lib/email'
import crypto from 'crypto'

async function main() {
  const args = process.argv.slice(2)

  let email: string | null = null

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) {
      email = args[i + 1]
    }
  }

  if (!email) {
    email = 'lucasrodrigues.gafner@outlook.com' // Default für Tests
  }

  const normalizedEmail = email.toLowerCase().trim()

  console.log('\n📧 TEST-VERIFIZIERUNGS-E-MAIL VERSENDEN\n')
  console.log('='.repeat(50))
  console.log(`Empfänger: ${normalizedEmail}`)
  console.log('='.repeat(50))
  console.log('')

  // Generiere Test-Token
  const testToken = crypto.randomBytes(32).toString('hex')
  const baseUrl =
    process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'
  const verificationUrl = `${baseUrl}/verify-email?token=${testToken}`

  console.log('🔧 Generiere Test-Verifizierungs-URL...')
  console.log(`   URL: ${verificationUrl}`)
  console.log('')

  // Generiere E-Mail-Template
  const firstName = 'Lucas' // Test-Name
  const { subject, html, text } = getEmailVerificationEmail(firstName, verificationUrl)

  console.log('📝 E-Mail-Template generiert:')
  console.log(`   Subject: ${subject}`)
  console.log(`   HTML Length: ${html.length} Zeichen`)
  console.log(`   Text Length: ${text.length} Zeichen`)
  console.log('')

  console.log('📧 Versende Test-E-Mail...')
  console.log('')

  // Versende E-Mail
  try {
    const emailResult = await sendEmail({
      to: normalizedEmail,
      subject,
      html,
      text,
    })

    console.log('')
    console.log('='.repeat(50))

    if (emailResult.success) {
      console.log('✅ TEST-E-MAIL ERFOLGREICH VERSENDET!')
      console.log('')
      console.log('📋 Details:')
      console.log(`   Empfänger: ${normalizedEmail}`)
      console.log(`   Betreff: ${subject}`)
      console.log(`   Message ID: ${emailResult.messageId || 'N/A'}`)
      console.log(`   Methode: ${emailResult.method}`)
      console.log('')
      console.log('💡 Überprüfen Sie Ihr E-Mail-Postfach:')
      console.log(`   → ${normalizedEmail}`)
      console.log('   → Auch Spam-Ordner prüfen')
      console.log('')
      console.log('⚠️  WICHTIG: Dies ist eine Test-E-Mail!')
      console.log('   Der Verifizierungs-Link funktioniert NICHT (Test-Token)')
      console.log('   Sie können nur sehen, wie die E-Mail aussieht.')
    } else {
      console.log('❌ FEHLER BEIM VERSENDEN DER TEST-E-MAIL')
      console.log('')
      console.log('📋 Fehlerdetails:')
      console.log(`   Error: ${emailResult.error}`)
      console.log(`   Methode: ${emailResult.method}`)
      console.log('')
      console.log('💡 Mögliche Ursachen:')
      console.log('   → RESEND_API_KEY nicht korrekt')
      console.log('   → E-Mail-Adresse nicht erlaubt (nur eigene E-Mail im Testmodus)')
      console.log('   → Domain nicht verifiziert')
    }

    console.log('='.repeat(50))
    console.log('')
  } catch (error: any) {
    console.error('')
    console.error('❌ FEHLER:', error.message)
    console.error('   Stack:', error.stack)
    console.error('')
    process.exit(1)
  }
}

main()
  .catch(e => {
    console.error('❌ Fehler:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
