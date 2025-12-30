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

    // Simplified query - only essential fields
    const watch = await prisma.watch.findUnique({
      where: { id },
      select: {
        id: true,
        sellerId: true,
        isAuction: true,
        moderationStatus: true,
        articleNumber: true, // For determining if published
        _count: {
          select: {
            bids: true,
            purchases: true,
            sales: true,
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

    // Get active purchases count separately
    const activePurchasesCount = await prisma.purchase.count({
      where: {
        watchId: id,
        NOT: { status: 'cancelled' },
      },
    })

    // Determine listing state
    // WICHTIG: Ein Artikel gilt als "veröffentlicht" wenn:
    // 1. Er eine Artikelnummer hat (wurde im System veröffentlicht)
    // 2. ODER moderationStatus = 'approved'
    // Nach Veröffentlichung: Kategorie + Verkaufsart sind gesperrt (Ricardo-Regel)
    const hasArticleNumber = !!watch.articleNumber
    const isApproved = watch.moderationStatus === 'approved'
    const isPublished = hasArticleNumber || isApproved
    const isDraft = !isPublished
    const hasActivePurchase = activePurchasesCount > 0
    const hasActiveSale = watch._count.sales > 0

    const listingState: ListingState = {
      isPublished,
      isDraft,
      isAuction: watch.isAuction || false,
      isFixedPrice: !watch.isAuction,
      bidsCount: watch._count.bids,
      hasActivePurchase,
      hasActiveSale,
      purchaseStatus: undefined, // Not needed for policy calculation
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

// ===========================================
// RICARDO-STYLE: Kein Toggle mehr!
// ===========================================
//
// DEPRECATED: Der isActive-Toggle wurde entfernt.
//
// Stattdessen verwenden Sie:
// - POST /api/admin/watches/bulk mit action: 'approve' → Genehmigen
// - DELETE /api/watches/[id]?action=remove → Entfernen (Soft Delete)
// - DELETE /api/watches/[id]?action=block → Sperren (Soft Delete)
//
// Artikel folgen dem Ricardo-Lebenszyklus:
// Entwurf → Genehmigt → Beendet (verkauft/abgelaufen) → Archiviert
//
// ===========================================

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // RICARDO-STYLE: Toggle ist deaktiviert
  console.warn('[DEPRECATED] edit-status PATCH called - isActive toggle is no longer supported')

  return NextResponse.json(
    {
      message:
        'Diese Funktion wurde deaktiviert (Ricardo-Konformität). Verwenden Sie stattdessen: approve, remove oder block.',
      deprecated: true,
      alternatives: {
        approve: 'POST /api/admin/watches/bulk mit action: "approve"',
        remove: 'DELETE /api/watches/[id]?action=remove',
        block: 'DELETE /api/watches/[id]?action=block',
      },
    },
    { status: 410 } // 410 Gone - Resource no longer available
  )
}
