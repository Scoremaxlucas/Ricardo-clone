import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addStatusHistory } from '@/lib/status-history'

/**
 * POST: Versand-Informationen hinzufügen/aktualisieren
 * Nur Verkäufer kann Versand-Informationen hinzufügen
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
    const { trackingNumber, trackingProvider, estimatedDeliveryDate } = await request.json()

    if (!trackingNumber || !trackingProvider) {
      return NextResponse.json(
        { message: 'Tracking-Nummer und Versanddienstleister sind erforderlich' },
        { status: 400 }
      )
    }

    // Lade Purchase
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        watch: {
          select: {
            sellerId: true
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

    // Prüfe ob der User der Verkäufer ist
    if (purchase.watch.sellerId !== session.user.id) {
      return NextResponse.json(
        { message: 'Sie sind nicht berechtigt, Versand-Informationen hinzuzufügen' },
        { status: 403 }
      )
    }

    // RICARDO-STYLE: Versandinformationen können nur hinzugefügt werden, wenn die Zahlung bestätigt wurde
    if (!purchase.paymentConfirmed) {
      return NextResponse.json(
        { message: 'Versand-Informationen können erst hinzugefügt werden, nachdem die Zahlung bestätigt wurde' },
        { status: 400 }
      )
    }

    // Update Purchase mit Versand-Informationen
    // Status wird auf "shipped" gesetzt, wenn noch nicht "completed"
    const newStatus = purchase.status === 'completed' ? 'completed' : 'shipped'
    
    const updateData: any = {
      trackingNumber,
      trackingProvider,
      shippedAt: new Date(),
      status: newStatus
    }

    if (estimatedDeliveryDate) {
      updateData.estimatedDeliveryDate = new Date(estimatedDeliveryDate)
    }

    const updatedPurchase = await prisma.purchase.update({
      where: { id },
      data: updateData,
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        watch: {
          select: {
            title: true
          }
        }
      }
    })

    // Füge Status-Historie hinzu
    try {
      await addStatusHistory(
        id,
        newStatus,
        session.user.id,
        `Artikel versandt - Tracking: ${trackingNumber}`
      )
    } catch (error) {
      console.error('[shipping] Fehler beim Hinzufügen der Status-Historie:', error)
    }

    // Benachrichtigung an Käufer
    try {
      await prisma.notification.create({
        data: {
          userId: purchase.buyerId,
          type: 'PURCHASE',
          title: '📦 Artikel versandt',
          message: `Der Artikel "${updatedPurchase.watch.title}" wurde versandt. Tracking-Nummer: ${trackingNumber}`,
          link: `/my-watches/buying/purchased`,
          watchId: purchase.watchId
        }
      })
    } catch (error) {
      console.error('[shipping] Fehler beim Erstellen der Benachrichtigung:', error)
    }

    console.log(`[shipping] Versand-Informationen für Purchase ${id} hinzugefügt`)

    return NextResponse.json({
      message: 'Versand-Informationen erfolgreich hinzugefügt',
      purchase: updatedPurchase
    })
  } catch (error: any) {
    console.error('Error adding shipping info:', error)
    return NextResponse.json(
      { message: 'Fehler beim Hinzufügen der Versand-Informationen: ' + error.message },
      { status: 500 }
    )
  }
}

/**
 * GET: Versand-Informationen abrufen
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
        trackingNumber: true,
        trackingProvider: true,
        shippedAt: true,
        estimatedDeliveryDate: true,
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
        { message: 'Sie sind nicht berechtigt, diese Versand-Informationen abzurufen' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      shipping: {
        trackingNumber: purchase.trackingNumber || null,
        trackingProvider: purchase.trackingProvider || null,
        shippedAt: purchase.shippedAt?.toISOString() || null,
        estimatedDeliveryDate: purchase.estimatedDeliveryDate?.toISOString() || null
      }
    })
  } catch (error: any) {
    console.error('Error fetching shipping info:', error)
    return NextResponse.json(
      { message: 'Fehler beim Abrufen der Versand-Informationen: ' + error.message },
      { status: 500 }
    )
  }
}

