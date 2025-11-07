const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // Alle Benutzer anzeigen
  const users = await prisma.user.findMany({
    select: { email: true, name: true }
  })
  
  console.log('\n📋 Vorhandene Benutzer:')
  if (users.length === 0) {
    console.log('Keine Benutzer gefunden.')
    console.log('\n✅ Erstelle Testbenutzer...')
    
    const hashedPassword = await bcrypt.hash('test123', 10)
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test Benutzer',
        password: hashedPassword
      }
    })
    console.log('✅ Testbenutzer erstellt!')
    console.log('\n📧 Login-Daten:')
    console.log('   Email: test@example.com')
    console.log('   Passwort: test123')
  } else {
    console.log('\n📧 Login-Daten für vorhandene Benutzer:')
    users.forEach(user => {
      console.log(`   Email: ${user.email}`)
    })
    console.log('\n⚠️  Passwörter können nicht aus der Datenbank ausgelesen werden.')
    console.log('   Falls Sie sich nicht anmelden können, erstelle ich einen neuen Testbenutzer.')
    
    // Prüfen ob test@example.com existiert
    const testUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    })
    
    if (!testUser) {
      console.log('\n✅ Erstelle test@example.com...')
      const hashedPassword = await bcrypt.hash('test123', 10)
      await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test Benutzer',
          password: hashedPassword
        }
      })
      console.log('✅ Testbenutzer erstellt!')
      console.log('\n📧 Login-Daten:')
      console.log('   Email: test@example.com')
      console.log('   Passwort: test123')
    } else {
      // Passwort zurücksetzen
      console.log('\n✅ Setze Passwort für test@example.com zurück...')
      const hashedPassword = await bcrypt.hash('test123', 10)
      await prisma.user.update({
        where: { email: 'test@example.com' },
        data: { password: hashedPassword }
      })
      console.log('✅ Passwort zurückgesetzt!')
      console.log('\n📧 Login-Daten:')
      console.log('   Email: test@example.com')
      console.log('   Passwort: test123')
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
