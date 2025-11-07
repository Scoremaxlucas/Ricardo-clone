import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { rating, comment, reviewedUserId } = await req.json()

    if (!rating || !reviewedUserId) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Validate rating
    if (!['positive', 'neutral', 'negative'].includes(rating)) {
      return new NextResponse('Invalid rating', { status: 400 })
    }

    const review = await prisma.review.create({
      data: {
        rating,
        comment: comment || null,
        reviewerId: session.user.id,
        reviewedUserId,
      },
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error('Error creating review:', error)
    return new NextResponse('Failed to create review', { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return new NextResponse('Missing userId parameter', { status: 400 })
    }

    const reviews = await prisma.review.findMany({
      where: {
        reviewedUserId: userId,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(reviews, { status: 200 })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return new NextResponse('Failed to fetch reviews', { status: 500 })
  }
}
