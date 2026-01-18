/**
 * Bexio Sync All Invoices API
 *
 * POST /api/bexio/sync-all-invoices
 *
 * Synchronisiert alle Rechnungen ohne Bexio-Referenz nachträglich zu Bexio.
 * Dies ist wichtig für Rechnungen, die erstellt wurden bevor Bexio-Sync aktiv war,
 * oder wenn der Sync fehlgeschlagen ist.
 */

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createBexioInvoice } from '@/lib/bexio-sync'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Check for CRON_SECRET or admin session
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    if (secret === process.env.CRON_SECRET) {
      // Valid cron request
    } else {
      const session = await getServerSession(authOptions)
      if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Check if Bexio API token is configured
    if (!process.env.BEXIO_API_TOKEN) {
      return NextResponse.json({
        error: 'BEXIO_API_TOKEN ist nicht konfiguriert',
      }, { status: 400 })
    }

    // Find all invoices without Bexio reference
    const unsyncedInvoices = await prisma.invoice.findMany({
      where: {
        qrReference: null,
        // Only sync regular invoices, not credit notes
        NOT: {
          invoiceNumber: {
            startsWith: 'KORR-',
          },
        },
        // Don't sync cancelled invoices
        status: {
          not: 'cancelled',
        },
      },
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        sellerId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    console.log(`[bexio/sync-all] Found ${unsyncedInvoices.length} invoices without Bexio reference`)

    const results: Array<{
      invoiceId: string
      invoiceNumber: string
      success: boolean
      bexioInvoiceId?: number
      qrReference?: string
      error?: string
    }> = []

    // Sync each invoice
    for (const invoice of unsyncedInvoices) {
      try {
        console.log(`[bexio/sync-all] Syncing invoice ${invoice.invoiceNumber}...`)

        const result = await createBexioInvoice(invoice.id)

        results.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          success: true,
          bexioInvoiceId: result.bexioInvoiceId,
          qrReference: result.qrReference,
        })

        console.log(`[bexio/sync-all] ✅ Invoice ${invoice.invoiceNumber} synced: Bexio ID ${result.bexioInvoiceId}, Ref: ${result.qrReference}`)
      } catch (error: any) {
        console.error(`[bexio/sync-all] ❌ Failed to sync invoice ${invoice.invoiceNumber}:`, error.message)

        results.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          success: false,
          error: error.message,
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return NextResponse.json({
      message: `Bexio-Sync abgeschlossen`,
      summary: {
        total: unsyncedInvoices.length,
        synced: successCount,
        failed: failCount,
      },
      results,
    })
  } catch (error: any) {
    console.error('[bexio/sync-all] Error:', error)
    return NextResponse.json({
      error: error.message || 'Sync failed',
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check for CRON_SECRET or admin session
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    if (secret === process.env.CRON_SECRET) {
      // Valid cron request
    } else {
      const session = await getServerSession(authOptions)
      if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Count unsynced invoices
    const unsyncedCount = await prisma.invoice.count({
      where: {
        qrReference: null,
        NOT: {
          invoiceNumber: {
            startsWith: 'KORR-',
          },
        },
        status: {
          not: 'cancelled',
        },
      },
    })

    // Count synced invoices
    const syncedCount = await prisma.invoice.count({
      where: {
        qrReference: {
          not: null,
        },
      },
    })

    return NextResponse.json({
      unsynced: unsyncedCount,
      synced: syncedCount,
      bexioConfigured: !!process.env.BEXIO_API_TOKEN,
    })
  } catch (error: any) {
    console.error('[bexio/sync-all] Status error:', error)
    return NextResponse.json({
      error: error.message || 'Status check failed',
    }, { status: 500 })
  }
}
