#!/usr/bin/env tsx
/**
 * Test if the Lacoste article appears in search results
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
  console.log('🔍 Testing article visibility in search...\n')

  const articleId = 'cmipseh3y0001bbm7ew1n8atm' // Lacoste article ID
  
  try {
    // Get the article
    const article = await prisma.watch.findUnique({
      where: { id: articleId },
      select: {
        id: true,
        title: true,
        brand: true,
        moderationStatus: true,
        isAuction: true,
        auctionEnd: true,
        purchases: {
          select: { id: true, status: true },
        },
        categories: {
          select: {
            category: {
              select: { slug: true },
            },
          },
        },
      },
    })

    if (!article) {
      console.log('❌ Article not found!')
      return
    }

    console.log('📋 Article details:')
    console.log(`   Title: ${article.title}`)
    console.log(`   Brand: ${article.brand}`)
    console.log(`   ModerationStatus: ${article.moderationStatus || 'null'}`)
    console.log(`   IsAuction: ${article.isAuction}`)
    console.log(`   AuctionEnd: ${article.auctionEnd ? new Date(article.auctionEnd).toISOString() : 'null'}`)
    console.log(`   Purchases: ${article.purchases.length} (active: ${article.purchases.filter(p => p.status !== 'cancelled').length})`)
    console.log(`   Categories: ${article.categories.map((c: any) => c.category.slug).join(', ') || 'none'}\n`)

    // Test search query (simulating /api/articles/search)
    const now = new Date()
    const whereClause: any = {
      AND: [
        {
          OR: [
            { moderationStatus: null },
            { moderationStatus: { not: 'rejected' } },
          ],
        },
        {
          OR: [
            { purchases: { none: {} } },
            { purchases: { every: { status: 'cancelled' } } },
          ],
        },
        {
          OR: [
            { auctionEnd: null },
            { auctionEnd: { gt: now } },
            {
              AND: [
                { auctionEnd: { lte: now } },
                { purchases: { some: { status: { not: 'cancelled' } } } },
              ],
            },
          ],
        },
      ],
    }

    // Test if article matches the search filter
    const searchResults = await prisma.watch.findMany({
      where: {
        ...whereClause,
        id: articleId, // Only search for this specific article
      },
      select: { id: true, title: true },
    })

    console.log('🔍 Search filter test:')
    if (searchResults.length > 0) {
      console.log('✅ Article PASSES search filters - should be visible!')
    } else {
      console.log('❌ Article FAILS search filters - will be hidden!')
      
      // Debug why it fails
      console.log('\n🔍 Debugging filter failures:')
      
      // Test moderationStatus filter
      const modTest = await prisma.watch.findMany({
        where: {
          OR: [
            { moderationStatus: null },
            { moderationStatus: { not: 'rejected' } },
          ],
          id: articleId,
        },
        select: { id: true },
      })
      console.log(`   ModerationStatus filter: ${modTest.length > 0 ? '✅ PASS' : '❌ FAIL'}`)
      
      // Test purchases filter
      const purchaseTest = await prisma.watch.findMany({
        where: {
          OR: [
            { purchases: { none: {} } },
            { purchases: { every: { status: 'cancelled' } } },
          ],
          id: articleId,
        },
        select: { id: true },
      })
      console.log(`   Purchases filter: ${purchaseTest.length > 0 ? '✅ PASS' : '❌ FAIL'}`)
      
      // Test auction filter
      const auctionTest = await prisma.watch.findMany({
        where: {
          OR: [
            { auctionEnd: null },
            { auctionEnd: { gt: now } },
            {
              AND: [
                { auctionEnd: { lte: now } },
                { purchases: { some: { status: { not: 'cancelled' } } } },
              ],
            },
          ],
          id: articleId,
        },
        select: { id: true },
      })
      console.log(`   Auction filter: ${auctionTest.length > 0 ? '✅ PASS' : '❌ FAIL'}`)
    }

    // Also test general search (without ID filter)
    const generalSearch = await prisma.watch.findMany({
      where: {
        ...whereClause,
        OR: [
          { title: { contains: 'lacoste', mode: 'insensitive' } },
          { brand: { contains: 'lacoste', mode: 'insensitive' } },
        ],
      },
      select: { id: true, title: true },
      take: 10,
    })

    console.log(`\n🔍 General search for "lacoste":`)
    console.log(`   Found ${generalSearch.length} article(s)`)
    const foundInSearch = generalSearch.some(a => a.id === articleId)
    console.log(`   Article in results: ${foundInSearch ? '✅ YES' : '❌ NO'}`)
    
    if (!foundInSearch && generalSearch.length > 0) {
      console.log(`\n⚠️  Other articles found but not the Lacoste one:`)
      generalSearch.forEach(a => console.log(`   - ${a.title} (${a.id})`))
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`)
    }
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

