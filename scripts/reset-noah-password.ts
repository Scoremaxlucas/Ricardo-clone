import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  try {
    // Finde Noah
    const noah = await prisma.user.findUnique({
      where: { email: 'noah@test.com' },
    })

    if (!noah) {
      console.log('❌ Noah nicht gefunden!')
      return
    }

    console.log('✅ Noah gefunden:')
    console.log(`   Email: ${noah.email}`)
    console.log(`   Name: ${noah.name}`)
    console.log(`   Nickname: ${noah.nickname}`)
    console.log(`   Blockiert: ${noah.isBlocked}`)
    console.log(`   Hat Passwort: ${!!noah.password}`)

    // Setze neues Passwort
    const newPassword = 'noah123' // Einfaches Passwort zum Testen
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id: noah.id },
      data: {
        password: hashedPassword,
        isBlocked: false, // Stelle sicher, dass er nicht blockiert ist
        blockedAt: null,
        blockedReason: null,
      },
    })

    console.log('\n✅ Noah Passwort zurückgesetzt!')
    console.log('\n📧 Login-Daten:')
    console.log(`   Email: ${noah.email}`)
    console.log(`   Passwort: ${newPassword}`)
    console.log('\n✅ Account ist nicht blockiert')
    console.log('✅ Login sollte jetzt funktionieren!')
  } catch (error: any) {
    console.error('❌ Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
