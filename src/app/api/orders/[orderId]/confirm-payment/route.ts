/**
 * POST /api/orders/[orderId]/confirm-payment
 *
 * Verkäufer bestätigt Zahlungseingang für Direktzahlungen (Bank/Bar)
 * Ricardo-Style: Rechnung wird erst bei Zahlungsbestätigung erstellt
 */

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { orderId } = params
    const userId = session.user.id

    // Lade Order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        watch: {
          select: { title: true },
        },
        buyer: {
          select: { email: true, name: true, firstName: true, nickname: true },
        },
        seller: {
          select: { email: true, name: true, firstName: true, nickname: true },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ message: 'Bestellung nicht gefunden' }, { status: 404 })
    }

    // Nur Verkäufer kann Zahlung bestätigen
    if (order.sellerId !== userId) {
      return NextResponse.json(
        { message: 'Nur der Verkäufer kann die Zahlung bestätigen' },
        { status: 403 }
      )
    }

    // Prüfe ob Order für Zahlungsbestätigung geeignet ist
    if (!['pending_bank_transfer', 'pending_cash'].includes(order.paymentStatus)) {
      return NextResponse.json(
        { message: 'Diese Bestellung kann nicht als bezahlt markiert werden' },
        { status: 400 }
      )
    }

    // === ZAHLUNGSBESTÄTIGUNG (Ricardo-Style) ===
    // 1. Update Order Status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'paid',
        orderStatus: 'processing',
        paidAt: new Date(),
        paymentDeadlineMissed: false, // Falls überfällig war, jetzt erledigt
      },
    })

    console.log(`[orders/confirm-payment] ✅ Order ${order.orderNumber} als bezahlt markiert`)

    // 2. Erstelle Rechnung (Ricardo-Style: erst bei Zahlungsbestätigung)
    let invoice = null
    try {
      const { calculateInvoiceForOrder } = await import('@/lib/invoice')
      invoice = await calculateInvoiceForOrder(orderId)

      // Update Order mit Invoice-Referenz
      await prisma.order.update({
        where: { id: orderId },
        data: {
          invoiceId: invoice.id,
          invoiceCreatedAt: new Date(),
        },
      })

      console.log(`[orders/confirm-payment] ✅ Rechnung ${invoice.invoiceNumber} erstellt für Order ${orderId}`)
    } catch (invoiceError: any) {
      console.error(`[orders/confirm-payment] Fehler bei Rechnungserstellung:`, invoiceError)
      // Nicht kritisch - Invoice kann später erstellt werden
    }

    // 3. Benachrichtigung an Käufer
    const buyerName = order.buyer.nickname || order.buyer.firstName || order.buyer.name || 'Käufer'
    try {
      await prisma.notification.create({
        data: {
          userId: order.buyerId,
          type: 'PAYMENT_CONFIRMED',
          title: 'Zahlung bestätigt',
          message: `Ihre Zahlung für "${order.watch.title}" wurde vom Verkäufer bestätigt.`,
          link: `/my-watches/buying/orders?highlight=${orderId}`,
        },
      })
    } catch (notifError) {
      console.error('[orders/confirm-payment] Fehler bei Käufer-Benachrichtigung:', notifError)
    }

    // 4. E-Mail an Käufer
    try {
      const { sendEmail } = await import('@/lib/email')
      const sellerName = order.seller.nickname || order.seller.firstName || order.seller.name || 'Verkäufer'

      await sendEmail({
        to: order.buyer.email,
        subject: `Zahlung bestätigt - Bestellung #${order.orderNumber}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #059669;">✅ Zahlung bestätigt</h2>
            <p>Hallo ${buyerName},</p>
            <p>Der Verkäufer <strong>${sellerName}</strong> hat den Zahlungseingang für Ihre Bestellung bestätigt.</p>
            <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 0;"><strong>Bestellung:</strong> #${order.orderNumber}</p>
              <p style="margin: 8px 0 0 0;"><strong>Artikel:</strong> ${order.watch.title}</p>
              <p style="margin: 8px 0 0 0;"><strong>Betrag:</strong> CHF ${order.totalAmount.toFixed(2)}</p>
            </div>
            ${order.selectedDeliveryMode === 'pickup'
              ? '<p>Bitte kontaktieren Sie den Verkäufer, um die Abholung zu koordinieren.</p>'
              : '<p>Der Verkäufer wird den Artikel in Kürze versenden.</p>'
            }
          </div>
        `,
        text: `Zahlung bestätigt - Bestellung #${order.orderNumber}`,
      })
    } catch (emailError) {
      console.error('[orders/confirm-payment] Fehler bei Käufer-E-Mail:', emailError)
    }

    return NextResponse.json({
      success: true,
      message: 'Zahlung erfolgreich bestätigt',
      order: {
        id: updatedOrder.id,
        orderNumber: order.orderNumber,
        paymentStatus: updatedOrder.paymentStatus,
        orderStatus: updatedOrder.orderStatus,
        paidAt: updatedOrder.paidAt,
      },
      invoice: invoice ? {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        total: invoice.total,
      } : null,
    })
  } catch (error: any) {
    console.error('[orders/confirm-payment] Fehler:', error)
    return NextResponse.json(
      { message: 'Fehler beim Bestätigen der Zahlung: ' + error.message },
      { status: 500 }
    )
  }
}
