#!/usr/bin/env tsx
/**
 * Direct script to find and fix the Lacoste article
 * This script directly accesses the database to repair the article
 *
 * Usage: npx tsx scripts/fix-lacoste-article.ts
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load DATABASE_URL from .env.local manually
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
  console.log('\n📝 Make sure DATABASE_URL is set in .env.local')
  process.exit(1)
}

// Set it in process.env so Prisma can use it
process.env.DATABASE_URL = databaseUrl

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Searching for Lacoste article...')
  console.log('📊 Database URL:', databaseUrl ? 'Set' : 'Not Set')

  try {
    // Search for Lacoste articles
    const articles = await prisma.watch.findMany({
      where: {
        OR: [
          { title: { contains: 'lacoste', mode: 'insensitive' } },
          { brand: { contains: 'lacoste', mode: 'insensitive' } },
          { model: { contains: 'lacoste', mode: 'insensitive' } },
          { title: { contains: 'puli', mode: 'insensitive' } },
          { title: { contains: 'pullover', mode: 'insensitive' } },
          { title: { contains: 'strick', mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        title: true,
        brand: true,
        model: true,
        moderationStatus: true,
        isAuction: true,
        auctionEnd: true,
        createdAt: true,
        purchases: {
          select: {
            id: true,
            status: true,
          },
        },
        categories: {
          select: {
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    console.log(`\n📋 Found ${articles.length} article(s):`)
    articles.forEach((article, index) => {
      console.log(`\n${index + 1}. ${article.title}`)
      console.log(`   ID: ${article.id}`)
      console.log(`   Brand: ${article.brand}`)
      console.log(`   Model: ${article.model}`)
      console.log(`   ModerationStatus: ${article.moderationStatus || 'null'}`)
      console.log(`   IsAuction: ${article.isAuction}`)
      console.log(`   AuctionEnd: ${article.auctionEnd ? new Date(article.auctionEnd).toISOString() : 'null'}`)
      console.log(`   Purchases: ${article.purchases.length} (active: ${article.purchases.filter(p => p.status !== 'cancelled').length})`)
      console.log(`   Categories: ${article.categories.map((c: any) => c.category.slug).join(', ') || 'none'}`)
    })

    if (articles.length === 0) {
      console.log('\n❌ No articles found matching "lacoste", "puli", "pullover", or "strick"')
      console.log('💡 Try searching for other terms or check if the article exists in the database')
      return
    }

    // Fix each article
    const fixes: Array<{ id: string; title: string; fixes: string[] }> = []
    const now = new Date()

    for (const article of articles) {
      const articleFixes: string[] = []
      let needsUpdate = false
      const updateData: any = {}

      // Fix 1: Set moderationStatus to 'pending' if it's null or 'rejected'
      if (!article.moderationStatus || article.moderationStatus === 'rejected') {
        updateData.moderationStatus = 'pending'
        articleFixes.push(`Set moderationStatus from '${article.moderationStatus || 'null'}' to 'pending'`)
        needsUpdate = true
      }

      // Fix 4: Update createdAt to make it appear as newest (if it's old)
      const articleDate = new Date(article.createdAt)
      const daysOld = (now.getTime() - articleDate.getTime()) / (1000 * 60 * 60 * 24)
      if (daysOld > 1) {
        // If article is more than 1 day old, update createdAt to now to make it appear first
        updateData.createdAt = now
        articleFixes.push(`Updated createdAt to make article appear as newest (was ${daysOld.toFixed(1)} days old)`)
        needsUpdate = true
      }

      // Fix 2: If auction expired without purchase, extend it
      if (article.isAuction && article.auctionEnd) {
        const auctionEndDate = new Date(article.auctionEnd)
        const hasActivePurchases = article.purchases.some(p => p.status !== 'cancelled')
        
        if (auctionEndDate <= now && !hasActivePurchases) {
          // Extend auction by 7 days
          const newEndDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          updateData.auctionEnd = newEndDate
          articleFixes.push(`Extended expired auction to ${newEndDate.toISOString()}`)
          needsUpdate = true
        }
      }

      // Fix 3: Ensure article has at least one category (if none)
      if (article.categories.length === 0) {
        // Try to find a suitable category
        const categorySlug = 'kleidung-accessoires' // Default for clothing
        const category = await prisma.category.findUnique({
          where: { slug: categorySlug },
        })
        
        if (category) {
          await prisma.watchCategory.create({
            data: {
              watchId: article.id,
              categoryId: category.id,
            },
          })
          articleFixes.push(`Added category: ${categorySlug}`)
        }
      }

      if (needsUpdate) {
        await prisma.watch.update({
          where: { id: article.id },
          data: updateData,
        })
        console.log(`\n✅ Fixed article: ${article.title}`)
        articleFixes.forEach(fix => console.log(`   - ${fix}`))
      } else {
        console.log(`\n✓ Article "${article.title}" is already OK`)
      }

      if (articleFixes.length > 0) {
        fixes.push({
          id: article.id,
          title: article.title,
          fixes: articleFixes,
        })
      }
    }

    console.log(`\n✨ Summary:`)
    console.log(`   Found: ${articles.length} article(s)`)
    console.log(`   Fixed: ${fixes.length} article(s)`)
    
    if (fixes.length > 0) {
      console.log(`\n🎉 Articles have been fixed! They should now be visible on the platform.`)
    } else {
      console.log(`\n💡 No fixes needed. If articles are still not visible, check:`)
      console.log(`   1. Are they sold (have active purchases)?`)
      console.log(`   2. Do they have categories assigned?`)
      console.log(`   3. Are they expired auctions without purchases?`)
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    if (error.code) {
      console.error(`   Code: ${error.code}`)
    }
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
