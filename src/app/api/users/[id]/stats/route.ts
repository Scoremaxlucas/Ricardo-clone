import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: Statistiken für einen User abrufen (öffentlich)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Hole User mit allen relevanten Daten
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        purchases: true,
        sales: true,
        receivedReviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                image: true,
                nickname: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10 // Letzte 10 Bewertungen
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User nicht gefunden' },
        { status: 404 }
      )
    }

    // Berechne Bewertungsstatistiken
    const allReviews = user.receivedReviews
    const positiveReviews = allReviews.filter(r => r.rating === 'positive')
    const neutralReviews = allReviews.filter(r => r.rating === 'neutral')
    const negativeReviews = allReviews.filter(r => r.rating === 'negative')

    // Berechne Bewertungsprozentzahl (nur positive und negative zählen)
    // Formel: (positive / (positive + negative)) * 100
    const relevantReviews = positiveReviews.length + negativeReviews.length
    const positivePercentage = relevantReviews > 0
      ? Math.round((positiveReviews.length / relevantReviews) * 100)
      : null // Keine Bewertungen oder nur neutrale

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        nickname: user.nickname,
        image: user.image
      },
      stats: {
        totalPurchases: user.purchases.length,
        totalSales: user.sales.length,
        totalReviews: allReviews.length,
        positiveReviews: positiveReviews.length,
        neutralReviews: neutralReviews.length,
        negativeReviews: negativeReviews.length,
        positivePercentage // null wenn keine relevanten Bewertungen
      },
      recentReviews: user.receivedReviews.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        reviewer: review.reviewer
      }))
    })
  } catch (error: any) {
    console.error('[users/stats] Error:', error)
    return NextResponse.json(
      { message: 'Fehler beim Abrufen der Statistiken', error: error.message },
      { status: 500 }
    )
  }
}

