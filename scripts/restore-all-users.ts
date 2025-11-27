import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Stelle alle User wieder her...\n')

  const hashedPassword = await bcrypt.hash('test123', 12)

  // Verwende executeRaw um ALLE User zu aktualisieren, auch die die Prisma nicht findet
  const result = await prisma.$executeRaw`
    UPDATE users 
    SET password = ${hashedPassword}, 
        emailVerified = 1,
        verified = 1,
        verificationStatus = 'approved'
    WHERE password IS NULL OR emailVerified = 0 OR emailVerified IS NULL
  `

  console.log(`✅ ${result} User aktualisiert via SQL\n`)

  // Zeige alle User
  const users = await prisma.user.findMany({
    select: {
      email: true,
      name: true,
      isAdmin: true,
      emailVerified: true,
      password: true
    },
    orderBy: { createdAt: 'desc' }
  })

  console.log(`📋 Alle User in der Datenbank (${users.length}):`)
  users.forEach(user => {
    const adminTag = user.isAdmin ? ' [ADMIN]' : ''
    const verifiedTag = user.emailVerified ? ' ✅' : ' ❌'
    const hasPassword = user.password ? ' 🔑' : ' ❌'
    console.log(`   - ${user.email}${adminTag}${verifiedTag}${hasPassword}`)
  })

  console.log(`\n✅ Alle User wiederhergestellt!`)
  console.log('\n📧 Login-Daten für ALLE User:')
  console.log('   Passwort: test123')
}

main()
  .catch((e) => {
    console.error('Fehler:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
















