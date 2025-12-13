import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Alle Gebote des eingeloggten Users abrufen
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Hole alle Gebote des Users mit Watch-Details
    const bids = await prisma.bid.findMany({
      where: { userId: session.user.id },
      include: {
        watch: {
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            bids: {
              orderBy: { amount: 'desc' }, // Sortiere nach Betrag, nicht nach Datum
              take: 1, // Nur das höchste Gebot
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Gruppiere Gebote nach Watch und finde das höchste Gebot pro Watch
    const bidsWithWatchInfo = bids.map(bid => {
      const watch = bid.watch
      const images = watch.images ? JSON.parse(watch.images) : []
      const highestBid = watch.bids[0] // Das höchste Gebot (erste in sortierter Liste)
      const isMyBidHighest = highestBid && highestBid.userId === session.user.id
      const auctionActive = watch.auctionEnd ? new Date(watch.auctionEnd) > new Date() : true

      return {
        id: bid.id,
        amount: bid.amount,
        createdAt: bid.createdAt,
        watch: {
          id: watch.id,
          title: watch.title,
          brand: watch.brand,
          model: watch.model,
          price: watch.price,
          buyNowPrice: watch.buyNowPrice,
          images: images,
          auctionEnd: watch.auctionEnd,
          seller: watch.seller,
          highestBid: highestBid?.amount || watch.price,
          isMyBidHighest,
          auctionActive,
        },
      }
    })

    // Entferne Duplikate basierend auf watchId und behalte nur das neueste Gebot pro Watch
    const uniqueBids = Array.from(
      new Map(bidsWithWatchInfo.map(bid => [bid.watch.id, bid])).values()
    )

    return NextResponse.json({ bids: uniqueBids })
  } catch (error: any) {
    console.error('Error fetching user bids:', error)
    return NextResponse.json(
      { message: 'Ein Fehler ist aufgetreten beim Laden der Gebote: ' + error.message },
      { status: 500 }
    )
  }
}
