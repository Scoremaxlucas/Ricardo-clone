import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/admin/users/cleanup-all-except-me
 *
 * DAUERHAFT DEAKTIVIERT - Dieser Endpoint war nur für den Launch-Cleanup gedacht.
 * Keine User-Löschungen mehr möglich.
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      message: 'Dieser Endpoint ist dauerhaft deaktiviert. User-Löschungen sind nicht mehr möglich.',
      disabled: true 
    },
    { status: 403 }
  )
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
      return NextResponse.json(
        { message: 'Nur Administratoren können diese Aktion ausführen' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { confirm } = body

    if (confirm !== true) {
      const allUsers = await prisma.user.findMany({
        select: { id: true, email: true, name: true, isAdmin: true },
      })
      const usersToDelete = allUsers.filter(u => u.id !== currentAdmin.id)

      return NextResponse.json(
        {
          message: 'Bestätigung erforderlich',
          warning: `Diese Aktion löscht ${usersToDelete.length} User (alle außer Ihnen: ${currentAdmin.email}). Setzen Sie confirm=true um fortzufahren.`,
          currentAdmin: { email: currentAdmin.email, id: currentAdmin.id },
          usersToDelete: usersToDelete.length,
        },
        { status: 400 }
      )
    }

    console.log(`[cleanup-all-except-me] Starte Cleanup durch Admin: ${currentAdmin.email}`)

    // Hole ALLE User außer dem aktuell eingeloggten Admin
    const usersToDelete = await prisma.user.findMany({
      where: {
        id: { not: currentAdmin.id },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    const userIds = usersToDelete.map(u => u.id)
    const stats = {
      currentAdmin: { email: currentAdmin.email, id: currentAdmin.id },
      totalUsersToDelete: usersToDelete.length,
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
        message: 'Keine User zum Löschen gefunden',
        stats,
      })
    }

    console.log(`[cleanup-all-except-me] Gefunden: ${userIds.length} User zum Löschen`)

    // Helper function to safely delete with error handling
    const safeDelete = async (tx: any, model: string, where: any, description: string) => {
      try {
        const result = await (tx as any)[model].deleteMany({ where })
        return result.count || 0
      } catch (error: any) {
        // Ignore errors for missing tables/models
        if (error.message?.includes('does not exist') || error.message?.includes('Unknown model')) {
          return 0
        }
        throw error
      }
    }

    // Lösche alle abhängigen Daten - verwende einzelne Transaktionen pro User
    for (const userId of userIds) {
      const userEmail = usersToDelete.find(u => u.id === userId)?.email || 'unknown'

      try {
        // Verwende eine große Transaktion, aber fange Fehler ab
        await prisma.$transaction(async (tx) => {
          // 1. Finde alle Watches des Users
          const watches = await tx.watch.findMany({
            where: { sellerId: userId },
            select: { id: true },
          })
          const watchIds = watches.map(w => w.id)
          stats.deletedWatches += watchIds.length

          // 2. Lösche abhängige Daten der Watches (mit Fehlerbehandlung)
          if (watchIds.length > 0) {
            try { await tx.bid.deleteMany({ where: { watchId: { in: watchIds } } }) } catch {}
            try { await tx.favorite.deleteMany({ where: { watchId: { in: watchIds } } }) } catch {}
            try { await tx.priceOffer.deleteMany({ where: { watchId: { in: watchIds } } }) } catch {}
            try { await tx.purchase.deleteMany({ where: { watchId: { in: watchIds } } }) } catch {}
            try { await tx.sale.deleteMany({ where: { watchId: { in: watchIds } } }) } catch {}
            try { await tx.message.deleteMany({ where: { watchId: { in: watchIds } } }) } catch {}
            try { await tx.watchCategory.deleteMany({ where: { watchId: { in: watchIds } } }) } catch {}
            try { await tx.watchView.deleteMany({ where: { watchId: { in: watchIds } } }) } catch {}
            try { await tx.report.deleteMany({ where: { watchId: { in: watchIds } } }) } catch {}
            try { await tx.adminNote.deleteMany({ where: { watchId: { in: watchIds } } }) } catch {}
            try { await tx.moderationHistory.deleteMany({ where: { watchId: { in: watchIds } } }) } catch {}
            try { await tx.invoiceItem.deleteMany({ where: { watchId: { in: watchIds } } }) } catch {}
            try { await tx.collectionItem.deleteMany({ where: { watchId: { in: watchIds } } }) } catch {}
            try { await tx.auctionViewer.deleteMany({ where: { watchId: { in: watchIds } } }) } catch {}
            try { await tx.story.deleteMany({ where: { watchId: { in: watchIds } } }) } catch {}
            try { await tx.browsingHistory.deleteMany({ where: { watchId: { in: watchIds } } }) } catch {}
            try { await tx.aISearchResult.deleteMany({ where: { watchId: { in: watchIds } } }) } catch {}
            try { await tx.order.deleteMany({ where: { watchId: { in: watchIds } } }) } catch {}
            try { await tx.productStats.deleteMany({ where: { watchId: { in: watchIds } } }) } catch {}
          }

          // 3. Lösche Watches
          await tx.watch.deleteMany({ where: { sellerId: userId } })

          // 4. Lösche User-spezifische Daten (mit Fehlerbehandlung)
          try {
            const deletedBids = await tx.bid.deleteMany({ where: { userId } })
            stats.deletedBids += deletedBids.count
          } catch {}

          try {
            const deletedPurchases = await tx.purchase.deleteMany({ where: { buyerId: userId } })
            stats.deletedPurchases += deletedPurchases.count
          } catch {}

          try {
            const deletedPriceOffers = await tx.priceOffer.deleteMany({ where: { buyerId: userId } })
            stats.deletedPriceOffers += deletedPriceOffers.count
          } catch {}

          try {
            const deletedMessages = await tx.message.deleteMany({
              where: { OR: [{ senderId: userId }, { receiverId: userId }] },
            })
            stats.deletedMessages += deletedMessages.count
          } catch {}

          try {
            const deletedNotifications = await tx.notification.deleteMany({ where: { userId } })
            stats.deletedNotifications += deletedNotifications.count
          } catch {}

          try {
            const deletedInvoices = await tx.invoice.deleteMany({ where: { sellerId: userId } })
            stats.deletedInvoices += deletedInvoices.count
          } catch {}

          try {
            const deletedSales = await tx.sale.deleteMany({
              where: { OR: [{ sellerId: userId }, { buyerId: userId }] },
            })
            stats.deletedSales += deletedSales.count
          } catch {}

          try {
            const deletedReviews = await tx.review.deleteMany({
              where: { OR: [{ reviewerId: userId }, { reviewedUserId: userId }] },
            })
            stats.deletedReviews += deletedReviews.count
          } catch {}

          try {
            const deletedFavorites = await tx.favorite.deleteMany({ where: { userId } })
            stats.deletedFavorites += deletedFavorites.count
          } catch {}

          // Weitere User-spezifische Daten (alle mit try-catch)
          try { await tx.searchSubscription.deleteMany({ where: { userId } }) } catch {}
          try { await tx.maxBid.deleteMany({ where: { userId } }) } catch {}
          try { await tx.browsingHistory.deleteMany({ where: { userId } }) } catch {}
          try { await tx.aIConversation.deleteMany({ where: { userId } }) } catch {}
          try { await tx.aISearchResult.deleteMany({ where: { userId } }) } catch {}
          try { await tx.collection.deleteMany({ where: { userId } }) } catch {}
          try { await tx.userBadge.deleteMany({ where: { userId } }) } catch {}
          try { await tx.userStreak.deleteMany({ where: { userId } }) } catch {}
          try { await tx.reward.deleteMany({ where: { userId } }) } catch {}
          try { await tx.draft.deleteMany({ where: { userId } }) } catch {}
          try { await tx.userPreferences.deleteMany({ where: { userId } }) } catch {}
          try { await tx.userActivity.deleteMany({ where: { userId } }) } catch {}
          try { await tx.searchQuery.deleteMany({ where: { userId } }) } catch {}
          try { await tx.userAddress.deleteMany({ where: { userId } }) } catch {}
          try { await tx.session.deleteMany({ where: { userId } }) } catch {}
          try { await tx.account.deleteMany({ where: { userId } }) } catch {}
          try { await tx.report.deleteMany({ where: { reportedBy: userId } }) } catch {}
          try {
            await tx.userReport.deleteMany({
              where: { OR: [{ reportedBy: userId }, { reportedUserId: userId }] },
            })
          } catch {}
          try { await tx.adminNote.deleteMany({ where: { adminId: userId } }) } catch {}
          try {
            await tx.userAdminNote.deleteMany({
              where: { OR: [{ adminId: userId }, { userId }] },
            })
          } catch {}
          try { await tx.moderationHistory.deleteMany({ where: { adminId: userId } }) } catch {}
          try { await tx.pricingHistory.deleteMany({ where: { changedBy: userId } }) } catch {}
          try { await tx.payoutProfile.deleteMany({ where: { userId } }) } catch {}
          try {
            await tx.payoutChangeRequest.deleteMany({
              where: { OR: [{ userId }, { decidedBy: userId }] },
            })
          } catch {}
          try { await tx.payoutAuditLog.deleteMany({ where: { actorUserId: userId } }) } catch {}
          try { await tx.disputeComment.deleteMany({ where: { userId } }) } catch {}
          try {
            await tx.systemOutage.deleteMany({
              where: {
                OR: [
                  { createdBy: userId },
                  { resolvedBy: userId },
                  { extensionAppliedBy: userId },
                ],
              },
            })
          } catch {}

          // 5. Lösche User (das ist kritisch - muss funktionieren)
          await tx.user.delete({ where: { id: userId } })
          stats.deletedUsers++
        }, {
          timeout: 30000, // 30 Sekunden Timeout pro User
        })
      } catch (error: any) {
        stats.errors.push(`${userEmail}: ${error.message}`)
        console.error(`[cleanup-all-except-me] Fehler beim Löschen von ${userEmail}:`, error)
        // Versuche User trotzdem zu löschen (falls Transaktion fehlgeschlagen ist)
        try {
          await prisma.user.delete({ where: { id: userId } })
          stats.deletedUsers++
          console.log(`[cleanup-all-except-me] User ${userEmail} trotz Fehler gelöscht`)
        } catch (deleteError: any) {
          console.error(`[cleanup-all-except-me] Konnte User ${userEmail} nicht löschen:`, deleteError.message)
        }
      }
    }

    console.log(`[cleanup-all-except-me] Cleanup abgeschlossen: ${stats.deletedUsers}/${stats.totalUsersToDelete} User gelöscht`)

    return NextResponse.json({
      message: `Cleanup abgeschlossen: ${stats.deletedUsers} von ${stats.totalUsersToDelete} Usern gelöscht. Sie (${currentAdmin.email}) bleiben erhalten.`,
      stats,
      warning: stats.errors.length > 0
        ? `${stats.errors.length} Fehler aufgetreten. Siehe stats.errors für Details.`
        : undefined,
    })
  } catch (error: any) {
    console.error('[cleanup-all-except-me] Fehler:', error)
    return NextResponse.json(
      { message: 'Fehler beim Cleanup: ' + error.message },
      { status: 500 }
    )
  }
}
