import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Test Users erstellen
  const hashedPassword = await bcrypt.hash('test123', 12)

  const user1 = await prisma.user.upsert({
    where: { email: 'test@watch-out.ch' },
    update: {},
    create: {
      email: 'test@watch-out.ch',
      name: 'Test User',
      password: hashedPassword,
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'seller@watch-out.ch' },
    update: {},
    create: {
      email: 'seller@watch-out.ch',
      name: 'Watch Seller',
      password: hashedPassword,
    },
  })

  // Admin User erstellen
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@helvenda.ch' },
    update: {
      isAdmin: true,
      password: hashedPassword,
    },
    create: {
      email: 'admin@helvenda.ch',
      name: 'Admin',
      password: hashedPassword,
      isAdmin: true,
    },
  })

  // Kategorien erstellen
  const categories = await Promise.all([
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

  // Test Uhren erstellen
  const watch1 = await prisma.watch.create({
    data: {
      title: 'Rolex Submariner Date 116610LN',
      description: 'Klassische Rolex Submariner in sehr gutem Zustand. Komplett mit Original-Box und Papiere.',
      brand: 'Rolex',
      model: 'Submariner Date',
      year: 2020,
      condition: 'Sehr gut',
      material: 'Stahl',
      movement: 'Automatik',
      caseSize: 40.0,
      price: 8500,
      isAuction: true,
      auctionEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 Tage
      images: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
      sellerId: user2.id,
      categories: {
        create: [
          { categoryId: categories[0].id },
          { categoryId: categories[2].id }
        ]
      }
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
      caseSize: 42.0,
      price: 3200,
      isAuction: false,
      images: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
      sellerId: user2.id,
      categories: {
        create: [
          { categoryId: categories[1].id }
        ]
      }
    },
  })

  // Test Gebote erstellen
  await prisma.bid.create({
    data: {
      amount: 9200,
      userId: user1.id,
      watchId: watch1.id,
    },
  })

  await prisma.bid.create({
    data: {
      amount: 9500,
      userId: user1.id,
      watchId: watch1.id,
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log('👤 Test Users:')
  console.log(`   - test@watch-out.ch (Password: test123)`)
  console.log(`   - seller@watch-out.ch (Password: test123)`)
  console.log(`   - admin@helvenda.ch (Password: test123) [ADMIN]`)
  console.log('⌚ Test Watches:')
  console.log(`   - ${watch1.title} (Auktion)`)
  console.log(`   - ${watch2.title} (Sofortkauf)`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
