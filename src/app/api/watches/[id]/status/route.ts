import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Status eines Angebots abrufen (verkauft, aktiv, abgelaufen)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const watch = await prisma.watch.findUnique({
      where: { id },
      include: {
        purchases: {
          take: 1,
          include: {
            buyer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        bids: {
          orderBy: { amount: 'desc' },
          take: 1
        }
      }
    })

    if (!watch) {
      return NextResponse.json(
        { message: 'Angebot nicht gefunden' },
        { status: 404 }
      )
    }

    const now = new Date()
    const auctionEndDate = watch.auctionEnd ? new Date(watch.auctionEnd) : null
    const isSold = watch.purchases.length > 0
    const isExpired = auctionEndDate ? auctionEndDate <= now : false
    const isActive = !isSold && (!auctionEndDate || auctionEndDate > now)

    return NextResponse.json({
      isSold,
      isExpired,
      isActive,
      auctionEnd: watch.auctionEnd,
      purchase: watch.purchases[0] || null,
      highestBid: watch.bids[0] || null
    })
  } catch (error: any) {
    console.error('Error fetching watch status:', error)
    return NextResponse.json(
      { message: 'Ein Fehler ist aufgetreten: ' + error.message },
      { status: 500 }
    )
  }
}





