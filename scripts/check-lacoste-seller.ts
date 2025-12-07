#!/usr/bin/env tsx
/**
 * Check if Lacoste article's seller exists and is active
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
  console.log('🔍 Checking Lacoste article seller...\n')

  const articleId = 'cmipseh3y0001bbm7ew1n8atm'

  try {
    const article = await prisma.watch.findUnique({
      where: { id: articleId },
      select: {
        id: true,
        title: true,
        sellerId: true,
        seller: {
          select: {
            id: true,
            email: true,
            name: true,
            isBlocked: true,
            blockedAt: true,
            emailVerified: true,
          },
        },
      },
    })

    if (!article) {
      console.log('❌ Article not found!')
      return
    }

    console.log('📋 Article:')
    console.log(`   Title: ${article.title}`)
    console.log(`   SellerId: ${article.sellerId}`)

    if (!article.seller) {
      console.log('\n❌ PROBLEM: Seller does not exist!')
      console.log('   This will cause the article to be filtered out.')

      // Try to find the seller
      const seller = await prisma.user.findUnique({
        where: { id: article.sellerId },
      })

      if (!seller) {
        console.log('   Seller with this ID does not exist in database.')
        console.log('   💡 Need to assign article to an existing seller.')
      }
    } else {
      console.log('\n✅ Seller exists:')
      console.log(`   Email: ${article.seller.email}`)
      console.log(`   Name: ${article.seller.name || 'N/A'}`)
      console.log(`   IsBlocked: ${article.seller.isBlocked || false}`)
      console.log(`   EmailVerified: ${article.seller.emailVerified || false}`)

      if (article.seller.isBlocked) {
        console.log('\n⚠️  WARNING: Seller is blocked!')
        console.log('   This might cause the article to be filtered out.')
      }
    }

    // Test if article appears with seller filter
    const searchWithSeller = await prisma.watch.findMany({
      where: {
        id: articleId,
        seller: {
          id: { not: null },
        },
      },
      select: { id: true },
    })

    console.log(`\n🔍 Search with seller filter: ${searchWithSeller.length > 0 ? '✅ PASSES' : '❌ FAILS'}`)

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`)
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


