/**
 * UserAddress Migration Script
 *
 * This script migrates address data from the User model to the new UserAddress model.
 * Run this after the SQL migration to verify and fix any issues.
 *
 * Usage:
 *   npx ts-node scripts/migrate-user-addresses.ts
 *   or
 *   npx tsx scripts/migrate-user-addresses.ts
 *
 * Options:
 *   --dry-run    Show what would be migrated without making changes
 *   --verify     Verify migration integrity
 *   --stats      Show statistics only
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface MigrationStats {
  totalUsers: number
  usersWithMainAddress: number
  usersWithDeliveryAddress: number
  migratedMain: number
  migratedDelivery: number
  skippedMain: number
  skippedDelivery: number
  errors: string[]
}

async function getStats(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalUsers: 0,
    usersWithMainAddress: 0,
    usersWithDeliveryAddress: 0,
    migratedMain: 0,
    migratedDelivery: 0,
    skippedMain: 0,
    skippedDelivery: 0,
    errors: [],
  }

  // Count total users
  stats.totalUsers = await prisma.user.count()

  // Count users with main address (legacy fields)
  stats.usersWithMainAddress = await prisma.user.count({
    where: {
      street: { not: null },
      city: { not: null },
      NOT: [{ street: '' }, { city: '' }],
    },
  })

  // Count users with delivery address (legacy fields)
  stats.usersWithDeliveryAddress = await prisma.user.count({
    where: {
      deliveryStreet: { not: null },
      deliveryCity: { not: null },
      NOT: [{ deliveryStreet: '' }, { deliveryCity: '' }],
    },
  })

  // Count migrated addresses
  stats.migratedMain = await prisma.userAddress.count({
    where: { type: 'MAIN' },
  })

  stats.migratedDelivery = await prisma.userAddress.count({
    where: { type: 'DELIVERY' },
  })

  // Calculate skipped
  stats.skippedMain = stats.usersWithMainAddress - stats.migratedMain
  stats.skippedDelivery = stats.usersWithDeliveryAddress - stats.migratedDelivery

  return stats
}

async function verifyMigration(): Promise<boolean> {
  console.log('\n🔍 Verifying migration integrity...\n')

  let hasErrors = false

  // Get all users with legacy addresses
  const usersWithLegacyMain = await prisma.user.findMany({
    where: {
      street: { not: null },
      city: { not: null },
      NOT: [{ street: '' }, { city: '' }],
    },
    select: {
      id: true,
      email: true,
      street: true,
      streetNumber: true,
      postalCode: true,
      city: true,
    },
  })

  // Check each user has a corresponding UserAddress
  for (const user of usersWithLegacyMain) {
    const address = await prisma.userAddress.findUnique({
      where: {
        userId_type: { userId: user.id, type: 'MAIN' },
      },
    })

    if (!address) {
      console.log(`❌ Missing UserAddress for user ${user.email} (${user.id})`)
      hasErrors = true
    } else {
      // Verify data matches
      if (address.street !== (user.street || '') ||
          address.city !== (user.city || '')) {
        console.log(`⚠️  Data mismatch for user ${user.email}:`)
        console.log(`   Legacy: ${user.street}, ${user.city}`)
        console.log(`   New: ${address.street}, ${address.city}`)
        hasErrors = true
      }
    }
  }

  if (!hasErrors) {
    console.log('✅ All addresses migrated correctly!')
  }

  return !hasErrors
}

async function migrateAddresses(dryRun: boolean): Promise<void> {
  console.log(`\n${dryRun ? '🔄 DRY RUN: ' : ''}Migrating addresses...\n`)

  // Get users with main address but no UserAddress entry
  const usersToMigrate = await prisma.user.findMany({
    where: {
      street: { not: null },
      city: { not: null },
      NOT: [{ street: '' }, { city: '' }],
    },
    select: {
      id: true,
      email: true,
      street: true,
      streetNumber: true,
      postalCode: true,
      city: true,
      country: true,
      addresszusatz: true,
      kanton: true,
      deliveryStreet: true,
      deliveryStreetNumber: true,
      deliveryPostalCode: true,
      deliveryCity: true,
      deliveryCountry: true,
    },
  })

  let mainMigrated = 0
  let deliveryMigrated = 0
  let errors = 0

  for (const user of usersToMigrate) {
    try {
      // Check if main address already exists
      const existingMain = await prisma.userAddress.findUnique({
        where: { userId_type: { userId: user.id, type: 'MAIN' } },
      })

      if (!existingMain && user.street && user.city) {
        if (dryRun) {
          console.log(`Would migrate MAIN for ${user.email}`)
        } else {
          await prisma.userAddress.create({
            data: {
              userId: user.id,
              type: 'MAIN',
              street: user.street || '',
              streetNumber: user.streetNumber || '',
              postalCode: user.postalCode || '',
              city: user.city || '',
              country: user.country || 'Schweiz',
              addresszusatz: user.addresszusatz,
              kanton: user.kanton,
              isDefault: true,
            },
          })
        }
        mainMigrated++
      }

      // Check if delivery address needs migration
      if (user.deliveryStreet && user.deliveryCity) {
        const existingDelivery = await prisma.userAddress.findUnique({
          where: { userId_type: { userId: user.id, type: 'DELIVERY' } },
        })

        if (!existingDelivery) {
          if (dryRun) {
            console.log(`Would migrate DELIVERY for ${user.email}`)
          } else {
            await prisma.userAddress.create({
              data: {
                userId: user.id,
                type: 'DELIVERY',
                street: user.deliveryStreet || '',
                streetNumber: user.deliveryStreetNumber || '',
                postalCode: user.deliveryPostalCode || '',
                city: user.deliveryCity || '',
                country: user.deliveryCountry || 'Schweiz',
                isDefault: false,
              },
            })
          }
          deliveryMigrated++
        }
      }
    } catch (error) {
      console.error(`Error migrating user ${user.email}:`, error)
      errors++
    }
  }

  console.log(`\n${dryRun ? 'Would migrate' : 'Migrated'}:`)
  console.log(`  - ${mainMigrated} main addresses`)
  console.log(`  - ${deliveryMigrated} delivery addresses`)
  if (errors > 0) {
    console.log(`  - ${errors} errors`)
  }
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const verify = args.includes('--verify')
  const statsOnly = args.includes('--stats')

  console.log('═══════════════════════════════════════════')
  console.log('  UserAddress Migration Script')
  console.log('═══════════════════════════════════════════')

  try {
    // Always show stats
    const stats = await getStats()

    console.log('\n📊 Current Statistics:')
    console.log(`   Total users: ${stats.totalUsers}`)
    console.log(`   Users with main address (legacy): ${stats.usersWithMainAddress}`)
    console.log(`   Users with delivery address (legacy): ${stats.usersWithDeliveryAddress}`)
    console.log(`   Migrated main addresses: ${stats.migratedMain}`)
    console.log(`   Migrated delivery addresses: ${stats.migratedDelivery}`)

    if (stats.skippedMain > 0 || stats.skippedDelivery > 0) {
      console.log('\n⚠️  Pending migrations:')
      if (stats.skippedMain > 0) console.log(`   - ${stats.skippedMain} main addresses`)
      if (stats.skippedDelivery > 0) console.log(`   - ${stats.skippedDelivery} delivery addresses`)
    }

    if (statsOnly) {
      return
    }

    if (verify) {
      await verifyMigration()
      return
    }

    // Run migration (or dry run)
    await migrateAddresses(dryRun)

    // Verify after migration
    if (!dryRun) {
      await verifyMigration()
    }

    console.log('\n✅ Migration complete!')
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
