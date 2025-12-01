import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 Teste Noah Login...\n')

    // Finde Noah
    const noah = await prisma.user.findUnique({
      where: { email: 'noah@test.com' },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        isBlocked: true,
      },
    })

    if (!noah) {
      console.log('❌ Noah nicht gefunden!')
      return
    }

    console.log('✅ Noah gefunden:')
    console.log(`   ID: ${noah.id}`)
    console.log(`   Email: ${noah.email}`)
    console.log(`   Name: ${noah.name}`)
    console.log(`   Blockiert: ${noah.isBlocked}`)
    console.log(`   Hat Passwort: ${!!noah.password}`)
    console.log(`   Passwort-Länge: ${noah.password?.length || 0}`)
    console.log(`   Passwort-Start: ${noah.password?.substring(0, 20) || 'N/A'}...`)

    // Teste Passwort-Verifizierung
    const testPassword = 'noah123'
    if (noah.password) {
      console.log(`\n🔐 Teste Passwort-Verifizierung mit: "${testPassword}"`)
      const isValid = await bcrypt.compare(testPassword, noah.password)
      console.log(`   Passwort gültig: ${isValid}`)

      if (!isValid) {
        console.log('\n⚠️ Passwort stimmt nicht überein!')
        console.log('   Setze neues Passwort...')

        const newHash = await bcrypt.hash(testPassword, 12)
        await prisma.user.update({
          where: { id: noah.id },
          data: { password: newHash },
        })

        console.log('✅ Neues Passwort gesetzt!')

        // Teste erneut
        const updatedUser = await prisma.user.findUnique({
          where: { id: noah.id },
          select: { password: true },
        })

        if (updatedUser?.password) {
          const isValidNow = await bcrypt.compare(testPassword, updatedUser.password)
          console.log(`   Passwort jetzt gültig: ${isValidNow}`)
        }
      }
    } else {
      console.log('\n⚠️ Kein Passwort vorhanden!')
      console.log('   Setze neues Passwort...')

      const newHash = await bcrypt.hash(testPassword, 12)
      await prisma.user.update({
        where: { id: noah.id },
        data: { password: newHash },
      })

      console.log('✅ Passwort gesetzt!')
    }

    console.log('\n📧 Login-Daten:')
    console.log(`   Email: ${noah.email}`)
    console.log(`   Passwort: ${testPassword}`)
  } catch (error: any) {
    console.error('❌ Fehler:', error.message)
    console.error(error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

main()
