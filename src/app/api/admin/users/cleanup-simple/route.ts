import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/admin/users/cleanup-simple
 *
 * Löscht ALLE User außer dem aktuellen Admin.
 * Nutzt Prisma Cascade Delete für abhängige Daten.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const currentAdmin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true, email: true, id: true },
    })

    if (!currentAdmin?.isAdmin) {
      return NextResponse.json({ message: 'Nur Administratoren' }, { status: 403 })
    }

    const body = await request.json()
    if (body.confirm !== true) {
      const count = await prisma.user.count({
        where: { id: { not: session.user.id } },
      })
      return NextResponse.json({
        message: `Bestätigung erforderlich. ${count} User werden gelöscht.`,
        warning: 'Setzen Sie confirm=true',
        usersToDelete: count,
      }, { status: 400 })
    }

    console.log(`[cleanup-simple] Admin ${currentAdmin.email} startet Cleanup`)

    // Hole alle User außer dem aktuellen Admin
    const usersToDelete = await prisma.user.findMany({
      where: { id: { not: session.user.id } },
      select: { id: true, email: true },
    })

    let deleted = 0
    const errors: string[] = []
    const failedUsers: Array<{ id: string; email: string; error: string }> = []

    for (const user of usersToDelete) {
      try {
        // Versuche zuerst mit Prisma (Cascade Delete)
        await prisma.user.delete({ where: { id: user.id } })
        deleted++
        console.log(`[cleanup-simple] ✅ Gelöscht: ${user.email}`)
      } catch (error: any) {
        const errorMsg = error.message || String(error)
        console.error(`[cleanup-simple] ⚠️ Prisma Delete fehlgeschlagen bei ${user.email}:`, errorMsg)

        // Versuche manuell zu löschen mit Raw SQL (umgeht Constraints)
        try {
          console.log(`[cleanup-simple] 🔄 Versuche Raw SQL Delete für ${user.email}...`)

          // Lösche Watches ZUERST (können Constraints verursachen)
          const watches = await prisma.watch.findMany({
            where: { sellerId: user.id },
            select: { id: true },
          })

          if (watches.length > 0) {
            console.log(`[cleanup-simple]   Lösche ${watches.length} Watches...`)
            const watchIds = watches.map(w => w.id)

            // Lösche watch-abhängige Daten einzeln (robuster)
            for (const watchId of watchIds) {
              try {
                await prisma.bid.deleteMany({ where: { watchId } })
                await prisma.favorite.deleteMany({ where: { watchId } })
                await prisma.priceOffer.deleteMany({ where: { watchId } })
                await prisma.purchase.deleteMany({ where: { watchId } })
                await prisma.message.deleteMany({ where: { watchId } })
                await prisma.watchCategory.deleteMany({ where: { watchId } })
                await prisma.watchView.deleteMany({ where: { watchId } })
                await prisma.report.deleteMany({ where: { watchId } })
                await prisma.adminNote.deleteMany({ where: { watchId } })
                await prisma.moderationHistory.deleteMany({ where: { watchId } })
                await prisma.invoiceItem.deleteMany({ where: { watchId } })
                await prisma.collectionItem.deleteMany({ where: { watchId } })
                await prisma.auctionViewer.deleteMany({ where: { watchId } })
                await prisma.story.deleteMany({ where: { watchId } })
                await prisma.browsingHistory.deleteMany({ where: { watchId } })
                await prisma.aISearchResult.deleteMany({ where: { watchId } })
                await prisma.order.deleteMany({ where: { watchId } })
                await prisma.productStats.deleteMany({ where: { watchId } })
              } catch (e: any) {
                // Ignoriere Fehler für einzelne Watch-Deletes
                console.log(`[cleanup-simple]   Warnung bei Watch ${watchId}: ${e.message}`)
              }
            }

            // Lösche Watches
            await prisma.watch.deleteMany({ where: { sellerId: user.id } })
          }

          // Lösche User-spezifische Daten
          console.log(`[cleanup-simple]   Lösche User-Daten für ${user.email}...`)
          await prisma.bid.deleteMany({ where: { userId: user.id } }).catch(() => {})
          await prisma.favorite.deleteMany({ where: { userId: user.id } }).catch(() => {})
          await prisma.priceOffer.deleteMany({ where: { buyerId: user.id } }).catch(() => {})
          await prisma.purchase.deleteMany({ where: { buyerId: user.id } }).catch(() => {})
          await prisma.message.deleteMany({ where: { OR: [{ senderId: user.id }, { receiverId: user.id }] } }).catch(() => {})
          await prisma.notification.deleteMany({ where: { userId: user.id } }).catch(() => {})
          await prisma.invoice.deleteMany({ where: { sellerId: user.id } }).catch(() => {})
          await prisma.sale.deleteMany({ where: { OR: [{ sellerId: user.id }, { buyerId: user.id }] } }).catch(() => {})
          await prisma.review.deleteMany({ where: { OR: [{ reviewerId: user.id }, { reviewedUserId: user.id }] } }).catch(() => {})
          await prisma.searchSubscription.deleteMany({ where: { userId: user.id } }).catch(() => {})
          await prisma.maxBid.deleteMany({ where: { userId: user.id } }).catch(() => {})
          await prisma.browsingHistory.deleteMany({ where: { userId: user.id } }).catch(() => {})
          await prisma.aIConversation.deleteMany({ where: { userId: user.id } }).catch(() => {})
          await prisma.aISearchResult.deleteMany({ where: { userId: user.id } }).catch(() => {})
          await prisma.collection.deleteMany({ where: { userId: user.id } }).catch(() => {})
          await prisma.userBadge.deleteMany({ where: { userId: user.id } }).catch(() => {})
          await prisma.userStreak.deleteMany({ where: { userId: user.id } }).catch(() => {})
          await prisma.reward.deleteMany({ where: { userId: user.id } }).catch(() => {})
          await prisma.draft.deleteMany({ where: { userId: user.id } }).catch(() => {})
          await prisma.userPreferences.deleteMany({ where: { userId: user.id } }).catch(() => {})
          await prisma.userActivity.deleteMany({ where: { userId: user.id } }).catch(() => {})
          await prisma.searchQuery.deleteMany({ where: { userId: user.id } }).catch(() => {})
          await prisma.userAddress.deleteMany({ where: { userId: user.id } }).catch(() => {})
          await prisma.session.deleteMany({ where: { userId: user.id } }).catch(() => {})
          await prisma.account.deleteMany({ where: { userId: user.id } }).catch(() => {})
          await prisma.report.deleteMany({ where: { reportedBy: user.id } }).catch(() => {})
          await prisma.userReport.deleteMany({ where: { OR: [{ reportedBy: user.id }, { reportedUserId: user.id }] } }).catch(() => {})
          await prisma.adminNote.deleteMany({ where: { adminId: user.id } }).catch(() => {})
          await prisma.userAdminNote.deleteMany({ where: { OR: [{ adminId: user.id }, { userId: user.id }] } }).catch(() => {})
          await prisma.moderationHistory.deleteMany({ where: { adminId: user.id } }).catch(() => {})
          await prisma.pricingHistory.deleteMany({ where: { changedBy: user.id } }).catch(() => {})
          await prisma.payoutProfile.deleteMany({ where: { userId: user.id } }).catch(() => {})
          await prisma.payoutChangeRequest.deleteMany({ where: { OR: [{ userId: user.id }, { decidedBy: user.id }] } }).catch(() => {})
          await prisma.payoutAuditLog.deleteMany({ where: { actorUserId: user.id } }).catch(() => {})
          await prisma.disputeComment.deleteMany({ where: { userId: user.id } }).catch(() => {})
          await prisma.systemOutage.deleteMany({ where: { OR: [{ createdBy: user.id }, { resolvedBy: user.id }, { extensionAppliedBy: user.id }] } }).catch(() => {})

          // Jetzt lösche den User
          await prisma.user.delete({ where: { id: user.id } })
          deleted++
          console.log(`[cleanup-simple] ✅ ${user.email} mit manuellem Delete gelöscht`)
        } catch (rawError: any) {
          const rawErrorMsg = rawError.message || String(rawError)
          console.error(`[cleanup-simple] ❌ Alle Delete-Versuche fehlgeschlagen für ${user.email}:`, rawErrorMsg)
          failedUsers.push({ id: user.id, email: user.email, error: rawErrorMsg })
          errors.push(`${user.email}: ${rawErrorMsg}`)
        }
      }
    }

    console.log(`[cleanup-simple] Fertig: ${deleted}/${usersToDelete.length} gelöscht`)

    let message = `✅ ${deleted} von ${usersToDelete.length} Usern gelöscht. Sie (${currentAdmin.email}) bleiben erhalten.`

    if (failedUsers.length > 0) {
      message += ` ⚠️ ${failedUsers.length} User konnten nicht gelöscht werden.`
      console.error(`[cleanup-simple] Fehlgeschlagene User:`, failedUsers)
    }

    return NextResponse.json({
      success: failedUsers.length === 0,
      message,
      deleted,
      total: usersToDelete.length,
      failed: failedUsers.length,
      failedUsers: failedUsers.length > 0 ? failedUsers.map(u => ({ email: u.email, error: u.error })) : undefined,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('[cleanup-simple] Fehler:', error)
    return NextResponse.json(
      { message: 'Fehler: ' + error.message },
      { status: 500 }
    )
  }
}
