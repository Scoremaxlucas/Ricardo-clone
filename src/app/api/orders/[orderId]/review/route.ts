import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/orders/[orderId]/review
 * Check if a review exists for this order and if the user can leave one
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { orderId } = await params

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        buyerConfirmedReceipt: true,
        orderStatus: true,
        watch: {
          select: {
            id: true,
            title: true,
            sellerId: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ message: 'Bestellung nicht gefunden' }, { status: 404 })
    }

    const isBuyer = order.buyerId === session.user.id
    const isSeller = order.sellerId === session.user.id

    if (!isBuyer && !isSeller) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 403 })
    }

    // Check for existing review by this user for this order
    // Reviews are linked via the reviewedUserId + reviewerId combination
    // We search by reviewer and the counterpart
    const reviewedUserId = isBuyer ? order.sellerId : order.buyerId

    // Find review that matches this order's context
    // Since reviews link to purchaseId/saleId (not orderId), we look for reviews
    // by this reviewer for this reviewedUser that were created after the order
    const existingReview = await prisma.review.findFirst({
      where: {
        reviewerId: session.user.id,
        reviewedUserId: reviewedUserId,
        // Match by the order's watch context (to distinguish from other transactions)
        OR: [
          { purchase: { watchId: order.watch.id } },
          { sale: { watchId: order.watch.id } },
          // Also check reviews without purchase/sale link but matching context
          {
            AND: [
              { purchaseId: null },
              { saleId: null },
              {
                createdAt: {
                  gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Within 90 days
                },
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
    })

    // Can review if: receipt confirmed (buyer) or order completed (seller), and no existing review
    const canReview =
      !existingReview &&
      (
        (isBuyer && order.buyerConfirmedReceipt) ||
        (isSeller && (order.orderStatus === 'completed' || order.buyerConfirmedReceipt))
      )

    return NextResponse.json({
      review: existingReview || null,
      canReview,
      isBuyer,
      isSeller,
    })
  } catch (error: any) {
    console.error('[orders/review] GET error:', error)
    return NextResponse.json(
      { message: 'Fehler beim Abrufen der Bewertung', error: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/orders/[orderId]/review
 * Submit a review for an order (buyer reviews seller, or seller reviews buyer)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { orderId } = await params
    const { rating, comment } = await request.json()

    // Validate rating
    if (!rating || !['positive', 'neutral', 'negative'].includes(rating)) {
      return NextResponse.json({ message: 'Ungültige Bewertung. Bitte wählen Sie positiv, neutral oder negativ.' }, { status: 400 })
    }

    // Load order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        buyerId: true,
        sellerId: true,
        buyerConfirmedReceipt: true,
        orderStatus: true,
        watchId: true,
        watch: {
          select: {
            id: true,
            title: true,
            sellerId: true,
          },
        },
        buyer: {
          select: { id: true, name: true, nickname: true, email: true },
        },
        seller: {
          select: { id: true, name: true, nickname: true, email: true },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ message: 'Bestellung nicht gefunden' }, { status: 404 })
    }

    const isBuyer = order.buyerId === session.user.id
    const isSeller = order.sellerId === session.user.id

    if (!isBuyer && !isSeller) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 403 })
    }

    // Check eligibility
    if (isBuyer && !order.buyerConfirmedReceipt) {
      return NextResponse.json(
        { message: 'Bewertung erst nach Erhaltbestätigung möglich.' },
        { status: 400 }
      )
    }

    if (isSeller && order.orderStatus !== 'completed' && !order.buyerConfirmedReceipt) {
      return NextResponse.json(
        { message: 'Bewertung erst nach Abschluss der Bestellung möglich.' },
        { status: 400 }
      )
    }

    const reviewedUserId = isBuyer ? order.sellerId : order.buyerId

    // Check for duplicate
    const existingReview = await prisma.review.findFirst({
      where: {
        reviewerId: session.user.id,
        reviewedUserId: reviewedUserId,
        OR: [
          { purchase: { watchId: order.watchId } },
          { sale: { watchId: order.watchId } },
        ],
      },
    })

    if (existingReview) {
      return NextResponse.json(
        { message: 'Sie haben bereits eine Bewertung für diese Transaktion abgegeben.' },
        { status: 400 }
      )
    }

    // Find corresponding Purchase or Sale for linking
    let purchaseId: string | null = null
    let saleId: string | null = null

    if (isBuyer) {
      // Find purchase for this watch/buyer combination
      const purchase = await prisma.purchase.findFirst({
        where: { watchId: order.watchId, buyerId: order.buyerId },
        select: { id: true },
      })
      purchaseId = purchase?.id || null
    } else {
      // Find sale for this watch/seller combination
      const sale = await prisma.sale.findFirst({
        where: { watchId: order.watchId, sellerId: order.sellerId },
        select: { id: true },
      })
      saleId = sale?.id || null
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        rating,
        comment: comment?.trim() || null,
        reviewerId: session.user.id,
        reviewedUserId: reviewedUserId,
        ...(purchaseId ? { purchaseId } : {}),
        ...(saleId ? { saleId } : {}),
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
    })

    // Send notification to the reviewed user
    const reviewerName = (session.user as any).nickname || session.user.name || 'Ein Nutzer'
    const ratingLabel = rating === 'positive' ? 'positive' : rating === 'neutral' ? 'neutrale' : 'negative'
    const reviewedUser = isBuyer ? order.seller : order.buyer

    try {
      await prisma.notification.create({
        data: {
          userId: reviewedUserId,
          type: 'REVIEW_RECEIVED',
          title: 'Neue Bewertung erhalten',
          message: `${reviewerName} hat Ihnen eine ${ratingLabel} Bewertung für "${order.watch.title}" gegeben.`,
          link: `/users/${reviewedUserId}`,
          watchId: order.watchId,
        },
      })

      // Send email
      const { sendEmail } = await import('@/lib/email')
      const recipientName = reviewedUser.nickname || reviewedUser.name || 'Nutzer'
      await sendEmail({
        to: reviewedUser.email,
        subject: `Neue ${ratingLabel} Bewertung für "${order.watch.title}"`,
        html: `
          <h2>Neue Bewertung erhalten</h2>
          <p>Hallo ${recipientName},</p>
          <p><strong>${reviewerName}</strong> hat Ihnen eine <strong>${ratingLabel}</strong> Bewertung für "<strong>${order.watch.title}</strong>" (Bestellung ${order.orderNumber}) gegeben.</p>
          ${comment ? `<p><em>"${comment.trim()}"</em></p>` : ''}
          <p>Sie können alle Ihre Bewertungen auf Ihrem Profil einsehen.</p>
          <p>Mit freundlichen Grüssen,<br>Ihr Helvenda Team</p>
        `,
        text: `Neue ${ratingLabel} Bewertung von ${reviewerName} für "${order.watch.title}".${comment ? ` Kommentar: "${comment.trim()}"` : ''}`,
        userId: reviewedUserId,
      })
    } catch (notifyError) {
      console.error('[orders/review] Notification error:', notifyError)
    }

    return NextResponse.json(
      { message: 'Bewertung erfolgreich abgegeben. Vielen Dank!', review },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[orders/review] POST error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'Sie haben bereits eine Bewertung für diese Transaktion abgegeben.' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { message: 'Fehler beim Erstellen der Bewertung', error: error.message },
      { status: 500 }
    )
  }
}
