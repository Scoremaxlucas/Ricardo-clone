import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe-server'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/stripe/connect/account-link
 * Erstellt einen Onboarding-Link für den Verkäufer
 * Helvenda-Wording: "Auszahlung einrichten"
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const userId = session.user.id

    // Lade User
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        stripeConnectedAccountId: true,
        connectOnboardingStatus: true,
        stripeOnboardingComplete: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Stelle sicher dass ein Account existiert
    let accountId = user.stripeConnectedAccountId

    if (!accountId) {
      // Erstelle Account automatisch
      console.log(`[connect/account-link] Erstelle Account für User ${userId}`)

      const account = await stripe.accounts.create({
        type: 'express',
        country: 'CH',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          userId: userId,
          platform: 'helvenda',
        },
      })

      accountId = account.id

      await prisma.user.update({
        where: { id: userId },
        data: {
          stripeConnectedAccountId: accountId,
          connectOnboardingStatus: 'INCOMPLETE',
          stripeOnboardingComplete: false,
          payoutsEnabled: false,
        },
      })

      console.log(`[connect/account-link] ✅ Account ${accountId} erstellt`)
    }

    // Bestimme URLs
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'

    // Lese optionalen return_to Parameter
    let returnTo = '/my-watches/account'
    try {
      const body = await request.json().catch(() => ({}))
      if (body.return_to) {
        returnTo = body.return_to
      }
    } catch {
      // Ignore parse errors
    }

    // Erstelle AccountLink für Onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/my-watches/account?payout_refresh=1`,
      return_url: `${baseUrl}${returnTo}?payout_return=1`,
      type: 'account_onboarding',
    })

    console.log(`[connect/account-link] ✅ Onboarding-Link erstellt für Account ${accountId}`)

    // Speichere Ablaufdatum (AccountLinks sind 15 Minuten gültig)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15)

    await prisma.user.update({
      where: { id: userId },
      data: {
        stripeOnboardingLinkExpiresAt: expiresAt,
      },
    })

    return NextResponse.json({
      success: true,
      url: accountLink.url,
      expiresAt: accountLink.expires_at,
    })
  } catch (error: any) {
    console.error('[connect/account-link] Fehler:', error)
    return NextResponse.json(
      {
        message: 'Fehler beim Erstellen des Einrichtungs-Links',
        error: error.message,
      },
      { status: 500 }
    )
  }
}
