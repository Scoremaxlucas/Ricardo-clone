/**
 * Bexio Sync API Routes
 *
 * POST /api/bexio/sync - Synchronisiert einen User oder eine Rechnung zu Bexio
 * GET /api/bexio/sync - Holt Sync-Status
 */

import { authOptions } from '@/lib/auth'
import { createBexioInvoice, getInvoicePaymentStatus, syncUserToBexio } from '@/lib/bexio-sync'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Nur Admins dürfen manuell synchronisieren
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, userId, invoiceId } = body

    if (type === 'user' && userId) {
      const bexioContactId = await syncUserToBexio(String(userId))
      return NextResponse.json({
        success: true,
        bexioContactId,
      })
    }

    if (type === 'invoice' && invoiceId) {
      const result = await createBexioInvoice(String(invoiceId))
      return NextResponse.json({
        success: true,
        ...result,
      })
    }

    return NextResponse.json(
      { error: 'Invalid request. Provide type (user/invoice) and corresponding ID.' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Bexio sync error:', error)
    return NextResponse.json({ error: error.message || 'Sync failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get('invoiceId')

    if (invoiceId) {
      const status = await getInvoicePaymentStatus(invoiceId)
      return NextResponse.json(status)
    }

    return NextResponse.json({ error: 'Provide invoiceId parameter' }, { status: 400 })
  } catch (error: any) {
    console.error('Bexio status error:', error)
    return NextResponse.json({ error: error.message || 'Status check failed' }, { status: 500 })
  }
}
