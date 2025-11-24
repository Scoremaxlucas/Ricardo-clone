import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { addStatusHistory } from '@/lib/status-history'

/**
 * POST: Dispute eröffnen
 * Kann sowohl von Käufer als auch Verkäufer aufgerufen werden
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

    // Prüfe Berechtigung (nur Käufer oder Verkäufer)
    const isSeller = purchase.watch.sellerId === session.user.id
    const isBuyer = purchase.buyerId === session.user.id

    if (!isSeller && !isBuyer) {
      return NextResponse.json(
        { message: 'Sie sind nicht berechtigt, einen Dispute zu eröffnen' },
        { status: 403 }
      )
    }

    // RICARDO-STYLE: Validiere, dass der Dispute-Grund für die Rolle gültig ist
    const buyerReasons = ['item_not_received', 'item_damaged', 'item_wrong', 'payment_not_confirmed', 'seller_not_responding', 'other']
    const sellerReasons = ['payment_not_confirmed', 'buyer_not_responding', 'other']
    
    const validReasons = isSeller ? sellerReasons : buyerReasons
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { message: `Dieser Dispute-Grund ist für ${isSeller ? 'Verkäufer' : 'Käufer'} nicht gültig` },
        { status: 400 }
      )
    }

    // Prüfe ob bereits ein Dispute existiert
    if (purchase.disputeOpenedAt) {
      return NextResponse.json(
        { message: 'Für diesen Kauf wurde bereits ein Dispute eröffnet' },
        { status: 400 }
      )
    }

    // Prüfe ob Kauf bereits abgeschlossen ist
    if (purchase.status === 'completed') {
      return NextResponse.json(
        { message: 'Für abgeschlossene Käufe kann kein Dispute eröffnet werden' },
        { status: 400 }
      )
    }

    // Erstelle Dispute
    const updatedPurchase = await prisma.purchase.update({
      where: { id },
      data: {
        disputeOpenedAt: new Date(),
        disputeStatus: 'pending',
        disputeReason: reason, // Nur der Grund (z.B. 'item_not_received')
        disputeDescription: description // Detaillierte Beschreibung getrennt
      }
    })

    // Füge Status-Historie hinzu
    try {
      await addStatusHistory(
        id,
        purchase.status || 'pending',
        session.user.id,
        `Dispute eröffnet: ${reason}`
      )
    } catch (error) {
      console.error('[dispute] Fehler beim Hinzufügen der Status-Historie:', error)
    }

    // Benachrichtigung an die andere Partei
    const otherParty = isSeller ? purchase.buyer : purchase.watch.seller
    const openerName = isSeller 
      ? (purchase.watch.seller.nickname || purchase.watch.seller.firstName || purchase.watch.seller.name || 'Verkäufer')
      : (purchase.buyer.nickname || purchase.buyer.firstName || purchase.buyer.name || 'Käufer')

    try {
      await prisma.notification.create({
        data: {
          userId: otherParty.id,
          type: 'PURCHASE',
          title: '⚠️ Dispute eröffnet',
          message: `${openerName} hat einen Dispute für "${purchase.watch.title}" eröffnet. Grund: ${reason}`,
          link: `/my-watches/${isSeller ? 'buying' : 'selling'}/${isSeller ? 'purchased' : 'sold'}`,
          watchId: purchase.watchId
        }
      })
    } catch (error) {
      console.error('[dispute] Fehler beim Erstellen der Benachrichtigung:', error)
    }

    // E-Mail-Benachrichtigung
    try {
      const { getDisputeOpenedEmail } = await import('@/lib/email')
      const { subject, html, text } = getDisputeOpenedEmail(
        otherParty.nickname || otherParty.firstName || otherParty.name || 'Nutzer',
        openerName,
        purchase.watch.title,
        reason,
        description,
        isSeller ? 'buyer' : 'seller'
      )
      
      await sendEmail({
        to: otherParty.email,
        subject,
        html,
        text
      })
    } catch (emailError) {
      console.error('[dispute] Fehler beim Senden der Dispute-E-Mail:', emailError)
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
            title: '🔔 Neuer Dispute',
            message: `Ein Dispute wurde für "${purchase.watch.title}" eröffnet. Grund: ${reason}`,
            link: `/admin/disputes/${id}`,
            watchId: purchase.watchId
          }
        })
      }
    } catch (error) {
      console.error('[dispute] Fehler beim Erstellen der Admin-Benachrichtigungen:', error)
    }

    console.log(`[dispute] Dispute eröffnet für Purchase ${id} von ${isSeller ? 'Verkäufer' : 'Käufer'}`)

    return NextResponse.json({
      message: 'Dispute erfolgreich eröffnet. Ein Admin wird sich in Kürze darum kümmern.',
      purchase: updatedPurchase
    })
  } catch (error: any) {
    console.error('Error opening dispute:', error)
    return NextResponse.json(
      { message: 'Fehler beim Eröffnen des Disputes: ' + error.message },
      { status: 500 }
    )
  }
}

/**
 * GET: Dispute-Informationen abrufen
 */
export async function GET(
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

    const purchase = await prisma.purchase.findUnique({
      where: { id },
      select: {
        id: true,
        disputeOpenedAt: true,
        disputeReason: true,
        disputeStatus: true,
        disputeResolvedAt: true,
        disputeResolvedBy: true,
        watch: {
          select: {
            sellerId: true
          }
        },
        buyerId: true
      }
    })

    if (!purchase) {
      return NextResponse.json(
        { message: 'Kauf nicht gefunden' },
        { status: 404 }
      )
    }

    // Prüfe Berechtigung (Käufer, Verkäufer oder Admin)
    const isSeller = purchase.watch.sellerId === session.user.id
    const isBuyer = purchase.buyerId === session.user.id
    const isAdmin = session.user.isAdmin === true

    if (!isSeller && !isBuyer && !isAdmin) {
      return NextResponse.json(
        { message: 'Sie sind nicht berechtigt, diese Dispute-Informationen abzurufen' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      dispute: {
        openedAt: purchase.disputeOpenedAt?.toISOString() || null,
        reason: purchase.disputeReason || null,
        status: purchase.disputeStatus || null,
        resolvedAt: purchase.disputeResolvedAt?.toISOString() || null,
        resolvedBy: purchase.disputeResolvedBy || null
      }
    })
  } catch (error: any) {
    console.error('Error fetching dispute:', error)
    return NextResponse.json(
      { message: 'Fehler beim Abrufen der Dispute-Informationen: ' + error.message },
      { status: 500 }
    )
  }
}

