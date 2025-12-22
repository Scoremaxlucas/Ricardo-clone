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
    // Prüfe Stripe Konfiguration
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[connect/account-link] STRIPE_SECRET_KEY fehlt!')
      return NextResponse.json(
        {
          message: 'Stripe ist nicht konfiguriert',
          error: 'STRIPE_SECRET_KEY environment variable fehlt',
        },
        { status: 500 }
      )
    }

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const userId = session.user.id
    console.log(`[connect/account-link] Request von User ${userId}`)

    // Lade User
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ message: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Extrahiere Felder (können undefined sein wenn Migration noch nicht ausgeführt wurde)
    const connectOnboardingStatus = (user as any).connectOnboardingStatus as string | undefined
    const payoutsEnabled = (user as any).payoutsEnabled as boolean | undefined

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

      // Update mit Fallback für fehlende Felder
      const createData: any = {
        stripeConnectedAccountId: accountId,
        stripeOnboardingComplete: false,
      }

      // Nur hinzufügen wenn Felder existieren
      if (connectOnboardingStatus !== undefined) {
        createData.connectOnboardingStatus = 'INCOMPLETE'
      }
      if (payoutsEnabled !== undefined) {
        createData.payoutsEnabled = false
      }

      await prisma.user.update({
        where: { id: userId },
        data: createData,
      })

      console.log(`[connect/account-link] ✅ Account ${accountId} erstellt`)
    }

    // Bestimme URLs
    let baseUrl = process.env.NEXTAUTH_URL || ''

    // Fallback: Verwende VERCEL_URL mit Protokoll
    if (!baseUrl && process.env.VERCEL_URL) {
      // VERCEL_URL enthält kein Protokoll
      baseUrl = `https://${process.env.VERCEL_URL}`
    }

    // Fallback: Konstruiere aus Request URL
    if (!baseUrl) {
      const url = new URL(request.url)
      baseUrl = `${url.protocol}//${url.host}`
    }

    // Letzter Fallback: localhost
    if (!baseUrl || baseUrl === 'http://undefined' || baseUrl === 'https://undefined') {
      baseUrl = 'http://localhost:3000'
    }

    console.log(`[connect/account-link] Environment check:`, {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not set',
      VERCEL_URL: process.env.VERCEL_URL || 'not set',
      computedBaseUrl: baseUrl,
    })

    // Lese optionalen return_to Parameter
    let returnTo = '/my-watches/account'
    try {
      const contentType = request.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        const body = await request.json()
        if (body && typeof body === 'object' && body.return_to) {
          returnTo = body.return_to
        }
      }
    } catch (error: any) {
      // Ignore parse errors - use default returnTo
      console.log(
        '[connect/account-link] Could not parse body, using default returnTo:',
        error.message
      )
    }

    // Validiere dass Account ID existiert
    if (!accountId) {
      throw new Error('Stripe Connected Account ID fehlt')
    }

    // Erstelle AccountLink für Onboarding
    const refreshUrl = `${baseUrl}/my-watches/account?payout_refresh=1`
    const returnUrl = `${baseUrl}${returnTo}?payout_return=1`

    console.log(`[connect/account-link] Creating account link for ${accountId}`)
    console.log(`[connect/account-link] refresh_url: ${refreshUrl}`)
    console.log(`[connect/account-link] return_url: ${returnUrl}`)

    let accountLink
    try {
      accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      })
    } catch (stripeError: any) {
      console.error('[connect/account-link] Stripe API Error:', stripeError)
      console.error('[connect/account-link] Stripe Error Details:', {
        type: stripeError.type,
        code: stripeError.code,
        message: stripeError.message,
        param: stripeError.param,
        decline_code: stripeError.decline_code,
      })
      throw new Error(
        `Stripe Fehler: ${stripeError.message || 'Unbekannter Fehler beim Erstellen des Onboarding-Links'}`
      )
    }

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
    console.error('[connect/account-link] Error stack:', error.stack)
    console.error('[connect/account-link] Error details:', {
      message: error.message,
      code: error.code,
      type: error.type,
      name: error.name,
    })

    // Detaillierte Fehlerantwort für Debugging
    const errorResponse: any = {
      message: 'Fehler beim Erstellen des Einrichtungs-Links',
      error: error.message || 'Unbekannter Fehler',
    }

    // Füge mehr Details hinzu für Debugging (ohne sensible Daten)
    if (error.type) {
      errorResponse.errorType = error.type
    }
    if (error.code) {
      errorResponse.errorCode = error.code
    }
    if (error.param) {
      errorResponse.param = error.param
    }

    // Stack nur in Development oder wenn explizit gewünscht
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_ERRORS === 'true') {
      errorResponse.stack = error.stack
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}
