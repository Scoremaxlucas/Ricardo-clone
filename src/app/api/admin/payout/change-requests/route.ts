import { authOptions } from '@/lib/auth'
import { maskIban } from '@/lib/crypto'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/payout/change-requests
 * Get all pending payout change requests (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ message: 'Nur für Administratoren' }, { status: 403 })
    }

    const status = request.nextUrl.searchParams.get('status') || 'PENDING'

    const requests = await prisma.payoutChangeRequest.findMany({
      where: {
        status: status as any,
      },
      include: {
        profile: {
          select: {
            accountHolderName: true,
            ibanLast4: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      requests: requests.map(req => ({
        id: req.id,
        userId: req.userId,
        currentAccountHolderName: req.profile.accountHolderName,
        currentIbanLast4: req.profile.ibanLast4,
        currentIbanMasked: maskIban('', req.profile.ibanLast4),
        requestedAccountHolderName: req.requestedAccountHolderName,
        requestedIbanLast4: req.requestedIbanLast4,
        requestedIbanMasked: maskIban('', req.requestedIbanLast4),
        reason: req.reason,
        status: req.status,
        createdAt: req.createdAt.toISOString(),
        decidedAt: req.decidedAt?.toISOString() || null,
        decidedBy: req.decidedBy,
      })),
    })
  } catch (error: any) {
    console.error('Error fetching change requests:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden der Änderungsanfragen' },
      { status: 500 }
    )
  }
}
