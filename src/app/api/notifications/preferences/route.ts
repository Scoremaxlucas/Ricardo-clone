import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

// Helper function to ensure notification preference columns exist
async function ensureNotificationColumnsExist() {
  try {
    // Check if columns exist by trying to query them
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        -- Add columns if they don't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'user_preferences' AND column_name = 'emailOnNewMessage'
        ) THEN
          ALTER TABLE "user_preferences" ADD COLUMN "emailOnNewMessage" BOOLEAN NOT NULL DEFAULT true;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'user_preferences' AND column_name = 'emailOnNewBid'
        ) THEN
          ALTER TABLE "user_preferences" ADD COLUMN "emailOnNewBid" BOOLEAN NOT NULL DEFAULT true;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'user_preferences' AND column_name = 'emailOnNewOffer'
        ) THEN
          ALTER TABLE "user_preferences" ADD COLUMN "emailOnNewOffer" BOOLEAN NOT NULL DEFAULT true;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'user_preferences' AND column_name = 'emailOnSaleCompleted'
        ) THEN
          ALTER TABLE "user_preferences" ADD COLUMN "emailOnSaleCompleted" BOOLEAN NOT NULL DEFAULT true;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'user_preferences' AND column_name = 'emailOnOutbid'
        ) THEN
          ALTER TABLE "user_preferences" ADD COLUMN "emailOnOutbid" BOOLEAN NOT NULL DEFAULT true;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'user_preferences' AND column_name = 'emailOnAuctionEnding'
        ) THEN
          ALTER TABLE "user_preferences" ADD COLUMN "emailOnAuctionEnding" BOOLEAN NOT NULL DEFAULT true;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'user_preferences' AND column_name = 'emailOnPurchase'
        ) THEN
          ALTER TABLE "user_preferences" ADD COLUMN "emailOnPurchase" BOOLEAN NOT NULL DEFAULT true;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'user_preferences' AND column_name = 'emailOnShipping'
        ) THEN
          ALTER TABLE "user_preferences" ADD COLUMN "emailOnShipping" BOOLEAN NOT NULL DEFAULT true;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'user_preferences' AND column_name = 'emailOnSearchMatch'
        ) THEN
          ALTER TABLE "user_preferences" ADD COLUMN "emailOnSearchMatch" BOOLEAN NOT NULL DEFAULT true;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'user_preferences' AND column_name = 'emailOnFavoritePriceChange'
        ) THEN
          ALTER TABLE "user_preferences" ADD COLUMN "emailOnFavoritePriceChange" BOOLEAN NOT NULL DEFAULT false;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'user_preferences' AND column_name = 'emailMarketing'
        ) THEN
          ALTER TABLE "user_preferences" ADD COLUMN "emailMarketing" BOOLEAN NOT NULL DEFAULT false;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'user_preferences' AND column_name = 'emailDigestFrequency'
        ) THEN
          ALTER TABLE "user_preferences" ADD COLUMN "emailDigestFrequency" TEXT NOT NULL DEFAULT 'instant';
        END IF;
      END $$;
    `)
  } catch (error: any) {
    // If it fails, log but don't throw - might already exist
    console.log('[notifications/preferences] Column check:', error.message)
  }
}

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

    // Ensure columns exist before querying
    await ensureNotificationColumnsExist()

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

    // Ensure columns exist before updating
    await ensureNotificationColumnsExist()

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
