#!/usr/bin/env tsx
/**
 * Script zum Anwenden der Notification Preferences Migration
 * 
 * Fügt die fehlenden Spalten zur user_preferences Tabelle hinzu.
 * 
 * Usage:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/apply-notification-migration.ts
 */

import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('\n🔧 Notification Preferences Migration')
  console.log('=' .repeat(50))

  try {
    console.log('\n📋 Füge fehlende Spalten zur user_preferences Tabelle hinzu...')

    // Verwende die gleiche Logik wie im Admin-Endpoint
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        -- Add columns if they don't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'user_preferences' AND column_name = 'emailOnNewMessage'
        ) THEN
          ALTER TABLE "user_preferences" ADD COLUMN "emailOnNewMessage" BOOLEAN NOT NULL DEFAULT true;
          RAISE NOTICE 'Added emailOnNewMessage column';
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'user_preferences' AND column_name = 'emailOnNewBid'
        ) THEN
          ALTER TABLE "user_preferences" ADD COLUMN "emailOnNewBid" BOOLEAN NOT NULL DEFAULT true;
          RAISE NOTICE 'Added emailOnNewBid column';
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'user_preferences' AND column_name = 'emailOnNewOffer'
        ) THEN
          ALTER TABLE "user_preferences" ADD COLUMN "emailOnNewOffer" BOOLEAN NOT NULL DEFAULT true;
          RAISE NOTICE 'Added emailOnNewOffer column';
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'user_preferences' AND column_name = 'emailOnSaleCompleted'
        ) THEN
          ALTER TABLE "user_preferences" ADD COLUMN "emailOnSaleCompleted" BOOLEAN NOT NULL DEFAULT true;
          RAISE NOTICE 'Added emailOnSaleCompleted column';
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'user_preferences' AND column_name = 'emailOnOutbid'
        ) THEN
          ALTER TABLE "user_preferences" ADD COLUMN "emailOnOutbid" BOOLEAN NOT NULL DEFAULT true;
          RAISE NOTICE 'Added emailOnOutbid column';
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'user_preferences' AND column_name = 'emailOnAuctionEnding'
        ) THEN
          ALTER TABLE "user_preferences" ADD COLUMN "emailOnAuctionEnding" BOOLEAN NOT NULL DEFAULT true;
          RAISE NOTICE 'Added emailOnAuctionEnding column';
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'user_preferences' AND column_name = 'emailOnPurchase'
        ) THEN
          ALTER TABLE "user_preferences" ADD COLUMN "emailOnPurchase" BOOLEAN NOT NULL DEFAULT true;
          RAISE NOTICE 'Added emailOnPurchase column';
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'user_preferences' AND column_name = 'emailOnShipping'
        ) THEN
          ALTER TABLE "user_preferences" ADD COLUMN "emailOnShipping" BOOLEAN NOT NULL DEFAULT true;
          RAISE NOTICE 'Added emailOnShipping column';
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'user_preferences' AND column_name = 'emailOnSearchMatch'
        ) THEN
          ALTER TABLE "user_preferences" ADD COLUMN "emailOnSearchMatch" BOOLEAN NOT NULL DEFAULT true;
          RAISE NOTICE 'Added emailOnSearchMatch column';
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'user_preferences' AND column_name = 'emailOnFavoritePriceChange'
        ) THEN
          ALTER TABLE "user_preferences" ADD COLUMN "emailOnFavoritePriceChange" BOOLEAN NOT NULL DEFAULT false;
          RAISE NOTICE 'Added emailOnFavoritePriceChange column';
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'user_preferences' AND column_name = 'emailMarketing'
        ) THEN
          ALTER TABLE "user_preferences" ADD COLUMN "emailMarketing" BOOLEAN NOT NULL DEFAULT false;
          RAISE NOTICE 'Added emailMarketing column';
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'user_preferences' AND column_name = 'emailDigestFrequency'
        ) THEN
          ALTER TABLE "user_preferences" ADD COLUMN "emailDigestFrequency" TEXT NOT NULL DEFAULT 'instant';
          RAISE NOTICE 'Added emailDigestFrequency column';
        END IF;
      END $$;
    `)

    console.log('\n✅ Migration erfolgreich angewendet!')
    console.log('   Alle fehlenden Spalten wurden zur user_preferences Tabelle hinzugefügt.')
    console.log('\n💡 Die Notification Preferences sollten jetzt funktionieren.')
  } catch (error: any) {
    console.error('\n❌ Fehler beim Anwenden der Migration:', error.message)
    process.exit(1)
  }
}

main()
  .catch(e => {
    console.error('\n❌ Fehler:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
