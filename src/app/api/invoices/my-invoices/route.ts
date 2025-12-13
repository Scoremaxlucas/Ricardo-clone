import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Hole alle Rechnungen für den eingeloggten Verkäufer
    const invoices = await prisma.invoice.findMany({
      where: {
        sellerId: session.user.id,
      },
      include: {
        items: {
          include: {
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
