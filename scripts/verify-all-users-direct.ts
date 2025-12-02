#!/usr/bin/env tsx
/**
 * Direct script to verify all users in the database
 * This can be run locally and will update the production database
 * 
 * Usage: DATABASE_URL="your-db-url" npx tsx scripts/verify-all-users-direct.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

async function main() {
  console.log('🔄 Aktualisiere alle Benutzer auf emailVerified: true...')
  console.log('📊 Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not Set')

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required!')
    console.log('\n📝 Usage:')
    console.log('   DATABASE_URL="your-db-url" npx tsx scripts/verify-all-users-direct.ts')
    process.exit(1)
  }

  try {
    // Finde alle Benutzer mit emailVerified: false oder null
    const unverifiedUsers = await prisma.user.findMany({
      where: {
        OR: [
          { emailVerified: false },
          { emailVerified: null },
        ],
      },
      select: {
        id: true,
        email: true,
        emailVerified: true,
      },
    })

    console.log(`📊 Gefundene Benutzer ohne Verifizierung: ${unverifiedUsers.length}`)

    if (unverifiedUsers.length === 0) {
      console.log('✅ Alle Benutzer sind bereits verifiziert!')
      return
    }

    // Aktualisiere alle Benutzer
    const result = await prisma.user.updateMany({
      where: {
        OR: [
          { emailVerified: false },
          { emailVerified: null },
        ],
      },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationTokenExpires: null,
      },
    })

    console.log(`✅ ${result.count} Benutzer erfolgreich aktualisiert!`)
    console.log('\n📋 Aktualisierte Benutzer:')
    unverifiedUsers.forEach(user => {
      console.log(`   - ${user.email} (ID: ${user.id})`)
    })
  } catch (error: any) {
    console.error('❌ Fehler:', error.message)
    if (error.code) {
      console.error(`   Code: ${error.code}`)
    }
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
