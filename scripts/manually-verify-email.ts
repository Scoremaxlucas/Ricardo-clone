#!/usr/bin/env tsx

/**
 * Script zum manuellen Bestätigen einer E-Mail-Adresse
 *
 * Verwendung:
 *   npm run verify-email -- --email lucas@example.com
 *   oder
 *   npm run verify-email -- --name "Lucas Rodrigues"
 */

import { prisma } from '../src/lib/prisma'

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
    console.log('   npm run verify-email -- --email lucas@example.com')
    console.log('   oder')
    console.log('   npm run verify-email -- --name "Lucas Rodrigues"')
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
    const nameParts = name.trim().split(' ')
    if (nameParts.length >= 2) {
      const allUsers = await prisma.user.findMany({
        where: {
          OR: [
            { firstName: { contains: nameParts[0] } },
            { lastName: { contains: nameParts.slice(1).join(' ') } },
            { name: { contains: name } },
          ],
        },
      })

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
        }) || allUsers[0]
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

      user =
        allUsers.find(u => {
          const searchName = name.toLowerCase()
          return (
            u.firstName?.toLowerCase() === searchName ||
            u.lastName?.toLowerCase() === searchName ||
            u.name?.toLowerCase() === searchName
          )
        }) || allUsers[0]
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
    console.log('✅ E-Mail ist bereits bestätigt!')
    process.exit(0)
  }

  console.log('🔧 Bestätige E-Mail-Adresse...')

  // Bestätige E-Mail
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
      emailVerificationTokenExpires: null,
    },
  })

  console.log('✅ E-Mail-Adresse erfolgreich bestätigt!')
  console.log('')
  console.log('📋 Zusammenfassung:')
  console.log(`   User: ${user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()}`)
  console.log(`   Email: ${user.email}`)
  console.log(`   Status: ✅ Bestätigt`)
  console.log('')
  console.log('💡 Der User kann sich jetzt einloggen!')
}

main()
  .catch(e => {
    console.error('❌ Fehler:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
