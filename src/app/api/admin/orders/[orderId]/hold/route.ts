import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Helper function to check admin status
async function checkAdmin(session: any): Promise<boolean> {
  if (!session?.user?.id && !session?.user?.email) {
    return false
  }

  let user = null
  if (session.user.id) {
    user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })
  }

  if (!user && session.user.email) {
    user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true },
    })
  }

  return user?.isAdmin === true
}

/**
 * POST /api/admin/orders/[orderId]/hold
 * Admin: Hält Zahlung zurück (z.B. bei Dispute)
 * Verhindert automatische Freigabe
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!(await checkAdmin(session))) {
      return NextResponse.json(
        { message: 'Zugriff verweigert. Admin-Rechte erforderlich.' },
        { status: 403 }
      )
    }

    const { orderId } = await params
    const body = await request.json().catch(() => ({}))
    const { reason } = body

    if (!reason) {
      return NextResponse.json({ message: 'Grund für das Zurückhalten ist erforderlich' }, { status: 400 })
    }

    console.log(`[admin/hold] Admin ${session?.user?.email} hält Order ${orderId} zurück`)
    console.log(`[admin/hold] Grund: ${reason}`)

    // Lade Order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      return NextResponse.json({ message: 'Bestellung nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob Order überhaupt bezahlt wurde
    if (order.paymentStatus !== 'paid' && order.paymentStatus !== 'release_pending') {
      return NextResponse.json(
        {
          message: `Bestellung kann nicht zurückgehalten werden. Status: ${order.paymentStatus}`,
          currentStatus: order.paymentStatus,
        },
        { status: 400 }
      )
    }

    // Prüfe ob bereits freigegeben
    if (order.paymentStatus === 'released') {
      return NextResponse.json(
        {
          message: 'Bestellung wurde bereits freigegeben und kann nicht mehr zurückgehalten werden',
          releasedAt: order.releasedAt,
        },
        { status: 400 }
      )
    }

    // Update Order - setze auf "on_hold" und entferne autoReleaseAt
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'on_hold',
        autoReleaseAt: null, // Verhindert Auto-Release
        disputeStatus: 'under_review',
        disputeReason: reason,
        disputeOpenedAt: new Date(),
      },
    })

    console.log(`[admin/hold] ✅ Order ${order.orderNumber} auf "on_hold" gesetzt`)

    // Benachrichtige beide Parteien
    try {
      await prisma.notification.create({
        data: {
          userId: order.sellerId,
          type: 'PAYMENT_ON_HOLD',
          title: 'Zahlung zurückgehalten',
          message: `Die Zahlung für Bestellung ${order.orderNumber} wurde vorübergehend zurückgehalten. Grund: ${reason}`,
          link: `/orders/${order.id}`,
        },
      })

      await prisma.notification.create({
        data: {
          userId: order.buyerId,
          type: 'PAYMENT_ON_HOLD',
          title: 'Zahlung in Prüfung',
          message: `Die Zahlung für Bestellung ${order.orderNumber} wird derzeit geprüft. Grund: ${reason}`,
          link: `/orders/${order.id}`,
        },
      })
    } catch (notifError: any) {
      console.error('[admin/hold] Fehler beim Erstellen der Benachrichtigungen:', notifError)
    }

    return NextResponse.json({
      success: true,
      message: 'Zahlung erfolgreich zurückgehalten',
      orderNumber: order.orderNumber,
      reason,
    })
  } catch (error: any) {
    console.error('[admin/hold] Fehler:', error)
    return NextResponse.json(
      {
        message: 'Fehler beim Zurückhalten',
        error: error.message,
      },
      { status: 500 }
    )
  }
}
