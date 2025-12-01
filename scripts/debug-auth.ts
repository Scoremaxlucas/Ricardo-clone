import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 Debug Auth für Noah...\n')

    // Teste verschiedene Email-Varianten
    const emails = ['noah@test.com', 'NOAH@TEST.COM', 'Noah@Test.com', ' noah@test.com ']

    for (const email of emails) {
      console.log(`\n📧 Suche nach: "${email}"`)

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        select: {
          id: true,
          email: true,
          name: true,
          password: true,
          isBlocked: true,
        },
      })

      if (user) {
        console.log(`✅ Gefunden!`)
        console.log(`   ID: ${user.id}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   Name: ${user.name}`)
        console.log(`   Blockiert: ${user.isBlocked}`)
        console.log(`   Hat Passwort: ${!!user.password}`)

        if (user.password) {
          const testPassword = 'noah123'
          const isValid = await bcrypt.compare(testPassword, user.password)
          console.log(`   Passwort "${testPassword}" gültig: ${isValid}`)
        }
        break
      } else {
        console.log(`❌ Nicht gefunden`)
      }
    }

    // Liste alle User
    console.log('\n📋 Alle User in der Datenbank:')
    const allUsers = await prisma.user.findMany({
      select: { email: true, name: true },
      orderBy: { createdAt: 'asc' },
    })

    allUsers.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.email} (${u.name || 'Kein Name'})`)
    })
  } catch (error: any) {
    console.error('❌ Fehler:', error.message)
    console.error(error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

main()
