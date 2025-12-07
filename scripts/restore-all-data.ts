import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load environment variables from .env.local (same as create-indexes.ts)
try {
  const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '')
      process.env[key] = value
    }
  })
} catch (error) {
  // Try .env as fallback
  try {
    const envFile = readFileSync(resolve(process.cwd(), '.env'), 'utf-8')
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        const value = match[2].trim().replace(/^["']|["']$/g, '')
        process.env[key] = value
      }
    })
  } catch (error2) {
    console.warn('Could not load .env or .env.local, using environment variables')
  }
}

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL is not set in .env file')
  process.exit(1)
}

const prisma = new PrismaClient()

/**
 * CRITICAL: Restore all users and products
 * This script restores:
 * - Admin user (admin@helvenda.ch)
 * - Test users (noah@test.com, gregor@test.com)
 * - Test products
 * - All existing users (if they exist but have no password)
 */
async function main() {
  console.log('🔄 RESTORING ALL USERS AND PRODUCTS...\n')

  // Passwörter erstellen
  const noahPassword = await bcrypt.hash('noah123', 12)
  const gregorPassword = await bcrypt.hash('gregor123', 12)
  const adminPassword = await bcrypt.hash('test123', 12)
  const defaultPassword = await bcrypt.hash('test123', 12)

  // 1. Restore Admin User
  console.log('👤 Restoring admin user...')
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@helvenda.ch' },
    update: {
      isAdmin: true,
      password: adminPassword,
      emailVerified: true,
      isBlocked: false,
      blockedAt: null,
      blockedReason: null,
    },
    create: {
      email: 'admin@helvenda.ch',
      name: 'Admin',
      password: adminPassword,
      isAdmin: true,
      emailVerified: true,
    },
  })
  console.log(`✅ Admin user restored: ${adminUser.email}`)

  // 2. Restore Noah User
  console.log('👤 Restoring Noah user...')
  const noah = await prisma.user.upsert({
    where: { email: 'noah@test.com' },
    update: {
      password: noahPassword,
      isBlocked: false,
      blockedAt: null,
      blockedReason: null,
      emailVerified: true,
      verified: true,
      verificationStatus: 'approved',
    },
    create: {
      email: 'noah@test.com',
      name: 'Noah',
      firstName: 'Noah',
      lastName: 'Gafner',
      nickname: 'Noah',
      password: noahPassword,
      emailVerified: true,
      verified: true,
      verificationStatus: 'approved',
    },
  })
  console.log(`✅ Noah user restored: ${noah.email}`)

  // 3. Restore Gregor User
  console.log('👤 Restoring Gregor user...')
  const gregor = await prisma.user.upsert({
    where: { email: 'gregor@test.com' },
    update: {
      password: gregorPassword,
      isBlocked: false,
      blockedAt: null,
      blockedReason: null,
      emailVerified: true,
      verified: true,
      verificationStatus: 'approved',
    },
    create: {
      email: 'gregor@test.com',
      name: 'Gregor',
      firstName: 'Gregor',
      lastName: 'Müller',
      nickname: 'Gregor',
      password: gregorPassword,
      emailVerified: true,
      verified: true,
      verificationStatus: 'approved',
    },
  })
  console.log(`✅ Gregor user restored: ${gregor.email}`)

  // 4. Restore Lucas8122 User
  console.log('👤 Restoring Lucas8122 user...')
  const lucas8122Password = await bcrypt.hash('test123', 12)
  const lucas8122 = await prisma.user.upsert({
    where: { email: 'Lugas8122@gmail.com' },
    update: {
      password: lucas8122Password,
      isBlocked: false,
      blockedAt: null,
      blockedReason: null,
      emailVerified: true,
      verified: true,
      verificationStatus: 'approved',
    },
    create: {
      email: 'Lugas8122@gmail.com',
      name: 'Lucas',
      firstName: 'Lucas',
      lastName: 'Rodrigues',
      nickname: 'Lucas8122',
      password: lucas8122Password,
      emailVerified: true,
      verified: true,
      verificationStatus: 'approved',
    },
  })
  console.log(`✅ Lucas8122 user restored: ${lucas8122.email}`)

  // 5. Restore Lucas8118 User
  console.log('👤 Restoring Lucas8118 user...')
  const lucas8118Password = await bcrypt.hash('test123', 12)
  const lucas8118 = await prisma.user.upsert({
    where: { email: 'Lolcas8118@gmail.com' },
    update: {
      password: lucas8118Password,
      isBlocked: false,
      blockedAt: null,
      blockedReason: null,
      emailVerified: true,
      verified: true,
      verificationStatus: 'approved',
    },
    create: {
      email: 'Lolcas8118@gmail.com',
      name: 'Lucas',
      firstName: 'Lucas',
      lastName: 'Rodrigues',
      nickname: 'Lucas8118',
      password: lucas8118Password,
      emailVerified: true,
      verified: true,
      verificationStatus: 'approved',
    },
  })
  console.log(`✅ Lucas8118 user restored: ${lucas8118.email}`)

  // 6. Restore all other users that might exist but have no password
  console.log('\n👤 Restoring other users without passwords...')
  const usersWithoutPassword = await prisma.user.findMany({
    where: {
      OR: [
        { password: null },
        { password: '' },
      ],
      email: {
        notIn: [
          'admin@helvenda.ch',
          'noah@test.com',
          'gregor@test.com',
          'Lugas8122@gmail.com',
          'Lolcas8118@gmail.com',
        ],
      },
    },
    select: { id: true, email: true },
  })

  if (usersWithoutPassword.length > 0) {
    console.log(`   Found ${usersWithoutPassword.length} users without passwords`)
    for (const user of usersWithoutPassword) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: defaultPassword,
          emailVerified: true,
          isBlocked: false,
        },
      })
      console.log(`   ✅ Restored password for: ${user.email}`)
    }
  } else {
    console.log('   No other users found without passwords')
  }

  // 7. Restore categories (with error handling for quota)
  console.log('\n📁 Restoring categories...')
  let categories: any[] = []
  try {
    categories = await Promise.all([
      prisma.category.upsert({
        where: { name: 'Rolex' },
        update: {},
        create: { name: 'Rolex', slug: 'rolex' },
      }),
      prisma.category.upsert({
        where: { name: 'Omega' },
        update: {},
        create: { name: 'Omega', slug: 'omega' },
      }),
      prisma.category.upsert({
        where: { name: 'Vintage' },
        update: {},
        create: { name: 'Vintage', slug: 'vintage' },
      }),
    ])
    console.log(`✅ ${categories.length} categories restored`)
  } catch (categoryError: any) {
    if (categoryError.message?.includes('quota')) {
      console.log('⚠️  Categories restore skipped due to quota (will be created automatically when needed)')
      // Try to fetch existing categories
      try {
        categories = await prisma.category.findMany({
          where: { name: { in: ['Rolex', 'Omega', 'Vintage'] } },
        })
        if (categories.length > 0) {
          console.log(`✅ Found ${categories.length} existing categories`)
        }
      } catch (e) {
        // Ignore
      }
    } else {
      throw categoryError
    }
  }

  // 8. Check if products exist
  const existingWatches = await prisma.watch.count()
  console.log(`\n📦 Found ${existingWatches} existing products`)

  // 9. Create test products if none exist
  if (existingWatches === 0) {
    console.log('📦 Creating test products...')

    const watch1 = await prisma.watch.create({
      data: {
        title: 'Rolex Submariner Date 116610LN',
        description:
          'Klassische Rolex Submariner in sehr gutem Zustand. Komplett mit Original-Box und Papiere.',
        brand: 'Rolex',
        model: 'Submariner Date',
        year: 2020,
        condition: 'Sehr gut',
        material: 'Stahl',
        movement: 'Automatik',
        caseDiameter: 40.0,
        price: 8500,
        isAuction: true,
        auctionEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 Tage
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
        ]),
        sellerId: gregor.id,
        moderationStatus: 'approved',
        categories: {
          create: [{ categoryId: categories[0].id }, { categoryId: categories[2].id }],
        },
      },
    })

    const watch2 = await prisma.watch.create({
      data: {
        title: 'Omega Speedmaster Professional Moonwatch',
        description: 'Legendäre Omega Speedmaster, die von der NASA verwendet wurde.',
        brand: 'Omega',
        model: 'Speedmaster Professional',
        year: 2019,
        condition: 'Ausgezeichnet',
        material: 'Stahl',
        movement: 'Handaufzug',
        caseDiameter: 42.0,
        price: 3200,
        isAuction: false,
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
        ]),
        sellerId: noah.id,
        moderationStatus: 'approved',
        categories: {
          create: [{ categoryId: categories[1].id }],
        },
      },
    })

    // Test Gebote erstellen
    await prisma.bid.create({
      data: {
        amount: 9200,
        userId: noah.id,
        watchId: watch1.id,
      },
    })

    await prisma.bid.create({
      data: {
        amount: 9500,
        userId: noah.id,
        watchId: watch1.id,
      },
    })

    console.log('✅ Test products created')
  }

  // 10. List all users
  console.log('\n📋 All users in database:')
  const allUsers = await prisma.user.findMany({
    select: {
      email: true,
      name: true,
      isAdmin: true,
      emailVerified: true,
      password: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  allUsers.forEach(user => {
    const adminTag = user.isAdmin ? ' [ADMIN]' : ''
    const verifiedTag = user.emailVerified ? ' ✅' : ' ❌'
    const hasPassword = user.password ? ' 🔑' : ' ❌'
    console.log(`   - ${user.email}${adminTag}${verifiedTag}${hasPassword}`)
  })

  console.log('\n✅ RESTORATION COMPLETE!')
  console.log('\n📧 Login credentials:')
  console.log('   - admin@helvenda.ch (Password: test123) [ADMIN]')
  console.log('   - noah@test.com (Password: noah123)')
  console.log('   - gregor@test.com (Password: gregor123)')
  console.log('   - Lugas8122@gmail.com (Password: test123)')
  console.log('   - Lolcas8118@gmail.com (Password: test123)')
  if (usersWithoutPassword.length > 0) {
    console.log(`   - ${usersWithoutPassword.length} other users (Password: test123)`)
  }
}

main()
  .catch(e => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

