#!/usr/bin/env tsx

/**
 * Script zum nachträglichen Versenden einer Verifizierungs-E-Mail
 *
 * Verwendung:
 *   npm run resend-verification -- --email lucas@example.com
 *   oder
 *   npm run resend-verification -- --name "Lucas Rodrigues"
 */

import { prisma } from '../src/lib/prisma'
import { sendEmail, getEmailVerificationEmail } from '../src/lib/email'
import crypto from 'crypto'

async function main() {
  const args = process.argv.slice(2)

  let email: string | null = null
  let name: string | null = null

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) {
      email = args[i + 1]
    }
    if (args[i] === '--name' && args[i + 1]) {
      name = args[i + 1]
    }
  }

  if (!email && !name) {
    console.log('\n❌ Fehler: Bitte geben Sie entweder --email oder --name an')
    console.log('\n📝 Verwendung:')
    console.log('   npm run resend-verification -- --email lucas@example.com')
    console.log('   oder')
    console.log('   npm run resend-verification -- --name "Lucas Rodrigues"')
    process.exit(1)
  }

  console.log('\n🔍 Suche nach User...')
  console.log(`   Email: ${email || '(nicht angegeben)'}`)
  console.log(`   Name: ${name || '(nicht angegeben)'}`)
  console.log('')

  // Finde User
  let user
  if (email) {
    user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })
  } else if (name) {
    // Suche nach Name (kann firstName + lastName oder name sein)
    // SQLite unterstützt kein mode: 'insensitive', daher verwenden wir contains ohne mode
    const nameParts = name.trim().split(' ')
    if (nameParts.length >= 2) {
      // Suche alle User und filtere manuell (case-insensitive)
      const allUsers = await prisma.user.findMany({
        where: {
          OR: [
            { firstName: { contains: nameParts[0] } },
            { lastName: { contains: nameParts.slice(1).join(' ') } },
            { name: { contains: name } },
          ],
        },
      })

      // Filtere case-insensitive
      user =
        allUsers.find(u => {
          const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim().toLowerCase()
          const searchName = name.toLowerCase()
          return (
            fullName === searchName ||
            u.name?.toLowerCase() === searchName ||
            (u.firstName?.toLowerCase() === nameParts[0].toLowerCase() &&
              u.lastName?.toLowerCase() === nameParts.slice(1).join(' ').toLowerCase())
          )
        }) || allUsers[0] // Fallback: nimm ersten Treffer
    } else {
      const allUsers = await prisma.user.findMany({
        where: {
          OR: [
            { firstName: { contains: name } },
            { lastName: { contains: name } },
            { name: { contains: name } },
          ],
        },
      })

      // Filtere case-insensitive
      user =
        allUsers.find(u => {
          const searchName = name.toLowerCase()
          return (
            u.firstName?.toLowerCase() === searchName ||
            u.lastName?.toLowerCase() === searchName ||
            u.name?.toLowerCase() === searchName
          )
        }) || allUsers[0] // Fallback: nimm ersten Treffer
    }
  }

  if (!user) {
    console.log('❌ User nicht gefunden!')
    process.exit(1)
  }

  console.log('✅ User gefunden:')
  console.log(`   ID: ${user.id}`)
  console.log(`   Name: ${user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()}`)
  console.log(`   Email: ${user.email}`)
  console.log(`   E-Mail bestätigt: ${user.emailVerified ? '✅ Ja' : '❌ Nein'}`)
  console.log('')

  if (user.emailVerified) {
    console.log('⚠️  Warnung: E-Mail ist bereits bestätigt!')
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    const answer = await new Promise<string>(resolve => {
      readline.question('Trotzdem neue Verifizierungs-E-Mail senden? (j/n): ', resolve)
    })
    readline.close()

    if (
      answer.toLowerCase() !== 'j' &&
      answer.toLowerCase() !== 'ja' &&
      answer.toLowerCase() !== 'y' &&
      answer.toLowerCase() !== 'yes'
    ) {
      console.log('❌ Abgebrochen.')
      process.exit(0)
    }
  }

  // Generiere neuen Verifizierungstoken
  const verificationToken = crypto.randomBytes(32).toString('hex')
  const tokenExpires = new Date()
  tokenExpires.setHours(tokenExpires.getHours() + 24) // Token gültig für 24 Stunden

  console.log('🔧 Generiere neuen Verifizierungstoken...')

  // Update User mit neuem Token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: false, // Setze zurück auf false
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpires: tokenExpires,
    },
  })

  console.log('✅ Token generiert und gespeichert')
  console.log('')

  // Generiere Bestätigungslink
  const baseUrl =
    process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'
  const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`

  console.log('📧 Versende Verifizierungs-E-Mail...')
  console.log(`   An: ${user.email}`)
  console.log(`   Link: ${verificationUrl}`)
  console.log('')

  // Versende E-Mail
  try {
    const userName = user.firstName || user.name || 'Benutzer'
    const { subject, html, text } = getEmailVerificationEmail(userName, verificationUrl)

    const emailResult = await sendEmail({
      to: user.email,
      subject,
      html,
      text,
    })

    if (emailResult.success) {
      console.log('✅ Verifizierungs-E-Mail erfolgreich versendet!')
      console.log('')
      console.log('📋 Zusammenfassung:')
      console.log(
        `   User: ${user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()}`
      )
      console.log(`   Email: ${user.email}`)
      console.log(`   Bestätigungslink: ${verificationUrl}`)
      console.log('')
      console.log('💡 Der User kann jetzt auf den Link klicken, um seine E-Mail zu bestätigen.')
    } else {
      console.log('❌ Fehler beim Versenden der E-Mail:')
      console.log(`   ${emailResult.error}`)
      console.log('')
      console.log('📋 Manueller Link:')
      console.log(`   ${verificationUrl}`)
    }
  } catch (error: any) {
    console.error('❌ Fehler beim Versenden der E-Mail:', error)
    console.log('')
    console.log('📋 Manueller Link:')
    console.log(`   ${verificationUrl}`)
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
