import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { releaseFunds } from '@/lib/release-funds'

/**
 * POST /api/orders/auto-release
 * Auto-Release Cron Job - Gibt Gelder automatisch frei nach Timeout
 * Sollte regelmäßig aufgerufen werden (z.B. stündlich)
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: API-Key oder Secret-Check für Sicherheit
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'development-secret'

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const timeoutHours = parseInt(process.env.AUTO_RELEASE_TIMEOUT_HOURS || '72')

    console.log(`[auto-release] Starte Auto-Release Job um ${now.toISOString()}`)

    // Finde alle Orders, die:
    // - bezahlt wurden (paid oder release_pending)
    // - noch nicht freigegeben wurden
    // - autoReleaseAt Zeitpunkt überschritten wurde
    // - Käufer hat noch nicht bestätigt
    const ordersToRelease = await prisma.order.findMany({
      where: {
        paymentStatus: {
          in: ['paid', 'release_pending'],
        },
        releasedAt: null, // Noch nicht freigegeben
        buyerConfirmedReceipt: false, // Käufer hat noch nicht bestätigt
        autoReleaseAt: {
          lte: now, // Timeout überschritten
        },
      },
      include: {
        seller: {
          select: {
            id: true,
            stripeConnectedAccountId: true,
            stripeOnboardingComplete: true,
          },
        },
        paymentRecord: true,
      },
    })

    console.log(
      `[auto-release] Gefundene Orders für Auto-Release: ${ordersToRelease.length}`
    )

    let releasedCount = 0
    let pendingOnboardingCount = 0
    const errors: string[] = []

    // Gib jede Order frei (mit Just-in-Time Onboarding Support)
    for (const order of ordersToRelease) {
      try {
        const result = await releaseFunds(order.id)

        if (result.success) {
          releasedCount++
          console.log(`[auto-release] ✅ Order ${order.orderNumber} automatisch freigegeben`)
        } else if (result.pendingOnboarding) {
          pendingOnboardingCount++
          console.log(
            `[auto-release] ⏳ Order ${order.orderNumber} wartet auf Verkäufer-Auszahlungseinrichtung`
          )
        } else {
          const errorMsg = `Order ${order.orderNumber}: ${result.message}`
          errors.push(errorMsg)
        }
      } catch (error: any) {
        const errorMsg = `Order ${order.orderNumber}: ${error.message}`
        errors.push(errorMsg)
        console.error(`[auto-release] ❌ Fehler bei Order ${order.orderNumber}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Auto-Release abgeschlossen`,
      released: releasedCount,
      pendingOnboarding: pendingOnboardingCount,
      total: ordersToRelease.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('[auto-release] Fehler beim Auto-Release Job:', error)
    return NextResponse.json(
      {
        message: 'Fehler beim Auto-Release Job',
        error: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/orders/auto-release
 * Vercel Cron Job - Gibt Gelder automatisch frei nach Timeout
 * Wird alle 6 Stunden aufgerufen
 */
export async function GET(request: NextRequest) {
  try {
    // Prüfe ob Aufruf von Vercel Cron kommt
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    const vercelCronHeader = request.headers.get('x-vercel-cron')

    // Erlaube Vercel Cron (hat speziellen Header) oder Authorization Header
    const isVercelCron = vercelCronHeader === '1'
    const isAuthorized = cronSecret && authHeader === `Bearer ${cronSecret}`

    // In Production: Nur Vercel Cron oder autorisierte Aufrufe
    if (process.env.NODE_ENV === 'production' && !isVercelCron && !isAuthorized) {
      console.log('[auto-release] Unauthorized request blocked')
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    console.log(`[auto-release] Starte Auto-Release Job um ${now.toISOString()}`)

    // Finde alle Orders, die:
    // - bezahlt wurden (paid oder release_pending)
    // - noch nicht freigegeben wurden
    // - autoReleaseAt Zeitpunkt überschritten wurde
    // - Käufer hat noch nicht bestätigt
    // - NICHT on_hold (Admin hat zurückgehalten)
    const ordersToRelease = await prisma.order.findMany({
      where: {
        paymentStatus: {
          in: ['paid', 'release_pending'],
        },
        releasedAt: null, // Noch nicht freigegeben
        buyerConfirmedReceipt: false, // Käufer hat noch nicht bestätigt
        autoReleaseAt: {
          lte: now, // Timeout überschritten
        },
      },
      include: {
        seller: {
          select: {
            id: true,
            stripeConnectedAccountId: true,
            stripeOnboardingComplete: true,
          },
        },
        paymentRecord: true,
      },
    })

    console.log(`[auto-release] Gefundene Orders für Auto-Release: ${ordersToRelease.length}`)

    let releasedCount = 0
    let pendingOnboardingCount = 0
    const errors: string[] = []

    // Gib jede Order frei (mit Just-in-Time Onboarding Support)
    for (const order of ordersToRelease) {
      try {
        const result = await releaseFunds(order.id)

        if (result.success) {
          releasedCount++
          console.log(`[auto-release] ✅ Order ${order.orderNumber} automatisch freigegeben`)
        } else if (result.pendingOnboarding) {
          pendingOnboardingCount++
          console.log(
            `[auto-release] ⏳ Order ${order.orderNumber} wartet auf Verkäufer-Auszahlungseinrichtung`
          )
        } else {
          const errorMsg = `Order ${order.orderNumber}: ${result.message}`
          errors.push(errorMsg)
        }
      } catch (error: any) {
        const errorMsg = `Order ${order.orderNumber}: ${error.message}`
        errors.push(errorMsg)
        console.error(`[auto-release] ❌ Fehler bei Order ${order.orderNumber}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Auto-Release abgeschlossen`,
      released: releasedCount,
      pendingOnboarding: pendingOnboardingCount,
      total: ordersToRelease.length,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: now.toISOString(),
    })
  } catch (error: any) {
    console.error('[auto-release] Fehler beim Auto-Release Job:', error)
    return NextResponse.json(
      {
        message: 'Fehler beim Auto-Release Job',
        error: error.message,
      },
      { status: 500 }
    )
  }
}
