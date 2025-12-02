import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateInvoiceForSale } from '@/lib/invoice'

// Admin-Check Funktion
async function checkAdmin(session: any): Promise<boolean> {
  if (!session?.user?.id && !session?.user?.email) {
    return false
  }
  let user = null
  if (session.user.id) {
    user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true, email: true },
    })
  }
  if (!user && session.user.email) {
    user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true, email: true },
    })
  }
  const isAdminInDb = user?.isAdmin === true || user?.isAdmin === true
  return isAdminInDb
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!(await checkAdmin(session))) {
      return NextResponse.json(
        { message: 'Zugriff verweigert. Admin-Rechte erforderlich.' },
        { status: 403 }
      )
    }

    const { purchaseId } = await request.json()

    if (!purchaseId) {
      return NextResponse.json({ message: 'Purchase ID ist erforderlich' }, { status: 400 })
    }

    // Prüfe ob bereits eine Rechnung existiert
    const existingInvoice = await prisma.invoice.findFirst({
      where: { saleId: purchaseId },
    })

    if (existingInvoice) {
      return NextResponse.json({
        message: 'Rechnung existiert bereits',
        invoice: {
          id: existingInvoice.id,
          invoiceNumber: existingInvoice.invoiceNumber,
          total: existingInvoice.total,
        },
      })
    }

    // Prüfe ob Purchase existiert
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        watch: {
          select: {
            id: true,
            sellerId: true,
            title: true,
          },
        },
      },
    })

    if (!purchase) {
      return NextResponse.json({ message: 'Purchase nicht gefunden' }, { status: 404 })
    }

    // Erstelle Rechnung
    const invoice = await calculateInvoiceForSale(purchaseId)

    return NextResponse.json({
      message: 'Rechnung erfolgreich erstellt',
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        sellerId: invoice.sellerId,
        total: invoice.total,
        status: invoice.status,
      },
    })
  } catch (error: any) {
    console.error('Error creating missing invoice:', error)
    return NextResponse.json(
      { message: 'Fehler beim Erstellen der Rechnung', error: error.message },
      { status: 500 }
    )
  }
}
