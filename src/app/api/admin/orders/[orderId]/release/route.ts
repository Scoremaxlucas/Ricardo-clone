import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { releaseFunds } from '@/lib/release-funds'

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
 * POST /api/admin/orders/[orderId]/release
 * Admin: Gibt Zahlung manuell frei (Transfer an Verkäufer)
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
    const { reason, skipOnboardingCheck } = body

    console.log(`[admin/release] Admin ${session?.user?.email} gibt Order ${orderId} frei`)
    console.log(`[admin/release] Grund: ${reason || 'Nicht angegeben'}`)

    // Lade Order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        seller: {
          select: {
            id: true,
            email: true,
            stripeConnectedAccountId: true,
            stripeOnboardingComplete: true,
            connectOnboardingStatus: true,
          },
        },
        paymentRecord: true,
      },
    })

    if (!order) {
      return NextResponse.json({ message: 'Bestellung nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob Order überhaupt bezahlt wurde
    if (
      order.paymentStatus !== 'paid' &&
      order.paymentStatus !== 'release_pending' &&
      order.paymentStatus !== 'release_pending_onboarding'
    ) {
      return NextResponse.json(
        {
          message: `Bestellung kann nicht freigegeben werden. Status: ${order.paymentStatus}`,
          currentStatus: order.paymentStatus,
        },
        { status: 400 }
      )
    }

    // Prüfe ob bereits freigegeben
    if (order.paymentStatus === 'released') {
      return NextResponse.json(
        {
          message: 'Bestellung wurde bereits freigegeben',
          releasedAt: order.releasedAt,
          stripeTransferId: order.stripeTransferId,
        },
        { status: 400 }
      )
    }

    // Prüfe ob Verkäufer Stripe-Konto hat (falls nicht skipOnboardingCheck)
    if (!skipOnboardingCheck) {
      if (!order.seller.stripeConnectedAccountId) {
        return NextResponse.json(
          {
            message:
              'Verkäufer hat noch keine Auszahlungsdaten eingerichtet. Nutze skipOnboardingCheck=true um trotzdem fortzufahren.',
            sellerEmail: order.seller.email,
            sellerOnboardingStatus: order.seller.connectOnboardingStatus,
          },
          { status: 400 }
        )
      }
    }

    // Gib Gelder frei
    const result = await releaseFunds(orderId)

    if (result.pendingOnboarding) {
      // Order wurde auf release_pending_onboarding gesetzt
      return NextResponse.json({
        success: true,
        message: 'Order wurde für Freigabe markiert. Verkäufer muss Auszahlung einrichten.',
        pendingOnboarding: true,
        orderNumber: order.orderNumber,
      })
    }

    if (!result.success) {
      return NextResponse.json(
        {
          message: result.message || 'Fehler bei der Freigabe',
          orderNumber: order.orderNumber,
        },
        { status: 500 }
      )
    }

    // Logge Admin-Aktion
    console.log(
      `[admin/release] ✅ Order ${order.orderNumber} erfolgreich freigegeben von Admin ${session?.user?.email}`
    )

    // Erstelle Admin-Notiz (falls Notes-System existiert)
    try {
      // Benachrichtige Verkäufer
      await prisma.notification.create({
        data: {
          userId: order.sellerId,
          type: 'PAYMENT_RELEASED',
          title: 'Auszahlung freigegeben',
          message: `Die Zahlung für Bestellung ${order.orderNumber} wurde freigegeben und wird auf Ihr Bankkonto überwiesen.`,
          link: `/orders/${order.id}`,
        },
      })

      // Benachrichtige Käufer
      await prisma.notification.create({
        data: {
          userId: order.buyerId,
          type: 'PAYMENT_RELEASED',
          title: 'Zahlung abgeschlossen',
          message: `Die Zahlung für Bestellung ${order.orderNumber} wurde an den Verkäufer freigegeben.`,
          link: `/orders/${order.id}`,
        },
      })
    } catch (notifError: any) {
      console.error('[admin/release] Fehler beim Erstellen der Benachrichtigungen:', notifError)
    }

    return NextResponse.json({
      success: true,
      message: 'Zahlung erfolgreich freigegeben',
      transferId: result.transferId,
      orderNumber: order.orderNumber,
    })
  } catch (error: any) {
    console.error('[admin/release] Fehler:', error)
    return NextResponse.json(
      {
        message: 'Fehler bei der Freigabe',
        error: error.message,
      },
      { status: 500 }
    )
  }
}
