import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { paymentMethod, paymentReference } = body || {}

    // Hole Rechnung
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        seller: true
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { message: 'Rechnung nicht gefunden' },
        { status: 404 }
      )
    }

    // Nur der Verkäufer oder Admin kann manuell als bezahlt markieren
    const userEmail = session.user.email?.toLowerCase()
    const isAdminEmail = userEmail === 'admin@admin.ch'
    const isAdminInSession = session?.user?.isAdmin === true || session?.user?.isAdmin === 1
    
    if (invoice.sellerId !== session.user.id && !isAdminInSession && !isAdminEmail) {
      return NextResponse.json(
        { message: 'Zugriff verweigert' },
        { status: 403 }
      )
    }

    // Update Rechnung
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: 'paid',
        paidAt: new Date(),
        paymentMethod: paymentMethod || null,
        paymentReference: paymentReference || null
      }
    })

    console.log(`[invoices/mark-paid] Rechnung ${invoice.invoiceNumber} als bezahlt markiert`)

    return NextResponse.json({
      message: 'Rechnung als bezahlt markiert',
      invoice: updatedInvoice
    })
  } catch (error: any) {
    console.error('Error marking invoice as paid:', error)
    return NextResponse.json(
      { message: 'Fehler beim Update: ' + error.message },
      { status: 500 }
    )
  }
}



