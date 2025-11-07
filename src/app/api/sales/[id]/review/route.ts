import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendReviewNotificationEmail } from '@/lib/email'

// GET: Bewertung für einen Sale abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Hole Sale mit Bewertungen
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                image: true,
                nickname: true
              }
            }
          }
        },
        watch: true,
        buyer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!sale) {
      return NextResponse.json(
        { message: 'Verkauf nicht gefunden' },
        { status: 404 }
      )
    }

    // Prüfe ob User der Verkäufer ist
    if (sale.sellerId !== session.user.id) {
      return NextResponse.json(
        { message: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    // Prüfe ob ein Käufer vorhanden ist
    if (!sale.buyerId) {
      return NextResponse.json(
        { message: 'Kein Käufer für diesen Verkauf vorhanden' },
        { status: 400 }
      )
    }

    // Finde Bewertung des aktuellen Users (falls vorhanden)
    const userReview = sale.reviews.find(r => r.reviewerId === session.user.id)

    return NextResponse.json({
      sale: {
        id: sale.id,
        watch: sale.watch,
        buyer: sale.buyer
      },
      review: userReview || null,
      canReview: !userReview // Kann nur bewerten, wenn noch keine Bewertung vorhanden
    })
  } catch (error: any) {
    console.error('[sales/review] Error:', error)
    return NextResponse.json(
      { message: 'Fehler beim Abrufen der Bewertung', error: error.message },
      { status: 500 }
    )
  }
}

// POST: Bewertung für einen Sale abgeben
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const { rating, comment } = await request.json()

    // Validierung
    if (!rating || !['positive', 'neutral', 'negative'].includes(rating)) {
      return NextResponse.json(
        { message: 'Ungültige Bewertung' },
        { status: 400 }
      )
    }

    // Hole Sale mit Buyer
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        buyer: true,
        watch: true,
        reviews: {
          where: {
            reviewerId: session.user.id
          }
        }
      }
    })

    if (!sale) {
      return NextResponse.json(
        { message: 'Verkauf nicht gefunden' },
        { status: 404 }
      )
    }

    // Prüfe ob User der Verkäufer ist
    if (sale.sellerId !== session.user.id) {
      return NextResponse.json(
        { message: 'Nur der Verkäufer kann eine Bewertung abgeben' },
        { status: 403 }
      )
    }

    // Prüfe ob ein Käufer vorhanden ist
    if (!sale.buyerId || !sale.buyer) {
      return NextResponse.json(
        { message: 'Kein Käufer für diesen Verkauf vorhanden' },
        { status: 400 }
      )
    }

    // Prüfe ob bereits eine Bewertung vorhanden ist
    if (sale.reviews.length > 0) {
      return NextResponse.json(
        { message: 'Sie haben bereits eine Bewertung abgegeben' },
        { status: 400 }
      )
    }

    // Erstelle Bewertung (Verkäufer bewertet Käufer)
    const review = await prisma.review.create({
      data: {
        rating,
        comment: comment || null,
        reviewerId: session.user.id,
        reviewedUserId: sale.buyerId,
        saleId: id
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            image: true,
            nickname: true
          }
        }
      }
    })

    // Sende E-Mail-Benachrichtigung an den Käufer
    try {
      await sendReviewNotificationEmail(
        sale.buyer.email,
        sale.buyer.name || 'Käufer',
        rating,
        session.user.name || 'Ein Verkäufer'
      )
    } catch (emailError) {
      console.error('[sales/review] Fehler beim Versenden der E-Mail:', emailError)
      // E-Mail-Fehler soll nicht die Bewertung verhindern
    }

    return NextResponse.json({
      message: 'Bewertung erfolgreich abgegeben',
      review
    }, { status: 201 })
  } catch (error: any) {
    console.error('[sales/review] Error:', error)
    
    // Prüfe ob es ein Duplikat-Fehler ist
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'Sie haben bereits eine Bewertung für diesen Verkauf abgegeben' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Fehler beim Erstellen der Bewertung', error: error.message },
      { status: 500 }
    )
  }
}

