#!/usr/bin/env tsx
/**
 * Make Lacoste article appear as newest by updating createdAt
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load DATABASE_URL from .env.local
let databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  try {
    const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
    const match = envFile.match(/^DATABASE_URL=(.+)$/m)
    if (match) {
      databaseUrl = match[1].trim().replace(/^["']|["']$/g, '')
    }
  } catch (e) {
    console.error('Error reading .env.local:', e)
  }
}

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found!')
  process.exit(1)
}

process.env.DATABASE_URL = databaseUrl

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Making Lacoste article appear as newest...\n')

  const articleId = 'cmipseh3y0001bbm7ew1n8atm' // Lacoste article ID
  
  try {
    // Update createdAt to now to make it appear first
    const now = new Date()
    const updated = await prisma.watch.update({
      where: { id: articleId },
      data: {
        createdAt: now,
        moderationStatus: 'pending', // Ensure it's pending
      },
    })

    console.log('✅ Article updated successfully!')
    console.log(`   Title: ${updated.title}`)
    console.log(`   New createdAt: ${now.toISOString()}`)
    console.log(`   ModerationStatus: ${updated.moderationStatus}`)
    console.log('\n🎉 Article should now appear as the newest on the homepage!')
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    if (error.code) {
      console.error(`   Code: ${error.code}`)
    }
    process.exit(1)
  }
}

main()
  .catch(e => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

