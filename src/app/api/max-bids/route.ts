import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET: Hole alle MaxBids eines Users
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const watchId = searchParams.get('watchId')

    const where: any = {
      userId: session.user.id,
    }

    if (watchId) {
      where.watchId = watchId
    }

    const maxBids = await prisma.maxBid.findMany({
      where,
      include: {
        watch: {
          select: {
            id: true,
            title: true,
            price: true,
            buyNowPrice: true,
            auctionEnd: true,
            images: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ maxBids })
  } catch (error: any) {
    console.error('Error fetching max bids:', error)
    return NextResponse.json(
      { message: 'Fehler beim Abrufen der Maximalgebote: ' + error.message },
      { status: 500 }
    )
  }
}

/**
 * POST: Erstelle oder aktualisiere ein MaxBid
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { watchId, maxAmount } = await request.json()

    if (!watchId || !maxAmount) {
      return NextResponse.json(
        { message: 'watchId und maxAmount sind erforderlich' },
        { status: 400 }
      )
    }

    if (maxAmount <= 0) {
      return NextResponse.json({ message: 'Maximalgebot muss größer als 0 sein' }, { status: 400 })
    }

    // Prüfe ob Auktion existiert und noch läuft
    const watch = await prisma.watch.findUnique({
      where: { id: watchId },
      include: {
        bids: {
          orderBy: { amount: 'desc' },
          take: 1,
        },
      },
    })

    if (!watch) {
      return NextResponse.json({ message: 'Angebot nicht gefunden' }, { status: 404 })
    }

    if (!watch.isAuction) {
      return NextResponse.json(
        { message: 'Maximalgebot ist nur für Auktionen verfügbar' },
        { status: 400 }
      )
    }

    const now = new Date()
    const auctionEndDate = watch.auctionEnd ? new Date(watch.auctionEnd) : null

    if (auctionEndDate && auctionEndDate < now) {
      return NextResponse.json({ message: 'Die Auktion ist bereits beendet' }, { status: 400 })
    }

    const highestBid = watch.bids[0]
    const minBid = highestBid ? highestBid.amount + 1.0 : watch.price

    if (maxAmount < minBid) {
      return NextResponse.json(
        { message: `Das Maximalgebot muss mindestens CHF ${minBid.toFixed(2)} betragen` },
        { status: 400 }
      )
    }

    // Erstelle oder aktualisiere MaxBid
    const maxBid = await prisma.maxBid.upsert({
      where: {
        watchId_userId: {
          watchId,
          userId: session.user.id,
        },
      },
      create: {
        watchId,
        userId: session.user.id,
        maxAmount,
        currentBid: minBid,
      },
      update: {
        maxAmount,
        currentBid: minBid,
      },
      include: {
        watch: {
          select: {
            id: true,
            title: true,
            price: true,
            auctionEnd: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: `Maximalgebot von CHF ${maxAmount.toFixed(2)} gesetzt`,
      maxBid,
    })
  } catch (error: any) {
    console.error('Error creating/updating max bid:', error)
    return NextResponse.json(
      { message: 'Fehler beim Erstellen des Maximalgebots: ' + error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE: Lösche ein MaxBid
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const watchId = searchParams.get('watchId')

    if (!watchId) {
      return NextResponse.json({ message: 'watchId ist erforderlich' }, { status: 400 })
    }

    await prisma.maxBid.deleteMany({
      where: {
        watchId,
        userId: session.user.id,
      },
    })

    return NextResponse.json({
      message: 'Maximalgebot gelöscht',
    })
  } catch (error: any) {
    console.error('Error deleting max bid:', error)
    return NextResponse.json(
      { message: 'Fehler beim Löschen des Maximalgebots: ' + error.message },
      { status: 500 }
    )
  }
}
