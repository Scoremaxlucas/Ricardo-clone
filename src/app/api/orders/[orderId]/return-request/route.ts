import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/orders/[orderId]/return-request
 * 
 * Buyer requests a return after receiving the item.
 * This opens a dispute with type 'return_request' which requires admin mediation.
 * 
 * Ricardo-style: Returns are handled through the dispute system.
 * The buyer has 14 days after confirming receipt to open a return request.
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
    const { reason, description } = await request.json()

    // Validate input
    if (!reason) {
      return NextResponse.json({ message: 'Bitte wählen Sie einen Grund für die Rückgabe' }, { status: 400 })
    }

    if (!description || description.trim().length < 10) {
      return NextResponse.json(
        { message: 'Bitte beschreiben Sie das Problem genauer (mind. 10 Zeichen)' },
        { status: 400 }
      )
    }

    const validReasons = [
      'item_not_as_described',
      'item_damaged',
      'item_defective',
      'wrong_item',
      'item_missing_parts',
      'other',
    ]

    if (!validReasons.includes(reason)) {
      return NextResponse.json({ message: 'Ungültiger Rückgabegrund' }, { status: 400 })
    }

    // Load order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: { select: { id: true, name: true, nickname: true, email: true } },
        seller: { select: { id: true, name: true, nickname: true, email: true } },
        watch: { select: { id: true, title: true } },
      },
    })

    if (!order) {
      return NextResponse.json({ message: 'Bestellung nicht gefunden' }, { status: 404 })
    }

    // Only buyer can request return
    if (order.buyerId !== session.user.id) {
      return NextResponse.json(
        { message: 'Nur der Käufer kann eine Rückgabe beantragen' },
        { status: 403 }
      )
    }

    // Must have confirmed receipt (return is after receiving the item)
    if (!order.buyerConfirmedReceipt) {
      return NextResponse.json(
        { message: 'Rückgabe ist nur möglich, nachdem Sie den Erhalt bestätigt haben. Falls Sie die Ware noch nicht erhalten haben, öffnen Sie bitte einen Dispute.' },
        { status: 400 }
      )
    }

    // Check if already has an active dispute
    if (order.disputeStatus !== 'none' && order.disputeStatus !== 'resolved' && order.disputeStatus !== 'closed') {
      return NextResponse.json(
        { message: 'Es existiert bereits ein offener Dispute für diese Bestellung.' },
        { status: 400 }
      )
    }

    // Check 14-day return window (from receipt confirmation)
    const confirmedAt = order.buyerConfirmedAt ? new Date(order.buyerConfirmedAt) : null
    if (confirmedAt) {
      const daysSinceConfirmed = Math.floor(
        (new Date().getTime() - confirmedAt.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSinceConfirmed > 14) {
        return NextResponse.json(
          {
            message: `Die Rückgabefrist von 14 Tagen ist leider abgelaufen. Der Erhalt wurde vor ${daysSinceConfirmed} Tagen bestätigt.`,
            expired: true,
          },
          { status: 400 }
        )
      }
    }

    const now = new Date()

    // Open return request as a dispute with special reason
    await prisma.order.update({
      where: { id: orderId },
      data: {
        disputeStatus: 'opened',
        disputeOpenedAt: now,
        disputeReason: `return_request:${reason}`,
        disputeDescription: `[RÜCKGABE-ANTRAG] ${description.trim()}`,
        // Don't change payment status to disputed if already released
        ...(order.paymentStatus === 'paid' || order.paymentStatus === 'release_pending'
          ? { paymentStatus: 'disputed' }
          : {}),
      },
    })

    // Create notifications
    const reasonLabels: Record<string, string> = {
      item_not_as_described: 'Artikel entspricht nicht der Beschreibung',
      item_damaged: 'Artikel beschädigt',
      item_defective: 'Artikel defekt',
      wrong_item: 'Falscher Artikel erhalten',
      item_missing_parts: 'Teile fehlen',
      other: 'Sonstiges',
    }
    const reasonLabel = reasonLabels[reason] || reason

    try {
      // Notify seller
      await prisma.notification.create({
        data: {
          userId: order.sellerId,
          type: 'RETURN_REQUESTED',
          title: 'Rückgabe beantragt',
          message: `Der Käufer hat eine Rückgabe für "${order.watch.title}" (${order.orderNumber}) beantragt. Grund: ${reasonLabel}`,
          link: `/orders/${order.id}`,
          watchId: order.watch.id,
        },
      })

      // Notify buyer (confirmation)
      await prisma.notification.create({
        data: {
          userId: order.buyerId,
          type: 'RETURN_REQUESTED',
          title: 'Rückgabe-Antrag eingereicht',
          message: `Ihr Rückgabe-Antrag für "${order.watch.title}" (${order.orderNumber}) wurde eingereicht. Wir werden den Fall prüfen.`,
          link: `/orders/${order.id}`,
          watchId: order.watch.id,
        },
      })

      // Email seller
      const { sendEmail } = await import('@/lib/email')
      const sellerName = order.seller.nickname || order.seller.name || 'Verkäufer'
      await sendEmail({
        to: order.seller.email,
        subject: `Rückgabe beantragt: ${order.orderNumber}`,
        html: `
          <h2>Rückgabe beantragt</h2>
          <p>Hallo ${sellerName},</p>
          <p>Der Käufer hat eine Rückgabe für die Bestellung <strong>${order.orderNumber}</strong> ("<strong>${order.watch.title}</strong>") beantragt.</p>
          <p><strong>Grund:</strong> ${reasonLabel}</p>
          <p><strong>Beschreibung:</strong> ${description.trim()}</p>
          <p>Bitte nehmen Sie Kontakt mit dem Käufer auf. Falls keine Einigung erzielt wird, wird Helvenda vermitteln.</p>
          <p>Mit freundlichen Grüssen,<br>Ihr Helvenda Team</p>
        `,
        text: `Rückgabe beantragt für Bestellung ${order.orderNumber}. Grund: ${reasonLabel}. ${description.trim()}`,
      })
    } catch (notifyError) {
      console.error('[return-request] Notification error:', notifyError)
    }

    return NextResponse.json({
      success: true,
      message: 'Rückgabe-Antrag erfolgreich eingereicht. Wir werden den Fall prüfen und Sie benachrichtigen.',
    })
  } catch (error: any) {
    console.error('[return-request] Error:', error)
    return NextResponse.json(
      { message: 'Fehler beim Einreichen des Rückgabe-Antrags', error: error.message },
      { status: 500 }
    )
  }
}
