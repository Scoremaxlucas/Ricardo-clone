import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Favoriten eines Users abrufen
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ favorites: [] }, { status: 200 })
    }

    const favorites = await prisma.favorite.findMany({
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
              orderBy: { amount: 'desc' },
              take: 1, // Nur das höchste Gebot
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Parse images und berechne aktuellen Preis
    const favoritesWithImages = favorites.map(fav => {
      const highestBid = fav.watch.bids[0]
      const currentPrice = highestBid ? highestBid.amount : fav.watch.price

      return {
        ...fav,
        watch: {
          ...fav.watch,
          price: currentPrice, // Überschreibe price mit aktuellem Preis
          images: fav.watch.images ? JSON.parse(fav.watch.images) : [],
        },
      }
    })

    return NextResponse.json({ favorites: favoritesWithImages })
  } catch (error: any) {
    console.error('Error fetching favorites:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden der Favoriten: ' + error.message },
      { status: 500 }
    )
  }
}

// Favorit hinzufügen
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const data = await request.json()
    const { watchId } = data

    if (!watchId) {
      return NextResponse.json({ message: 'watchId fehlt' }, { status: 400 })
    }

    // Prüfe ob bereits Favorit
    const existing = await prisma.favorite.findUnique({
      where: {
        watchId_userId: {
          watchId,
          userId: session.user.id,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ message: 'Bereits in Favoriten' })
    }

    const favorite = await prisma.favorite.create({
      data: {
        watchId,
        userId: session.user.id,
      },
      include: {
        watch: true,
      },
    })

    return NextResponse.json({ favorite })
  } catch (error: any) {
    console.error('Error creating favorite:', error)
    return NextResponse.json(
      { message: 'Fehler beim Hinzufügen: ' + error.message },
      { status: 500 }
    )
  }
}
