import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Lade Umgebungsvariablen aus .env.local
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
  console.warn('Could not load .env.local')
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

async function testQueryPerformance() {
  console.log('Testing query performance...\n')

  // Test 1: Einfache Query ohne Limit
  const start1 = Date.now()
  const result1 = await prisma.watch.findMany({
    where: { sellerId: 'test-user-id' },
    select: {
      id: true,
      title: true,
      brand: true,
      model: true,
      price: true,
    },
    take: 20,
  })
  const time1 = Date.now() - start1
  console.log(`Query ohne Index (simuliert): ${time1}ms, ${result1.length} results`)

  // Test 2: Query mit Limit und Select
  const start2 = Date.now()
  const result2 = await prisma.watch.findMany({
    where: { sellerId: 'test-user-id' },
    select: {
      id: true,
      title: true,
      brand: true,
      model: true,
      price: true,
      images: true,
      createdAt: true,
      isAuction: true,
      auctionEnd: true,
      articleNumber: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  const time2 = Date.now() - start2
  console.log(`Query mit allen Feldern: ${time2}ms, ${result2.length} results`)

  // Test 3: Prüfe ob Indizes existieren
  const indexes = await prisma.$queryRawUnsafe(`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'watches' 
    AND indexname LIKE '%sellerId%'
    ORDER BY indexname;
  `)
  console.log('\nExisting indexes on watches table:')
  console.log(indexes)

  await prisma.$disconnect()
}

testQueryPerformance().catch(console.error)

