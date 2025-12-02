import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Aktualisiere alle Benutzer auf emailVerified: true...')

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
}

main()
  .catch(e => {
    console.error('❌ Fehler:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

