#!/usr/bin/env tsx
/**
 * Force show Lacoste article by ensuring it passes ALL filters and appears first
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
  console.log('🔧 Force showing Lacoste article...\n')

  const articleId = 'cmipseh3y0001bbm7ew1n8atm'
  const now = new Date()
  
  try {
    // Get current article state
    const article = await prisma.watch.findUnique({
      where: { id: articleId },
      select: {
        id: true,
        title: true,
        moderationStatus: true,
        createdAt: true,
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

    console.log('📋 Current state:')
    console.log(`   Title: ${article.title}`)
    console.log(`   ModerationStatus: ${article.moderationStatus || 'null'}`)
    console.log(`   CreatedAt: ${article.createdAt.toISOString()}`)
    console.log(`   IsAuction: ${article.isAuction}`)
    console.log(`   Purchases: ${article.purchases.length}`)
    console.log(`   Categories: ${article.categories.map((c: any) => c.category.slug).join(', ') || 'none'}\n`)

    // Force fix: Set everything to ensure visibility
    const updateData: any = {
      moderationStatus: 'pending',
      createdAt: now, // Make it newest
      updatedAt: now,
    }

    // Ensure it's not an auction (or if it is, extend it)
    if (article.isAuction) {
      const newEndDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      updateData.auctionEnd = newEndDate
      console.log(`   Extending auction to: ${newEndDate.toISOString()}`)
    } else {
      updateData.auctionEnd = null
      updateData.isAuction = false
    }

    // Ensure category exists
    if (article.categories.length === 0) {
      const category = await prisma.category.findUnique({
        where: { slug: 'kleidung-accessoires' },
      })
      if (category) {
        await prisma.watchCategory.create({
          data: {
            watchId: articleId,
            categoryId: category.id,
          },
        })
        console.log(`   Added category: kleidung-accessoires`)
      }
    }

    // Cancel any purchases (if needed for testing)
    const activePurchases = article.purchases.filter(p => p.status !== 'cancelled')
    if (activePurchases.length > 0) {
      console.log(`   ⚠️  Article has ${activePurchases.length} active purchase(s) - these will hide it`)
      console.log(`   💡 To make it visible, cancel these purchases manually`)
    }

    // Update the article
    const updated = await prisma.watch.update({
      where: { id: articleId },
      data: updateData,
    })

    console.log('\n✅ Article updated!')
    console.log(`   New createdAt: ${updated.createdAt.toISOString()}`)
    console.log(`   ModerationStatus: ${updated.moderationStatus}`)
    
    // Test if it appears in search
    const searchTest = await prisma.watch.findMany({
      where: {
        AND: [
          { OR: [{ moderationStatus: null }, { moderationStatus: { not: 'rejected' } }] },
          { OR: [{ purchases: { none: {} } }, { purchases: { every: { status: 'cancelled' } } }] },
          { OR: [{ auctionEnd: null }, { auctionEnd: { gt: now } }] },
        ],
        id: articleId,
      },
      select: { id: true, title: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    console.log(`\n🔍 Search test: ${searchTest.length > 0 ? '✅ PASSES' : '❌ FAILS'}`)
    if (searchTest.length > 0) {
      const position = searchTest.findIndex(a => a.id === articleId)
      console.log(`   Position in results: ${position >= 0 ? `#${position + 1}` : 'NOT FOUND'}`)
    }

    // Get all articles ordered by createdAt to see position
    const allArticles = await prisma.watch.findMany({
      where: {
        AND: [
          { OR: [{ moderationStatus: null }, { moderationStatus: { not: 'rejected' } }] },
          { OR: [{ purchases: { none: {} } }, { purchases: { every: { status: 'cancelled' } } }] },
          { OR: [{ auctionEnd: null }, { auctionEnd: { gt: now } }] },
        ],
      },
      select: { id: true, title: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    console.log(`\n📊 Top 10 articles (newest first):`)
    allArticles.forEach((a, i) => {
      const isLacoste = a.id === articleId
      console.log(`   ${i + 1}. ${isLacoste ? '⭐ ' : '   '}${a.title.substring(0, 50)}... (${a.createdAt.toISOString()})`)
    })

    const lacostePosition = allArticles.findIndex(a => a.id === articleId)
    if (lacostePosition >= 0) {
      console.log(`\n🎉 Lacoste article is at position #${lacostePosition + 1} - should be visible!`)
    } else {
      console.log(`\n❌ Lacoste article NOT in top 10 - might be filtered out`)
    }

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

