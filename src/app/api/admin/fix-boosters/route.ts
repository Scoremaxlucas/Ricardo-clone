import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

/**
 * POST /api/admin/fix-boosters
 * Migration to update booster codes from Bronze/Silber/Gold to Boost/Turbo-Boost/Super-Boost
 * Watch-out.ch Style
 * Only accessible by admins
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update old booster codes (bronze/silber/gold) to new naming (boost/turbo-boost/super-boost)
    const updates = await prisma.$transaction([
      // bronze -> boost
      prisma.boosterPrice.updateMany({
        where: { code: 'bronze' },
        data: {
          code: 'boost',
          name: 'Boost',
          description: 'Bessere Platzierung in Suchergebnissen für mehr Aufmerksamkeit',
          price: 19.90,
        },
      }),
      // silber -> turbo-boost
      prisma.boosterPrice.updateMany({
        where: { code: 'silber' },
        data: {
          code: 'turbo-boost',
          name: 'Turbo-Boost',
          description: 'Sehr prominente Platzierung + erhöhte Sichtbarkeit in Listen',
          price: 39.90,
        },
      }),
      // gold -> super-boost
      prisma.boosterPrice.updateMany({
        where: { code: 'gold' },
        data: {
          code: 'super-boost',
          name: 'Super-Boost',
          description: 'Top-Position + Premium-Startseite + Priorität bei Empfehlungen',
          price: 69.90,
        },
      }),
    ])

    // Also update any watches that have old booster codes (boosters is a String field)
    // Note: The boosters field stores a JSON array as string, e.g. '["bronze"]' or just 'bronze'
    const watchUpdates = await prisma.$transaction([
      // bronze -> boost
      prisma.watch.updateMany({
        where: { boosters: 'bronze' },
        data: { boosters: 'boost' },
      }),
      prisma.watch.updateMany({
        where: { boosters: '["bronze"]' },
        data: { boosters: '["boost"]' },
      }),
      // silber -> turbo-boost
      prisma.watch.updateMany({
        where: { boosters: 'silber' },
        data: { boosters: 'turbo-boost' },
      }),
      prisma.watch.updateMany({
        where: { boosters: '["silber"]' },
        data: { boosters: '["turbo-boost"]' },
      }),
      // gold -> super-boost
      prisma.watch.updateMany({
        where: { boosters: 'gold' },
        data: { boosters: 'super-boost' },
      }),
      prisma.watch.updateMany({
        where: { boosters: '["gold"]' },
        data: { boosters: '["super-boost"]' },
      }),
    ])

    // Get current state of boosters
    const boosters = await prisma.boosterPrice.findMany({
      orderBy: { price: 'asc' },
    })

    return NextResponse.json({
      success: true,
      message: 'Boosters updated successfully',
      boosterPriceUpdates: updates,
      watchUpdates: watchUpdates,
      currentBoosters: boosters.map(b => ({
        code: b.code,
        name: b.name,
        price: b.price,
      })),
    })
  } catch (error: any) {
    console.error('[fix-boosters] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update boosters', details: error.message },
      { status: 500 }
    )
  }
}

// GET to check current state
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const boosters = await prisma.boosterPrice.findMany({
      orderBy: { price: 'asc' },
    })

    return NextResponse.json({
      boosters: boosters.map(b => ({
        code: b.code,
        name: b.name,
        description: b.description,
        price: b.price,
        isActive: b.isActive,
      })),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
