import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/admin/invoices/create-all-missing
 *
 * Erstellt Rechnungen für alle verkauften Artikel ohne Rechnung.
 * Unterstützt sowohl Purchases als auch Orders.
 *
 * Admin-only Endpoint.
 */
export async function POST(request: NextRequest) {
  try {
    // Check auth via CRON_SECRET or session
    const url = new URL(request.url)
    const secret = url.searchParams.get('secret')

    if (secret !== process.env.CRON_SECRET) {
      const session = await getServerSession(authOptions)

      if (!session?.user?.email) {
        return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
      }

      // Check admin
      const adminEmails = ['admin@helvenda.ch', 'lucas@helvenda.ch', 'a@a.ch']
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { isAdmin: true },
      })

      if (!user?.isAdmin && !adminEmails.includes(session.user.email)) {
        return NextResponse.json({ error: 'Admin-Rechte erforderlich' }, { status: 403 })
      }
    }

    const results: {
      purchases: { attempted: number; created: number; skipped: number; failed: number; details: string[] }
      orders: { attempted: number; created: number; skipped: number; failed: number; details: string[] }
    } = {
      purchases: { attempted: 0, created: 0, skipped: 0, failed: 0, details: [] },
      orders: { attempted: 0, created: 0, skipped: 0, failed: 0, details: [] },
    }

    // === PURCHASES (altes System) ===
    // Zuerst: saleIds die bereits eine Rechnung haben (Purchase/Order IDs sind in Invoice.saleId gespeichert)
    const existingInvoiceSaleIds = await prisma.invoice.findMany({
      where: { saleId: { not: null } },
      select: { saleId: true },
    })
    const saleIdsWithInvoice = existingInvoiceSaleIds.map((i) => i.saleId as string)

    // Finde alle Purchases ohne Rechnung
    const purchasesWithoutInvoice = await prisma.purchase.findMany({
      where: {
        status: { notIn: ['cancelled'] },
        id: { notIn: saleIdsWithInvoice },
      },
      select: {
        id: true,
        price: true,
        watch: {
          select: {
            id: true,
            title: true,
            sellerId: true,
          },
        },
      },
    })

    results.purchases.attempted = purchasesWithoutInvoice.length
    console.log(`[create-all-missing] ${purchasesWithoutInvoice.length} Purchases ohne Rechnung gefunden`)

    for (const purchase of purchasesWithoutInvoice) {
      try {
        const { calculateInvoiceForSale } = await import('@/lib/invoice')
        const invoice = await calculateInvoiceForSale(purchase.id)
        results.purchases.created++
        results.purchases.details.push(`✅ Purchase ${purchase.id}: ${invoice.invoiceNumber} (${purchase.watch?.title || 'Unbekannt'})`)
      } catch (error: unknown) {
        results.purchases.failed++
        const msg = error instanceof Error ? error.message : String(error)
        results.purchases.details.push(`❌ Purchase ${purchase.id}: ${msg}`)
      }
    }

    // === ORDERS (neues System) ===
    // Finde alle Orders ohne Rechnung (die nicht storniert sind)
    const ordersWithoutInvoice = await prisma.order.findMany({
      where: {
        orderStatus: { notIn: ['canceled', 'refunded'] },
        invoiceId: null,
      },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        watch: {
          select: {
            id: true,
            title: true,
            sellerId: true,
          },
        },
      },
    })

    results.orders.attempted = ordersWithoutInvoice.length
    console.log(`[create-all-missing] ${ordersWithoutInvoice.length} Orders ohne Rechnung gefunden`)

    for (const order of ordersWithoutInvoice) {
      try {
        const { calculateInvoiceForOrder } = await import('@/lib/invoice')
        const invoice = await calculateInvoiceForOrder(order.id)

        // Update Order mit Invoice-Referenz
        await prisma.order.update({
          where: { id: order.id },
          data: {
            invoiceId: invoice.id,
            invoiceCreatedAt: new Date(),
          },
        })

        results.orders.created++
        results.orders.details.push(`✅ Order ${order.orderNumber}: ${invoice.invoiceNumber} (${order.watch?.title || 'Unbekannt'})`)
      } catch (error: unknown) {
        results.orders.failed++
        const msg = error instanceof Error ? error.message : String(error)
        results.orders.details.push(`❌ Order ${order.orderNumber || order.id}: ${msg}`)
      }
    }

    const totalCreated = results.purchases.created + results.orders.created
    const totalFailed = results.purchases.failed + results.orders.failed

    return NextResponse.json({
      success: totalFailed === 0,
      message: `${totalCreated} Rechnungen erstellt, ${totalFailed} fehlgeschlagen`,
      results,
    })
  } catch (error: unknown) {
    console.error('[create-all-missing] Fehler:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Rechnungen: ' + msg },
      { status: 500 }
    )
  }
}

// GET for info
export async function GET() {
  return NextResponse.json({
    message: 'POST this endpoint to create all missing invoices',
    usage: 'POST /api/admin/invoices/create-all-missing or POST with ?secret=CRON_SECRET',
  })
}
