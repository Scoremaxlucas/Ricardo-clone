import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateInvoiceForSale } from '@/lib/invoice'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const { watchId, shippingMethod, price } = await request.json()

    if (!watchId) {
      return NextResponse.json(
        { message: 'WatchId ist erforderlich' },
        { status: 400 }
      )
    }

    // Prüfe ob die Uhr existiert
    const watch = await prisma.watch.findUnique({
      where: { id: watchId },
      include: { purchases: true }
    })

    if (!watch) {
      return NextResponse.json(
        { message: 'Uhr nicht gefunden' },
        { status: 404 }
      )
    }

    // Prüfe ob bereits ein Purchase für diese Uhr existiert (nur ein Kauf pro Uhr möglich)
    if (watch.purchases.length > 0) {
      return NextResponse.json(
        { message: 'Diese Uhr wurde bereits verkauft' },
        { status: 400 }
      )
    }

    // Prüfe ob der Käufer nicht der Verkäufer ist
    if (watch.sellerId === session.user.id) {
      return NextResponse.json(
        { message: 'Sie können nicht Ihre eigene Uhr kaufen' },
        { status: 400 }
      )
    }

    // Erstelle Purchase
    const purchase = await prisma.purchase.create({
      data: {
        watchId,
        buyerId: session.user.id,
        shippingMethod: shippingMethod || null,
        price: price || watch.price
      },
      include: {
        watch: true,
        buyer: true
      }
    })

    console.log(`[purchases/create] Purchase erstellt: ${purchase.id} für Watch ${watchId} von ${session.user.email}`)

    // Erstelle automatisch Rechnung für den Verkäufer
    let invoiceCreated = false
    try {
      const invoice = await calculateInvoiceForSale(purchase.id)
      console.log(`[purchases/create] ✅ Invoice erstellt: ${invoice.invoiceNumber} für Seller ${purchase.watch.sellerId}, Total: CHF ${invoice.total}`)
      invoiceCreated = true
    } catch (invoiceError: any) {
      console.error('[purchases/create] ❌ KRITISCHER FEHLER bei Rechnungserstellung:', invoiceError)
      console.error('[purchases/create] Fehler-Details:', {
        message: invoiceError?.message,
        stack: invoiceError?.stack,
        purchaseId: purchase.id,
        sellerId: purchase.watch.sellerId,
        watchId: purchase.watchId,
        price: purchase.price || purchase.watch.price
      })
      // Fehler wird geloggt, aber Purchase bleibt erfolgreich
      // Die Rechnung kann später manuell über /api/admin/invoices/create-missing erstellt werden
    }
    
    if (!invoiceCreated) {
      console.warn(`[purchases/create] ⚠️ WARNUNG: Purchase ${purchase.id} wurde erstellt, aber Rechnung konnte nicht generiert werden. Bitte manuell prüfen!`)
    }

    return NextResponse.json({
      message: 'Kauf erfolgreich abgeschlossen',
      purchase: {
        id: purchase.id,
        watchId: purchase.watchId,
        shippingMethod: purchase.shippingMethod,
        price: purchase.price,
        createdAt: purchase.createdAt
      }
    })
  } catch (error: any) {
    console.error('Error creating purchase:', error)
    return NextResponse.json(
      { message: 'Fehler beim Erstellen des Kaufs: ' + error.message },
      { status: 500 }
    )
  }
}

