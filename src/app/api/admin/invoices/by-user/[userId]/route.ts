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

// GET: Get all invoices for a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!(await checkAdmin(session))) {
      return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
    }

    const { userId } = await params

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        firstName: true,
        lastName: true,
        companyName: true,
        isBlocked: true,
        hasUnpaidInvoices: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Get all invoices for user
    const invoices = await prisma.invoice.findMany({
      where: { sellerId: userId },
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
      orderBy: { createdAt: 'desc' },
    })

    // Calculate statistics
    const stats = {
      total: invoices.length,
      pending: invoices.filter(i => i.status === 'pending').length,
      overdue: invoices.filter(i => i.status === 'overdue').length,
      paid: invoices.filter(i => i.status === 'paid').length,
      cancelled: invoices.filter(i => i.status === 'cancelled').length,
      totalAmount: invoices.reduce((sum, i) => sum + i.total, 0),
      openAmount: invoices
        .filter(i => i.status === 'pending' || i.status === 'overdue')
        .reduce((sum, i) => sum + i.total, 0),
      paidAmount: invoices
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + i.total, 0),
      lateFees: invoices.reduce((sum, i) => sum + (i.lateFeeAmount || 0), 0),
      withMahnstopp: invoices.filter(i => i.collectionStopped).length,
      withPaymentArrangement: invoices.filter(i => i.paymentArrangement).length,
    }

    return NextResponse.json({
      user,
      invoices,
      stats,
    })
  } catch (error: any) {
    console.error('Error fetching user invoices:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden der Rechnungen', error: error.message },
      { status: 500 }
    )
  }
}
