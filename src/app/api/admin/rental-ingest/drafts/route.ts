import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !(await isAdmin(session))) {
    return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
  }

  const rows = await prisma.rentalListingIngestDraft.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    take: 150,
    select: {
      id: true,
      createdAt: true,
      sourceUrl: true,
      lastError: true,
      status: true,
      createdBy: {
        select: {
          name: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  })

  return NextResponse.json({ drafts: rows })
}
