import { authOptions } from '@/lib/auth'
import { getEditPolicy, type ListingState } from '@/lib/edit-policy'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Prüft ob ein Artikel bearbeitet werden kann und gibt EditPolicy zurück
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
        bids: {
          select: { id: true },
        },
        categories: {
          include: {
            category: true,
          },
        },
      },
    })

    if (!watch) {
      return NextResponse.json({ message: 'Artikel nicht gefunden' }, { status: 404 })
    }

    // Prüfe Berechtigung
    if (watch.sellerId !== session.user.id) {
      return NextResponse.json({ message: 'Sie sind nicht berechtigt' }, { status: 403 })
    }

    // Determine listing state
    const isPublished = watch.moderationStatus === 'approved'
    const isDraft = !isPublished || watch.moderationStatus === 'pending' || !watch.moderationStatus
    const hasActivePurchase = watch.purchases.length > 0
    const hasActiveSale = watch.sales.length > 0
    const purchaseStatus = watch.purchases[0]?.status || undefined

    const listingState: ListingState = {
      isPublished,
      isDraft,
      isAuction: watch.isAuction || false,
      isFixedPrice: !watch.isAuction,
      bidsCount: watch.bids.length,
      hasActivePurchase,
      hasActiveSale,
      purchaseStatus,
      moderationStatus: watch.moderationStatus || undefined,
    }

    const policy = getEditPolicy(listingState)

    return NextResponse.json({
      hasActivePurchase,
      canEdit: policy.level !== 'READ_ONLY',
      policy,
      listingState,
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
    // WICHTIG: Nur nicht-stornierte Purchases zählen als "verkauft" (wie in admin/watches)
    const activePurchases = (updatedWatch?.purchases || []).filter(
      (p: any) => p.status !== 'cancelled'
    )
    const isSold = activePurchases.length > 0
    const isExpired = auctionEndDate ? auctionEndDate <= now : false
    const hasAnyPurchases = (updatedWatch?.purchases || []).length > 0

    // WICHTIG: moderationStatus 'rejected' bedeutet deaktiviert
    const isRejected = updatedWatch?.moderationStatus === 'rejected'
    // WICHTIG: Wenn moderationStatus = 'approved', ist das Produkt aktiv (außer es wurde verkauft)
    // Wenn moderationStatus = 'rejected', ist es immer inaktiv
    // Ansonsten berechne basierend auf Auktion-Status
    const isApproved = updatedWatch?.moderationStatus === 'approved'
    let calculatedIsActive: boolean
    if (isRejected) {
      calculatedIsActive = false // Rejected = immer inaktiv
    } else if (isApproved) {
      // KRITISCH: Approved = IMMER aktiv, außer es wurde verkauft
      calculatedIsActive = !isSold
      // Double-check: Wenn approved aber trotzdem false, log error
      if (!calculatedIsActive && !isSold) {
        console.error(
          '[edit-status] CRITICAL: Approved watch calculated as inactive but not sold!',
          {
            watchId: id,
            moderationStatus: updatedWatch?.moderationStatus,
            isSold,
            activePurchases: activePurchases.length,
          }
        )
        // Force to true as fallback
        calculatedIsActive = true
      }
    } else {
      // Für andere Status (pending, null): Berechne basierend auf Auktion
      calculatedIsActive = !isSold && (!auctionEndDate || !isExpired || hasAnyPurchases)
    }

    console.log('[edit-status] Status update:', {
      watchId: id,
      requestedIsActive: isActive,
      moderationStatus: updatedWatch?.moderationStatus,
      isApproved: updatedWatch?.moderationStatus === 'approved',
      isRejected: updatedWatch?.moderationStatus === 'rejected',
      isSold,
      calculatedIsActive,
    })

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
