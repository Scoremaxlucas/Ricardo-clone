/**
 * Import users who have NOT uploaded any listings as marketing contacts.
 * Adds them with tag "keine-artikel" + "marketing" so they can be targeted
 * with campaigns encouraging them to list their first item.
 *
 * Usage: npx tsx scripts/import-users-without-listings.ts
 */
import dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local'), override: true })
dotenv.config({ path: resolve(process.cwd(), '.env'), override: false })

if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('postgres')) {
  console.error('DATABASE_URL must be a PostgreSQL connection string.')
  console.error('Make sure .env.local has the production DATABASE_URL.')
  process.exit(1)
}

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
})

async function main() {
  const usersWithoutListings = await prisma.user.findMany({
    where: {
      watches: { none: {} },
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  })

  console.log(`Found ${usersWithoutListings.length} users without any listings.\n`)

  let created = 0
  let updated = 0
  let skipped = 0
  let errors = 0

  const TAGS = ['marketing', 'keine-artikel']

  for (const user of usersWithoutListings) {
    try {
      const existing = await prisma.marketingContact.findUnique({
        where: { email: user.email.toLowerCase() },
      })

      if (existing) {
        const existingTags: string[] = (() => {
          try { return JSON.parse(existing.tags) } catch { return [] }
        })()

        if (existing.status === 'unsubscribed') {
          skipped++
          console.log(`  - ${user.email} (unsubscribed, skipped)`)
          continue
        }

        let changed = false
        for (const tag of TAGS) {
          if (!existingTags.includes(tag)) {
            existingTags.push(tag)
            changed = true
          }
        }

        if (changed) {
          await prisma.marketingContact.update({
            where: { email: user.email.toLowerCase() },
            data: {
              tags: JSON.stringify(existingTags),
              userId: existing.userId || user.id,
            },
          })
          updated++
          console.log(`  ~ ${user.email} (tags updated: ${existingTags.join(', ')})`)
        } else {
          skipped++
          console.log(`  = ${user.email} (already has all tags)`)
        }
      } else {
        await prisma.marketingContact.create({
          data: {
            email: user.email.toLowerCase(),
            tags: JSON.stringify(TAGS),
            source: 'registration',
            userId: user.id,
          },
        })
        created++
        console.log(`  + ${user.email} (${user.name || 'no name'})`)
      }
    } catch (err: any) {
      errors++
      console.error(`  ! ${user.email}: ${err.message}`)
    }
  }

  const totalContacts = await prisma.marketingContact.count()
  const activeContacts = await prisma.marketingContact.count({ where: { status: 'active' } })

  console.log(`\n--- Done ---`)
  console.log(`Created: ${created}`)
  console.log(`Updated: ${updated}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Errors: ${errors}`)
  console.log(`Total contacts in DB: ${totalContacts} (${activeContacts} active)`)

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
