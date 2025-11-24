import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { addStatusHistory } from '@/lib/status-history'

/**
 * POST: Dispute durch Admin lösen
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

    // Prüfe ob Admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json(
        { message: 'Zugriff verweigert. Nur Admins können Disputes lösen.' },
        { status: 403 }
      )
    }

    const { id } = await params
    const { resolution, refundBuyer, refundSeller, cancelPurchase } = await request.json()

    if (!resolution) {
      return NextResponse.json(
        { message: 'Lösung ist erforderlich' },
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

    if (!purchase.disputeOpenedAt) {
      return NextResponse.json(
        { message: 'Für diesen Kauf wurde kein Dispute eröffnet' },
        { status: 400 }
      )
    }

    if (purchase.disputeStatus === 'resolved') {
      return NextResponse.json(
        { message: 'Dieser Dispute wurde bereits gelöst' },
        { status: 400 }
      )
    }

    // Update Purchase
    const updateData: any = {
      disputeStatus: 'resolved',
      disputeResolvedAt: new Date(),
      disputeResolvedBy: session.user.id,
      // Speichere Lösung in disputeDescription (nicht in disputeReason überschreiben)
      disputeDescription: `${purchase.disputeDescription || ''}\n\n--- ADMIN-LÖSUNG ---\n${resolution}`
    }

    // Storniere Purchase falls gewünscht
    if (cancelPurchase) {
      updateData.status = 'cancelled'
      
      // Storniere zugehörige Rechnung
      const invoice = await prisma.invoice.findFirst({
        where: {
          saleId: id,
          sellerId: purchase.watch.sellerId
        }
      })

      if (invoice) {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            status: 'cancelled',
            refundedAt: new Date()
          }
        })
      }
    }

    const updatedPurchase = await prisma.purchase.update({
      where: { id },
      data: updateData
    })

    // Füge Status-Historie hinzu
    try {
      await addStatusHistory(
        id,
        updateData.status || purchase.status || 'pending',
        session.user.id,
        `Dispute gelöst: ${resolution}`
      )
    } catch (error) {
      console.error('[dispute/resolve] Fehler beim Hinzufügen der Status-Historie:', error)
    }

    // Benachrichtigungen an beide Parteien
    const sellerName = purchase.watch.seller.nickname || purchase.watch.seller.firstName || purchase.watch.seller.name || 'Verkäufer'
    const buyerName = purchase.buyer.nickname || purchase.buyer.firstName || purchase.buyer.name || 'Käufer'

    // Benachrichtigung an Verkäufer
    try {
      await prisma.notification.create({
        data: {
          userId: purchase.watch.sellerId,
          type: 'PURCHASE',
          title: '✅ Dispute gelöst',
          message: `Der Dispute für "${purchase.watch.title}" wurde gelöst. ${resolution}`,
          link: `/my-watches/selling/sold`,
          watchId: purchase.watchId
        }
      })
    } catch (error) {
      console.error('[dispute/resolve] Fehler bei Verkäufer-Benachrichtigung:', error)
    }

    // Benachrichtigung an Käufer
    try {
      await prisma.notification.create({
        data: {
          userId: purchase.buyerId,
          type: 'PURCHASE',
          title: '✅ Dispute gelöst',
          message: `Der Dispute für "${purchase.watch.title}" wurde gelöst. ${resolution}`,
          link: `/my-watches/buying/purchased`,
          watchId: purchase.watchId
        }
      })
    } catch (error) {
      console.error('[dispute/resolve] Fehler bei Käufer-Benachrichtigung:', error)
    }

    // E-Mail-Benachrichtigungen
    try {
      const { getDisputeResolvedEmail } = await import('@/lib/email')
      
      // E-Mail an Verkäufer
      const sellerEmail = getDisputeResolvedEmail(
        sellerName,
        buyerName,
        purchase.watch.title,
        resolution,
        'seller'
      )
      await sendEmail({
        to: purchase.watch.seller.email,
        subject: sellerEmail.subject,
        html: sellerEmail.html,
        text: sellerEmail.text
      })

      // E-Mail an Käufer
      const buyerEmail = getDisputeResolvedEmail(
        buyerName,
        sellerName,
        purchase.watch.title,
        resolution,
        'buyer'
      )
      await sendEmail({
        to: purchase.buyer.email,
        subject: buyerEmail.subject,
        html: buyerEmail.html,
        text: buyerEmail.text
      })
    } catch (emailError) {
      console.error('[dispute/resolve] Fehler beim Senden der E-Mails:', emailError)
    }

    console.log(`[dispute/resolve] Admin ${session.user.id} hat Dispute für Purchase ${id} gelöst`)

    return NextResponse.json({
      message: 'Dispute erfolgreich gelöst',
      purchase: updatedPurchase
    })
  } catch (error: any) {
    console.error('Error resolving dispute:', error)
    return NextResponse.json(
      { message: 'Fehler beim Lösen des Disputes: ' + error.message },
      { status: 500 }
    )
  }
}

