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

// GET: Historie der Pricing-Änderungen
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
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Lade Historie mit Admin-Informationen
    const history = await prisma.pricingHistory.findMany({
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            nickname: true,
          },
        },
      },
      orderBy: {
        changedAt: 'desc',
      },
      take: limit,
      skip: offset,
    })

    const total = await prisma.pricingHistory.count()

    return NextResponse.json({
      history: history.map(h => ({
        id: h.id,
        platformMarginRate: h.platformMarginRate,
        vatRate: h.vatRate,
        minimumCommission: h.minimumCommission,
        maximumCommission: h.maximumCommission,
        listingFee: h.listingFee,
        transactionFee: h.transactionFee,
        changedBy: h.changedBy,
        changedAt: h.changedAt.toISOString(),
        admin: {
          id: h.admin.id,
          email: h.admin.email,
          name:
            h.admin.name ||
            `${h.admin.firstName || ''} ${h.admin.lastName || ''}`.trim() ||
            h.admin.nickname ||
            'Unbekannt',
        },
      })),
      total,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error('Error fetching pricing history:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden der Historie: ' + error.message },
      { status: 500 }
    )
  }
}
