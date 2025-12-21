import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe-server'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/stripe/connect/ensure-account
 * Erstellt einen Stripe Connected Account für den Verkäufer falls noch nicht vorhanden
 * Just-in-Time Onboarding: Account wird nur bei Bedarf erstellt
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
    })

    if (!user) {
      return NextResponse.json({ message: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Extrahiere Felder (können undefined sein wenn Migration noch nicht ausgeführt wurde)
    const connectOnboardingStatus = (user as any).connectOnboardingStatus as
      | string
      | undefined
    const payoutsEnabled = (user as any).payoutsEnabled as boolean | undefined

    // Falls bereits ein Account existiert, prüfe Status
    if (user.stripeConnectedAccountId) {
      // Hole aktuellen Status von Stripe
      try {
        const account = await stripe.accounts.retrieve(user.stripeConnectedAccountId)

        const isComplete =
          account.details_submitted === true &&
          account.charges_enabled === true &&
          account.payouts_enabled === true

        const status = isComplete ? 'COMPLETE' : 'INCOMPLETE'

        // Update lokalen Status (mit Fallback für fehlende Felder)
        const updateData: any = {
          stripeOnboardingComplete: isComplete,
        }

        // Nur hinzufügen wenn Felder existieren
        if (connectOnboardingStatus !== undefined) {
          updateData.connectOnboardingStatus = status
        }
        if (payoutsEnabled !== undefined) {
          updateData.payoutsEnabled = account.payouts_enabled === true
        }

        await prisma.user.update({
          where: { id: userId },
          data: updateData,
        })

        return NextResponse.json({
          success: true,
          accountId: user.stripeConnectedAccountId,
          status: status,
          payoutsEnabled: account.payouts_enabled === true,
          chargesEnabled: account.charges_enabled === true,
          detailsSubmitted: account.details_submitted === true,
          existing: true,
        })
      } catch (stripeError: any) {
        console.error('[connect/ensure-account] Fehler beim Abrufen des Stripe Accounts:', stripeError)
        // Account existiert möglicherweise nicht mehr, erstelle neuen
      }
    }

    // Erstelle neuen Stripe Express Account
    console.log(`[connect/ensure-account] Erstelle neuen Stripe Connected Account für User ${userId}`)

    const account = await stripe.accounts.create({
      type: 'express',
      country: 'CH',
      email: user.email || undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      individual: {
        first_name: user.firstName || undefined,
        last_name: user.lastName || undefined,
        email: user.email || undefined,
      },
      metadata: {
        userId: userId,
        platform: 'helvenda',
      },
    })

    console.log(`[connect/ensure-account] ✅ Stripe Account ${account.id} erstellt für User ${userId}`)

    // Speichere Account ID und setze Status auf INCOMPLETE (mit Fallback für fehlende Felder)
    const createData: any = {
      stripeConnectedAccountId: account.id,
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

    return NextResponse.json({
      success: true,
      accountId: account.id,
      status: 'INCOMPLETE',
      payoutsEnabled: false,
      chargesEnabled: false,
      detailsSubmitted: false,
      existing: false,
    })
  } catch (error: any) {
    console.error('[connect/ensure-account] Fehler:', error)
    console.error('[connect/ensure-account] Error stack:', error.stack)
    console.error('[connect/ensure-account] Error details:', {
      message: error.message,
      code: error.code,
      type: error.type,
    })
    return NextResponse.json(
      {
        message: 'Fehler beim Erstellen des Auszahlungskontos',
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/stripe/connect/ensure-account
 * Holt den aktuellen Onboarding-Status des Verkäufers
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const userId = session.user.id

    // Lade User
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ message: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Extrahiere Felder (können undefined sein wenn Migration noch nicht ausgeführt wurde)
    const connectOnboardingStatus = (user as any).connectOnboardingStatus as
      | string
      | undefined
    const payoutsEnabled = (user as any).payoutsEnabled as boolean | undefined

    // Falls kein Account, Status ist NOT_STARTED
    if (!user.stripeConnectedAccountId) {
      return NextResponse.json({
        hasAccount: false,
        status: 'NOT_STARTED',
        payoutsEnabled: false,
        onboardingComplete: false,
      })
    }

    // Hole aktuellen Status von Stripe
    try {
      const account = await stripe.accounts.retrieve(user.stripeConnectedAccountId)

      const isComplete =
        account.details_submitted === true &&
        account.charges_enabled === true &&
        account.payouts_enabled === true

      return NextResponse.json({
        hasAccount: true,
        accountId: user.stripeConnectedAccountId,
        status: isComplete ? 'COMPLETE' : 'INCOMPLETE',
        payoutsEnabled: account.payouts_enabled === true,
        chargesEnabled: account.charges_enabled === true,
        detailsSubmitted: account.details_submitted === true,
        onboardingComplete: isComplete,
      })
    } catch (stripeError: any) {
      console.error('[connect/ensure-account] Fehler beim Abrufen des Stripe Accounts:', stripeError)
      return NextResponse.json({
        hasAccount: false,
        status: 'NOT_STARTED',
        payoutsEnabled: false,
        onboardingComplete: false,
        error: 'Account nicht mehr gültig',
      })
    }
  } catch (error: any) {
    console.error('[connect/ensure-account] Fehler:', error)
    return NextResponse.json(
      {
        message: 'Fehler beim Abrufen des Auszahlungsstatus',
        error: error.message,
      },
      { status: 500 }
    )
  }
}
