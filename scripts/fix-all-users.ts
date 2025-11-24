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

  // Alle User aktualisieren
  for (const user of users) {
    const updates: any = {
      password: hashedPassword, // Setze Passwort auf test123
      emailVerified: true, // E-Mail als verifiziert markieren
    }

    // Für Admin-User zusätzlich sicherstellen
    if (user.isAdmin) {
      updates.isAdmin = true
      updates.verified = true
      updates.verificationStatus = 'approved'
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updates
    })

    console.log(`✅ ${user.email} - Passwort: test123, emailVerified: true`)
  }

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

