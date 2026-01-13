import { getAccountFinallyDeletedEmail, sendEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/cron/process-account-deletions
 *
 * Cronjob zur Verarbeitung von Kontolöschungen nach Wartefrist.
 * Sollte täglich ausgeführt werden (z.B. via Vercel Cron).
 *
 * 1. Findet alle Konten mit abgelaufener Wartefrist
 * 2. Führt die endgültige Löschung durch
 * 3. Sendet Bestätigungs-E-Mail
 */
export async function POST(request: NextRequest) {
  try {
    // Prüfe Cron-Secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.log('[process-account-deletions] Unauthorized cron request')
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    console.log(`[process-account-deletions] Start: ${now.toISOString()}`)

    // Finde alle Konten mit abgelaufener Wartefrist
    const usersToDelete = await prisma.user.findMany({
      where: {
        blockedReason: 'DELETION_SCHEDULED',
        deletionScheduledAt: {
          lte: now, // Löschdatum erreicht oder überschritten
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        nickname: true,
        name: true,
        deletionScheduledAt: true,
      },
    })

    console.log(`[process-account-deletions] ${usersToDelete.length} Konten zur Löschung`)

    let deletedCount = 0
    let errorCount = 0

    for (const user of usersToDelete) {
      try {
        const userName = user.firstName || user.nickname || user.name || 'Benutzer'
        const userEmail = user.email

        console.log(`[process-account-deletions] Lösche Konto: ${userEmail}`)

        // === LÖSCHUNG IN TRANSAKTION ===
        await prisma.$transaction(async (tx) => {
          const userId = user.id

          // 1. Lösche persönliche Daten (keine gesetzliche Aufbewahrungspflicht)

          // Favoriten löschen
          await tx.favorite.deleteMany({ where: { userId } })

          // Suchaufträge löschen
          await tx.searchSubscription.deleteMany({ where: { userId } })

          // Benachrichtigungen löschen
          await tx.notification.deleteMany({ where: { userId } })

          // MaxBids löschen
          await tx.maxBid.deleteMany({ where: { userId } })

          // Browsing History löschen
          await tx.browsingHistory.deleteMany({ where: { userId } })

          // AI Conversations löschen
          await tx.aIConversation.deleteMany({ where: { userId } })

          // AI Search Results löschen
          await tx.aISearchResult.deleteMany({ where: { userId } })

          // Collections löschen
          await tx.collection.deleteMany({ where: { userId } })

          // User Badges löschen
          await tx.userBadge.deleteMany({ where: { userId } })

          // User Streak löschen
          await tx.userStreak.deleteMany({ where: { userId } })

          // Rewards löschen
          await tx.reward.deleteMany({ where: { userId } })

          // Drafts löschen
          await tx.draft.deleteMany({ where: { userId } })

          // User Preferences löschen
          await tx.userPreferences.deleteMany({ where: { userId } })

          // User Activities löschen
          await tx.userActivity.deleteMany({ where: { userId } })

          // Search Queries löschen
          await tx.searchQuery.deleteMany({ where: { userId } })

          // User Addresses löschen
          await tx.userAddress.deleteMany({ where: { userId } })

          // Sessions löschen
          await tx.session.deleteMany({ where: { userId } })

          // Accounts löschen (OAuth)
          await tx.account.deleteMany({ where: { userId } })

          // 2. Anonymisiere User-Daten (User-Record bleibt für Referenzen)
          await tx.user.update({
            where: { id: userId },
            data: {
              email: `deleted-${userId}@helvenda.ch`,
              password: null,
              name: 'Gelöschter Benutzer',
              firstName: null,
              lastName: null,
              nickname: `deleted-${userId.slice(0, 8)}`,
              bio: null,
              phone: null,
              image: null,
              dateOfBirth: null,
              nationality: null,
              paymentMethods: null,
              idDocument: null,
              idDocumentPage1: null,
              idDocumentPage2: null,
              idDocumentType: null,
              companyName: null,
              // Markiere als endgültig gelöscht
              isBlocked: true,
              blockedReason: 'ACCOUNT_DELETED_BY_USER',
              blockedAt: new Date(),
              // Lösche Lösch-Daten
              deletionToken: null,
              deletionTokenExpires: null,
              deletionRequestedAt: null,
              deletionConfirmedAt: null,
              deletionScheduledAt: null,
              // Lösche Stripe-Daten
              stripeConnectedAccountId: null,
              stripeOnboardingComplete: false,
            },
          })
        })

        console.log(`[process-account-deletions] Konto gelöscht: ${userEmail}`)

        // Sende Bestätigungs-E-Mail an ursprüngliche Adresse
        const { subject, html, text } = getAccountFinallyDeletedEmail(userName)
        await sendEmail({
          to: userEmail,
          subject,
          html,
          text,
          useNoReply: true,
        })

        deletedCount++
      } catch (userError: any) {
        console.error(
          `[process-account-deletions] Fehler bei User ${user.email}:`,
          userError?.message
        )
        errorCount++
      }
    }

    console.log(
      `[process-account-deletions] Fertig: ${deletedCount} gelöscht, ${errorCount} Fehler`
    )

    return NextResponse.json({
      success: true,
      processed: usersToDelete.length,
      deleted: deletedCount,
      errors: errorCount,
      timestamp: now.toISOString(),
    })
  } catch (error: any) {
    console.error('[process-account-deletions] Fehler:', error)
    return NextResponse.json(
      { message: 'Ein Fehler ist aufgetreten', error: error?.message },
      { status: 500 }
    )
  }
}

// GET für manuelle Tests (nur in Development)
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'GET not allowed in production' }, { status: 405 })
  }
  return POST(request)
}
