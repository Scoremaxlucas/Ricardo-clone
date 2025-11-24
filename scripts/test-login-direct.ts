import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 Direkter Login-Test für Noah...\n')

    const email = 'noah@test.com'
    const password = 'noah123'
    const normalizedEmail = email.toLowerCase().trim()

    console.log(`📧 Suche User: "${normalizedEmail}"`)

    // Finde User
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        isBlocked: true,
        isAdmin: true
      }
    })

    if (!user) {
      console.log('❌ User nicht gefunden!')
      
      // Liste alle User
      const allUsers = await prisma.user.findMany({
        select: { email: true, name: true },
        take: 10
      })
      console.log(`\nVorhandene User (${allUsers.length}):`)
      allUsers.forEach(u => console.log(`  - ${u.email} (${u.name})`))
      return
    }

    console.log('✅ User gefunden!')
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Name: ${user.name}`)
    console.log(`   Blockiert: ${user.isBlocked}`)
    console.log(`   Hat Passwort: ${!!user.password}`)

    if (!user.password) {
      console.log('\n⚠️ Kein Passwort vorhanden!')
      console.log('   Setze neues Passwort...')
      
      const newHash = await bcrypt.hash(password, 12)
      await prisma.user.update({
        where: { id: user.id },
        data: { password: newHash }
      })
      
      console.log('✅ Passwort gesetzt!')
      return
    }

    // Teste Passwort
    console.log(`\n🔐 Teste Passwort: "${password}"`)
    console.log(`   Passwort-Länge: ${password.length}`)
    console.log(`   Hash-Länge: ${user.password.length}`)
    console.log(`   Hash-Start: ${user.password.substring(0, 30)}...`)

    const isValid = await bcrypt.compare(password, user.password)
    console.log(`   Passwort gültig: ${isValid ? '✅ JA' : '❌ NEIN'}`)

    if (!isValid) {
      console.log('\n⚠️ Passwort stimmt nicht überein!')
      console.log('   Setze neues Passwort...')
      
      const newHash = await bcrypt.hash(password, 12)
      await prisma.user.update({
        where: { id: user.id },
        data: { password: newHash }
      })
      
      console.log('✅ Neues Passwort gesetzt!')
      
      // Teste erneut
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { password: true }
      })
      
      if (updatedUser?.password) {
        const isValidNow = await bcrypt.compare(password, updatedUser.password)
        console.log(`   Passwort jetzt gültig: ${isValidNow ? '✅ JA' : '❌ NEIN'}`)
      }
    } else {
      console.log('\n✅ Passwort ist korrekt!')
      console.log('   Login sollte funktionieren.')
    }

    console.log('\n📧 Login-Daten:')
    console.log(`   Email: ${email}`)
    console.log(`   Passwort: ${password}`)

  } catch (error: any) {
    console.error('❌ Fehler:', error.message)
    console.error(error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

main()





