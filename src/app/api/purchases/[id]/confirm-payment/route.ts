import { authOptions } from '@/lib/auth'
import { checkAndAwardBadges } from '@/lib/badge-system'
import { prisma } from '@/lib/prisma'
import { addStatusHistory } from '@/lib/status-history'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

// Verkäufer bestätigt Zahlung
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { id } = await params

    // Lade Purchase
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        watch: {
          include: {
            seller: true,
          },
        },
        buyer: true,
      },
    })

    if (!purchase) {
      return NextResponse.json({ message: 'Kauf nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob der Benutzer der Verkäufer ist
    if (purchase.watch.sellerId !== session.user.id) {
      return NextResponse.json(
        { message: 'Sie sind nicht berechtigt, diese Zahlung zu bestätigen' },
        { status: 403 }
      )
    }

    // Prüfe ob bereits bestätigt
    if (purchase.paymentConfirmed) {
      return NextResponse.json({ message: 'Zahlung wurde bereits bestätigt' }, { status: 400 })
    }

    // WICHTIG: Verkäufer kann nur bestätigen, wenn der Käufer bereits als bezahlt markiert hat
    // Dies verhindert, dass Verkäufer fälschlicherweise bestätigen, dass sie bezahlt wurden
    if (!purchase.paid) {
      return NextResponse.json(
        {
          message:
            'Der Käufer muss zuerst bestätigen, dass er bezahlt hat, bevor Sie die Zahlung bestätigen können.',
        },
        { status: 400 }
      )
    }

    // Bestimme neuen Status
    const newStatus = purchase.itemReceived ? 'completed' : 'payment_confirmed'

    // Aktualisiere Purchase
    const updatedPurchase = await prisma.purchase.update({
      where: { id },
      data: {
        paymentConfirmed: true,
        paymentConfirmedAt: new Date(),
        paid: true, // Legacy-Feld für Rückwärtskompatibilität
        paidAt: new Date(), // Legacy-Feld für Rückwärtskompatibilität
        status: newStatus,
      },
    })

    // Füge Status-Historie hinzu
    try {
      await addStatusHistory(id, newStatus, session.user.id, 'Zahlung durch Verkäufer bestätigt')
    } catch (error) {
      console.error(
        '[purchases/confirm-payment] Fehler beim Hinzufügen der Status-Historie:',
        error
      )
    }

    console.log(
      `[purchases/confirm-payment] Verkäufer ${session.user.email} hat Zahlung bestätigt für Purchase ${id}`
    )

    // Rechnung wurde bereits bei Purchase-Erstellung erstellt
    // Hier nur Status aktualisieren, keine neue Rechnung erstellen

    // Wenn Käufer bereits Erhalt bestätigt hat, setze Status auf "completed"
    if (purchase.itemReceived) {
      await prisma.purchase.update({
        where: { id },
        data: { status: 'completed' },
      })
      await addStatusHistory(
        id,
        'completed',
        'system',
        'Zahlung und Erhalt bestätigt - Kauf abgeschlossen'
      )

      // Erstelle Sale für Gamification (Feature 9)
      try {
        const existingSale = await prisma.sale.findFirst({
          where: {
            watchId: purchase.watchId,
            sellerId: purchase.watch.sellerId,
            buyerId: purchase.buyerId,
          },
        })

        if (!existingSale) {
          await prisma.sale.create({
            data: {
              watchId: purchase.watchId,
              sellerId: purchase.watch.sellerId,
              buyerId: purchase.buyerId,
              price: purchase.price,
            },
          })

          // Badge-Vergabe für Verkäufer (Feature 9: Gamification)
          checkAndAwardBadges(purchase.watch.sellerId, 'sale').catch(err => {
            console.error('[confirm-payment] Error awarding seller badges:', err)
          })
        }
      } catch (saleError) {
        console.error('[confirm-payment] Error creating sale:', saleError)
        // Silent fail - Sale-Erstellung sollte nicht kritisch sein
      }

      // Badge-Vergabe für Käufer beim Purchase-Abschluss (Feature 9: Gamification)
      checkAndAwardBadges(purchase.buyerId, 'purchase').catch(err => {
        console.error('[confirm-payment] Error awarding buyer badges:', err)
      })
    }

    // Benachrichtigung an Käufer
    try {
      await prisma.notification.create({
        data: {
          userId: purchase.buyerId,
          type: 'PURCHASE',
          title: 'Zahlung bestätigt',
          message: `Der Verkäufer hat die Zahlung für "${purchase.watch.title}" bestätigt.`,
          link: `/my-watches/buying/purchased`,
          watchId: purchase.watchId,
        },
      })
    } catch (notifError) {
      console.error(
        '[purchases/confirm-payment] Fehler beim Erstellen der Benachrichtigung:',
        notifError
      )
    }

    return NextResponse.json({
      message: 'Zahlung erfolgreich bestätigt',
      purchase: updatedPurchase,
    })
  } catch (error: any) {
    console.error('Error confirming payment:', error)
    return NextResponse.json(
      { message: 'Fehler beim Bestätigen der Zahlung: ' + error.message },
      { status: 500 }
    )
  }
}
