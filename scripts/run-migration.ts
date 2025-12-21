#!/usr/bin/env ts-node

/**
 * Run migration for connectOnboardingStatus and payoutsEnabled fields
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." npx ts-node scripts/run-migration.ts
 *
 * Or set DATABASE_URL in .env file
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function runMigration() {
  try {
    console.log('🚀 Starting migration...')

    // Check if columns already exist by trying to query them
    try {
      await prisma.$queryRaw`SELECT "connectOnboardingStatus" FROM "User" LIMIT 1`
      console.log('✅ Column connectOnboardingStatus already exists')
    } catch (error: any) {
      if (error.message?.includes('does not exist') || error.code === '42703') {
        console.log('📝 Adding connectOnboardingStatus column...')
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "connectOnboardingStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED';
        `)
        console.log('✅ Added connectOnboardingStatus column')
      } else {
        throw error
      }
    }

    try {
      await prisma.$queryRaw`SELECT "payoutsEnabled" FROM "User" LIMIT 1`
      console.log('✅ Column payoutsEnabled already exists')
    } catch (error: any) {
      if (error.message?.includes('does not exist') || error.code === '42703') {
        console.log('📝 Adding payoutsEnabled column...')
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "payoutsEnabled" BOOLEAN NOT NULL DEFAULT false;
        `)
        console.log('✅ Added payoutsEnabled column')
      } else {
        throw error
      }
    }

    // Migrate existing users
    console.log('📝 Migrating existing users...')

    const completeResult = await prisma.$executeRawUnsafe(`
      UPDATE "User"
      SET "connectOnboardingStatus" = 'COMPLETE',
          "payoutsEnabled" = true
      WHERE "stripeOnboardingComplete" = true
        AND "stripeConnectedAccountId" IS NOT NULL;
    `)
    console.log(`✅ Migrated ${completeResult} users with complete onboarding`)

    const incompleteResult = await prisma.$executeRawUnsafe(`
      UPDATE "User"
      SET "connectOnboardingStatus" = 'INCOMPLETE'
      WHERE "stripeConnectedAccountId" IS NOT NULL
        AND "stripeOnboardingComplete" = false;
    `)
    console.log(`✅ Migrated ${incompleteResult} users with incomplete onboarding`)

    console.log('✅ Migration completed successfully!')
  } catch (error: any) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

runMigration()
  .then(() => {
    console.log('🎉 Done!')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Error:', error)
    process.exit(1)
  })
