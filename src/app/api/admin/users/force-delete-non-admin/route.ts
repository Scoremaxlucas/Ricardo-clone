import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/admin/users/force-delete-non-admin
 *
 * FORCIERTE LÖSCHUNG mit manueller Bereinigung aller abhängigen Daten.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const currentAdmin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true, email: true },
    })

    if (!currentAdmin?.isAdmin) {
      return NextResponse.json({ message: 'Nur Administratoren' }, { status: 403 })
    }

    // Finde ALLE nicht-Admin-User
    const nonAdminUsers = await prisma.user.findMany({
      where: { isAdmin: false },
      select: { id: true, email: true },
    })

    if (nonAdminUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: '✅ Keine nicht-Admin-User vorhanden.',
        deleted: 0,
        cleanupComplete: true,
      })
    }

    console.log(`[force-delete] Starte Löschung von ${nonAdminUsers.length} Usern`)

    let deleted = 0
    const errors: string[] = []

    for (const user of nonAdminUsers) {
      const userId = user.id
      console.log(`[force-delete] Lösche ${user.email} (${userId})...`)

      try {
        // SCHRITT 1: Lösche alle Watches des Users und deren abhängige Daten
        const watches = await prisma.watch.findMany({
          where: { sellerId: userId },
          select: { id: true },
        })

        for (const watch of watches) {
          const watchId = watch.id
          // Lösche Watch-abhängige Daten
          await prisma.bid.deleteMany({ where: { watchId } }).catch(() => {})
          await prisma.favorite.deleteMany({ where: { watchId } }).catch(() => {})
          await prisma.priceOffer.deleteMany({ where: { watchId } }).catch(() => {})
          await prisma.purchase.deleteMany({ where: { watchId } }).catch(() => {})
          await prisma.sale.deleteMany({ where: { watchId } }).catch(() => {})
          await prisma.message.deleteMany({ where: { watchId } }).catch(() => {})
          await prisma.watchCategory.deleteMany({ where: { watchId } }).catch(() => {})
          await prisma.watchView.deleteMany({ where: { watchId } }).catch(() => {})
          await prisma.report.deleteMany({ where: { watchId } }).catch(() => {})
          await prisma.adminNote.deleteMany({ where: { watchId } }).catch(() => {})
          await prisma.moderationHistory.deleteMany({ where: { watchId } }).catch(() => {})
          await prisma.invoiceItem.deleteMany({ where: { watchId } }).catch(() => {})
          await prisma.collectionItem.deleteMany({ where: { watchId } }).catch(() => {})
          await prisma.auctionViewer.deleteMany({ where: { watchId } }).catch(() => {})
          await prisma.story.deleteMany({ where: { watchId } }).catch(() => {})
          await prisma.browsingHistory.deleteMany({ where: { watchId } }).catch(() => {})
          await prisma.aISearchResult.deleteMany({ where: { watchId } }).catch(() => {})
          await prisma.order.deleteMany({ where: { watchId } }).catch(() => {})
          await prisma.productStats.deleteMany({ where: { watchId } }).catch(() => {})
        }

        // Lösche Watches
        await prisma.watch.deleteMany({ where: { sellerId: userId } }).catch(() => {})

        // SCHRITT 2: Lösche User-spezifische Daten
        await prisma.bid.deleteMany({ where: { userId } }).catch(() => {})
        await prisma.favorite.deleteMany({ where: { userId } }).catch(() => {})
        await prisma.priceOffer.deleteMany({ where: { buyerId: userId } }).catch(() => {})
        await prisma.purchase.deleteMany({ where: { buyerId: userId } }).catch(() => {})
        await prisma.message.deleteMany({ where: { senderId: userId } }).catch(() => {})
        await prisma.message.deleteMany({ where: { receiverId: userId } }).catch(() => {})
        await prisma.notification.deleteMany({ where: { userId } }).catch(() => {})
        await prisma.invoice.deleteMany({ where: { sellerId: userId } }).catch(() => {})
        await prisma.sale.deleteMany({ where: { sellerId: userId } }).catch(() => {})
        await prisma.sale.deleteMany({ where: { buyerId: userId } }).catch(() => {})
        await prisma.review.deleteMany({ where: { reviewerId: userId } }).catch(() => {})
        await prisma.review.deleteMany({ where: { reviewedUserId: userId } }).catch(() => {})
        await prisma.searchSubscription.deleteMany({ where: { userId } }).catch(() => {})
        await prisma.maxBid.deleteMany({ where: { userId } }).catch(() => {})
        await prisma.browsingHistory.deleteMany({ where: { userId } }).catch(() => {})
        await prisma.aIConversation.deleteMany({ where: { userId } }).catch(() => {})
        await prisma.aISearchResult.deleteMany({ where: { userId } }).catch(() => {})
        await prisma.collection.deleteMany({ where: { userId } }).catch(() => {})
        await prisma.userBadge.deleteMany({ where: { userId } }).catch(() => {})
        await prisma.userStreak.deleteMany({ where: { userId } }).catch(() => {})
        await prisma.reward.deleteMany({ where: { userId } }).catch(() => {})
        await prisma.draft.deleteMany({ where: { userId } }).catch(() => {})
        await prisma.userPreferences.deleteMany({ where: { userId } }).catch(() => {})
        await prisma.userActivity.deleteMany({ where: { userId } }).catch(() => {})
        await prisma.searchQuery.deleteMany({ where: { userId } }).catch(() => {})
        await prisma.userAddress.deleteMany({ where: { userId } }).catch(() => {})
        await prisma.session.deleteMany({ where: { userId } }).catch(() => {})
        await prisma.account.deleteMany({ where: { userId } }).catch(() => {})
        await prisma.report.deleteMany({ where: { reportedBy: userId } }).catch(() => {})
        await prisma.userReport.deleteMany({ where: { reportedBy: userId } }).catch(() => {})
        await prisma.userReport.deleteMany({ where: { reportedUserId: userId } }).catch(() => {})
        await prisma.adminNote.deleteMany({ where: { adminId: userId } }).catch(() => {})
        await prisma.userAdminNote.deleteMany({ where: { adminId: userId } }).catch(() => {})
        await prisma.userAdminNote.deleteMany({ where: { userId } }).catch(() => {})
        await prisma.moderationHistory.deleteMany({ where: { adminId: userId } }).catch(() => {})
        await prisma.pricingHistory.deleteMany({ where: { changedBy: userId } }).catch(() => {})
        await prisma.payoutProfile.deleteMany({ where: { userId } }).catch(() => {})
        await prisma.payoutChangeRequest.deleteMany({ where: { userId } }).catch(() => {})
        await prisma.payoutChangeRequest.deleteMany({ where: { decidedBy: userId } }).catch(() => {})
        await prisma.payoutAuditLog.deleteMany({ where: { actorUserId: userId } }).catch(() => {})
        await prisma.disputeComment.deleteMany({ where: { userId } }).catch(() => {})
        await prisma.systemOutage.deleteMany({ where: { createdBy: userId } }).catch(() => {})
        await prisma.systemOutage.deleteMany({ where: { resolvedBy: userId } }).catch(() => {})
        await prisma.systemOutage.deleteMany({ where: { extensionAppliedBy: userId } }).catch(() => {})
        await prisma.auctionViewer.deleteMany({ where: { userId } }).catch(() => {})
        await prisma.order.deleteMany({ where: { buyerId: userId } }).catch(() => {})
        await prisma.order.deleteMany({ where: { sellerId: userId } }).catch(() => {})
        await prisma.conversation.deleteMany({ where: { userId } }).catch(() => {})

        // SCHRITT 3: Lösche den User
        await prisma.user.delete({ where: { id: userId } })
        deleted++
        console.log(`[force-delete] ✅ ${user.email} gelöscht`)
      } catch (error: any) {
        console.error(`[force-delete] ❌ ${user.email}: ${error.message}`)
        errors.push(`${user.email}: ${error.message}`)
      }
    }

    const remaining = await prisma.user.count({ where: { isAdmin: false } })

    return NextResponse.json({
      success: deleted > 0,
      message: `${deleted}/${nonAdminUsers.length} User gelöscht. ${remaining} nicht-Admin-User verbleiben.`,
      deleted,
      total: nonAdminUsers.length,
      remaining,
      cleanupComplete: remaining === 0,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('[force-delete] Fehler:', error)
    return NextResponse.json({ message: 'Fehler: ' + error.message, error: error.message }, { status: 500 })
  }
}
