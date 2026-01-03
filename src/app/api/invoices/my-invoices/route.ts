import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Hole alle Rechnungen für den eingeloggten Verkäufer
    // Use explicit select to avoid errors with new columns during migration
    const invoices = await prisma.invoice.findMany({
      where: {
        sellerId: session.user.id,
      },
      select: {
        id: true,
        invoiceNumber: true,
        sellerId: true,
        saleId: true,
        subtotal: true,
        vatRate: true,
        vatAmount: true,
        total: true,
        status: true,
        paidAt: true,
        dueDate: true,
        paymentMethod: true,
        paymentReference: true,
        createdAt: true,
        updatedAt: true,
        reminderCount: true,
        lateFeeAdded: true,
        lateFeeAmount: true,
        items: {
          select: {
            id: true,
            description: true,
            quantity: true,
            price: true,
            total: true,
            watchId: true,
            watch: {
              select: {
                id: true,
                title: true,
                brand: true,
                model: true,
                images: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Format we Bilder für Frontend
    const formattedInvoices = invoices.map(invoice => ({
      ...invoice,
      items: invoice.items.map(item => ({
        ...item,
        watch: item.watch
          ? {
              ...item.watch,
              images: item.watch.images ? JSON.parse(item.watch.images) : [],
            }
          : null,
      })),
    }))

    return NextResponse.json({
      invoices: formattedInvoices,
    })
  } catch (error: any) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden der Rechnungen: ' + error.message },
      { status: 500 }
    )
  }
}
