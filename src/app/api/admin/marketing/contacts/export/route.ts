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
 * GET /api/admin/marketing/contacts/export
 * CSV export of all marketing contacts
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!(await checkAdmin(session))) {
    return NextResponse.json({ error: 'Admin-Rechte erforderlich' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const tag = searchParams.get('tag') || ''
  const showUnsubscribed = searchParams.get('showUnsubscribed') === 'true'

  const where: any = {}
  if (!showUnsubscribed) {
    where.status = 'active'
  }
  if (tag) {
    where.tags = { contains: tag }
  }

  const contacts = await prisma.marketingContact.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  const csvHeader = 'E-Mail,Tags,Quelle,Status,Erstellt\n'
  const csvRows = contacts.map(c => {
    const tags = (() => {
      try { return JSON.parse(c.tags).join('; ') } catch { return '' }
    })()
    return `"${c.email}","${tags}","${c.source}","${c.status}","${c.createdAt.toISOString()}"`
  }).join('\n')

  const csv = csvHeader + csvRows

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="marketing-kontakte-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
