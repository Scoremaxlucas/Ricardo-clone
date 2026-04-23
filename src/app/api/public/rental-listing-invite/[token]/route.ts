import { processRentalListingInviteUrl } from '@/lib/rental/rental-listing-invite-process'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function maskEmail(email: string): string {
  const [a, d] = email.split('@')
  if (!d) return '***'
  const left = (a || '').slice(0, 2)
  return `${left}***@${d}`
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params
  if (!token || token.length < 16) {
    return NextResponse.json({ ok: false, message: 'Ungültiger Link' }, { status: 400 })
  }

  const invite = await prisma.rentalListingInvite.findUnique({
    where: { token },
    select: { email: true, expiresAt: true, status: true },
  })
  if (!invite) {
    return NextResponse.json({ ok: false, message: 'Diese Einladung existiert nicht.' }, { status: 404 })
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ ok: false, message: 'Diese Einladung ist abgelaufen.', expired: true }, { status: 410 })
  }
  if (invite.status !== 'SENT') {
    return NextResponse.json({
      ok: true,
      alreadyUsed: true,
      status: invite.status,
      maskedEmail: maskEmail(invite.email),
    })
  }

  return NextResponse.json({
    ok: true,
    maskedEmail: maskEmail(invite.email),
    expiresAt: invite.expiresAt.toISOString(),
  })
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params
  if (!token || token.length < 16) {
    return NextResponse.json({ message: 'Ungültiger Link' }, { status: 400 })
  }

  const invite = await prisma.rentalListingInvite.findUnique({
    where: { token },
    select: { id: true, expiresAt: true, status: true },
  })
  if (!invite) {
    return NextResponse.json({ message: 'Diese Einladung existiert nicht.' }, { status: 404 })
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ message: 'Diese Einladung ist abgelaufen.' }, { status: 410 })
  }
  if (invite.status !== 'SENT') {
    return NextResponse.json({ message: 'Diese Einladung wurde bereits verwendet.' }, { status: 409 })
  }

  let body: { url?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Ungültiger JSON-Body' }, { status: 400 })
  }
  const url = typeof body.url === 'string' ? body.url.trim() : ''
  if (!url) {
    return NextResponse.json({ message: 'Bitte eine URL angeben.' }, { status: 400 })
  }

  let result: Awaited<ReturnType<typeof processRentalListingInviteUrl>>
  try {
    result = await processRentalListingInviteUrl({ inviteId: invite.id, rawUrl: url })
  } catch {
    return NextResponse.json({ message: 'Verarbeitung fehlgeschlagen.' }, { status: 500 })
  }

  if (result.status === 'LISTING_CREATED') {
    return NextResponse.json({
      ok: true,
      status: result.status,
      listingId: result.listingId,
      message: 'Inserat wurde erstellt. Vielen Dank!',
    })
  }

  return NextResponse.json({
    ok: true,
    status: result.status,
    message:
      result.status === 'NEEDS_ADMIN' ?
        'Wir konnten das Inserat nicht vollautomatisch anlegen. Unser Team prüft die Angaben und setzt es für dich fort.'
      : 'URL gespeichert.',
    detail: result.error,
  })
}
