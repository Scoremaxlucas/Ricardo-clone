import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendReviewNotificationEmail } from '@/lib/email'

// GET: Bewertung für einen Purchase abrufen
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Hole Purchase mit Bewertungen
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                image: true,
                nickname: true,
              },
            },
          },
        },
        watch: {
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!purchase) {
      return NextResponse.json({ message: 'Kauf nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob User der Käufer ist
    if (purchase.buyerId !== session.user.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 403 })
    }

    // Finde Bewertung des aktuellen Users (falls vorhanden)
    const userReview = purchase.reviews.find(r => r.reviewerId === session.user.id)

    return NextResponse.json({
      purchase: {
        id: purchase.id,
        watch: purchase.watch,
      },
      review: userReview || null,
      canReview: !userReview, // Kann nur bewerten, wenn noch keine Bewertung vorhanden
    })
  } catch (error: any) {
    console.error('[purchases/review] Error:', error)
    return NextResponse.json(
      { message: 'Fehler beim Abrufen der Bewertung', error: error.message },
      { status: 500 }
    )
  }
}

// POST: Bewertung für einen Purchase abgeben
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { rating, comment } = await request.json()

    // Validierung
    if (!rating || !['positive', 'neutral', 'negative'].includes(rating)) {
      return NextResponse.json({ message: 'Ungültige Bewertung' }, { status: 400 })
    }

    // Hole Purchase mit Watch und Seller
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        watch: {
          include: {
            seller: true,
          },
        },
        reviews: {
          where: {
            reviewerId: session.user.id,
          },
        },
      },
    })

    if (!purchase) {
      return NextResponse.json({ message: 'Kauf nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob User der Käufer ist
    if (purchase.buyerId !== session.user.id) {
      return NextResponse.json(
        { message: 'Nur der Käufer kann eine Bewertung abgeben' },
        { status: 403 }
      )
    }

    // Prüfe ob bereits eine Bewertung vorhanden ist
    if (purchase.reviews.length > 0) {
      return NextResponse.json(
        { message: 'Sie haben bereits eine Bewertung abgegeben' },
        { status: 400 }
      )
    }

    // Erstelle Bewertung (Käufer bewertet Verkäufer)
    const review = await prisma.review.create({
      data: {
        rating,
        comment: comment || null,
        reviewerId: session.user.id,
        reviewedUserId: purchase.watch.sellerId,
        purchaseId: id,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            image: true,
            nickname: true,
          },
        },
      },
    })

    // Sende E-Mail-Benachrichtigung an den Verkäufer
    try {
      await sendReviewNotificationEmail(
        purchase.watch.seller.email,
        purchase.watch.seller.name || 'Verkäufer',
        rating,
        session.user.name || 'Ein Käufer'
      )
    } catch (emailError) {
      console.error('[purchases/review] Fehler beim Versenden der E-Mail:', emailError)
      // E-Mail-Fehler soll nicht die Bewertung verhindern
    }

    return NextResponse.json(
      {
        message: 'Bewertung erfolgreich abgegeben',
        review,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[purchases/review] Error:', error)

    // Prüfe ob es ein Duplikat-Fehler ist
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'Sie haben bereits eine Bewertung für diesen Kauf abgegeben' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Fehler beim Erstellen der Bewertung', error: error.message },
      { status: 500 }
    )
  }
}
