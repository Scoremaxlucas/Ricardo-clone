import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Default Pricing Settings
const DEFAULT_PRICING = {
  platformMarginRate: 0.1, // 10%
  vatRate: 0.081, // 8.1% MwSt
  minimumCommission: 0,
  maximumCommission: 220, // Maximum CHF 220.- für Plattform-Gebühr
  listingFee: 0,
  transactionFee: 0
}

// In-Memory Store (später können wir das in eine Datenbank-Tabelle verschieben)
let pricingSettings: typeof DEFAULT_PRICING = { ...DEFAULT_PRICING }

// Helper function to check admin status
async function checkAdmin(session: any): Promise<boolean> {
  if (!session?.user?.id && !session?.user?.email) {
    return false
  }

  let user = null
  if (session.user.id) {
    user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true, email: true }
    })
  }

  if (!user && session.user.email) {
    user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true, email: true }
    })
  }

  const userEmail = session.user.email?.toLowerCase()
  const isAdminEmail = userEmail === 'admin@admin.ch'
  const isAdminInDb = user?.isAdmin === true || user?.isAdmin === 1

  return isAdminInDb || isAdminEmail
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

    return NextResponse.json(pricingSettings)
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
    const { platformMarginRate, vatRate, minimumCommission, maximumCommission, listingFee, transactionFee } = body

    // Validierung
    if (platformMarginRate !== undefined) {
      if (typeof platformMarginRate !== 'number' || platformMarginRate < 0 || platformMarginRate > 1) {
        return NextResponse.json(
          { message: 'Plattform-Marge muss zwischen 0 und 1 liegen (0 = 0%, 1 = 100%)' },
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

    if (minimumCommission !== undefined && (typeof minimumCommission !== 'number' || minimumCommission < 0)) {
      return NextResponse.json(
        { message: 'Minimale Kommission muss >= 0 sein' },
        { status: 400 }
      )
    }

    if (maximumCommission !== undefined && (typeof maximumCommission !== 'number' || maximumCommission < 0)) {
      return NextResponse.json(
        { message: 'Maximale Kommission (Kostendach) muss >= 0 sein' },
        { status: 400 }
      )
    }

    if (listingFee !== undefined && (typeof listingFee !== 'number' || listingFee < 0)) {
      return NextResponse.json(
        { message: 'Listing-Gebühr muss >= 0 sein' },
        { status: 400 }
      )
    }

    if (transactionFee !== undefined && (typeof transactionFee !== 'number' || transactionFee < 0)) {
      return NextResponse.json(
        { message: 'Transaktionsgebühr muss >= 0 sein' },
        { status: 400 }
      )
    }

    // Update settings
    if (platformMarginRate !== undefined) pricingSettings.platformMarginRate = platformMarginRate
    if (vatRate !== undefined) pricingSettings.vatRate = vatRate
    if (minimumCommission !== undefined) pricingSettings.minimumCommission = minimumCommission
    if (maximumCommission !== undefined) pricingSettings.maximumCommission = maximumCommission
    if (listingFee !== undefined) pricingSettings.listingFee = listingFee
    if (transactionFee !== undefined) pricingSettings.transactionFee = transactionFee

    // TODO: Später in Datenbank speichern

    return NextResponse.json({
      message: 'Pricing-Einstellungen erfolgreich gespeichert',
      settings: pricingSettings
    })
  } catch (error: any) {
    console.error('Error updating pricing settings:', error)
    return NextResponse.json(
      { message: 'Fehler beim Speichern der Pricing-Einstellungen', error: error.message },
      { status: 500 }
    )
  }
}



