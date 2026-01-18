import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkAdmin } from '@/lib/auth-utils'
import { releaseFunds } from '@/lib/release-funds'
import { stripe } from '@/lib/stripe-server'
import { sendEmail } from '@/lib/email'

/**
 * POST /api/orders/[orderId]/resolve-dispute
 * Admin löst einen Dispute auf (refund oder release)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!(await checkAdmin(session))) {
      return NextResponse.json(
        { message: 'Zugriff verweigert. Admin-Rechte erforderlich.' },
        { status: 403 }
      )
    }

    const orderId = params.orderId
    const { resolution, adminNotes } = await request.json()

    // Validiere Resolution
    const validResolutions = ['refund', 'release']

    if (!resolution || !validResolutions.includes(resolution)) {
      return NextResponse.json(
        { message: 'Ungültige Resolution. Muss "refund" oder "release" sein.' },
        { status: 400 }
      )
    }

    // Lade Order mit PaymentRecord
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        paymentRecord: true,
        seller: {
          select: {
            id: true,
            stripeConnectedAccountId: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ message: 'Bestellung nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob ein Dispute existiert
    if (order.disputeStatus !== 'opened' && order.disputeStatus !== 'under_review') {
      return NextResponse.json(
        { message: 'Für diese Bestellung existiert kein aktiver Dispute' },
        { status: 400 }
      )
    }

    const adminId = session.user!.id

    if (resolution === 'refund') {
      // Refund: Geld zurück an Käufer
      if (!order.paymentRecord?.stripeChargeId) {
        return NextResponse.json(
          { message: 'Charge ID nicht gefunden. Refund nicht möglich.' },
          { status: 400 }
        )
      }

      // Prüfe ob bereits Transfer erstellt wurde
      if (order.stripeTransferId) {
        // Transfer wurde bereits erstellt - kann nicht mehr refunded werden
        // In diesem Fall müsste der Verkäufer manuell zurückzahlen
        return NextResponse.json(
          {
            message:
              'Geld wurde bereits an Verkäufer überwiesen. Refund erfordert manuelle Rückzahlung durch Verkäufer.',
            requiresManualRefund: true,
          },
          { status: 400 }
        )
      }

      // Erstelle Refund über Stripe
      const refund = await stripe.refunds.create({
        charge: order.paymentRecord.stripeChargeId,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          reason: 'dispute_resolution',
          resolvedBy: adminId,
        },
      })

      console.log(`[dispute] Refund ${refund.id} erstellt für Order ${order.orderNumber}`)

      // Update Order
      await prisma.order.update({
        where: { id: orderId },
        data: {
          disputeStatus: 'resolved_refund',
          disputeResolvedAt: new Date(),
          disputeResolvedBy: adminId,
          paymentStatus: 'refunded',
          orderStatus: 'canceled',
          refundedAt: new Date(),
          stripeRefundId: refund.id,
        },
      })

      // Update PaymentRecord
      if (order.paymentRecord) {
        await prisma.paymentRecord.update({
          where: { id: order.paymentRecord.id },
          data: {
            stripeRefundId: refund.id,
            refundStatus: refund.status,
          },
        })
      }

      // === RICARDO-STYLE: Watch bleibt INAKTIV nach Stornierung ===
      // Der Verkäufer muss manuell neu einstellen, falls gewünscht
      try {
        const watchWithDetails = await prisma.watch.findUnique({
          where: { id: order.watchId },
          include: {
            seller: {
              select: {
                id: true,
                email: true,
                name: true,
                firstName: true,
              },
            },
          },
        })

        if (watchWithDetails) {
          // Setze auctionEnd auf Vergangenheit, damit der Artikel als "beendet" gilt
          const pastDate = new Date()
          pastDate.setDate(pastDate.getDate() - 1)

          await prisma.watch.update({
            where: { id: order.watchId },
            data: {
              auctionEnd: pastDate,
            },
          })

          console.log(
            `[dispute] RICARDO-STYLE: Watch ${order.watchId} bleibt INAKTIV. ` +
            `Verkäufer muss manuell reaktivieren.`
          )

          // Sende Info-E-Mail an Verkäufer
          if (watchWithDetails.seller?.email) {
            const sellerName = watchWithDetails.seller.firstName || 
                              watchWithDetails.seller.name || 
                              'Verkäufer'
            
            await sendEmail({
              to: watchWithDetails.seller.email,
              subject: `Dispute gelöst - Artikel "${watchWithDetails.title}" kann neu eingestellt werden`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #0d9488;">Dispute wurde gelöst</h2>
                  <p>Hallo ${sellerName},</p>
                  <p>Der Dispute für Ihren Artikel <strong>"${watchWithDetails.title}"</strong> (Bestellung ${order.orderNumber}) wurde gelöst und der Kauf wurde storniert. Das Geld wurde an den Käufer zurückerstattet.</p>
                  <p><strong>Der Artikel ist jetzt inaktiv.</strong></p>
                  <p>Falls Sie den Artikel erneut verkaufen möchten, können Sie ihn in Ihrem Dashboard unter "Mein Verkaufen" → "Beendete Artikel" wieder aktivieren oder als neues Angebot einstellen.</p>
                  <p style="margin-top: 20px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://helvenda.ch'}/my-watches/selling" 
                       style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                      Zu meinen Verkäufen
                    </a>
                  </p>
                  <p style="margin-top: 30px; color: #666; font-size: 12px;">
                    Bei Fragen kontaktieren Sie uns unter support@helvenda.ch
                  </p>
                </div>
              `,
            })
            console.log(`[dispute] ✅ Info-E-Mail an Verkäufer ${watchWithDetails.seller.email} gesendet`)
          }
        }
      } catch (watchError: any) {
        console.error('[dispute] ⚠️ Fehler beim Deaktivieren des Watch:', watchError)
        // Fehler sollte nicht die Dispute-Lösung verhindern
      }

      // Benachrichtigungen
      try {
        await prisma.notification.create({
          data: {
            userId: order.buyerId,
            type: 'DISPUTE_RESOLVED',
            title: 'Dispute gelöst - Rückerstattung',
            message: `Ihr Dispute für Bestellung ${order.orderNumber} wurde gelöst. Das Geld wurde zurückerstattet.`,
            link: `/orders/${order.id}`,
          },
        })

        await prisma.notification.create({
          data: {
            userId: order.sellerId,
            type: 'DISPUTE_RESOLVED',
            title: 'Dispute gelöst - Artikel kann neu eingestellt werden',
            message: `Der Dispute für Bestellung ${order.orderNumber} wurde gelöst. Das Geld wurde zurückerstattet. Sie können den Artikel bei Bedarf unter "Mein Verkaufen" neu einstellen.`,
            link: `/my-watches/selling`,
          },
        })
      } catch (error: any) {
        console.error(`[dispute] Fehler beim Erstellen der Notifications:`, error)
      }

      return NextResponse.json({
        success: true,
        message: 'Dispute gelöst - Geld zurückerstattet. Artikel kann vom Verkäufer manuell neu eingestellt werden.',
        refundId: refund.id,
      })
    } else if (resolution === 'release') {
      // Release: Geld an Verkäufer freigeben
      if (order.paymentStatus === 'released') {
        return NextResponse.json(
          { message: 'Geld wurde bereits freigegeben' },
          { status: 400 }
        )
      }

      // Gib Gelder frei (mit Just-in-Time Onboarding Support)
      const result = await releaseFunds(orderId)

      if (result.pendingOnboarding) {
        // Update Order Dispute Status - aber Auszahlung wartet auf Onboarding
        await prisma.order.update({
          where: { id: orderId },
          data: {
            disputeStatus: 'resolved_release',
            disputeResolvedAt: new Date(),
            disputeResolvedBy: adminId,
          },
        })

        return NextResponse.json({
          success: true,
          message:
            'Dispute gelöst - Auszahlung wartet auf Verkäufer-Auszahlungseinrichtung',
          pendingOnboarding: true,
        })
      }

      if (!result.success) {
        return NextResponse.json(
          { message: result.message || 'Fehler bei der Freigabe der Zahlung' },
          { status: 500 }
        )
      }

      // Update Order Dispute Status
      await prisma.order.update({
        where: { id: orderId },
        data: {
          disputeStatus: 'resolved_release',
          disputeResolvedAt: new Date(),
          disputeResolvedBy: adminId,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Dispute gelöst - Geld freigegeben',
        transferId: result.transferId,
      })
    }
  } catch (error: any) {
    console.error('Error resolving dispute:', error)
    return NextResponse.json(
      {
        message: 'Fehler beim Lösen des Disputes',
        error: error.message,
      },
      { status: 500 }
    )
  }
}
