import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { sendRentalListingInviteEmail } from '@/lib/rental/rental-listing-invite-email'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !(await isAdmin(session))) {
    return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
  }

  const rows = await prisma.rentalListingInvite.findMany({
    where: { createdByUserId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 80,
    select: {
      id: true,
      email: true,
      status: true,
      createdAt: true,
      expiresAt: true,
      sourceUrl: true,
      rentalListingId: true,
      lastError: true,
      draftPayload: true,
    },
  })

  return NextResponse.json({ invites: rows })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !(await isAdmin(session))) {
    return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
  }

  let body: { email?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Ungültiger JSON-Body' }, { status: 400 })
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ message: 'Bitte eine gültige E-Mail-Adresse angeben.' }, { status: 400 })
  }

  const token = randomBytes(24).toString('hex')
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

  const invite = await prisma.rentalListingInvite.create({
    data: {
      token,
      email,
      createdByUserId: session.user.id,
      expiresAt,
      status: 'SENT',
    },
  })

  const sent = await sendRentalListingInviteEmail({ to: email, token })
  if (!sent.ok) {
    await prisma.rentalListingInvite.delete({ where: { id: invite.id } }).catch(() => {})
    return NextResponse.json({ message: sent.error || 'E-Mail konnte nicht gesendet werden.' }, { status: 502 })
  }

  return NextResponse.json({
    id: invite.id,
    message: 'Einladung versendet.',
    expiresAt: invite.expiresAt.toISOString(),
  })
}
