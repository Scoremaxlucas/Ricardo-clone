import { NextRequest, NextResponse } from 'next/server'

/**
 * Test-Route um zu prüfen ob Stripe korrekt konfiguriert ist
 * 
 * GET /api/test-stripe
 * 
 * Prüft:
 * - Ob STRIPE_SECRET_KEY gesetzt ist
 * - Ob NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY gesetzt ist
 * - Ob die Keys gültig sind (durch einfachen API-Call)
 */
export async function GET(_request: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

    if (!stripeSecretKey || stripeSecretKey.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: 'STRIPE_SECRET_KEY ist nicht konfiguriert',
          message: 'Bitte fügen Sie STRIPE_SECRET_KEY zu den Vercel Environment Variables hinzu.',
          steps: [
            '1. Gehen Sie zu Vercel Dashboard → Settings → Environment Variables',
            '2. Fügen Sie STRIPE_SECRET_KEY hinzu (beginnt mit sk_test_ oder sk_live_)',
            '3. Redeploy das Projekt',
          ],
        },
        { status: 500 }
      )
    }

    if (!stripePublishableKey || stripePublishableKey.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ist nicht konfiguriert',
          message: 'Bitte fügen Sie NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY zu den Vercel Environment Variables hinzu.',
          steps: [
            '1. Gehen Sie zu Vercel Dashboard → Settings → Environment Variables',
            '2. Fügen Sie NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY hinzu (beginnt mit pk_test_ oder pk_live_)',
            '3. Redeploy das Projekt',
          ],
        },
        { status: 500 }
      )
    }

    // Prüfe Key-Format
    if (!stripeSecretKey.startsWith('sk_')) {
      return NextResponse.json(
        {
          success: false,
          error: 'STRIPE_SECRET_KEY hat ungültiges Format',
          message: 'Der Secret Key sollte mit "sk_test_" oder "sk_live_" beginnen.',
          keyPrefix: stripeSecretKey.substring(0, 10) + '...',
        },
        { status: 500 }
      )
    }

    if (!stripePublishableKey.startsWith('pk_')) {
      return NextResponse.json(
        {
          success: false,
          error: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY hat ungültiges Format',
          message: 'Der Publishable Key sollte mit "pk_test_" oder "pk_live_" beginnen.',
          keyPrefix: stripePublishableKey.substring(0, 10) + '...',
        },
        { status: 500 }
      )
    }

    // Teste Secret Key mit einem einfachen API-Call
    try {
      const Stripe = (await import('stripe')).default
      const stripe = new Stripe(stripeSecretKey.trim(), {
        apiVersion: '2023-10-16',
      })

      // Versuche einen einfachen API-Call (z.B. Balance abrufen)
      await stripe.balance.retrieve()

      // Erfolgreich!
      return NextResponse.json({
        success: true,
        message: 'Stripe ist korrekt konfiguriert und funktioniert!',
        secretKeyPrefix: stripeSecretKey.substring(0, 12) + '...',
        publishableKeyPrefix: stripePublishableKey.substring(0, 12) + '...',
        secretKeyLength: stripeSecretKey.length,
        publishableKeyLength: stripePublishableKey.length,
        isTestMode: stripeSecretKey.startsWith('sk_test_'),
        timestamp: new Date().toISOString(),
        features: [
          '✅ Kreditkartenzahlungen',
          '✅ TWINT-Zahlungen',
          '✅ Zahlungsformulare',
          '✅ Rechnungszahlungen',
        ],
      })
    } catch (apiError: any) {
      return NextResponse.json(
        {
          success: false,
          error: 'Stripe API Key ist ungültig oder hat keine Berechtigung',
          message: 'Der API Key konnte nicht validiert werden.',
          errorDetails: apiError.message || 'Unbekannter Fehler',
          steps: [
            '1. Prüfen Sie Ihre Stripe API Keys: https://dashboard.stripe.com/test/apikeys',
            '2. Stellen Sie sicher, dass Sie die richtigen Keys verwenden (Test vs. Live)',
            '3. Prüfen Sie, ob Ihr Stripe Account aktiv ist',
            '4. Erstellen Sie neue API Keys falls nötig',
          ],
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[test-stripe] Fehler:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Interner Serverfehler',
        message: error.message || 'Unbekannter Fehler',
      },
      { status: 500 }
    )
  }
}

