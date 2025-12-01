import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Prüft ob ein Artikel bearbeitet werden kann
 * Artikel kann nicht bearbeitet werden wenn bereits ein aktiver Kauf stattgefunden hat
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const watch = await prisma.watch.findUnique({
      where: { id },
      include: {
        purchases: {
          where: {
            status: { not: 'cancelled' },
          },
        },
        sales: true,
      },
    })

    if (!watch) {
      return NextResponse.json({ message: 'Artikel nicht gefunden' }, { status: 404 })
    }

    // Prüfe Berechtigung
    if (watch.sellerId !== session.user.id) {
      return NextResponse.json({ message: 'Sie sind nicht berechtigt' }, { status: 403 })
    }

    const hasActivePurchase = watch.purchases.length > 0 || watch.sales.length > 0

    return NextResponse.json({
      hasActivePurchase,
      canEdit: !hasActivePurchase,
    })
  } catch (error: any) {
    console.error('[watches/edit-status] Error:', error)
    return NextResponse.json(
      { message: 'Fehler beim Prüfen des Status', error: error.message },
      { status: 500 }
    )
  }
}

// PATCH: Status eines Angebots aktualisieren (für Admin)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Prüfe Admin-Status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json(
        { message: 'Nur Administratoren können den Status ändern' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { isActive } = body

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ message: 'isActive muss ein Boolean sein' }, { status: 400 })
    }

    // Hole Watch mit Purchases
    const watch = await prisma.watch.findUnique({
      where: { id },
      include: {
        purchases: {
          where: {
            status: { not: 'cancelled' },
          },
        },
      },
    })

    if (!watch) {
      return NextResponse.json({ message: 'Angebot nicht gefunden' }, { status: 404 })
    }

    // Da isActive dynamisch berechnet wird, müssen wir Purchases stornieren oder moderationStatus ändern
    if (!isActive) {
      // Deaktivieren: Storniere alle aktiven Purchases und setze moderationStatus auf 'rejected'
      if (watch.purchases.length > 0) {
        await prisma.purchase.updateMany({
          where: {
            watchId: id,
            status: { not: 'cancelled' },
          },
          data: {
            status: 'cancelled',
          },
        })
      }

      await prisma.watch.update({
        where: { id },
        data: {
          moderationStatus: 'rejected',
          moderatedBy: session.user.id,
          moderatedAt: new Date(),
        },
      })
    } else {
      // Aktivieren: Setze moderationStatus auf 'approved'
      await prisma.watch.update({
        where: { id },
        data: {
          moderationStatus: 'approved',
          moderatedBy: session.user.id,
          moderatedAt: new Date(),
        },
      })
    }

    // Berechne den neuen isActive Status
    const updatedWatch = await prisma.watch.findUnique({
      where: { id },
      include: {
        purchases: {
          where: {
            status: { not: 'cancelled' },
          },
        },
      },
    })

    const now = new Date()
    const auctionEndDate = updatedWatch?.auctionEnd ? new Date(updatedWatch.auctionEnd) : null
    const isSold = (updatedWatch?.purchases.length || 0) > 0
    const isExpired = auctionEndDate ? auctionEndDate <= now : false

    // WICHTIG: moderationStatus 'rejected' bedeutet deaktiviert
    const isRejected = updatedWatch?.moderationStatus === 'rejected'
    const calculatedIsActive = !isRejected && !isSold && (!auctionEndDate || !isExpired)

    return NextResponse.json({
      message: `Angebot erfolgreich ${isActive ? 'aktiviert' : 'deaktiviert'}`,
      watch: {
        id: updatedWatch?.id,
        isActive: calculatedIsActive,
        moderationStatus: updatedWatch?.moderationStatus,
      },
    })
  } catch (error: any) {
    console.error('[watches/edit-status] Error updating status:', error)
    return NextResponse.json(
      { message: 'Fehler beim Aktualisieren des Status', error: error.message },
      { status: 500 }
    )
  }
}
