#!/usr/bin/env tsx
/**
 * Cleanup Script - Löscht alle User außer Admin-Usern
 * 
 * Usage: npx tsx scripts/cleanup-all-users.ts [admin-email]
 * 
 * Wenn keine E-Mail angegeben, werden nur User mit isAdmin=true behalten
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.argv[2]

  console.log('\n🧹 Cleanup Script - Lösche alle Test-User\n')

  // Finde alle Admin-User
  const adminUsers = await prisma.user.findMany({
    where: { isAdmin: true },
    select: { id: true, email: true, name: true },
  })

  if (adminUsers.length === 0) {
    console.log('⚠️  Keine Admin-User gefunden!')
    console.log('   Bitte stelle sicher, dass mindestens ein User isAdmin=true hat.')
    process.exit(1)
  }

  console.log(`✅ Gefunden: ${adminUsers.length} Admin-User:`)
  adminUsers.forEach((u, i) => {
    console.log(`   ${i + 1}. ${u.email} (${u.name || 'Kein Name'})`)
  })

  // Wenn eine E-Mail angegeben, prüfe ob sie Admin ist
  if (adminEmail) {
    const specifiedAdmin = adminUsers.find(u => u.email.toLowerCase() === adminEmail.toLowerCase())
    if (!specifiedAdmin) {
      console.log(`\n⚠️  ${adminEmail} ist kein Admin-User!`)
      console.log('   Nur Admin-User werden behalten.')
      process.exit(1)
    }
    console.log(`\n✅ ${adminEmail} wird behalten.`)
  }

  // Hole alle User außer Admin-Usern
  const usersToDelete = await prisma.user.findMany({
    where: { isAdmin: false },
    select: { id: true, email: true, name: true },
  })

  if (usersToDelete.length === 0) {
    console.log('\n✅ Keine Test-User gefunden. Datenbank ist bereits sauber!')
    await prisma.$disconnect()
    process.exit(0)
  }

  console.log(`\n📋 Gefunden: ${usersToDelete.length} Test-User zum Löschen:`)
  usersToDelete.slice(0, 10).forEach((u, i) => {
    console.log(`   ${i + 1}. ${u.email} (${u.name || 'Kein Name'})`)
  })
  if (usersToDelete.length > 10) {
    console.log(`   ... und ${usersToDelete.length - 10} weitere`)
  }

  console.log(`\n⚠️  WARNUNG: Dies löscht ${usersToDelete.length} User und alle deren Daten!`)
  console.log(`   ${adminUsers.length} Admin-User bleiben erhalten.\n`)

  // Lösche alle Test-User
  let deleted = 0
  let errors = 0

  for (const user of usersToDelete) {
    try {
      // Prisma löscht automatisch alle abhängigen Daten (Cascade)
      await prisma.user.delete({ where: { id: user.id } })
      deleted++
      if (deleted % 10 === 0) {
        console.log(`   ✅ ${deleted}/${usersToDelete.length} gelöscht...`)
      }
    } catch (error: any) {
      errors++
      console.error(`   ❌ Fehler bei ${user.email}: ${error.message}`)
    }
  }

  console.log(`\n✅ Cleanup abgeschlossen!`)
  console.log(`   Gelöscht: ${deleted} User`)
  if (errors > 0) {
    console.log(`   Fehler: ${errors} User`)
  }
  console.log(`   Behalten: ${adminUsers.length} Admin-User`)

  // Zeige verbleibende User
  const remainingUsers = await prisma.user.findMany({
    select: { id: true, email: true, name: true, isAdmin: true },
  })

  console.log(`\n📊 Verbleibende User (${remainingUsers.length}):`)
  remainingUsers.forEach((u) => {
    console.log(`   - ${u.email} ${u.isAdmin ? '(Admin)' : ''}`)
  })

  await prisma.$disconnect()
}

main()
  .catch((e) => {
    console.error('❌ Fataler Fehler:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
