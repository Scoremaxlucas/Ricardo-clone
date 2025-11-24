import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Verkäufer folgen
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
    }

    const sellerId = params.id

    // Prüfe ob der User sich selbst folgen will
    if (sellerId === session.user.id) {
      return NextResponse.json({ error: 'Sie können sich nicht selbst folgen' }, { status: 400 })
    }

    // Prüfe ob bereits gefolgt wird
    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: sellerId
        }
      }
    })

    if (existing) {
      return NextResponse.json({ message: 'Bereits gefolgt', isFollowing: true })
    }

    // Erstelle Follow
    await prisma.follow.create({
      data: {
        followerId: session.user.id,
        followingId: sellerId
      }
    })

    return NextResponse.json({ message: 'Erfolgreich gefolgt', isFollowing: true })
  } catch (error) {
    console.error('Error following seller:', error)
    return NextResponse.json({ error: 'Fehler beim Folgen' }, { status: 500 })
  }
}

// DELETE - Verkäufer entfolgen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
    }

    const sellerId = params.id

    await prisma.follow.deleteMany({
      where: {
        followerId: session.user.id,
        followingId: sellerId
      }
    })

    return NextResponse.json({ message: 'Erfolgreich entfolgt', isFollowing: false })
  } catch (error) {
    console.error('Error unfollowing seller:', error)
    return NextResponse.json({ error: 'Fehler beim Entfolgen' }, { status: 500 })
  }
}

// GET - Follow-Status prüfen
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ isFollowing: false })
    }

    const sellerId = params.id

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: sellerId
        }
      }
    })

    return NextResponse.json({ isFollowing: !!follow })
  } catch (error) {
    console.error('Error checking follow status:', error)
    return NextResponse.json({ isFollowing: false })
  }
}
