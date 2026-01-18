/**
 * Bexio Connection Test API
 * 
 * GET /api/bexio/test-connection?secret=CRON_SECRET
 * 
 * Testet die Bexio-Verbindung und gibt detaillierte Infos zurück.
 */

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    
    if (secret !== process.env.CRON_SECRET) {
      const session = await getServerSession(authOptions)
      if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const results: any = {
      timestamp: new Date().toISOString(),
      environment: {},
      bexioConnection: null,
      testInvoice: null,
      errors: [],
    }

    // 1. Check environment
    results.environment = {
      BEXIO_API_TOKEN_SET: !!process.env.BEXIO_API_TOKEN,
      BEXIO_API_TOKEN_LENGTH: process.env.BEXIO_API_TOKEN?.length || 0,
      BEXIO_API_TOKEN_PREFIX: process.env.BEXIO_API_TOKEN?.substring(0, 10) + '...',
    }

    if (!process.env.BEXIO_API_TOKEN) {
      results.errors.push('BEXIO_API_TOKEN is not set')
      return NextResponse.json(results)
    }

    // 2. Test Bexio connection
    try {
      const { getBexioClient } = await import('@/lib/bexio-client')
      const bexio = getBexioClient()
      
      // Try to get a list of contacts (simple API call)
      const contacts = await (bexio as any).request('GET', '/contact?limit=1')
      results.bexioConnection = {
        success: true,
        message: 'Bexio API connection successful',
        testContactCount: contacts?.length || 0,
      }
    } catch (bexioError: any) {
      results.bexioConnection = {
        success: false,
        error: bexioError.message,
      }
      results.errors.push(`Bexio connection failed: ${bexioError.message}`)
    }

    // 3. Find a test invoice to sync
    const testInvoice = await prisma.invoice.findFirst({
      where: {
        qrReference: null,
        status: { not: 'cancelled' },
        NOT: { invoiceNumber: { startsWith: 'KORR-' } },
      },
      include: {
        items: true,
        seller: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    if (testInvoice) {
      results.testInvoice = {
        id: testInvoice.id,
        invoiceNumber: testInvoice.invoiceNumber,
        total: testInvoice.total,
        itemCount: testInvoice.items.length,
        items: testInvoice.items.map(item => ({
          id: item.id,
          description: item.description,
          price: item.price,
          total: item.total,
          amount: (item as any).amount,
        })),
        seller: {
          id: testInvoice.seller.id,
          name: testInvoice.seller.name,
          bexioContactId: testInvoice.seller.bexioContactId,
        },
        qrReference: testInvoice.qrReference,
        bexioInvoiceId: testInvoice.bexioInvoiceId,
      }

      // 4. Try to sync this invoice
      const syncInvoiceId = searchParams.get('sync')
      if (syncInvoiceId === 'true' && results.bexioConnection?.success) {
        try {
          const { createBexioInvoice } = await import('@/lib/bexio-sync')
          const syncResult = await createBexioInvoice(testInvoice.id)
          results.syncResult = {
            success: true,
            bexioInvoiceId: syncResult.bexioInvoiceId,
            qrReference: syncResult.qrReference,
          }
        } catch (syncError: any) {
          results.syncResult = {
            success: false,
            error: syncError.message,
            stack: syncError.stack?.split('\n').slice(0, 5),
          }
          results.errors.push(`Sync failed: ${syncError.message}`)
        }
      }
    } else {
      results.testInvoice = {
        message: 'No unsynced invoices found - all invoices already have qrReference',
      }
    }

    // 5. Count invoices by sync status
    const [syncedCount, unsyncedCount, totalCount] = await Promise.all([
      prisma.invoice.count({ where: { qrReference: { not: null } } }),
      prisma.invoice.count({ where: { qrReference: null, status: { not: 'cancelled' } } }),
      prisma.invoice.count(),
    ])

    results.invoiceCounts = {
      total: totalCount,
      synced: syncedCount,
      unsynced: unsyncedCount,
    }

    return NextResponse.json(results, { status: results.errors.length > 0 ? 500 : 200 })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5),
    }, { status: 500 })
  }
}
