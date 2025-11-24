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
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json(
        { message: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Prüfe Admin-Status
    const isAdminInSession = session?.user?.isAdmin === true || session?.user?.isAdmin === 1
    
    // Prüfe ob User Admin ist (per ID oder E-Mail)
    let user = null
    if (session.user.id) {
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isAdmin: true, email: true }
      })
    }

    // Falls nicht gefunden per ID, versuche per E-Mail
    if (!user && session.user.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { isAdmin: true, email: true }
      })
    }

    // Prüfe Admin-Status: Session ODER Datenbank
    const isAdminInDb = user?.isAdmin === true || user?.isAdmin === 1
    const isAdmin = isAdminInSession || isAdminInDb

    if (!isAdmin) {
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
          select: {
            id: true,
            title: true,
            sellerId: true,
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

    // Update Purchase - Baue Update-Objekt sorgfältig auf
    const existingDescription = purchase.disputeDescription || ''
    const adminResolution = `\n\n--- ADMIN-LÖSUNG ---\n${resolution}`
    const newDescription = existingDescription + adminResolution

    const updateData: {
      disputeStatus: string
      disputeResolvedAt: Date
      disputeResolvedBy: string
      disputeDescription: string
      status?: string
    } = {
      disputeStatus: 'resolved',
      disputeResolvedAt: new Date(),
      disputeResolvedBy: session.user.id,
      disputeDescription: newDescription
    }

    // Storniere Purchase falls gewünscht
    if (cancelPurchase) {
      updateData.status = 'cancelled'
      
      // Storniere zugehörige Rechnung (falls vorhanden)
      try {
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
          console.log(`[dispute/resolve] Invoice ${invoice.id} wurde storniert`)
        }
      } catch (invoiceError: any) {
        console.error('[dispute/resolve] Fehler beim Stornieren der Invoice:', invoiceError)
        // Invoice-Fehler sollte nicht die Dispute-Lösung verhindern
      }
    }

    // Führe Update durch
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

