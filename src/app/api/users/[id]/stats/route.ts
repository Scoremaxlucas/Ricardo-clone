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
        watches: {
          where: {
            purchases: {
              none: {} // Nur nicht verkaufte Artikel
            }
          },
          include: {
            bids: {
              orderBy: {
                amount: 'desc'
              },
              take: 1
            },
            categories: {
              include: {
                category: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
          // Alle aktiven Angebote, nicht nur 10
        },
        receivedReviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                image: true,
                nickname: true
              }
            },
            purchase: {
              select: {
                id: true,
                watch: {
                  select: {
                    id: true,
                    title: true
                  }
                }
              }
            },
            sale: {
              select: {
                id: true,
                watch: {
                  select: {
                    id: true,
                    title: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
          // Alle Bewertungen, nicht nur 10
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

    // Alle aktiven Angebote des Verkäufers
    const activeWatches = user.watches.map(watch => {
      const highestBid = watch.bids[0]
      const currentPrice = highestBid ? highestBid.amount : watch.price
      let images: string[] = []
      try {
        if (watch.images) {
          images = JSON.parse(watch.images)
        }
      } catch (e) {
        images = []
      }
      return {
        id: watch.id,
        title: watch.title,
        price: currentPrice,
        buyNowPrice: watch.buyNowPrice,
        isAuction: watch.isAuction,
        auctionEnd: watch.auctionEnd,
        images: images,
        createdAt: watch.createdAt,
        categories: watch.categories.map(wc => wc.category.name)
      }
    })

    // Bewertungen der letzten 12 Monate
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
    const recentReviews = user.receivedReviews.filter(r => new Date(r.createdAt) >= twelveMonthsAgo)
    const recentPositive = recentReviews.filter(r => r.rating === 'positive').length
    const recentNeutral = recentReviews.filter(r => r.rating === 'neutral').length
    const recentNegative = recentReviews.filter(r => r.rating === 'negative').length

    return NextResponse.json({
      name: user.name,
      verified: user.verified || false,
      phoneVerified: user.phoneVerified || false,
      activeListings: user.watches.length,
      reviewStats: {
        total: allReviews.length,
        averageRating: positivePercentage ? positivePercentage / 20 : 5, // Konvertiere zu 0-5 Skala
        positivePercentage: positivePercentage || 100
      },
      activeWatches: activeWatches,
      user: {
        id: user.id,
        name: user.name,
        nickname: user.nickname,
        image: user.image,
        city: user.city,
        postalCode: user.postalCode,
        createdAt: user.createdAt
      },
      stats: {
        totalPurchases: user.purchases.length,
        totalSales: user.sales.length,
        totalReviews: allReviews.length,
        positiveReviews: positiveReviews.length,
        neutralReviews: neutralReviews.length,
        negativeReviews: negativeReviews.length,
        positivePercentage,
        recentPositive,
        recentNeutral,
        recentNegative
      },
      recentReviews: user.receivedReviews.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        reviewer: review.reviewer,
        watchId: review.purchase?.watch?.id || review.sale?.watch?.id || null,
        watchTitle: review.purchase?.watch?.title || review.sale?.watch?.title || null
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

