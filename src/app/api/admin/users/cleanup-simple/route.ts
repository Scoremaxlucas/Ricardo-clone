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
          
          // Lösche alle abhängigen Daten manuell
          await prisma.$executeRawUnsafe(`
            DELETE FROM "bids" WHERE "userId" = $1;
            DELETE FROM "favorites" WHERE "userId" = $1;
            DELETE FROM "price_offers" WHERE "buyerId" = $1;
            DELETE FROM "purchases" WHERE "buyerId" = $1;
            DELETE FROM "messages" WHERE "senderId" = $1 OR "receiverId" = $1;
            DELETE FROM "notifications" WHERE "userId" = $1;
            DELETE FROM "invoices" WHERE "sellerId" = $1;
            DELETE FROM "sales" WHERE "sellerId" = $1 OR "buyerId" = $1;
            DELETE FROM "reviews" WHERE "reviewerId" = $1 OR "reviewedUserId" = $1;
            DELETE FROM "search_subscriptions" WHERE "userId" = $1;
            DELETE FROM "max_bids" WHERE "userId" = $1;
            DELETE FROM "browsing_history" WHERE "userId" = $1;
            DELETE FROM "ai_conversations" WHERE "userId" = $1;
            DELETE FROM "ai_search_results" WHERE "userId" = $1;
            DELETE FROM "collections" WHERE "userId" = $1;
            DELETE FROM "user_badges" WHERE "userId" = $1;
            DELETE FROM "user_streaks" WHERE "userId" = $1;
            DELETE FROM "rewards" WHERE "userId" = $1;
            DELETE FROM "drafts" WHERE "userId" = $1;
            DELETE FROM "user_preferences" WHERE "userId" = $1;
            DELETE FROM "user_activities" WHERE "userId" = $1;
            DELETE FROM "search_queries" WHERE "userId" = $1;
            DELETE FROM "user_addresses" WHERE "userId" = $1;
            DELETE FROM "sessions" WHERE "userId" = $1;
            DELETE FROM "accounts" WHERE "userId" = $1;
            DELETE FROM "reports" WHERE "reportedBy" = $1;
            DELETE FROM "user_reports" WHERE "reportedBy" = $1 OR "reportedUserId" = $1;
            DELETE FROM "admin_notes" WHERE "adminId" = $1;
            DELETE FROM "user_admin_notes" WHERE "adminId" = $1 OR "userId" = $1;
            DELETE FROM "moderation_history" WHERE "adminId" = $1;
            DELETE FROM "pricing_history" WHERE "changedBy" = $1;
            DELETE FROM "payout_profiles" WHERE "userId" = $1;
            DELETE FROM "payout_change_requests" WHERE "userId" = $1 OR "decidedBy" = $1;
            DELETE FROM "payout_audit_logs" WHERE "actorUserId" = $1;
            DELETE FROM "dispute_comments" WHERE "userId" = $1;
            DELETE FROM "system_outages" WHERE "createdBy" = $1 OR "resolvedBy" = $1 OR "extensionAppliedBy" = $1;
          `, user.id)
          
          // Lösche Watches und deren abhängige Daten
          const watches = await prisma.watch.findMany({
            where: { sellerId: user.id },
            select: { id: true },
          })
          
          if (watches.length > 0) {
            const watchIds = watches.map(w => w.id)
            await prisma.$executeRawUnsafe(`
              DELETE FROM "bids" WHERE "watchId" = ANY($1::text[]);
              DELETE FROM "favorites" WHERE "watchId" = ANY($1::text[]);
              DELETE FROM "price_offers" WHERE "watchId" = ANY($1::text[]);
              DELETE FROM "purchases" WHERE "watchId" = ANY($1::text[]);
              DELETE FROM "sales" WHERE "watchId" = ANY($1::text[]);
              DELETE FROM "messages" WHERE "watchId" = ANY($1::text[]);
              DELETE FROM "watch_categories" WHERE "watchId" = ANY($1::text[]);
              DELETE FROM "watch_views" WHERE "watchId" = ANY($1::text[]);
              DELETE FROM "reports" WHERE "watchId" = ANY($1::text[]);
              DELETE FROM "admin_notes" WHERE "watchId" = ANY($1::text[]);
              DELETE FROM "moderation_history" WHERE "watchId" = ANY($1::text[]);
              DELETE FROM "invoice_items" WHERE "watchId" = ANY($1::text[]);
              DELETE FROM "collection_items" WHERE "watchId" = ANY($1::text[]);
              DELETE FROM "auction_viewers" WHERE "watchId" = ANY($1::text[]);
              DELETE FROM "stories" WHERE "watchId" = ANY($1::text[]);
              DELETE FROM "browsing_history" WHERE "watchId" = ANY($1::text[]);
              DELETE FROM "ai_search_results" WHERE "watchId" = ANY($1::text[]);
              DELETE FROM "orders" WHERE "watchId" = ANY($1::text[]);
              DELETE FROM "product_stats" WHERE "watchId" = ANY($1::text[]);
              DELETE FROM "watches" WHERE "id" = ANY($1::text[]);
            `, watchIds)
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
