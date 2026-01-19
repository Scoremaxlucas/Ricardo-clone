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
    const failedUsers: string[] = []

    for (const user of usersToDelete) {
      try {
        // Versuche zuerst mit Prisma (Cascade Delete)
        await prisma.user.delete({ where: { id: user.id } })
        deleted++
        console.log(`[cleanup-simple] Gelöscht: ${user.email}`)
      } catch (error: any) {
        console.error(`[cleanup-simple] Fehler bei ${user.email}:`, error.message)
        errors.push(`${user.email}: ${error.message}`)
        failedUsers.push(user.id)
        
        // Versuche manuell zu löschen mit Raw SQL (umgeht Constraints)
        try {
          console.log(`[cleanup-simple] Versuche Raw SQL Delete für ${user.email}...`)
          
          // Lösche alle abhängigen Daten manuell (sicher escaped)
          const userIdEscaped = user.id.replace(/'/g, "''")
          await prisma.$executeRawUnsafe(`
            DELETE FROM "bids" WHERE "userId" = '${userIdEscaped}';
            DELETE FROM "favorites" WHERE "userId" = '${userIdEscaped}';
            DELETE FROM "price_offers" WHERE "buyerId" = '${userIdEscaped}';
            DELETE FROM "purchases" WHERE "buyerId" = '${userIdEscaped}';
            DELETE FROM "messages" WHERE "senderId" = '${userIdEscaped}' OR "receiverId" = '${userIdEscaped}';
            DELETE FROM "notifications" WHERE "userId" = '${userIdEscaped}';
            DELETE FROM "invoices" WHERE "sellerId" = '${userIdEscaped}';
            DELETE FROM "sales" WHERE "sellerId" = '${userIdEscaped}' OR "buyerId" = '${userIdEscaped}';
            DELETE FROM "reviews" WHERE "reviewerId" = '${userIdEscaped}' OR "reviewedUserId" = '${userIdEscaped}';
            DELETE FROM "search_subscriptions" WHERE "userId" = '${userIdEscaped}';
            DELETE FROM "max_bids" WHERE "userId" = '${userIdEscaped}';
            DELETE FROM "browsing_history" WHERE "userId" = '${userIdEscaped}';
            DELETE FROM "ai_conversations" WHERE "userId" = '${userIdEscaped}';
            DELETE FROM "ai_search_results" WHERE "userId" = '${userIdEscaped}';
            DELETE FROM "collections" WHERE "userId" = '${userIdEscaped}';
            DELETE FROM "user_badges" WHERE "userId" = '${userIdEscaped}';
            DELETE FROM "user_streaks" WHERE "userId" = '${userIdEscaped}';
            DELETE FROM "rewards" WHERE "userId" = '${userIdEscaped}';
            DELETE FROM "drafts" WHERE "userId" = '${userIdEscaped}';
            DELETE FROM "user_preferences" WHERE "userId" = '${userIdEscaped}';
            DELETE FROM "user_activities" WHERE "userId" = '${userIdEscaped}';
            DELETE FROM "search_queries" WHERE "userId" = '${userIdEscaped}';
            DELETE FROM "user_addresses" WHERE "userId" = '${userIdEscaped}';
            DELETE FROM "sessions" WHERE "userId" = '${userIdEscaped}';
            DELETE FROM "accounts" WHERE "userId" = '${userIdEscaped}';
            DELETE FROM "reports" WHERE "reportedBy" = '${userIdEscaped}';
            DELETE FROM "user_reports" WHERE "reportedBy" = '${userIdEscaped}' OR "reportedUserId" = '${userIdEscaped}';
            DELETE FROM "admin_notes" WHERE "adminId" = '${userIdEscaped}';
            DELETE FROM "user_admin_notes" WHERE "adminId" = '${userIdEscaped}' OR "userId" = '${userIdEscaped}';
            DELETE FROM "moderation_history" WHERE "adminId" = '${userIdEscaped}';
            DELETE FROM "pricing_history" WHERE "changedBy" = '${userIdEscaped}';
            DELETE FROM "payout_profiles" WHERE "userId" = '${userIdEscaped}';
            DELETE FROM "payout_change_requests" WHERE "userId" = '${userIdEscaped}' OR "decidedBy" = '${userIdEscaped}';
            DELETE FROM "payout_audit_logs" WHERE "actorUserId" = '${userIdEscaped}';
            DELETE FROM "dispute_comments" WHERE "userId" = '${userIdEscaped}';
            DELETE FROM "system_outages" WHERE "createdBy" = '${userIdEscaped}' OR "resolvedBy" = '${userIdEscaped}' OR "extensionAppliedBy" = '${userIdEscaped}';
          `)
          
          // Lösche Watches und deren abhängige Daten
          const watches = await prisma.watch.findMany({
            where: { sellerId: user.id },
            select: { id: true },
          })
          
          if (watches.length > 0) {
            const watchIds = watches.map(w => w.id)
            // Verwende IN statt ANY für bessere Kompatibilität
            const watchIdsStr = watchIds.map(id => `'${id.replace(/'/g, "''")}'`).join(',')
            
            await prisma.$executeRawUnsafe(`
              DELETE FROM "bids" WHERE "watchId" IN (${watchIdsStr});
              DELETE FROM "favorites" WHERE "watchId" IN (${watchIdsStr});
              DELETE FROM "price_offers" WHERE "watchId" IN (${watchIdsStr});
              DELETE FROM "purchases" WHERE "watchId" IN (${watchIdsStr});
              DELETE FROM "sales" WHERE "watchId" IN (${watchIdsStr});
              DELETE FROM "messages" WHERE "watchId" IN (${watchIdsStr});
              DELETE FROM "watch_categories" WHERE "watchId" IN (${watchIdsStr});
              DELETE FROM "watch_views" WHERE "watchId" IN (${watchIdsStr});
              DELETE FROM "reports" WHERE "watchId" IN (${watchIdsStr});
              DELETE FROM "admin_notes" WHERE "watchId" IN (${watchIdsStr});
              DELETE FROM "moderation_history" WHERE "watchId" IN (${watchIdsStr});
              DELETE FROM "invoice_items" WHERE "watchId" IN (${watchIdsStr});
              DELETE FROM "collection_items" WHERE "watchId" IN (${watchIdsStr});
              DELETE FROM "auction_viewers" WHERE "watchId" IN (${watchIdsStr});
              DELETE FROM "stories" WHERE "watchId" IN (${watchIdsStr});
              DELETE FROM "browsing_history" WHERE "watchId" IN (${watchIdsStr});
              DELETE FROM "ai_search_results" WHERE "watchId" IN (${watchIdsStr});
              DELETE FROM "orders" WHERE "watchId" IN (${watchIdsStr});
              DELETE FROM "product_stats" WHERE "watchId" IN (${watchIdsStr});
              DELETE FROM "watches" WHERE "id" IN (${watchIdsStr});
            `)
          }
          
          // Jetzt lösche den User
          await prisma.user.delete({ where: { id: user.id } })
          deleted++
          console.log(`[cleanup-simple] ✅ ${user.email} mit Raw SQL gelöscht`)
        } catch (rawError: any) {
          console.error(`[cleanup-simple] ❌ Raw SQL Delete fehlgeschlagen für ${user.email}:`, rawError.message)
          failedUsers.push(user.id)
        }
      }
    }

    console.log(`[cleanup-simple] Fertig: ${deleted}/${usersToDelete.length} gelöscht`)

    let message = `✅ ${deleted} von ${usersToDelete.length} Usern gelöscht. Sie (${currentAdmin.email}) bleiben erhalten.`
    
    if (failedUsers.length > 0) {
      message += ` ⚠️ ${failedUsers.length} User konnten nicht gelöscht werden.`
    }

    return NextResponse.json({
      success: failedUsers.length === 0,
      message,
      deleted,
      total: usersToDelete.length,
      failed: failedUsers.length,
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
