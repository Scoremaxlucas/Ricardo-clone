import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Lösche veraltete watch-out Benutzer und deren Daten
  console.log('🗑️  Lösche veraltete watch-out Benutzer...')

  // Finde die Benutzer zuerst
  const watchOutUsers = await prisma.user.findMany({
    where: {
      email: {
        in: ['test@watch-out.ch', 'seller@watch-out.ch'],
      },
    },
    select: { id: true, email: true },
  })

  if (watchOutUsers.length > 0) {
    const userIds = watchOutUsers.map(u => u.id)

    // Finde alle Watches dieser Benutzer
    const watches = await prisma.watch.findMany({
      where: { sellerId: { in: userIds } },
      select: { id: true },
    })
    const watchIds = watches.map(w => w.id)

    // Lösche zuerst alle abhängigen Daten der Watches
    if (watchIds.length > 0) {
      await prisma.bid.deleteMany({ where: { watchId: { in: watchIds } } })
      await prisma.favorite.deleteMany({ where: { watchId: { in: watchIds } } })
      await prisma.priceOffer.deleteMany({ where: { watchId: { in: watchIds } } })
      await prisma.purchase.deleteMany({ where: { watchId: { in: watchIds } } })
      await prisma.sale.deleteMany({ where: { watchId: { in: watchIds } } })
      await prisma.message.deleteMany({ where: { watchId: { in: watchIds } } })
      await prisma.watchCategory.deleteMany({ where: { watchId: { in: watchIds } } })
      await prisma.watchView.deleteMany({ where: { watchId: { in: watchIds } } })
      await prisma.report.deleteMany({ where: { watchId: { in: watchIds } } })
      await prisma.adminNote.deleteMany({ where: { watchId: { in: watchIds } } })
      await prisma.moderationHistory.deleteMany({ where: { watchId: { in: watchIds } } })
      await prisma.invoiceItem.deleteMany({ where: { watchId: { in: watchIds } } })
    }

    // Lösche dann die Watches
    await prisma.watch.deleteMany({ where: { sellerId: { in: userIds } } })

    // Lösche alle anderen abhängigen Daten der Benutzer
    await prisma.bid.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.favorite.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.purchase.deleteMany({ where: { buyerId: { in: userIds } } })
    await prisma.sale.deleteMany({ where: { sellerId: { in: userIds } } })
    await prisma.sale.deleteMany({ where: { buyerId: { in: userIds } } })
    await prisma.priceOffer.deleteMany({ where: { buyerId: { in: userIds } } })
    await prisma.notification.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.message.deleteMany({ where: { senderId: { in: userIds } } })
    await prisma.message.deleteMany({ where: { receiverId: { in: userIds } } })
    await prisma.review.deleteMany({ where: { reviewerId: { in: userIds } } })
    await prisma.review.deleteMany({ where: { reviewedUserId: { in: userIds } } })
    await prisma.searchSubscription.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.conversation.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.report.deleteMany({ where: { reportedBy: { in: userIds } } })
    await prisma.report.deleteMany({ where: { reviewedBy: { in: userIds } } })
    await prisma.adminNote.deleteMany({ where: { adminId: { in: userIds } } })
    await prisma.moderationHistory.deleteMany({ where: { adminId: { in: userIds } } })

    // Lösche dann die Benutzer
    await prisma.user.deleteMany({
      where: {
        id: { in: userIds },
      },
    })
    console.log(`✅ ${watchOutUsers.length} veraltete Benutzer gelöscht`)
  } else {
    console.log('✅ Keine veralteten Benutzer gefunden')
  }

  // Passwörter erstellen
  const noahPassword = await bcrypt.hash('noah123', 12)
  const gregorPassword = await bcrypt.hash('gregor123', 12)
  const adminPassword = await bcrypt.hash('test123', 12)

  // Noah Benutzer erstellen
  const noah = await prisma.user.upsert({
    where: { email: 'noah@test.com' },
    update: {
      password: noahPassword,
      isBlocked: false,
      blockedAt: null,
      blockedReason: null,
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

  // Gregor Benutzer erstellen
  const gregor = await prisma.user.upsert({
    where: { email: 'gregor@test.com' },
    update: {
      password: gregorPassword,
      isBlocked: false,
      blockedAt: null,
      blockedReason: null,
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

  // Admin User erstellen
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@helvenda.ch' },
    update: {
      isAdmin: true,
      password: adminPassword,
    },
    create: {
      email: 'admin@helvenda.ch',
      name: 'Admin',
      password: adminPassword,
      isAdmin: true,
      emailVerified: true,
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

  // Test Uhren erstellen (falls noch keine vorhanden)
  const existingWatches = await prisma.watch.count()

  if (existingWatches === 0) {
    console.log('📦 Erstelle Test-Artikel...')

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

    console.log('✅ Test-Artikel erstellt')
  } else {
    console.log(`✅ ${existingWatches} Artikel bereits vorhanden`)
  }

  console.log('')
  console.log('✅ Database seeded successfully!')
  console.log('')
  console.log('👤 Benutzer:')
  console.log(`   - noah@test.com (Password: noah123)`)
  console.log(`   - gregor@test.com (Password: gregor123)`)
  console.log(`   - admin@helvenda.ch (Password: test123) [ADMIN]`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
