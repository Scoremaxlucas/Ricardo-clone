import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

/**
 * POST: Stornierungsantrag stellen
 * Nur Verkäufer können Stornierungsanträge stellen
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const { id } = await params
    const { reason, description } = await request.json()

    if (!reason || !description) {
      return NextResponse.json(
        { message: 'Grund und Beschreibung sind erforderlich' },
        { status: 400 }
      )
    }

    // Lade Purchase
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        watch: {
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                email: true,
                firstName: true,
                lastName: true,
                nickname: true
              }
            }
          }
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
            nickname: true
          }
        }
      }
    })

    if (!purchase) {
      return NextResponse.json(
        { message: 'Kauf nicht gefunden' },
        { status: 404 }
      )
    }

    // Prüfe Berechtigung (nur Verkäufer)
    const isSeller = purchase.watch.sellerId === session.user.id

    if (!isSeller) {
      return NextResponse.json(
        { message: 'Nur der Verkäufer kann einen Stornierungsantrag stellen' },
        { status: 403 }
      )
    }

    // Prüfe ob bereits ein Stornierungsantrag existiert
    if (purchase.cancellationRequestedAt) {
      return NextResponse.json(
        { message: 'Für diesen Kauf wurde bereits ein Stornierungsantrag gestellt' },
        { status: 400 }
      )
    }

    // Prüfe ob Kauf bereits storniert oder abgeschlossen ist
    if (purchase.status === 'cancelled') {
      return NextResponse.json(
        { message: 'Dieser Kauf wurde bereits storniert' },
        { status: 400 }
      )
    }

    if (purchase.status === 'completed') {
      return NextResponse.json(
        { message: 'Für abgeschlossene Käufe kann kein Stornierungsantrag gestellt werden' },
        { status: 400 }
      )
    }

    // Validiere Stornierungsgründe
    const validReasons = ['buyer_not_responding', 'payment_not_confirmed', 'item_damaged_before_shipping', 'other']
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { message: 'Dieser Stornierungsgrund ist nicht gültig' },
        { status: 400 }
      )
    }

    // Erstelle Stornierungsantrag
    const updatedPurchase = await prisma.purchase.update({
      where: { id },
      data: {
        cancellationRequestedAt: new Date(),
        cancellationRequestStatus: 'pending',
        cancellationRequestReason: reason,
        cancellationRequestDescription: description
      }
    })

    // Benachrichtigung an Käufer
    try {
      await prisma.notification.create({
        data: {
          userId: purchase.buyerId,
          type: 'PURCHASE',
          title: '⚠️ Stornierungsantrag gestellt',
          message: `Der Verkäufer hat einen Stornierungsantrag für "${purchase.watch.title}" gestellt. Ein Admin wird sich darum kümmern.`,
          link: `/my-watches/buying/purchased`,
          watchId: purchase.watchId
        }
      })
    } catch (error) {
      console.error('[cancel-request] Fehler beim Erstellen der Käufer-Benachrichtigung:', error)
    }

    // E-Mail-Benachrichtigung an Käufer
    try {
      const { getCancelRequestEmail } = await import('@/lib/email')
      const sellerName = purchase.watch.seller.nickname || purchase.watch.seller.firstName || purchase.watch.seller.name || 'Verkäufer'
      const { subject, html, text } = getCancelRequestEmail(
        purchase.buyer.nickname || purchase.buyer.firstName || purchase.buyer.name || 'Nutzer',
        sellerName,
        purchase.watch.title,
        reason,
        description
      )
      
      await sendEmail({
        to: purchase.buyer.email,
        subject,
        html,
        text
      })
    } catch (emailError) {
      console.error('[cancel-request] Fehler beim Senden der E-Mail:', emailError)
    }

    // Benachrichtigung an Admins
    try {
      const admins = await prisma.user.findMany({
        where: { isAdmin: true },
        select: { id: true }
      })

      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'PURCHASE',
            title: '🔔 Neuer Stornierungsantrag',
            message: `Ein Stornierungsantrag wurde für "${purchase.watch.title}" gestellt. Grund: ${reason}`,
            link: `/admin/disputes/${id}`,
            watchId: purchase.watchId
          }
        })
      }
    } catch (error) {
      console.error('[cancel-request] Fehler beim Erstellen der Admin-Benachrichtigungen:', error)
    }

    console.log(`[cancel-request] Stornierungsantrag gestellt für Purchase ${id} von Verkäufer`)

    return NextResponse.json({
      message: 'Stornierungsantrag erfolgreich gestellt. Ein Admin wird sich in Kürze darum kümmern.',
      purchase: updatedPurchase
    })
  } catch (error: any) {
    console.error('Error submitting cancel request:', error)
    return NextResponse.json(
      { message: 'Fehler beim Stellen des Stornierungsantrags: ' + error.message },
      { status: 500 }
    )
  }
}

