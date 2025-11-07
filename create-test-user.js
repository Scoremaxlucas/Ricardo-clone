const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('test123', 10)
  
  // Prüfe ob Testbenutzer existiert und aktualisiere, sonst erstelle neu
  try {
    const existing = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    })
    
    if (existing) {
      await prisma.user.update({
        where: { email: 'test@example.com' },
        data: { password: hashedPassword }
      })
      console.log('✅ Passwort für test@example.com zurückgesetzt!')
    } else {
      await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test Benutzer',
          password: hashedPassword
        }
      })
      console.log('✅ Testbenutzer erstellt!')
    }
    
    console.log('\n📧 Login-Daten:')
    console.log('   Email: test@example.com')
    console.log('   Passwort: test123')
    console.log('\n🌐 Anmelden auf: http://localhost:3000/login')
  } catch (error) {
    console.error('Fehler:', error.message)
    console.log('\n🔧 Versuche Migrations auszuführen...')
    console.log('Bitte führen Sie aus: npx prisma migrate dev')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
