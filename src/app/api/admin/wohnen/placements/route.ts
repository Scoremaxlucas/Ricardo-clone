import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { createWohnenPlacementFromApplication } from '@/lib/wohnen/placement'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !(await isAdmin(session))) {
    return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
  }

  const placements = await prisma.wohnenRentalPlacement.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      rentalApplication: {
        select: {
          id: true,
          listing: { select: { title: true, city: true } },
          applicant: { select: { email: true, firstName: true, name: true } },
        },
      },
    },
  })

  return NextResponse.json({
    placements: placements.map(p => ({
      id: p.id,
      createdAt: p.createdAt.toISOString(),
      rentalApplicationId: p.rentalApplicationId,
      netRentPerMonth: p.netRentPerMonth,
      commissionAmountChf: p.commissionAmountChf,
      commissionTotalChf: p.commissionTotalChf,
      commissionStatus: p.commissionStatus,
      tenantBonusAmountChf: p.tenantBonusAmountChf,
      tenantBonusStatus: p.tenantBonusStatus,
      moveInDate: p.moveInDate?.toISOString() ?? null,
      listingTitle: p.rentalApplication.listing.title,
      listingCity: p.rentalApplication.listing.city,
      applicantEmail: p.rentalApplication.applicant.email,
      applicantName:
        p.rentalApplication.applicant.firstName?.trim() ||
        p.rentalApplication.applicant.name?.trim() ||
        null,
      adminNotes: p.adminNotes,
    })),
  })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !(await isAdmin(session))) {
    return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const applicationId = typeof body?.applicationId === 'string' ? body.applicationId.trim() : ''
  if (!applicationId) {
    return NextResponse.json({ message: 'applicationId fehlt' }, { status: 400 })
  }

  const result = await createWohnenPlacementFromApplication({
    applicationId,
    recordedByUserId: session.user.id,
    moveInDate: body?.moveInDate != null ? String(body.moveInDate) : null,
    netRentPerMonth:
      body?.netRentPerMonth != null && body.netRentPerMonth !== ''
        ? Number(body.netRentPerMonth)
        : null,
    adminNotes: typeof body?.adminNotes === 'string' ? body.adminNotes : null,
  })

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status })
  }

  return NextResponse.json({ ok: true, placementId: result.placementId })
}
