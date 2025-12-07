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
  console.warn('Could not load .env.local, using environment variables')
}

// Prüfe ob DATABASE_URL gesetzt ist
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set!')
  console.error('Please set DATABASE_URL in your .env.local file or environment variables.')
  process.exit(1)
}

console.log('DATABASE_URL:', process.env.DATABASE_URL.substring(0, 20) + '...')

// Erstelle Prisma Client mit expliziter DATABASE_URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

async function createIndexes() {
  console.log('Creating performance indexes...')

  try {
    // Index auf sellerId für schnelle Abfragen nach Verkäufer (Artikel)
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "watches_sellerId_idx" ON "watches"("sellerId");
    `)
    console.log('✓ Created index: watches_sellerId_idx')

    // Zusammengesetzter Index für Sortierung nach createdAt bei sellerId-Filter (Artikel)
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "watches_sellerId_createdAt_idx" ON "watches"("sellerId", "createdAt" DESC);
    `)
    console.log('✓ Created index: watches_sellerId_createdAt_idx')

    // Index auf watchId (Artikel-ID) in bids für schnelle Gebots-Abfragen
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "bids_watchId_idx" ON "bids"("watchId");
    `)
    console.log('✓ Created index: bids_watchId_idx')

    // Zusammengesetzter Index für Sortierung nach amount bei watchId-Filter (Artikel-Gebote)
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "bids_watchId_amount_idx" ON "bids"("watchId", "amount" DESC);
    `)
    console.log('✓ Created index: bids_watchId_amount_idx')

    // Index auf watchId (Artikel-ID) in purchases für schnelle Kauf-Abfragen
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "purchases_watchId_idx" ON "purchases"("watchId");
    `)
    console.log('✓ Created index: purchases_watchId_idx')

    // Zusammengesetzter Index für Filterung nach Status bei watchId-Filter (Artikel-Käufe)
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "purchases_watchId_status_idx" ON "purchases"("watchId", "status");
    `)
    console.log('✓ Created index: purchases_watchId_status_idx')

    console.log('\n✅ All indexes created successfully!')
    console.log('Performance should be dramatically improved now.')
  } catch (error) {
    console.error('❌ Error creating indexes:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createIndexes()
  .catch((error) => {
    console.error('Failed to create indexes:', error)
    process.exit(1)
  })

