import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'
import { processPendingPayoutsForSeller } from '@/lib/release-funds'

/**
 * POST /api/stripe/connect/process-pending-payouts
 * Verarbeitet alle ausstehenden Auszahlungen für den aktuellen Verkäufer
 * Wird aufgerufen nachdem der Verkäufer das Onboarding abgeschlossen hat
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const userId = session.user.id

    // Prüfe ob User onboarding abgeschlossen hat
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        connectOnboardingStatus: true,
        stripeOnboardingComplete: true,
        payoutsEnabled: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    if (user.connectOnboardingStatus !== 'COMPLETE' || !user.stripeOnboardingComplete) {
      return NextResponse.json(
        {
          message:
            'Auszahlung nicht möglich. Bitte richten Sie zuerst Ihre Auszahlungsdaten ein.',
          needsOnboarding: true,
        },
        { status: 400 }
      )
    }

    // Verarbeite alle ausstehenden Auszahlungen
    const processedCount = await processPendingPayoutsForSeller(userId)

    return NextResponse.json({
      success: true,
      message:
        processedCount > 0
          ? `${processedCount} Auszahlung${processedCount > 1 ? 'en' : ''} erfolgreich verarbeitet`
          : 'Keine ausstehenden Auszahlungen',
      processedCount,
    })
  } catch (error: any) {
    console.error('[connect/process-pending-payouts] Fehler:', error)
    return NextResponse.json(
      {
        message: 'Fehler beim Verarbeiten der Auszahlungen',
        error: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/stripe/connect/process-pending-payouts
 * Holt die Anzahl der ausstehenden Auszahlungen
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const userId = session.user.id

    // Zähle ausstehende Auszahlungen
    const count = await prisma.order.count({
      where: {
        sellerId: userId,
        paymentStatus: 'release_pending_onboarding',
      },
    })

    // Berechne Gesamtbetrag
    const pendingOrders = await prisma.order.findMany({
      where: {
        sellerId: userId,
        paymentStatus: 'release_pending_onboarding',
      },
      select: {
        itemPrice: true,
        platformFee: true,
      },
    })

    const totalAmount = pendingOrders.reduce(
      (sum, order) => sum + (order.itemPrice - order.platformFee),
      0
    )

    return NextResponse.json({
      count,
      totalAmount,
      message:
        count > 0
          ? `${count} Auszahlung${count > 1 ? 'en' : ''} ausstehend (CHF ${totalAmount.toFixed(2)})`
          : 'Keine ausstehenden Auszahlungen',
    })
  } catch (error: any) {
    console.error('[connect/process-pending-payouts] Fehler:', error)
    return NextResponse.json(
      {
        message: 'Fehler beim Abrufen der ausstehenden Auszahlungen',
        error: error.message,
      },
      { status: 500 }
    )
  }
}
