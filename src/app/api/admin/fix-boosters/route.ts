import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * POST /api/admin/fix-boosters
 * One-time migration to update booster codes from old naming to new
 * Only accessible by admins
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update old booster codes to new naming
    const updates = await prisma.$transaction([
      // boost -> bronze
      prisma.boosterPrice.updateMany({
        where: { code: 'boost' },
        data: {
          code: 'bronze',
          name: 'Bronze',
          description: 'Grundlegende Hervorhebung: Ihr Angebot wird in Suchergebnissen fett hervorgehoben',
        },
      }),
      // turbo-boost -> silber
      prisma.boosterPrice.updateMany({
        where: { code: 'turbo-boost' },
        data: {
          code: 'silber',
          name: 'Silber',
          description: 'Erhöhte Sichtbarkeit: Hervorhebung + Platzierung in der Empfohlen-Sektion',
        },
      }),
      // turbo (alternative old code) -> silber
      prisma.boosterPrice.updateMany({
        where: { code: 'turbo' },
        data: {
          code: 'silber',
          name: 'Silber',
          description: 'Erhöhte Sichtbarkeit: Hervorhebung + Platzierung in der Empfohlen-Sektion',
        },
      }),
      // super-boost -> gold
      prisma.boosterPrice.updateMany({
        where: { code: 'super-boost' },
        data: {
          code: 'gold',
          name: 'Gold',
          description: 'Maximale Sichtbarkeit: Premium-Platzierung ganz oben in allen Suchergebnissen + Startseite',
        },
      }),
      // super (alternative old code) -> gold
      prisma.boosterPrice.updateMany({
        where: { code: 'super' },
        data: {
          code: 'gold',
          name: 'Gold',
          description: 'Maximale Sichtbarkeit: Premium-Platzierung ganz oben in allen Suchergebnissen + Startseite',
        },
      }),
    ])

    // Also update any watches that have old booster codes
    const watchUpdates = await prisma.$transaction([
      prisma.watch.updateMany({
        where: { boosters: { has: 'boost' } },
        data: { boosters: ['bronze'] },
      }),
      prisma.watch.updateMany({
        where: { boosters: { has: 'turbo-boost' } },
        data: { boosters: ['silber'] },
      }),
      prisma.watch.updateMany({
        where: { boosters: { has: 'turbo' } },
        data: { boosters: ['silber'] },
      }),
      prisma.watch.updateMany({
        where: { boosters: { has: 'super-boost' } },
        data: { boosters: ['gold'] },
      }),
      prisma.watch.updateMany({
        where: { boosters: { has: 'super' } },
        data: { boosters: ['gold'] },
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
