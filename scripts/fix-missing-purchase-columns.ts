/**
 * Fix Missing Purchase Columns
 * 
 * Dieses Script fügt die fehlenden Spalten zur 'purchases' Tabelle hinzu.
 * 
 * Verwendung:
 *   1. Stelle sicher, dass DATABASE_URL auf die Produktions-DB zeigt
 *   2. Führe aus: npx tsx scripts/fix-missing-purchase-columns.ts
 * 
 * Oder verwende die SQL-Datei direkt in der Vercel PostgreSQL Console.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Fixing missing purchase columns...\n')

  try {
    // Add missing dispute columns
    const alterCommands = [
      `ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeDeadline" TIMESTAMP(3)`,
      `ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeFrozenAt" TIMESTAMP(3)`,
      `ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeAttachments" TEXT`,
      `ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeReminderSentAt" TIMESTAMP(3)`,
      `ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeReminderCount" INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "stripePaymentIntentId" TEXT`,
      `ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "stripeRefundId" TEXT`,
      `ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "stripeRefundStatus" TEXT`,
      `ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "stripeRefundedAt" TIMESTAMP(3)`,
    ]

    for (const command of alterCommands) {
      console.log(`  Running: ${command.substring(0, 60)}...`)
      try {
        await prisma.$executeRawUnsafe(command)
        console.log('  ✅ Success')
      } catch (error: any) {
        if (error.message?.includes('already exists')) {
          console.log('  ⏭️  Column already exists')
        } else {
          console.error(`  ❌ Error: ${error.message}`)
        }
      }
    }

    // Create index
    console.log('\n📊 Creating indexes...')
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "purchases_disputeStatus_idx" ON "purchases"("disputeStatus")
      `)
      console.log('  ✅ Index created')
    } catch (error: any) {
      console.log(`  ⏭️  Index may already exist: ${error.message}`)
    }

    // Create DisputeComment table
    console.log('\n📋 Creating dispute_comments table...')
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "dispute_comments" (
          "id" TEXT NOT NULL,
          "purchaseId" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "userRole" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "attachments" TEXT,
          "isInternal" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "dispute_comments_pkey" PRIMARY KEY ("id")
        )
      `)
      console.log('  ✅ Table created')
    } catch (error: any) {
      console.log(`  ⏭️  Table may already exist: ${error.message}`)
    }

    // Create indexes for dispute_comments
    console.log('\n📊 Creating dispute_comments indexes...')
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "dispute_comments_purchaseId_idx" ON "dispute_comments"("purchaseId")
      `)
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "dispute_comments_purchaseId_createdAt_idx" ON "dispute_comments"("purchaseId", "createdAt")
      `)
      console.log('  ✅ Indexes created')
    } catch (error: any) {
      console.log(`  ⏭️  Indexes may already exist: ${error.message}`)
    }

    // Verify columns exist
    console.log('\n🔍 Verifying columns...')
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'purchases' 
      AND column_name IN (
        'disputeDeadline', 
        'disputeFrozenAt', 
        'disputeAttachments', 
        'disputeReminderSentAt', 
        'disputeReminderCount',
        'stripePaymentIntentId',
        'stripeRefundId',
        'stripeRefundStatus',
        'stripeRefundedAt'
      )
    ` as any[]

    console.log('\n📋 Existing columns in purchases table:')
    if (result.length === 0) {
      console.log('  ❌ No columns found! Something went wrong.')
    } else {
      for (const row of result) {
        console.log(`  ✅ ${row.column_name} (${row.data_type})`)
      }
    }

    console.log('\n✅ Done! The missing columns should now exist.')
    console.log('   Please redeploy your application to Vercel.')
    
  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
