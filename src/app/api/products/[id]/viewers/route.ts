import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route für Live-Viewer Tracking (Feature 2: Social Proof)
 *
 * POST /api/products/[id]/viewers
 *
 * Registriert einen aktiven Viewer für ein Produkt
 * GET gibt aktuelle Viewer-Anzahl zurück
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const watchId = id

    // Zähle aktive Viewer (letzten 2 Minuten)
    const twoMinutesAgo = new Date()
    twoMinutesAgo.setMinutes(twoMinutesAgo.getMinutes() - 2)

    const activeViewers = await prisma.auctionViewer.count({
      where: {
        watchId,
        joinedAt: { gte: twoMinutesAgo },
      },
    })

    // Update ProductStats
    await prisma.productStats.upsert({
      where: { watchId },
      update: {
        viewersNow: activeViewers,
        lastUpdated: new Date(),
      },
      create: {
        watchId,
        favoriteCount: 0,
        viewCount: 0,
        soldLast24h: 0,
        viewersNow: activeViewers,
      },
    })

    return NextResponse.json({
      watchId,
      viewersNow: activeViewers,
    })
  } catch (error: any) {
    console.error('Error getting viewers:', error)
    return NextResponse.json(
      {
        watchId: null,
        viewersNow: 0,
        error: 'Error getting viewers',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/products/[id]/viewers
 *
 * Registriert einen aktiven Viewer
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const watchId = id
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || null

    // Erstelle Viewer-Eintrag (mit eindeutiger ID)
    // Verwende Timestamp für eindeutige IDs
    const viewerId = `viewer-${watchId}-${userId || 'anonymous'}-${Date.now()}-${Math.random().toString(36).substring(7)}`

    try {
      await prisma.auctionViewer.create({
        data: {
          id: viewerId,
          watchId,
          userId,
          joinedAt: new Date(),
        },
      })
    } catch (createError: any) {
      // Ignore duplicate key errors (P2002) - viewer might already be tracked
      // But log other errors for debugging
      if (createError.code !== 'P2002') {
        console.error('[Viewers API] Error creating viewer entry:', createError)
        throw createError
      }
    }

    // Cleanup alte Viewer-Einträge (älter als 5 Minuten)
    const fiveMinutesAgo = new Date()
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5)

    await prisma.auctionViewer.deleteMany({
      where: {
        watchId,
        joinedAt: { lt: fiveMinutesAgo },
      },
    })

    // Update ProductStats viewersNow
    const twoMinutesAgo = new Date()
    twoMinutesAgo.setMinutes(twoMinutesAgo.getMinutes() - 2)

    const activeViewers = await prisma.auctionViewer.count({
      where: {
        watchId,
        joinedAt: { gte: twoMinutesAgo },
      },
    })

    await prisma.productStats.upsert({
      where: { watchId },
      update: {
        viewersNow: activeViewers,
        lastUpdated: new Date(),
      },
      create: {
        watchId,
        favoriteCount: 0,
        viewCount: 0,
        soldLast24h: 0,
        viewersNow: activeViewers,
      },
    })

    return NextResponse.json({ success: true, viewersNow: activeViewers })
  } catch (error: any) {
    // Ignore duplicate key errors (viewer already exists)
    if (error.code === 'P2002') {
      return NextResponse.json({ success: true })
    }
    console.error('Error tracking viewer:', error)
    return NextResponse.json({ success: false, error: 'Error tracking viewer' }, { status: 500 })
  }
}
