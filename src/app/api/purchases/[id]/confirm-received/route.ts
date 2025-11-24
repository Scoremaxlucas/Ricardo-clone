import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateInvoiceForSale } from '@/lib/invoice'
import { addStatusHistory } from '@/lib/status-history'

// Käufer bestätigt Erhalt des Artikels
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

    // Lade Purchase
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        watch: {
          include: {
            seller: true
          }
        },
        buyer: true
      }
    })

    if (!purchase) {
      return NextResponse.json(
        { message: 'Kauf nicht gefunden' },
        { status: 404 }
      )
    }

    // Prüfe ob der Benutzer der Käufer ist
    if (purchase.buyerId !== session.user.id) {
      return NextResponse.json(
        { message: 'Sie sind nicht berechtigt, diesen Kauf zu bestätigen' },
        { status: 403 }
      )
    }

    // Prüfe ob bereits bestätigt
    if (purchase.itemReceived) {
      return NextResponse.json(
        { message: 'Erhalt wurde bereits bestätigt' },
        { status: 400 }
      )
    }

    // Bestimme neuen Status
    const newStatus = purchase.paymentConfirmed ? 'completed' : 'item_received'

    // Aktualisiere Purchase
    const updatedPurchase = await prisma.purchase.update({
      where: { id },
      data: {
        itemReceived: true,
        itemReceivedAt: new Date(),
        status: newStatus
      }
    })

    // Füge Status-Historie hinzu
    try {
      await addStatusHistory(
        id,
        newStatus,
        session.user.id,
        'Erhalt durch Käufer bestätigt'
      )
    } catch (error) {
      console.error('[purchases/confirm-received] Fehler beim Hinzufügen der Status-Historie:', error)
    }

    console.log(`[purchases/confirm-received] Käufer ${session.user.email} hat Erhalt bestätigt für Purchase ${id}`)

    // RICARDO-STYLE: Rechnung wurde bereits bei Purchase-Erstellung erstellt
    // Hier nur Status aktualisieren, keine neue Rechnung erstellen
    
    // Wenn Verkäufer bereits Zahlung bestätigt hat, setze Status auf "completed"
    if (purchase.paymentConfirmed) {
      await prisma.purchase.update({
        where: { id },
        data: { status: 'completed' }
      })
      await addStatusHistory(
        id,
        'completed',
        'system',
        'Zahlung und Erhalt bestätigt - Kauf abgeschlossen'
      )
    }

    // Benachrichtigung an Verkäufer
    try {
      await prisma.notification.create({
        data: {
          userId: purchase.watch.sellerId,
          type: 'PURCHASE',
          title: 'Artikel erhalten bestätigt',
          message: `${purchase.buyer.name || purchase.buyer.nickname || 'Der Käufer'} hat den Erhalt des Artikels "${purchase.watch.title}" bestätigt.`,
          link: `/my-watches/selling/sold`,
          watchId: purchase.watchId,
        },
      })
    } catch (notifError) {
      console.error('[purchases/confirm-received] Fehler beim Erstellen der Benachrichtigung:', notifError)
    }

    return NextResponse.json({
      message: 'Erhalt erfolgreich bestätigt',
      purchase: updatedPurchase
    })
  } catch (error: any) {
    console.error('Error confirming received:', error)
    return NextResponse.json(
      { message: 'Fehler beim Bestätigen des Erhalts: ' + error.message },
      { status: 500 }
    )
  }
}



