import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { updateWohnenPlacementStatus } from '@/lib/wohnen/placement'
import type { WohnenCommissionStatus, WohnenTenantBonusStatus } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const COMMISSION_STATUSES = new Set<string>(['pending', 'invoiced', 'paid', 'waived', 'cancelled'])
const BONUS_STATUSES = new Set<string>(['not_eligible', 'eligible', 'pending_payout', 'paid', 'excluded'])

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !(await isAdmin(session))) {
    return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
  }

  const { id } = await params
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return NextResponse.json({ message: 'Ungültiger Body' }, { status: 400 })

  const commissionStatus =
    typeof body.commissionStatus === 'string' && COMMISSION_STATUSES.has(body.commissionStatus)
      ? (body.commissionStatus as WohnenCommissionStatus)
      : undefined
  const tenantBonusStatus =
    typeof body.tenantBonusStatus === 'string' && BONUS_STATUSES.has(body.tenantBonusStatus)
      ? (body.tenantBonusStatus as WohnenTenantBonusStatus)
      : undefined

  const result = await updateWohnenPlacementStatus({
    placementId: id,
    commissionStatus,
    tenantBonusStatus,
    adminNotes: typeof body.adminNotes === 'string' ? body.adminNotes : undefined,
  })

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status })
  }

  return NextResponse.json({ ok: true })
}
