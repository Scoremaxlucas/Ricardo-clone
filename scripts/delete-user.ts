#!/usr/bin/env tsx

/**
 * Script zum Löschen eines Users
 *
 * Verwendung:
 *   npm run delete-user -- --email lucas@example.com
 */

import { prisma } from '../src/lib/prisma'

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
    console.log('\n❌ Fehler: Bitte geben Sie eine E-Mail-Adresse an')
    console.log('\n📝 Verwendung:')
    console.log('   npm run delete-user -- --email lucas@example.com')
    process.exit(1)
  }

  const normalizedEmail = email.toLowerCase().trim()

  console.log('\n🔍 Suche nach User...')
  console.log(`   Email: ${normalizedEmail}`)
  console.log('')

  // Finde User
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      nickname: true,
    },
  })

  if (!user) {
    console.log('❌ User nicht gefunden!')
    process.exit(1)
  }

  console.log('✅ User gefunden:')
  console.log(`   ID: ${user.id}`)
  console.log(`   Name: ${user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()}`)
  console.log(`   Email: ${user.email}`)
  console.log(`   Nickname: ${user.nickname}`)
  console.log('')

  // Bestätigung
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const answer = await new Promise<string>(resolve => {
    readline.question('⚠️  Möchten Sie diesen User wirklich löschen? (j/n): ', resolve)
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

  console.log('\n🗑️  Lösche User...')

  try {
    // Lösche User (Cascade sollte automatisch abhängige Daten löschen)
    await prisma.user.delete({
      where: { id: user.id },
    })

    console.log('✅ User erfolgreich gelöscht!')
    console.log('')
    console.log('📋 Zusammenfassung:')
    console.log(`   User: ${user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Status: ✅ Gelöscht`)
    console.log('')
    console.log('💡 Sie können sich jetzt erneut mit dieser E-Mail registrieren.')
  } catch (error: any) {
    console.error('❌ Fehler beim Löschen:', error.message)

    // Falls Foreign Key Constraints Probleme machen, versuche manuell abhängige Daten zu löschen
    if (error.code === 'P2003' || error.message.includes('Foreign key constraint')) {
      console.log('\n⚠️  Foreign Key Constraint erkannt. Versuche abhängige Daten zu löschen...')

      try {
        // Lösche abhängige Daten manuell
        // Zuerst Watches finden, bevor sie gelöscht werden
        const watchesByUser = await prisma.watch.findMany({ where: { sellerId: user.id }, select: { id: true } })
        const watchIds = watchesByUser.map(w => w.id)
        
        // Lösche Purchases
        await prisma.purchase.deleteMany({ where: { buyerId: user.id } })
        if (watchIds.length > 0) {
          await prisma.purchase.deleteMany({ where: { watchId: { in: watchIds } } })
        }
        
        // Lösche PriceOffers
        await prisma.priceOffer.deleteMany({ where: { buyerId: user.id } })
        if (watchIds.length > 0) {
          await prisma.priceOffer.deleteMany({ where: { watchId: { in: watchIds } } })
        }
        
        // Jetzt können die Watches gelöscht werden
        await prisma.watch.deleteMany({ where: { sellerId: user.id } })
        await prisma.bid.deleteMany({ where: { userId: user.id } })
        await prisma.message.deleteMany({ where: { senderId: user.id } })
        await prisma.message.deleteMany({ where: { receiverId: user.id } })
        await prisma.notification.deleteMany({ where: { userId: user.id } })
        await prisma.invoice.deleteMany({ where: { sellerId: user.id } })

        // Versuche User erneut zu löschen
        await prisma.user.delete({
          where: { id: user.id },
        })

        console.log('✅ User und abhängige Daten erfolgreich gelöscht!')
      } catch (deleteError: any) {
        console.error('❌ Fehler beim Löschen abhängiger Daten:', deleteError.message)
        process.exit(1)
      }
    } else {
      process.exit(1)
    }
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
