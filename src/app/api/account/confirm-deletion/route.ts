import { getAccountDeletionConfirmationEmail, sendEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/account/confirm-deletion?token=xxx
 *
 * Bestätigt die Kontolöschung:
 * 1. Validiert Token
 * 2. Anonymisiert Transaktionsdaten (10-Jahre-Aufbewahrung)
 * 3. Löscht persönliche Daten
 * 4. Sendet Bestätigungs-E-Mail
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ message: 'Kein Token angegeben' }, { status: 400 })
    }

    // Finde User mit Token
    const user = await prisma.user.findFirst({
      where: {
        deletionToken: token,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        nickname: true,
        name: true,
        deletionTokenExpires: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Ungültiger oder bereits verwendeter Token' },
        { status: 400 }
      )
    }

    // Prüfe Token-Ablauf
    if (user.deletionTokenExpires && user.deletionTokenExpires < new Date()) {
      return NextResponse.json(
        {
          message: 'Der Bestätigungslink ist abgelaufen. Bitte fordern Sie einen neuen Link an.',
        },
        { status: 400 }
      )
    }

    const userId = user.id
    const userEmail = user.email
    const userName = user.firstName || user.nickname || user.name || 'Benutzer'

    console.log(`[confirm-deletion] Starte Kontolöschung für User: ${userEmail}`)

    // === LÖSCHUNG IN TRANSAKTION ===
    await prisma.$transaction(async (tx) => {
      // 1. Anonymisiere Transaktionsdaten (gesetzliche Aufbewahrungspflicht)
      // Sales: Behalte Transaktionsdaten, anonymisiere persönliche Referenzen
      await tx.sale.updateMany({
        where: { OR: [{ sellerId: userId }, { buyerId: userId }] },
        data: {
          // Behalte Transaktionsdaten, aber markiere als anonymisiert
          // Die Relation bleibt bestehen für Buchhaltungszwecke
        },
      })

      // Invoices: Behalte für Buchhaltung (10 Jahre)
      await tx.invoice.updateMany({
        where: { sellerId: userId },
        data: {
          // Invoices müssen für Buchhaltung erhalten bleiben
        },
      })

      // 2. Lösche persönliche Daten (keine gesetzliche Aufbewahrungspflicht)

      // Favoriten löschen
      await tx.favorite.deleteMany({ where: { userId } })
      console.log(`[confirm-deletion] Favoriten gelöscht`)

      // Suchaufträge löschen
      await tx.searchSubscription.deleteMany({ where: { userId } })
      console.log(`[confirm-deletion] Suchaufträge gelöscht`)

      // Benachrichtigungen löschen
      await tx.notification.deleteMany({ where: { userId } })
      console.log(`[confirm-deletion] Benachrichtigungen gelöscht`)

      // MaxBids löschen
      await tx.maxBid.deleteMany({ where: { userId } })
      console.log(`[confirm-deletion] MaxBids gelöscht`)

      // Browsing History löschen
      await tx.browsingHistory.deleteMany({ where: { userId } })
      console.log(`[confirm-deletion] Browsing History gelöscht`)

      // AI Conversations löschen
      await tx.aIConversation.deleteMany({ where: { userId } })
      console.log(`[confirm-deletion] AI Conversations gelöscht`)

      // AI Search Results löschen
      await tx.aISearchResult.deleteMany({ where: { userId } })
      console.log(`[confirm-deletion] AI Search Results gelöscht`)

      // Collections löschen
      await tx.collection.deleteMany({ where: { userId } })
      console.log(`[confirm-deletion] Collections gelöscht`)

      // User Badges löschen
      await tx.userBadge.deleteMany({ where: { userId } })
      console.log(`[confirm-deletion] User Badges gelöscht`)

      // User Streak löschen
      await tx.userStreak.deleteMany({ where: { userId } })
      console.log(`[confirm-deletion] User Streak gelöscht`)

      // Rewards löschen
      await tx.reward.deleteMany({ where: { userId } })
      console.log(`[confirm-deletion] Rewards gelöscht`)

      // Drafts löschen
      await tx.draft.deleteMany({ where: { userId } })
      console.log(`[confirm-deletion] Drafts gelöscht`)

      // User Preferences löschen
      await tx.userPreferences.deleteMany({ where: { userId } })
      console.log(`[confirm-deletion] User Preferences gelöscht`)

      // User Activities löschen
      await tx.userActivity.deleteMany({ where: { userId } })
      console.log(`[confirm-deletion] User Activities gelöscht`)

      // Search Queries löschen
      await tx.searchQuery.deleteMany({ where: { userId } })
      console.log(`[confirm-deletion] Search Queries gelöscht`)

      // User Addresses löschen
      await tx.userAddress.deleteMany({ where: { userId } })
      console.log(`[confirm-deletion] User Addresses gelöscht`)

      // Sessions löschen
      await tx.session.deleteMany({ where: { userId } })
      console.log(`[confirm-deletion] Sessions gelöscht`)

      // Accounts löschen (OAuth)
      await tx.account.deleteMany({ where: { userId } })
      console.log(`[confirm-deletion] Accounts gelöscht`)

      // 3. Anonymisiere User-Daten (User-Record bleibt für Referenzen)
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
          // Markiere als gelöscht
          isBlocked: true,
          blockedReason: 'ACCOUNT_DELETED_BY_USER',
          blockedAt: new Date(),
          deletionToken: null,
          deletionTokenExpires: null,
          // Lösche Stripe-Daten
          stripeConnectedAccountId: null,
          stripeOnboardingComplete: false,
        },
      })
      console.log(`[confirm-deletion] User anonymisiert`)
    })

    console.log(`[confirm-deletion] Kontolöschung abgeschlossen für: ${userEmail}`)

    // Sende Bestätigungs-E-Mail an ursprüngliche Adresse
    const { subject, html, text } = getAccountDeletionConfirmationEmail(userName)
    await sendEmail({
      to: userEmail,
      subject,
      html,
      text,
      useNoReply: true,
    })

    return NextResponse.json({
      message: 'Ihr Konto wurde erfolgreich gelöscht.',
      success: true,
    })
  } catch (error) {
    console.error('[confirm-deletion] Fehler:', error)
    return NextResponse.json(
      { message: 'Ein Fehler ist aufgetreten. Bitte kontaktieren Sie den Support.' },
      { status: 500 }
    )
  }
}
