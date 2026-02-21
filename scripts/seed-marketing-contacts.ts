/**
 * Seed Marketing Contacts from Existing Users
 *
 * Imports all users who gave marketing consent (or all users with emails)
 * into the MarketingContact table for the marketing email system.
 *
 * Usage:
 *   npx tsx scripts/seed-marketing-contacts.ts
 *   npx tsx scripts/seed-marketing-contacts.ts --all   # Include all users, not just those with consent
 */

import dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local'), override: true })
dotenv.config({ path: resolve(process.cwd(), '.env'), override: false })

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set!')
  process.exit(1)
}

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
})

async function main() {
  const includeAll = process.argv.includes('--all')

  console.log(`\nSeeding marketing contacts from existing users...`)
  console.log(`Mode: ${includeAll ? 'ALL users' : 'Only users with marketingConsent=true'}\n`)

  const where = includeAll ? {} : { marketingConsent: true }

  const users = await prisma.user.findMany({
    where,
    select: { id: true, email: true, marketingConsent: true },
  })

  console.log(`Found ${users.length} users to process\n`)

  let created = 0
  let skipped = 0
  let errors = 0

  for (const user of users) {
    try {
      const tags = user.marketingConsent
        ? ['marketing', 'registration']
        : ['registration']

      await prisma.marketingContact.upsert({
        where: { email: user.email },
        update: { userId: user.id },
        create: {
          email: user.email,
          tags: JSON.stringify(tags),
          source: 'migration',
          userId: user.id,
        },
      })
      created++
    } catch (err: any) {
      if (err.code === 'P2002') {
        skipped++
      } else {
        errors++
        console.error(`  Error for ${user.email}: ${err.message}`)
      }
    }
  }

  // Also import contact form submissions
  console.log(`\nImporting contact form submissions...`)
  const contactRequests = await prisma.contactRequest.findMany({
    select: { email: true },
    distinct: ['email'],
  })

  let contactCreated = 0
  for (const cr of contactRequests) {
    if (!cr.email) continue
    try {
      await prisma.marketingContact.upsert({
        where: { email: cr.email.toLowerCase() },
        update: {},
        create: {
          email: cr.email.toLowerCase(),
          tags: JSON.stringify(['contact-form']),
          source: 'contact-form',
        },
      })
      contactCreated++
    } catch {
      // Already exists, skip
    }
  }

  const totalContacts = await prisma.marketingContact.count()

  console.log(`\n--- Results ---`)
  console.log(`Users processed: ${users.length}`)
  console.log(`  Created: ${created}`)
  console.log(`  Skipped (already existed): ${skipped}`)
  console.log(`  Errors: ${errors}`)
  console.log(`Contact form imports: ${contactCreated}`)
  console.log(`Total marketing contacts in DB: ${totalContacts}\n`)

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
