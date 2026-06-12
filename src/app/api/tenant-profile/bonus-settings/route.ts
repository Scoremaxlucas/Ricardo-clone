import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function normalizeIban(raw: string): string | null {
  const compact = raw.replace(/\s+/g, '').toUpperCase()
  if (!compact) return null
  if (!/^CH[0-9]{19}$/.test(compact) && !/^CH[0-9]{2}[A-Z0-9]{4}[0-9]{12}$/.test(compact)) {
    return null
  }
  return compact
}

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })

  const profile = await prisma.tenantProfile.findUnique({
    where: { userId },
    select: { bonusPayoutIban: true, listingMatchAlertsEnabled: true },
  })
  if (!profile) return NextResponse.json({ message: 'Profil nicht gefunden' }, { status: 404 })

  return NextResponse.json({
    bonusPayoutIban: profile.bonusPayoutIban,
    listingMatchAlertsEnabled: profile.listingMatchAlertsEnabled,
  })
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })

  const profile = await prisma.tenantProfile.findUnique({ where: { userId } })
  if (!profile) return NextResponse.json({ message: 'Profil nicht gefunden' }, { status: 404 })

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return NextResponse.json({ message: 'Ungültiger Body' }, { status: 400 })

  const data: { bonusPayoutIban?: string | null; listingMatchAlertsEnabled?: boolean } = {}

  if (body.bonusPayoutIban !== undefined) {
    if (body.bonusPayoutIban === null || body.bonusPayoutIban === '') {
      data.bonusPayoutIban = null
    } else if (typeof body.bonusPayoutIban === 'string') {
      const iban = normalizeIban(body.bonusPayoutIban)
      if (!iban) {
        return NextResponse.json({ message: 'Ungültige Schweizer IBAN' }, { status: 400 })
      }
      data.bonusPayoutIban = iban
    }
  }

  if (typeof body.listingMatchAlertsEnabled === 'boolean') {
    data.listingMatchAlertsEnabled = body.listingMatchAlertsEnabled
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ message: 'Keine Felder' }, { status: 400 })
  }

  const updated = await prisma.tenantProfile.update({ where: { userId }, data })
  return NextResponse.json({
    ok: true,
    bonusPayoutIban: updated.bonusPayoutIban,
    listingMatchAlertsEnabled: updated.listingMatchAlertsEnabled,
  })
}
