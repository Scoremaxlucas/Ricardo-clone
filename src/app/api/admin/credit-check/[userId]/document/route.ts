import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { prisma } from '@/lib/prisma'
import { decryptPdfFromStorageBestEffort } from '@/lib/rental/pdf-crypto'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(_: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!(await isAdmin(session))) {
    return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
  }

  const { userId } = await params
  const profile = await prisma.tenantProfile.findUnique({
    where: { userId },
    select: { encryptedFileRef: true },
  })
  if (!profile) {
    return NextResponse.json({ message: 'User nicht gefunden' }, { status: 404 })
  }
  if (!profile.encryptedFileRef) {
    return NextResponse.json({ message: 'Kein Betreibungsregisterauszug-Dokument vorhanden' }, { status: 404 })
  }

  const remote = await fetch(profile.encryptedFileRef, { signal: AbortSignal.timeout(10_000) })
  if (!remote.ok) {
    return NextResponse.json({ message: 'Dokument konnte nicht geladen werden' }, { status: 502 })
  }
  const raw = Buffer.from(await remote.arrayBuffer())
  const { buffer } = decryptPdfFromStorageBestEffort(raw)

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="betreibungsregister-${userId}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
