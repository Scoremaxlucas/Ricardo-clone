import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Fixe alle User...\n')

  const hashedPassword = await bcrypt.hash('test123', 12)

  // Alle User finden
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
      emailVerified: true,
      isAdmin: true
    }
  })

  console.log(`📋 Gefundene User: ${users.length}\n`)

  // Alle User aktualisieren - verwende updateMany für bessere Performance
  const updateResult = await prisma.user.updateMany({
    data: {
      password: hashedPassword, // Setze Passwort auf test123 für alle
      emailVerified: true, // E-Mail als verifiziert markieren
    }
  })

  console.log(`✅ ${updateResult.count} User wurden aktualisiert!`)

  // Admin-User zusätzlich konfigurieren
  const adminUsers = users.filter(u => u.isAdmin)
  if (adminUsers.length > 0) {
    for (const admin of adminUsers) {
      await prisma.user.update({
        where: { id: admin.id },
        data: {
          isAdmin: true,
          verified: true,
          verificationStatus: 'approved'
        }
      })
    }
    console.log(`✅ ${adminUsers.length} Admin-User zusätzlich konfiguriert`)
  }

  // Zeige alle User
  const allUsers = await prisma.user.findMany({
    select: {
      email: true,
      name: true,
      isAdmin: true,
      emailVerified: true
    },
    orderBy: { createdAt: 'desc' }
  })

  console.log(`\n📋 Alle User in der Datenbank (${allUsers.length}):`)
  allUsers.forEach(user => {
    const adminTag = user.isAdmin ? ' [ADMIN]' : ''
    const verifiedTag = user.emailVerified ? ' ✅' : ' ❌'
    console.log(`   - ${user.email}${adminTag}${verifiedTag}`)
  })

  console.log(`\n✅ Alle ${users.length} User wurden aktualisiert!`)
  console.log('\n📧 Login-Daten für alle User:')
  console.log('   Passwort: test123')
  console.log('\n👤 Verfügbare User:')
  users.forEach(user => {
    const adminTag = user.isAdmin ? ' [ADMIN]' : ''
    console.log(`   - ${user.email}${adminTag}`)
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

