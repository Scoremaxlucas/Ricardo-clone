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
    const errors: string[] = []

    // Gib jede Order frei
    for (const order of ordersToRelease) {
      try {
        await releaseFunds(order.id)
        releasedCount++
        console.log(`[auto-release] ✅ Order ${order.orderNumber} automatisch freigegeben`)
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
 * Zeigt Anzahl der Orders, die für Auto-Release bereit sind (für Monitoring)
 */
export async function GET(request: NextRequest) {
  try {
    const now = new Date()

    const count = await prisma.order.count({
      where: {
        paymentStatus: {
          in: ['paid', 'release_pending'],
        },
        releasedAt: null,
        buyerConfirmedReceipt: false,
        autoReleaseAt: {
          lte: now,
        },
      },
    })

    return NextResponse.json({
      count,
      message: `${count} Orders bereit für Auto-Release`,
    })
  } catch (error: any) {
    console.error('[auto-release] Fehler beim Zählen:', error)
    return NextResponse.json(
      {
        message: 'Fehler beim Zählen',
        error: error.message,
      },
      { status: 500 }
    )
  }
}
