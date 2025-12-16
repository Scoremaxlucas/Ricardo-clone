import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Default Pricing Settings
const DEFAULT_PRICING = {
  platformMarginRate: 0.1, // 10%
  protectionFeeRate: 0.02, // 2% Zahlungsschutz-Gebühr
  vatRate: 0.081, // 8.1% MwSt
  minimumCommission: 0,
  maximumCommission: 220, // Maximum CHF 220.- für Plattform-Gebühr
  listingFee: 0,
  transactionFee: 0,
}

/**
 * Lädt die aktuellen Pricing-Settings aus der Datenbank
 * Gibt die neuesten Settings zurück oder Defaults falls keine vorhanden
 */
async function getCurrentPricingSettings() {
  const latestPricing = await prisma.pricingHistory.findFirst({
    orderBy: { changedAt: 'desc' },
    select: {
      platformMarginRate: true,
      protectionFeeRate: true,
      vatRate: true,
      minimumCommission: true,
      maximumCommission: true,
      listingFee: true,
      transactionFee: true,
    },
  })

  if (latestPricing) {
    return {
      platformMarginRate: latestPricing.platformMarginRate ?? DEFAULT_PRICING.platformMarginRate,
      protectionFeeRate: latestPricing.protectionFeeRate ?? DEFAULT_PRICING.protectionFeeRate,
      vatRate: latestPricing.vatRate ?? DEFAULT_PRICING.vatRate,
      minimumCommission: latestPricing.minimumCommission ?? DEFAULT_PRICING.minimumCommission,
      maximumCommission: latestPricing.maximumCommission ?? DEFAULT_PRICING.maximumCommission,
      listingFee: latestPricing.listingFee ?? DEFAULT_PRICING.listingFee,
      transactionFee: latestPricing.transactionFee ?? DEFAULT_PRICING.transactionFee,
    }
  }

  return { ...DEFAULT_PRICING }
}

// Helper function to check admin status
async function checkAdmin(session: any): Promise<boolean> {
  if (!session?.user?.id && !session?.user?.email) {
    return false
  }

  let user = null
  if (session.user.id) {
    user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true, email: true },
    })
  }

  if (!user && session.user.email) {
    user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true, email: true },
    })
  }

  const isAdminInDb = user?.isAdmin === true

  return isAdminInDb
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!(await checkAdmin(session))) {
      return NextResponse.json(
        { message: 'Zugriff verweigert. Admin-Rechte erforderlich.' },
        { status: 403 }
      )
    }

    const currentSettings = await getCurrentPricingSettings()
    return NextResponse.json(currentSettings)
  } catch (error: any) {
    console.error('Error fetching pricing settings:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden der Pricing-Einstellungen', error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!(await checkAdmin(session))) {
      return NextResponse.json(
        { message: 'Zugriff verweigert. Admin-Rechte erforderlich.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      platformMarginRate,
      protectionFeeRate,
      vatRate,
      minimumCommission,
      maximumCommission,
      listingFee,
      transactionFee,
    } = body

    // Validierung
    if (platformMarginRate !== undefined) {
      if (
        typeof platformMarginRate !== 'number' ||
        platformMarginRate < 0 ||
        platformMarginRate > 1
      ) {
        return NextResponse.json(
          { message: 'Plattform-Marge muss zwischen 0 und 1 liegen (0 = 0%, 1 = 100%)' },
          { status: 400 }
        )
      }
    }

    if (protectionFeeRate !== undefined) {
      if (
        typeof protectionFeeRate !== 'number' ||
        protectionFeeRate < 0 ||
        protectionFeeRate > 1
      ) {
        return NextResponse.json(
          { message: 'Zahlungsschutz-Gebühr muss zwischen 0 und 1 liegen (0 = 0%, 1 = 100%)' },
          { status: 400 }
        )
      }
    }

    if (vatRate !== undefined) {
      if (typeof vatRate !== 'number' || vatRate < 0 || vatRate > 1) {
        return NextResponse.json(
          { message: 'MwSt-Satz muss zwischen 0 und 1 liegen (0 = 0%, 1 = 100%)' },
          { status: 400 }
        )
      }
    }

    if (
      minimumCommission !== undefined &&
      (typeof minimumCommission !== 'number' || minimumCommission < 0)
    ) {
      return NextResponse.json({ message: 'Minimale Kommission muss >= 0 sein' }, { status: 400 })
    }

    if (
      maximumCommission !== undefined &&
      (typeof maximumCommission !== 'number' || maximumCommission < 0)
    ) {
      return NextResponse.json(
        { message: 'Maximale Kommission (Kostendach) muss >= 0 sein' },
        { status: 400 }
      )
    }

    if (listingFee !== undefined && (typeof listingFee !== 'number' || listingFee < 0)) {
      return NextResponse.json({ message: 'Listing-Gebühr muss >= 0 sein' }, { status: 400 })
    }

    if (
      transactionFee !== undefined &&
      (typeof transactionFee !== 'number' || transactionFee < 0)
    ) {
      return NextResponse.json({ message: 'Transaktionsgebühr muss >= 0 sein' }, { status: 400 })
    }

    // Lade aktuelle Settings
    const currentSettings = await getCurrentPricingSettings()

    // Erstelle neue Settings mit Updates
    const newSettings = {
      platformMarginRate:
        platformMarginRate !== undefined ? platformMarginRate : currentSettings.platformMarginRate,
      protectionFeeRate:
        protectionFeeRate !== undefined ? protectionFeeRate : currentSettings.protectionFeeRate,
      vatRate: vatRate !== undefined ? vatRate : currentSettings.vatRate,
      minimumCommission:
        minimumCommission !== undefined ? minimumCommission : currentSettings.minimumCommission,
      maximumCommission:
        maximumCommission !== undefined ? maximumCommission : currentSettings.maximumCommission,
      listingFee: listingFee !== undefined ? listingFee : currentSettings.listingFee,
      transactionFee:
        transactionFee !== undefined ? transactionFee : currentSettings.transactionFee,
    }

    // Speichere in Datenbank (PricingHistory)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Benutzer-ID nicht gefunden' }, { status: 400 })
    }

    await prisma.pricingHistory.create({
      data: {
        platformMarginRate: newSettings.platformMarginRate,
        protectionFeeRate: newSettings.protectionFeeRate,
        vatRate: newSettings.vatRate,
        minimumCommission: newSettings.minimumCommission,
        maximumCommission: newSettings.maximumCommission,
        listingFee: newSettings.listingFee,
        transactionFee: newSettings.transactionFee,
        changedBy: session.user.id,
      },
    })

    return NextResponse.json({
      message: 'Pricing-Einstellungen erfolgreich gespeichert',
      settings: newSettings,
    })
  } catch (error: any) {
    console.error('Error updating pricing settings:', error)
    return NextResponse.json(
      { message: 'Fehler beim Speichern der Pricing-Einstellungen', error: error.message },
      { status: 500 }
    )
  }
}
