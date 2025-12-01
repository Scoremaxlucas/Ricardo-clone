import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔐 Creating admin user...')

  const hashedPassword = await bcrypt.hash('admin123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@admin.ch' },
    update: {
      password: hashedPassword,
      isAdmin: true,
      emailVerified: true, // Wichtig: E-Mail als verifiziert markieren
      verified: true,
      verificationStatus: 'approved',
    },
    create: {
      email: 'admin@admin.ch',
      name: 'Admin',
      password: hashedPassword,
      isAdmin: true,
      emailVerified: true, // Wichtig: E-Mail als verifiziert markieren
      verified: true,
      verificationStatus: 'approved',
    },
  })

  console.log('✅ Admin user created/updated successfully!')
  console.log('\n📧 Admin Login Credentials:')
  console.log('   Email: admin@admin.ch')
  console.log('   Password: admin123')
  console.log('\n⚠️  Please change the password after first login!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
