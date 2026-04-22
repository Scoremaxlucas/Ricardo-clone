import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email/sender'
import type { CreditCheckStatus } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const VALID: CreditCheckStatus[] = ['NONE', 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'PENDING_MANUAL_REVIEW']

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!(await isAdmin(session))) {
    return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
  }

  const { userId } = await params
  const body = (await request.json().catch(() => ({}))) as { status?: string; rejectionReason?: string }
  const status = body.status as CreditCheckStatus | undefined
  if (!status || !VALID.includes(status)) {
    return NextResponse.json({ message: 'Ungültiger Status' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, firstName: true, name: true },
  })
  if (!user) return NextResponse.json({ message: 'User nicht gefunden' }, { status: 404 })

  const now = new Date()
  const expires = status === 'APPROVED' ? new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) : null
  const profile = await prisma.tenantProfile.update({
    where: { userId },
    data: {
      creditCheckStatus: status,
      creditCheckExpiresAt: expires,
      creditCheckUploadedAt: now,
      expiryReminderSentAt: null,
    },
    select: { creditCheckStatus: true, creditCheckExpiresAt: true },
  })

  if (status === 'REJECTED' && user.email) {
    const reason = typeof body.rejectionReason === 'string' ? body.rejectionReason.trim() : ''
    const first = user.firstName?.trim() || user.name?.split(/\s+/)[0] || 'du'
    await sendEmail({
      to: user.email,
      subject: 'Dein Betreibungsregisterauszug wurde abgelehnt',
      html: `<p>Hallo ${first},</p>
<p>dein Betreibungsregisterauszug wurde manuell geprüft und abgelehnt.</p>
${reason ? `<p><strong>Grund:</strong> ${reason}</p>` : ''}
<p>Bitte lade einen neuen, gut lesbaren Auszug in deinem Profil hoch.</p>`,
      text: `Hallo ${first},\n\ndein Betreibungsregisterauszug wurde manuell geprüft und abgelehnt.\n${reason ? `Grund: ${reason}\n` : ''}\nBitte lade einen neuen, gut lesbaren Auszug in deinem Profil hoch.`,
      userId: user.id,
      from: 'Helvenda Wohnungen <noreply@helvenda.ch>',
    })
  }

  return NextResponse.json({ success: true, status: profile.creditCheckStatus, expiresAt: profile.creditCheckExpiresAt })
}
