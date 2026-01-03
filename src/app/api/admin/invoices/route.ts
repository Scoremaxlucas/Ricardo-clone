import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Helper function to check admin status
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

  const isAdminInDb = user?.isAdmin === true

  return isAdminInDb
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!(await checkAdmin(session))) {
      return NextResponse.json(
        { message: 'Zugriff verweigert. Admin-Rechte erforderlich.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // all, pending, overdue, paid, cancelled
    const search = searchParams.get('search') // Search by invoice number, user email, or name
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const mahnstopp = searchParams.get('mahnstopp') // true or false
    const withLateFees = searchParams.get('withLateFees') // true or false

    // Build where clause
    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (mahnstopp === 'true') {
      where.collectionStopped = true
    } else if (mahnstopp === 'false') {
      where.collectionStopped = false
    }

    if (withLateFees === 'true') {
      where.lateFeeAdded = true
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { seller: { email: { contains: search, mode: 'insensitive' } } },
        { seller: { name: { contains: search, mode: 'insensitive' } } },
        { seller: { firstName: { contains: search, mode: 'insensitive' } } },
        { seller: { lastName: { contains: search, mode: 'insensitive' } } },
        { seller: { companyName: { contains: search, mode: 'insensitive' } } },
      ]
    }

    // Get total count for pagination
    const totalCount = await prisma.invoice.count({ where })

    // Hole alle Rechnungen mit Pagination
    const invoices = await prisma.invoice.findMany({
      where,
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
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
            companyName: true,
            isBlocked: true,
            hasUnpaidInvoices: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    })

    // Calculate statistics
    const allInvoices = await prisma.invoice.findMany({
      where: {},
      select: {
        status: true,
        total: true,
        lateFeeAmount: true,
        collectionStopped: true,
        paymentArrangement: true,
      },
    })

    const stats = {
      total: allInvoices.length,
      pending: allInvoices.filter(i => i.status === 'pending').length,
      overdue: allInvoices.filter(i => i.status === 'overdue').length,
      paid: allInvoices.filter(i => i.status === 'paid').length,
      cancelled: allInvoices.filter(i => i.status === 'cancelled').length,
      totalAmount: allInvoices.reduce((sum, i) => sum + i.total, 0),
      openAmount: allInvoices
        .filter(i => i.status === 'pending' || i.status === 'overdue')
        .reduce((sum, i) => sum + i.total, 0),
      totalLateFees: allInvoices.reduce((sum, i) => sum + (i.lateFeeAmount || 0), 0),
      withMahnstopp: allInvoices.filter(i => i.collectionStopped).length,
      withPaymentArrangement: allInvoices.filter(i => i.paymentArrangement).length,
    }

    return NextResponse.json({
      invoices,
      stats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error: any) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden der Rechnungen: ' + error.message },
      { status: 500 }
    )
  }
}
