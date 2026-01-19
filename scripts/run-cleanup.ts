/**
 * Direct cleanup script - deletes all non-admin users
 * Run with: npx ts-node scripts/run-cleanup.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Starting cleanup of all non-admin users...\n')

  // Get all non-admin users
  const usersToDelete = await prisma.user.findMany({
    where: { isAdmin: false },
    select: { id: true, email: true, name: true },
  })

  console.log(`Found ${usersToDelete.length} non-admin users to delete:\n`)
  usersToDelete.forEach((u, i) => {
    console.log(`  ${i + 1}. ${u.email} (${u.name || 'No name'})`)
  })

  if (usersToDelete.length === 0) {
    console.log('\n✅ No non-admin users found. Database is already clean!')
    return
  }

  console.log('\n🔄 Deleting users and their data...\n')

  let deletedCount = 0

  for (const user of usersToDelete) {
    const userId = user.id
    console.log(`Deleting: ${user.email}...`)

    try {
      // Delete in correct order to respect foreign key constraints
      // First: Delete data that references watches
      const watches = await prisma.watch.findMany({
        where: { sellerId: userId },
        select: { id: true },
      })
      const watchIds = watches.map((w) => w.id)

      if (watchIds.length > 0) {
        // Delete watch-related data
        await prisma.bid.deleteMany({ where: { watchId: { in: watchIds } } })
        await prisma.favorite.deleteMany({ where: { watchId: { in: watchIds } } })
        await prisma.priceOffer.deleteMany({ where: { watchId: { in: watchIds } } })
        await prisma.purchase.deleteMany({ where: { watchId: { in: watchIds } } })
        await prisma.message.deleteMany({ where: { watchId: { in: watchIds } } })
        await prisma.watchCategory.deleteMany({ where: { watchId: { in: watchIds } } })
        await prisma.watchView.deleteMany({ where: { watchId: { in: watchIds } } })
        await prisma.report.deleteMany({ where: { watchId: { in: watchIds } } })
        await prisma.adminNote.deleteMany({ where: { watchId: { in: watchIds } } })
        await prisma.moderationHistory.deleteMany({ where: { watchId: { in: watchIds } } })
        await prisma.invoiceItem.deleteMany({ where: { watchId: { in: watchIds } } })
        await prisma.order.deleteMany({ where: { watchId: { in: watchIds } } })
        await prisma.collectionItem.deleteMany({ where: { watchId: { in: watchIds } } })
        await prisma.auctionViewer.deleteMany({ where: { watchId: { in: watchIds } } })
        await prisma.story.deleteMany({ where: { watchId: { in: watchIds } } })
        await prisma.browsingHistory.deleteMany({ where: { watchId: { in: watchIds } } })
        await prisma.aISearchResult.deleteMany({ where: { watchId: { in: watchIds } } })
        await prisma.productStats.deleteMany({ where: { watchId: { in: watchIds } } })
      }

      // Delete watches
      await prisma.watch.deleteMany({ where: { sellerId: userId } })

      // Delete user-specific data
      await prisma.bid.deleteMany({ where: { userId } })
      await prisma.favorite.deleteMany({ where: { userId } })
      await prisma.searchSubscription.deleteMany({ where: { userId } })
      await prisma.notification.deleteMany({ where: { userId } })
      await prisma.maxBid.deleteMany({ where: { userId } })
      await prisma.browsingHistory.deleteMany({ where: { userId } })
      await prisma.aIConversation.deleteMany({ where: { userId } })
      await prisma.aISearchResult.deleteMany({ where: { userId } })
      await prisma.collection.deleteMany({ where: { userId } })
      await prisma.userBadge.deleteMany({ where: { userId } })
      await prisma.userStreak.deleteMany({ where: { userId } })
      await prisma.reward.deleteMany({ where: { userId } })
      await prisma.draft.deleteMany({ where: { userId } })
      await prisma.userPreferences.deleteMany({ where: { userId } })
      await prisma.userActivity.deleteMany({ where: { userId } })
      await prisma.searchQuery.deleteMany({ where: { userId } })
      await prisma.userAddress.deleteMany({ where: { userId } })
      await prisma.session.deleteMany({ where: { userId } })
      await prisma.account.deleteMany({ where: { userId } })
      await prisma.report.deleteMany({ where: { reportedBy: userId } })
      await prisma.userReport.deleteMany({
        where: { OR: [{ reportedBy: userId }, { reportedUserId: userId }] },
      })
      await prisma.adminNote.deleteMany({ where: { adminId: userId } })
      await prisma.moderationHistory.deleteMany({ where: { adminId: userId } })
      await prisma.pricingHistory.deleteMany({ where: { changedBy: userId } })
      await prisma.payoutProfile.deleteMany({ where: { userId } })
      await prisma.payoutChangeRequest.deleteMany({
        where: { OR: [{ userId }, { decidedBy: userId }] },
      })
      await prisma.payoutAuditLog.deleteMany({ where: { actorUserId: userId } })
      await prisma.disputeComment.deleteMany({ where: { userId } })
      await prisma.systemOutage.deleteMany({
        where: {
          OR: [{ createdBy: userId }, { resolvedBy: userId }, { extensionAppliedBy: userId }],
        },
      })

      // Delete messages where user is sender or receiver
      await prisma.message.deleteMany({ where: { senderId: userId } })
      await prisma.message.deleteMany({ where: { receiverId: userId } })

      // Delete purchases where user is buyer
      await prisma.purchase.deleteMany({ where: { buyerId: userId } })

      // Delete price offers where user is buyer
      await prisma.priceOffer.deleteMany({ where: { buyerId: userId } })

      // Delete invoices where user is seller
      await prisma.invoice.deleteMany({ where: { sellerId: userId } })

      // Delete reviews
      await prisma.review.deleteMany({ where: { reviewerId: userId } })
      await prisma.review.deleteMany({ where: { reviewedUserId: userId } })

      // Finally, delete the user
      await prisma.user.delete({ where: { id: userId } })

      deletedCount++
      console.log(`  ✅ Deleted: ${user.email}`)
    } catch (error: any) {
      console.error(`  ❌ Error deleting ${user.email}: ${error.message}`)
    }
  }

  console.log(`\n✅ Cleanup complete! Deleted ${deletedCount} users.`)

  // Show remaining users
  const remainingUsers = await prisma.user.findMany({
    select: { id: true, email: true, name: true, isAdmin: true },
  })

  console.log(`\n📊 Remaining users (${remainingUsers.length}):`)
  remainingUsers.forEach((u) => {
    console.log(`  - ${u.email} (Admin: ${u.isAdmin})`)
  })
}

main()
  .catch((e) => {
    console.error('Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
