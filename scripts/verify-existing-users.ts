#!/usr/bin/env tsx

/**
 * Script zum automatischen Bestätigen aller bestehenden User
 * 
 * Dieses Script markiert alle User, die bereits ein Passwort haben,
 * als E-Mail-verifiziert, da sie sich vorher schon anmelden konnten.
 * 
 * Verwendung:
 *   npm run verify-existing-users
 */

import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('\n🔍 Suche nach bestehenden Usern ohne E-Mail-Bestätigung...')
  console.log('')
  
  // Finde alle User, die ein Passwort haben aber nicht verifiziert sind
  const unverifiedUsers = await prisma.user.findMany({
    where: {
      emailVerified: false,
      password: { not: null } // Nur User mit Passwort (können sich anmelden)
    },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      emailVerified: true,
      createdAt: true
    }
  })
  
  console.log(`📊 Gefunden: ${unverifiedUsers.length} User ohne E-Mail-Bestätigung`)
  console.log('')
  
  if (unverifiedUsers.length === 0) {
    console.log('✅ Alle User sind bereits verifiziert!')
    return
  }
  
  console.log('📋 User die verifiziert werden:')
  unverifiedUsers.forEach((user, index) => {
    const name = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
    console.log(`   ${index + 1}. ${name} (${user.email})`)
  })
  console.log('')
  
  console.log('🔧 Bestätige E-Mail-Adressen...')
  
  // Bestätige alle User
  const result = await prisma.user.updateMany({
    where: {
      emailVerified: false,
      password: { not: null }
    },
    data: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      // Setze Token zurück (falls vorhanden)
      emailVerificationToken: null,
      emailVerificationTokenExpires: null,
    }
  })
  
  console.log(`✅ ${result.count} User erfolgreich verifiziert!`)
  console.log('')
  console.log('💡 Diese User können sich jetzt wieder anmelden.')
  console.log('')
  console.log('📝 Hinweis:')
  console.log('   → Nur User mit Passwort wurden verifiziert')
  console.log('   → Neue User müssen weiterhin ihre E-Mail bestätigen')
  console.log('   → Dies betrifft nur bestehende User, die sich vorher anmelden konnten')
}

main()
  .catch((e) => {
    console.error('❌ Fehler:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })





