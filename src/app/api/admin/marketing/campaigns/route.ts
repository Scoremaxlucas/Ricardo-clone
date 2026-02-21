import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function checkAdmin(session: any): Promise<boolean> {
  if (!session?.user?.id) return false
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  })
  return user?.isAdmin === true
}

/**
 * GET /api/admin/marketing/campaigns
 * List all campaigns (most recent first)
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!(await checkAdmin(session))) {
    return NextResponse.json({ error: 'Admin-Rechte erforderlich' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))

  const campaigns = await prisma.marketingCampaign.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return NextResponse.json({ campaigns })
}
