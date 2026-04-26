import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ message: 'Nicht angemeldet' }, { status: 401 })
  }

  const res = await prisma.helvendaCertificate.updateMany({
    where: { userId, status: 'ACTIVE' },
    data: { status: 'REVOKED' },
  })

  if (res.count === 0) {
    return NextResponse.json({ success: false, message: 'Kein aktives Zertifikat' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
