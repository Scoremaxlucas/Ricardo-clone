const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

// Lade .env.local
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8')
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '')
      process.env[key] = value
    }
  })
}

const prisma = new PrismaClient()

async function main() {
  console.log('🔐 Creating admin user...')

  try {
    // Prüfe ob Admin bereits existiert
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@admin.ch' },
    })

    const hashedPassword = await bcrypt.hash('admin123', 12)

    if (existingAdmin) {
      // Aktualisiere bestehenden Admin
      await prisma.user.update({
        where: { email: 'admin@admin.ch' },
        data: {
          password: hashedPassword,
          isAdmin: true,
          verified: true,
          verificationStatus: 'approved',
        },
      })
      console.log('✅ Admin user updated successfully!')
    } else {
      // Erstelle neuen Admin
      await prisma.user.create({
        data: {
          email: 'admin@admin.ch',
          name: 'Admin',
          password: hashedPassword,
          isAdmin: true,
          verified: true,
          verificationStatus: 'approved',
        },
      })
      console.log('✅ Admin user created successfully!')
    }

    console.log('\n📧 Admin Login Credentials:')
    console.log('   Email: admin@admin.ch')
    console.log('   Password: admin123')
    console.log('\n⚠️  Please change the password after first login!')
  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.code === 'P2002') {
      console.error('   User already exists, trying to update...')
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
