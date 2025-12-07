import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import { resolve } from 'path'

// Lade Umgebungsvariablen aus .env.local
config({ path: resolve(process.cwd(), '.env.local') })

// Prüfe ob DATABASE_URL gesetzt ist
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set!')
  console.error('Please set DATABASE_URL in your .env.local file or environment variables.')
  process.exit(1)
}

const prisma = new PrismaClient()

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

