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
  // Allow access via CRON_SECRET, temporary migration key, or admin session
  const url = new URL(request.url)
  const secret = url.searchParams.get('secret')
  
  // Temporary migration key - REMOVE AFTER MIGRATION
  const TEMP_MIGRATION_KEY = 'helvenda-migrate-2026-01-17'
  
  if (secret === process.env.CRON_SECRET || secret === TEMP_MIGRATION_KEY) {
    // Authorized via secret
    console.log('[run-migration] Authorized via secret key')
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
    { name: 'paymentMethod', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT' },
    { name: 'paymentDeadline', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentDeadline" TIMESTAMP(3)' },
    { name: 'paymentReminderSentAt', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentReminderSentAt" TIMESTAMP(3)' },
    { name: 'paymentReminderCount', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentReminderCount" INTEGER NOT NULL DEFAULT 0' },
    { name: 'paymentDeadlineMissed', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentDeadlineMissed" BOOLEAN NOT NULL DEFAULT false' },
    { name: 'paymentDeadlineMissedAt', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentDeadlineMissedAt" TIMESTAMP(3)' },
    { name: 'autoCancelledAt', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "autoCancelledAt" TIMESTAMP(3)' },
    { name: 'autoCancelReason', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "autoCancelReason" TEXT' },
    { name: 'contactDeadline', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "contactDeadline" TIMESTAMP(3)' },
    { name: 'sellerContactedAt', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "sellerContactedAt" TIMESTAMP(3)' },
    { name: 'buyerContactedAt', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "buyerContactedAt" TIMESTAMP(3)' },
    { name: 'contactWarningSentAt', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "contactWarningSentAt" TIMESTAMP(3)' },
    { name: 'selectedDeliveryMode', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "selectedDeliveryMode" TEXT' },
    { name: 'selectedShippingCode', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "selectedShippingCode" TEXT' },
    { name: 'selectedAddons', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "selectedAddons" TEXT' },
    { name: 'shippingCostChfFinal', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shippingCostChfFinal" DOUBLE PRECISION NOT NULL DEFAULT 0' },
    { name: 'shippingCostBreakdown', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shippingCostBreakdown" TEXT' },
    { name: 'shippingRateSetId', sql: 'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shippingRateSetId" TEXT DEFAULT \'default_ch_post\'' },
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
