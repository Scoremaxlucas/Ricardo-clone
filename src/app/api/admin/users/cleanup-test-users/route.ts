import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/admin/users/cleanup-test-users
 *
 * KRITISCH: Löscht ALLE Nicht-Admin-User und deren Daten
 *
 * Sicherheitsmaßnahmen:
 * - Nur für Admin-User
 * - Erfordert explizite Bestätigung (confirm=true)
 * - Admin-User werden NIEMALS gelöscht
 * - Gibt detaillierte Statistiken zurück
 *
 * WICHTIG: Diese Route sollte nur vor dem Launch verwendet werden!
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Prüfe Admin-Status
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true, email: true },
    })

    if (!adminUser?.isAdmin) {
      return NextResponse.json(
        { message: 'Nur Administratoren können diese Aktion ausführen' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { confirm } = body

    // Erfordere explizite Bestätigung
    if (confirm !== true) {
      return NextResponse.json(
        {
          message: 'Bestätigung erforderlich',
          warning: 'Diese Aktion löscht ALLE Nicht-Admin-User und deren Daten. Setzen Sie confirm=true um fortzufahren.',
          stats: await getStats(),
        },
        { status: 400 }
      )
    }

    console.log(`[cleanup-test-users] Starte Cleanup durch Admin: ${adminUser.email}`)

    // Hole alle Nicht-Admin-User
    const nonAdminUsers = await prisma.user.findMany({
      where: {
        isAdmin: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    const userIds = nonAdminUsers.map(u => u.id)
    const stats = {
      totalUsers: nonAdminUsers.length,
      deletedUsers: 0,
      deletedWatches: 0,
      deletedBids: 0,
      deletedPurchases: 0,
      deletedPriceOffers: 0,
      deletedMessages: 0,
      deletedNotifications: 0,
      deletedInvoices: 0,
      deletedSales: 0,
      deletedReviews: 0,
      deletedFavorites: 0,
      errors: [] as string[],
    }

    if (userIds.length === 0) {
      return NextResponse.json({
        message: 'Keine Nicht-Admin-User gefunden',
        stats,
      })
    }

    console.log(`[cleanup-test-users] Gefunden: ${userIds.length} Nicht-Admin-User`)

    // Lösche alle abhängigen Daten in Transaktionen
    for (const userId of userIds) {
      try {
        await prisma.$transaction(async (tx) => {
          // 1. Finde alle Watches des Users
          const watches = await tx.watch.findMany({
            where: { sellerId: userId },
            select: { id: true },
          })
          const watchIds = watches.map(w => w.id)
          stats.deletedWatches += watchIds.length

          // 2. Lösche abhängige Daten der Watches
          if (watchIds.length > 0) {
            await tx.bid.deleteMany({ where: { watchId: { in: watchIds } } })
            await tx.favorite.deleteMany({ where: { watchId: { in: watchIds } } })
            await tx.priceOffer.deleteMany({ where: { watchId: { in: watchIds } } })
            await tx.purchase.deleteMany({ where: { watchId: { in: watchIds } } })
            await tx.sale.deleteMany({ where: { watchId: { in: watchIds } } })
            await tx.message.deleteMany({ where: { watchId: { in: watchIds } } })
            await tx.watchCategory.deleteMany({ where: { watchId: { in: watchIds } } })
            await tx.watchView.deleteMany({ where: { watchId: { in: watchIds } } })
            await tx.report.deleteMany({ where: { watchId: { in: watchIds } } })
            await tx.adminNote.deleteMany({ where: { watchId: { in: watchIds } } })
            await tx.moderationHistory.deleteMany({ where: { watchId: { in: watchIds } } })
            await tx.invoiceItem.deleteMany({ where: { watchId: { in: watchIds } } })
            await tx.collectionItem.deleteMany({ where: { watchId: { in: watchIds } } })
            await tx.auctionViewer.deleteMany({ where: { watchId: { in: watchIds } } })
            await tx.story.deleteMany({ where: { watchId: { in: watchIds } } })
            await tx.browsingHistory.deleteMany({ where: { watchId: { in: watchIds } } })
            await tx.aISearchResult.deleteMany({ where: { watchId: { in: watchIds } } })
            await tx.order.deleteMany({ where: { watchId: { in: watchIds } } })
          }

          // 3. Lösche Watches
          await tx.watch.deleteMany({ where: { sellerId: userId } })

          // 4. Lösche User-spezifische Daten
          const deletedBids = await tx.bid.deleteMany({ where: { userId } })
          stats.deletedBids += deletedBids.count

          const deletedPurchases = await tx.purchase.deleteMany({ where: { buyerId: userId } })
          stats.deletedPurchases += deletedPurchases.count

          const deletedPriceOffers = await tx.priceOffer.deleteMany({ where: { buyerId: userId } })
          stats.deletedPriceOffers += deletedPriceOffers.count

          const deletedMessages = await tx.message.deleteMany({
            where: { OR: [{ senderId: userId }, { receiverId: userId }] },
          })
          stats.deletedMessages += deletedMessages.count

          const deletedNotifications = await tx.notification.deleteMany({ where: { userId } })
          stats.deletedNotifications += deletedNotifications.count

          const deletedInvoices = await tx.invoice.deleteMany({ where: { sellerId: userId } })
          stats.deletedInvoices += deletedInvoices.count

          const deletedSales = await tx.sale.deleteMany({
            where: { OR: [{ sellerId: userId }, { buyerId: userId }] },
          })
          stats.deletedSales += deletedSales.count

          const deletedReviews = await tx.review.deleteMany({
            where: { OR: [{ reviewerId: userId }, { reviewedUserId: userId }] },
          })
          stats.deletedReviews += deletedReviews.count

          const deletedFavorites = await tx.favorite.deleteMany({ where: { userId } })
          stats.deletedFavorites += deletedFavorites.count

          // Weitere User-spezifische Daten
          await tx.searchSubscription.deleteMany({ where: { userId } })
          await tx.maxBid.deleteMany({ where: { userId } })
          await tx.browsingHistory.deleteMany({ where: { userId } })
          await tx.aIConversation.deleteMany({ where: { userId } })
          await tx.aISearchResult.deleteMany({ where: { userId } })
          await tx.collection.deleteMany({ where: { userId } })
          await tx.userBadge.deleteMany({ where: { userId } })
          await tx.userStreak.deleteMany({ where: { userId } })
          await tx.reward.deleteMany({ where: { userId } })
          await tx.draft.deleteMany({ where: { userId } })
          await tx.userPreferences.deleteMany({ where: { userId } })
          await tx.userActivity.deleteMany({ where: { userId } })
          await tx.searchQuery.deleteMany({ where: { userId } })
          await tx.userAddress.deleteMany({ where: { userId } })
          await tx.session.deleteMany({ where: { userId } })
          await tx.account.deleteMany({ where: { userId } })
          await tx.report.deleteMany({ where: { reportedBy: userId } })
          await tx.userReport.deleteMany({
            where: { OR: [{ reportedBy: userId }, { reportedUserId: userId }] },
          })
          await tx.adminNote.deleteMany({ where: { adminId: userId } })
          await tx.userAdminNote.deleteMany({
            where: { OR: [{ adminId: userId }, { userId }] },
          })
          await tx.moderationHistory.deleteMany({ where: { adminId: userId } })
          await tx.pricingHistory.deleteMany({ where: { changedBy: userId } })
          await tx.payoutProfile.deleteMany({ where: { userId } })
          await tx.payoutChangeRequest.deleteMany({
            where: { OR: [{ userId }, { decidedBy: userId }] },
          })
          await tx.payoutAuditLog.deleteMany({ where: { actorId: userId } })
          await tx.disputeComment.deleteMany({ where: { userId } })
          await tx.systemOutage.deleteMany({
            where: {
              OR: [
                { createdById: userId },
                { resolvedById: userId },
                { extendedById: userId },
              ],
            },
          })

          // 5. Lösche User
          await tx.user.delete({ where: { id: userId } })
          stats.deletedUsers++
        })
      } catch (error: any) {
        const userEmail = nonAdminUsers.find(u => u.id === userId)?.email || 'unknown'
        stats.errors.push(`${userEmail}: ${error.message}`)
        console.error(`[cleanup-test-users] Fehler beim Löschen von ${userEmail}:`, error)
      }
    }

    console.log(`[cleanup-test-users] Cleanup abgeschlossen: ${stats.deletedUsers}/${stats.totalUsers} User gelöscht`)

    return NextResponse.json({
      message: `Cleanup abgeschlossen: ${stats.deletedUsers} von ${stats.totalUsers} Nicht-Admin-Usern gelöscht`,
      stats,
      warning: stats.errors.length > 0
        ? `${stats.errors.length} Fehler aufgetreten. Siehe stats.errors für Details.`
        : undefined,
    })
  } catch (error: any) {
    console.error('[cleanup-test-users] Fehler:', error)
    return NextResponse.json(
      { message: 'Fehler beim Cleanup: ' + error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/users/cleanup-test-users
 * Gibt Statistiken zurück ohne zu löschen
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!adminUser?.isAdmin) {
      return NextResponse.json(
        { message: 'Nur Administratoren können diese Aktion ausführen' },
        { status: 403 }
      )
    }

    const stats = await getStats()

    return NextResponse.json({
      message: 'Statistiken (keine Löschung durchgeführt)',
      stats,
      warning: 'Um tatsächlich zu löschen, senden Sie POST mit { confirm: true }',
    })
  } catch (error: any) {
    console.error('[cleanup-test-users] GET Fehler:', error)
    return NextResponse.json(
      { message: 'Fehler beim Abrufen der Statistiken: ' + error.message },
      { status: 500 }
    )
  }
}

async function getStats() {
  const totalUsers = await prisma.user.count()
  const adminUsers = await prisma.user.count({ where: { isAdmin: true } })
  const nonAdminUsers = await prisma.user.count({ where: { isAdmin: false } })
  const totalWatches = await prisma.watch.count()
  const totalBids = await prisma.bid.count()
  const totalPurchases = await prisma.purchase.count()

  return {
    totalUsers,
    adminUsers,
    nonAdminUsers,
    totalWatches,
    totalBids,
    totalPurchases,
    warning: `Es werden ${nonAdminUsers} Nicht-Admin-User gelöscht. Admin-User (${adminUsers}) bleiben erhalten.`,
  }
}
