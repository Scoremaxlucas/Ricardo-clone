import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

// Default notification preferences
const DEFAULT_PREFERENCES = {
  // Verkäufer
  emailOnNewMessage: true,
  emailOnNewBid: true,
  emailOnNewOffer: true,
  emailOnSaleCompleted: true,
  // Käufer
  emailOnOutbid: true,
  emailOnAuctionEnding: true,
  emailOnPurchase: true,
  emailOnShipping: true,
  // Suchabo
  emailOnSearchMatch: true,
  // Favoriten
  emailOnFavoritePriceChange: false,
  // Marketing
  emailMarketing: false,
  emailDigestFrequency: 'instant',
}

/**
 * GET /api/notifications/preferences
 * Holt die Benachrichtigungs-Einstellungen des aktuellen Nutzers
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Hole oder erstelle UserPreferences
    let preferences = await prisma.userPreferences.findUnique({
      where: { userId: session.user.id },
    })

    if (!preferences) {
      // Erstelle Default-Preferences
      preferences = await prisma.userPreferences.create({
        data: {
          userId: session.user.id,
          ...DEFAULT_PREFERENCES,
        },
      })
    }

    // Extrahiere nur Notification-relevante Felder
    const notificationPreferences = {
      emailOnNewMessage: preferences.emailOnNewMessage ?? DEFAULT_PREFERENCES.emailOnNewMessage,
      emailOnNewBid: preferences.emailOnNewBid ?? DEFAULT_PREFERENCES.emailOnNewBid,
      emailOnNewOffer: preferences.emailOnNewOffer ?? DEFAULT_PREFERENCES.emailOnNewOffer,
      emailOnSaleCompleted: preferences.emailOnSaleCompleted ?? DEFAULT_PREFERENCES.emailOnSaleCompleted,
      emailOnOutbid: preferences.emailOnOutbid ?? DEFAULT_PREFERENCES.emailOnOutbid,
      emailOnAuctionEnding: preferences.emailOnAuctionEnding ?? DEFAULT_PREFERENCES.emailOnAuctionEnding,
      emailOnPurchase: preferences.emailOnPurchase ?? DEFAULT_PREFERENCES.emailOnPurchase,
      emailOnShipping: preferences.emailOnShipping ?? DEFAULT_PREFERENCES.emailOnShipping,
      emailOnSearchMatch: preferences.emailOnSearchMatch ?? DEFAULT_PREFERENCES.emailOnSearchMatch,
      emailOnFavoritePriceChange: preferences.emailOnFavoritePriceChange ?? DEFAULT_PREFERENCES.emailOnFavoritePriceChange,
      emailMarketing: preferences.emailMarketing ?? DEFAULT_PREFERENCES.emailMarketing,
      emailDigestFrequency: preferences.emailDigestFrequency ?? DEFAULT_PREFERENCES.emailDigestFrequency,
    }

    return NextResponse.json({ preferences: notificationPreferences })
  } catch (error: any) {
    console.error('[notifications/preferences] GET error:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden der Einstellungen: ' + error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/notifications/preferences
 * Aktualisiert die Benachrichtigungs-Einstellungen des aktuellen Nutzers
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const data = await request.json()

    // Validiere emailDigestFrequency
    if (data.emailDigestFrequency && 
        !['instant', 'daily', 'weekly', 'none'].includes(data.emailDigestFrequency)) {
      return NextResponse.json(
        { message: 'Ungültige Digest-Frequenz' },
        { status: 400 }
      )
    }

    // Filtere nur erlaubte Felder
    const allowedFields = [
      'emailOnNewMessage',
      'emailOnNewBid',
      'emailOnNewOffer',
      'emailOnSaleCompleted',
      'emailOnOutbid',
      'emailOnAuctionEnding',
      'emailOnPurchase',
      'emailOnShipping',
      'emailOnSearchMatch',
      'emailOnFavoritePriceChange',
      'emailMarketing',
      'emailDigestFrequency',
    ]

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    }

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field]
      }
    }

    // Upsert: Erstelle falls nicht vorhanden, aktualisiere falls vorhanden
    const preferences = await prisma.userPreferences.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...DEFAULT_PREFERENCES,
        ...updateData,
      },
      update: updateData,
    })

    // Extrahiere nur Notification-relevante Felder für Response
    const notificationPreferences = {
      emailOnNewMessage: preferences.emailOnNewMessage,
      emailOnNewBid: preferences.emailOnNewBid,
      emailOnNewOffer: preferences.emailOnNewOffer,
      emailOnSaleCompleted: preferences.emailOnSaleCompleted,
      emailOnOutbid: preferences.emailOnOutbid,
      emailOnAuctionEnding: preferences.emailOnAuctionEnding,
      emailOnPurchase: preferences.emailOnPurchase,
      emailOnShipping: preferences.emailOnShipping,
      emailOnSearchMatch: preferences.emailOnSearchMatch,
      emailOnFavoritePriceChange: preferences.emailOnFavoritePriceChange,
      emailMarketing: preferences.emailMarketing,
      emailDigestFrequency: preferences.emailDigestFrequency,
    }

    return NextResponse.json({ 
      message: 'Einstellungen gespeichert',
      preferences: notificationPreferences 
    })
  } catch (error: any) {
    console.error('[notifications/preferences] PUT error:', error)
    return NextResponse.json(
      { message: 'Fehler beim Speichern der Einstellungen: ' + error.message },
      { status: 500 }
    )
  }
}
