import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

// Check if user is admin
async function checkAdmin(session: any): Promise<boolean> {
  if (!session?.user?.id) return false

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  })

  return user?.isAdmin === true
}

// GET: Export invoices as CSV
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!(await checkAdmin(session))) {
      return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // all, pending, overdue, paid
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const format = searchParams.get('format') || 'csv' // csv or json

    // Build query
    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (userId) {
      where.sellerId = userId
    }

    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) }
    }

    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) }
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
            companyName: true,
          },
        },
        items: {
          include: {
            watch: {
              select: {
                title: true,
                brand: true,
                model: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (format === 'json') {
      return NextResponse.json({ invoices, count: invoices.length })
    }

    // Generate CSV
    const headers = [
      'Rechnungsnummer',
      'Status',
      'Verkäufer ID',
      'Verkäufer Name',
      'Verkäufer Email',
      'Firma',
      'Nettobetrag',
      'MwSt Rate',
      'MwSt Betrag',
      'Gesamtbetrag',
      'Mahngebühren',
      'Fälligkeitsdatum',
      'Bezahlt am',
      'Zahlungsmethode',
      'Erstellt am',
      'Mahnstopp',
      'Ratenzahlung',
      'Mahnungen gesendet',
      'Artikel',
    ]

    const rows = invoices.map(invoice => {
      const sellerName =
        invoice.seller.companyName ||
        `${invoice.seller.firstName || ''} ${invoice.seller.lastName || ''}`.trim() ||
        invoice.seller.name ||
        ''
      const items = invoice.items.map(i => i.watch?.title || i.description).join('; ')

      return [
        invoice.invoiceNumber,
        invoice.status,
        invoice.sellerId,
        sellerName,
        invoice.seller.email || '',
        invoice.seller.companyName || '',
        invoice.subtotal.toFixed(2),
        (invoice.vatRate * 100).toFixed(1) + '%',
        invoice.vatAmount.toFixed(2),
        invoice.total.toFixed(2),
        invoice.lateFeeAmount.toFixed(2),
        new Date(invoice.dueDate).toLocaleDateString('de-CH'),
        invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString('de-CH') : '',
        invoice.paymentMethod || '',
        new Date(invoice.createdAt).toLocaleDateString('de-CH'),
        invoice.collectionStopped ? 'Ja' : 'Nein',
        invoice.paymentArrangement ? 'Ja' : 'Nein',
        invoice.reminderCount.toString(),
        items,
      ]
    })

    // Create CSV content
    const csvContent = [
      headers.join(';'),
      ...rows.map(row =>
        row
          .map(cell => {
            // Escape quotes and wrap in quotes if contains semicolon or newline
            const escaped = String(cell).replace(/"/g, '""')
            if (escaped.includes(';') || escaped.includes('\n') || escaped.includes('"')) {
              return `"${escaped}"`
            }
            return escaped
          })
          .join(';')
      ),
    ].join('\n')

    // Add BOM for Excel compatibility
    const bom = '\uFEFF'
    const csvWithBom = bom + csvContent

    const filename = `rechnungen_export_${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('Error exporting invoices:', error)
    return NextResponse.json(
      { message: 'Fehler beim Exportieren', error: error.message },
      { status: 500 }
    )
  }
}
