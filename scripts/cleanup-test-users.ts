#!/usr/bin/env tsx
/**
 * Script zum Löschen aller Test-User (Nicht-Admin-User)
 *
 * WICHTIG: Diese Aktion ist irreversibel!
 * Nur ausführen, wenn du sicher bist, dass du alle Test-User löschen möchtest.
 *
 * Usage:
 *   tsx scripts/cleanup-test-users.ts
 *
 * Oder mit Bestätigung:
 *   tsx scripts/cleanup-test-users.ts --confirm
 */

import { prisma } from '../src/lib/prisma'

async function main() {
  const args = process.argv.slice(2)
  const confirm = args.includes('--confirm') || args.includes('-y')

  console.log('\n🧹 Helvenda Test-User Cleanup')
  console.log('=' .repeat(50))

  // Hole Statistiken
  const totalUsers = await prisma.user.count()
  const adminUsers = await prisma.user.count({ where: { isAdmin: true } })
  const nonAdminUsers = await prisma.user.count({ where: { isAdmin: false } })

  console.log('\n📊 Aktuelle Statistiken:')
  console.log(`   Gesamt User: ${totalUsers}`)
  console.log(`   Admin-User: ${adminUsers} (bleiben erhalten)`)
  console.log(`   Nicht-Admin-User: ${nonAdminUsers} (werden gelöscht)`)

  if (nonAdminUsers === 0) {
    console.log('\n✅ Keine Nicht-Admin-User gefunden. Nichts zu löschen.')
    process.exit(0)
  }

  // Hole Details der Nicht-Admin-User
  const nonAdminUsersList = await prisma.user.findMany({
    where: { isAdmin: false },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  console.log('\n👥 Nicht-Admin-User die gelöscht werden:')
  nonAdminUsersList.slice(0, 10).forEach((user, index) => {
    console.log(`   ${index + 1}. ${user.email} (${user.name || 'Kein Name'})`)
  })
  if (nonAdminUsersList.length > 10) {
    console.log(`   ... und ${nonAdminUsersList.length - 10} weitere`)
  }

  if (!confirm) {
    console.log('\n⚠️  WARNUNG: Diese Aktion ist irreversibel!')
    console.log('   Alle Nicht-Admin-User und deren Daten werden gelöscht.')
    console.log('   Admin-User bleiben erhalten.')
    console.log('\n   Um fortzufahren, führen Sie das Script mit --confirm aus:')
    console.log('   tsx scripts/cleanup-test-users.ts --confirm')
    process.exit(0)
  }

  console.log('\n🗑️  Starte Cleanup...')
  console.log('   (Dies kann einige Minuten dauern)')

  const stats = {
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

  const userIds = nonAdminUsersList.map(u => u.id)

  // Lösche jeden User in einer Transaktion
  for (let i = 0; i < userIds.length; i++) {
    const userId = userIds[i]
    const user = nonAdminUsersList[i]
    const progress = `[${i + 1}/${userIds.length}]`

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
        await tx.report.deleteMany({ where: { reportedById: userId } })
        await tx.userReport.deleteMany({
          where: { OR: [{ reportedById: userId }, { reportedUserId: userId }] },
        })
        await tx.adminNote.deleteMany({ where: { adminId: userId } })
        await tx.userAdminNote.deleteMany({
          where: { OR: [{ adminId: userId }, { userId }] },
        })
        await tx.moderationHistory.deleteMany({ where: { adminId: userId } })
        await tx.pricingHistory.deleteMany({ where: { userId } })
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

        process.stdout.write(`\r   ${progress} ${user.email} ✅`)
      })
    } catch (error: any) {
      stats.errors.push(`${user.email}: ${error.message}`)
      process.stdout.write(`\r   ${progress} ${user.email} ❌`)
      console.error(`\n      Fehler: ${error.message}`)
    }
  }

  console.log('\n\n✅ Cleanup abgeschlossen!')
  console.log('\n📊 Zusammenfassung:')
  console.log(`   Gelöschte User: ${stats.deletedUsers}/${userIds.length}`)
  console.log(`   Gelöschte Watches: ${stats.deletedWatches}`)
  console.log(`   Gelöschte Bids: ${stats.deletedBids}`)
  console.log(`   Gelöschte Purchases: ${stats.deletedPurchases}`)
  console.log(`   Gelöschte PriceOffers: ${stats.deletedPriceOffers}`)
  console.log(`   Gelöschte Messages: ${stats.deletedMessages}`)
  console.log(`   Gelöschte Notifications: ${stats.deletedNotifications}`)
  console.log(`   Gelöschte Invoices: ${stats.deletedInvoices}`)
  console.log(`   Gelöschte Sales: ${stats.deletedSales}`)
  console.log(`   Gelöschte Reviews: ${stats.deletedReviews}`)
  console.log(`   Gelöschte Favorites: ${stats.deletedFavorites}`)

  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Fehler (${stats.errors.length}):`)
    stats.errors.forEach(error => console.log(`   - ${error}`))
  }

  // Finale Statistiken
  const remainingUsers = await prisma.user.count()
  const remainingAdminUsers = await prisma.user.count({ where: { isAdmin: true } })

  console.log('\n🎯 Finale Statistiken:')
  console.log(`   Verbleibende User: ${remainingUsers}`)
  console.log(`   Admin-User: ${remainingAdminUsers}`)
  console.log('\n✨ Die Plattform ist jetzt bereit für den Launch!')
}

main()
  .catch(e => {
    console.error('\n❌ Fehler:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
