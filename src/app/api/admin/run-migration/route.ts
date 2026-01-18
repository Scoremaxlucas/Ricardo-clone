import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'

/**
 * POST /api/admin/run-migration
 * Runs the missing Order columns migration
 * Only accessible by admins
 */
export async function POST(request: Request) {
  // Allow access via CRON_SECRET or admin session
  const url = new URL(request.url)
  const secret = url.searchParams.get('secret')

  if (secret === process.env.CRON_SECRET) {
    // Authorized via CRON_SECRET
    console.log('[run-migration] Authorized via CRON_SECRET')
  } else {
    // Check session
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    // Check if user is admin (add your admin emails here)
    const adminEmails = ['admin@helvenda.ch', 'lucas@helvenda.ch', 'a@a.ch']
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Nicht autorisiert - nur für Admins' }, { status: 403 })
    }
  }

  const results: string[] = []
  const errors: string[] = []

  // List of columns to add
  const columns = [
    // === Orders Table ===
    { name: 'orders.paymentMethod', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT' },
    { name: 'orders.paymentDeadline', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentDeadline" TIMESTAMP(3)' },
    { name: 'orders.paymentReminderSentAt', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentReminderSentAt" TIMESTAMP(3)' },
    { name: 'orders.paymentReminderCount', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentReminderCount" INTEGER NOT NULL DEFAULT 0' },
    { name: 'orders.paymentDeadlineMissed', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentDeadlineMissed" BOOLEAN NOT NULL DEFAULT false' },
    { name: 'orders.paymentDeadlineMissedAt', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentDeadlineMissedAt" TIMESTAMP(3)' },
    { name: 'orders.autoCancelledAt', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "autoCancelledAt" TIMESTAMP(3)' },
    { name: 'orders.autoCancelReason', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "autoCancelReason" TEXT' },
    { name: 'orders.contactDeadline', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "contactDeadline" TIMESTAMP(3)' },
    { name: 'orders.sellerContactedAt', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "sellerContactedAt" TIMESTAMP(3)' },
    { name: 'orders.buyerContactedAt', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "buyerContactedAt" TIMESTAMP(3)' },
    { name: 'orders.contactWarningSentAt', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "contactWarningSentAt" TIMESTAMP(3)' },
    { name: 'orders.selectedDeliveryMode', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "selectedDeliveryMode" TEXT' },
    { name: 'orders.selectedShippingCode', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "selectedShippingCode" TEXT' },
    { name: 'orders.selectedAddons', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "selectedAddons" TEXT' },
    { name: 'orders.shippingCostChfFinal', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shippingCostChfFinal" DOUBLE PRECISION NOT NULL DEFAULT 0' },
    { name: 'orders.shippingCostBreakdown', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shippingCostBreakdown" TEXT' },
    { name: 'orders.shippingRateSetId', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shippingRateSetId" TEXT DEFAULT \'default_ch_post\'' },
    { name: 'orders.invoiceId', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "invoiceId" TEXT' },
    { name: 'orders.invoiceCreatedAt', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "invoiceCreatedAt" TIMESTAMP(3)' },
    
    // === UserPreferences Table - Notification Settings ===
    // Verkäufer-Benachrichtigungen
    { name: 'prefs.emailOnNewMessage', sql: 'ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "emailOnNewMessage" BOOLEAN NOT NULL DEFAULT true' },
    { name: 'prefs.emailOnNewBid', sql: 'ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "emailOnNewBid" BOOLEAN NOT NULL DEFAULT true' },
    { name: 'prefs.emailOnNewOffer', sql: 'ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "emailOnNewOffer" BOOLEAN NOT NULL DEFAULT true' },
    { name: 'prefs.emailOnSaleCompleted', sql: 'ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "emailOnSaleCompleted" BOOLEAN NOT NULL DEFAULT true' },
    // Käufer-Benachrichtigungen
    { name: 'prefs.emailOnOutbid', sql: 'ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "emailOnOutbid" BOOLEAN NOT NULL DEFAULT true' },
    { name: 'prefs.emailOnAuctionEnding', sql: 'ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "emailOnAuctionEnding" BOOLEAN NOT NULL DEFAULT true' },
    { name: 'prefs.emailOnPurchase', sql: 'ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "emailOnPurchase" BOOLEAN NOT NULL DEFAULT true' },
    { name: 'prefs.emailOnShipping', sql: 'ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "emailOnShipping" BOOLEAN NOT NULL DEFAULT true' },
    // Suchabo & Favoriten
    { name: 'prefs.emailOnSearchMatch', sql: 'ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "emailOnSearchMatch" BOOLEAN NOT NULL DEFAULT true' },
    { name: 'prefs.emailOnFavoritePriceChange', sql: 'ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "emailOnFavoritePriceChange" BOOLEAN NOT NULL DEFAULT false' },
    // Marketing & Frequency
    { name: 'prefs.emailMarketing', sql: 'ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "emailMarketing" BOOLEAN NOT NULL DEFAULT false' },
    { name: 'prefs.emailDigestFrequency', sql: 'ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "emailDigestFrequency" TEXT NOT NULL DEFAULT \'instant\'' },
  ]

  for (const col of columns) {
    try {
      await prisma.$executeRawUnsafe(col.sql)
      results.push(`✅ ${col.name}: Added or already exists`)
    } catch (e: any) {
      // Check if column already exists
      if (e.message?.includes('already exists') || e.code === '42701') {
        results.push(`⏭️ ${col.name}: Already exists`)
      } else {
        errors.push(`❌ ${col.name}: ${e.message}`)
      }
    }
  }

  return NextResponse.json({
    success: errors.length === 0,
    results,
    errors,
    message: errors.length === 0
      ? 'Migration erfolgreich ausgeführt!'
      : 'Migration teilweise fehlgeschlagen - siehe errors',
  })
}

// Also allow GET for easy testing
export async function GET() {
  return NextResponse.json({
    message: 'Use POST to run the migration',
    warning: 'This endpoint runs database migrations - only for admins!',
  })
}
