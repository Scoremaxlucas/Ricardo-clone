import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { releaseFunds } from '@/lib/release-funds'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/orders/[orderId]/confirm-receipt
 * Käufer bestätigt Erhalt der Ware und gibt Zahlung frei
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const orderId = params.orderId

    // Lade Order mit Dispute-Feldern
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        buyerId: true,
        sellerId: true,
        paymentStatus: true,
        buyerConfirmedReceipt: true,
        disputeOpenedAt: true,
        disputeStatus: true,
        buyer: {
          select: { id: true, name: true, nickname: true, email: true },
        },
        seller: {
          select: { id: true, name: true, nickname: true, email: true },
        },
        watch: {
          select: { id: true, title: true },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ message: 'Bestellung nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob User der Käufer ist
    if (order.buyerId !== session.user.id) {
      return NextResponse.json(
        { message: 'Sie sind nicht berechtigt, diese Bestellung zu bestätigen' },
        { status: 403 }
      )
    }

    // Prüfe ob Order bereits bestätigt wurde
    if (order.buyerConfirmedReceipt) {
      return NextResponse.json(
        { message: 'Diese Bestellung wurde bereits bestätigt' },
        { status: 400 }
      )
    }

    // Prüfe ob Order bezahlt wurde
    if (order.paymentStatus !== 'paid' && order.paymentStatus !== 'release_pending') {
      return NextResponse.json(
        { message: 'Diese Bestellung wurde noch nicht bezahlt' },
        { status: 400 }
      )
    }

    // WICHTIG: Prüfe ob ein Dispute offen ist - blockiere Bestätigung bei aktivem Dispute
    if (
      order.disputeOpenedAt &&
      order.disputeStatus &&
      order.disputeStatus !== 'none' &&
      order.disputeStatus !== 'resolved' &&
      order.disputeStatus !== 'closed'
    ) {
      return NextResponse.json(
        {
          message:
            'Der Kaufprozess ist aufgrund eines offenen Disputes eingefroren. Bitte warten Sie auf die Entscheidung von Helvenda.',
        },
        { status: 400 }
      )
    }

    // Update Order - Käufer bestätigt Erhalt
    await prisma.order.update({
      where: { id: orderId },
      data: {
        buyerConfirmedReceipt: true,
        buyerConfirmedAt: new Date(),
        paymentStatus: 'release_pending',
        orderStatus: 'processing',
      },
    })

    // Gib Gelder frei (mit Just-in-Time Onboarding Support)
    const result = await releaseFunds(orderId)

    if (result.pendingOnboarding) {
      // Verkäufer muss noch Auszahlung einrichten
      return NextResponse.json({
        success: true,
        message: 'Erhalt bestätigt. Der Verkäufer muss noch seine Auszahlungsdaten einrichten.',
        pendingOnboarding: true,
      })
    }

    if (!result.success) {
      return NextResponse.json(
        { message: result.message || 'Fehler bei der Freigabe der Zahlung' },
        { status: 500 }
      )
    }

    // === REVIEW REMINDER: Send email prompts to both buyer and seller ===
    try {
      const { sendEmail } = await import('@/lib/email')
      const orderUrl = `https://helvenda.ch/orders/${order.id}`

      // Remind buyer to review seller
      const buyerName = order.buyer.nickname || order.buyer.name || 'Käufer'
      const sellerDisplayName = order.seller.nickname || order.seller.name || 'den Verkäufer'
      await sendEmail({
        to: order.buyer.email,
        subject: `Bewerten Sie Ihre Erfahrung mit ${sellerDisplayName}`,
        html: `
          <h2>Wie war Ihre Erfahrung?</h2>
          <p>Hallo ${buyerName},</p>
          <p>Vielen Dank für die Bestätigung des Erhalts von "<strong>${order.watch.title}</strong>" (Bestellung ${order.orderNumber}).</p>
          <p>Bitte nehmen Sie sich einen Moment Zeit, um <strong>${sellerDisplayName}</strong> zu bewerten. Ihre Bewertung hilft anderen Käufern und Verkäufern auf Helvenda.</p>
          <p><a href="${orderUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0f766e; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Jetzt bewerten</a></p>
          <p style="color: #6b7280; font-size: 14px;">Sie können positiv, neutral oder negativ bewerten und optional einen Kommentar hinterlassen.</p>
          <p>Mit freundlichen Grüssen,<br>Ihr Helvenda Team</p>
        `,
        text: `Bewerten Sie Ihre Erfahrung mit ${sellerDisplayName} für "${order.watch.title}". Link: ${orderUrl}`,
        userId: order.buyerId,
      })

      // Remind seller to review buyer
      const sellerName = order.seller.nickname || order.seller.name || 'Verkäufer'
      const buyerDisplayName = order.buyer.nickname || order.buyer.name || 'den Käufer'
      await sendEmail({
        to: order.seller.email,
        subject: `Bewerten Sie ${buyerDisplayName} — Bestellung ${order.orderNumber} abgeschlossen`,
        html: `
          <h2>Transaktion abgeschlossen</h2>
          <p>Hallo ${sellerName},</p>
          <p>Der Käufer hat den Erhalt von "<strong>${order.watch.title}</strong>" (Bestellung ${order.orderNumber}) bestätigt und die Zahlung wurde freigegeben.</p>
          <p>Bitte bewerten Sie <strong>${buyerDisplayName}</strong>, um die Vertrauenswürdigkeit auf Helvenda zu stärken.</p>
          <p><a href="${orderUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0f766e; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Jetzt bewerten</a></p>
          <p>Mit freundlichen Grüssen,<br>Ihr Helvenda Team</p>
        `,
        text: `Bewerten Sie ${buyerDisplayName} für Bestellung ${order.orderNumber}. Link: ${orderUrl}`,
        userId: order.sellerId,
      })

      console.log(`[confirm-receipt] Review reminder emails sent for order ${order.orderNumber}`)
    } catch (emailError) {
      console.error('[confirm-receipt] Review reminder email error:', emailError)
      // Don't fail the receipt confirmation if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Erhalt bestätigt und Auszahlung an Verkäufer erfolgt.',
      transferId: result.transferId,
    })
  } catch (error: any) {
    console.error('Error confirming receipt:', error)
    return NextResponse.json(
      { message: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
