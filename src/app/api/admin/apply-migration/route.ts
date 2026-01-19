import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/admin/apply-migration
 * Admin-only endpoint to apply database migrations that weren't run automatically
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin access
    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results: string[] = []

    // Apply notification preferences columns migration
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "user_preferences"
        ADD COLUMN IF NOT EXISTS "emailOnNewMessage" BOOLEAN NOT NULL DEFAULT true
      `)
      results.push('Added emailOnNewMessage column')
    } catch (e: any) {
      results.push(`emailOnNewMessage: ${e.message}`)
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "user_preferences"
        ADD COLUMN IF NOT EXISTS "emailOnNewBid" BOOLEAN NOT NULL DEFAULT true
      `)
      results.push('Added emailOnNewBid column')
    } catch (e: any) {
      results.push(`emailOnNewBid: ${e.message}`)
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "user_preferences"
        ADD COLUMN IF NOT EXISTS "emailOnNewOffer" BOOLEAN NOT NULL DEFAULT true
      `)
      results.push('Added emailOnNewOffer column')
    } catch (e: any) {
      results.push(`emailOnNewOffer: ${e.message}`)
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "user_preferences"
        ADD COLUMN IF NOT EXISTS "emailOnSaleCompleted" BOOLEAN NOT NULL DEFAULT true
      `)
      results.push('Added emailOnSaleCompleted column')
    } catch (e: any) {
      results.push(`emailOnSaleCompleted: ${e.message}`)
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "user_preferences"
        ADD COLUMN IF NOT EXISTS "emailOnOutbid" BOOLEAN NOT NULL DEFAULT true
      `)
      results.push('Added emailOnOutbid column')
    } catch (e: any) {
      results.push(`emailOnOutbid: ${e.message}`)
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "user_preferences"
        ADD COLUMN IF NOT EXISTS "emailOnAuctionEnding" BOOLEAN NOT NULL DEFAULT true
      `)
      results.push('Added emailOnAuctionEnding column')
    } catch (e: any) {
      results.push(`emailOnAuctionEnding: ${e.message}`)
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "user_preferences"
        ADD COLUMN IF NOT EXISTS "emailOnPurchase" BOOLEAN NOT NULL DEFAULT true
      `)
      results.push('Added emailOnPurchase column')
    } catch (e: any) {
      results.push(`emailOnPurchase: ${e.message}`)
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "user_preferences"
        ADD COLUMN IF NOT EXISTS "emailOnShipping" BOOLEAN NOT NULL DEFAULT true
      `)
      results.push('Added emailOnShipping column')
    } catch (e: any) {
      results.push(`emailOnShipping: ${e.message}`)
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "user_preferences"
        ADD COLUMN IF NOT EXISTS "emailOnSearchMatch" BOOLEAN NOT NULL DEFAULT true
      `)
      results.push('Added emailOnSearchMatch column')
    } catch (e: any) {
      results.push(`emailOnSearchMatch: ${e.message}`)
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "user_preferences"
        ADD COLUMN IF NOT EXISTS "emailOnFavoritePriceChange" BOOLEAN NOT NULL DEFAULT false
      `)
      results.push('Added emailOnFavoritePriceChange column')
    } catch (e: any) {
      results.push(`emailOnFavoritePriceChange: ${e.message}`)
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "user_preferences"
        ADD COLUMN IF NOT EXISTS "emailMarketing" BOOLEAN NOT NULL DEFAULT false
      `)
      results.push('Added emailMarketing column')
    } catch (e: any) {
      results.push(`emailMarketing: ${e.message}`)
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "user_preferences"
        ADD COLUMN IF NOT EXISTS "emailDigestFrequency" TEXT NOT NULL DEFAULT 'instant'
      `)
      results.push('Added emailDigestFrequency column')
    } catch (e: any) {
      results.push(`emailDigestFrequency: ${e.message}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Migration applied',
      results,
    })
  } catch (error: any) {
    console.error('[apply-migration] Error:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    )
  }
}
