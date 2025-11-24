import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Follow/Unfollow einen User
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const { id: followingId } = await params
    const followerId = session.user.id

    if (followerId === followingId) {
      return NextResponse.json(
        { message: 'Sie können sich nicht selbst folgen' },
        { status: 400 }
      )
    }

    // Prüfe ob bereits gefolgt wird
    const existingFollow = await prisma.follow.findFirst({
      where: {
        followerId,
        followingId
      }
    })

    if (existingFollow) {
      // Unfollow
      await prisma.follow.delete({
        where: {
          id: existingFollow.id
        }
      })
      return NextResponse.json({ isFollowing: false, message: 'Nicht mehr folgen' })
    } else {
      // Follow
      await prisma.follow.create({
        data: {
          followerId,
          followingId
        }
      })
      return NextResponse.json({ isFollowing: true, message: 'Folgen' })
    }
  } catch (error: any) {
    console.error('[users/follow] Error:', error)
    return NextResponse.json(
      { message: 'Fehler beim Folgen/Entfolgen: ' + error.message },
      { status: 500 }
    )
  }
}

// Prüfe ob aktueller User diesem User folgt
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ isFollowing: false })
    }

    const { id: followingId } = await params
    const followerId = session.user.id

    const follow = await prisma.follow.findFirst({
      where: {
        followerId,
        followingId
      }
    })

    return NextResponse.json({ isFollowing: !!follow })
  } catch (error: any) {
    console.error('[users/follow] Error:', error)
    return NextResponse.json({ isFollowing: false })
  }
}

