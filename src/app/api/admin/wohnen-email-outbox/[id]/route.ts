import { logAdminAudit } from '@/lib/admin/auditLog'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { prisma } from '@/lib/prisma'
import { processWohnenEmailOutboxRowNow } from '@/lib/wohnen/email-outbox'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !(await isAdmin(session))) {
    return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
  }

  const { id } = await params
  const body = (await request.json().catch(() => null)) as { action?: string } | null
  const action = body?.action
  if (!id || (action !== 'retry_now' && action !== 'cancel')) {
    return NextResponse.json({ message: 'Ungültige Anfrage' }, { status: 400 })
  }

  const row = await prisma.wohnenEmailOutbox.findUnique({
    where: { id },
    select: { id: true, status: true, kind: true, attempts: true },
  })
  if (!row) {
    return NextResponse.json({ message: 'Outbox-Eintrag nicht gefunden' }, { status: 404 })
  }

  if (action === 'cancel') {
    if (row.status === 'sent' || row.status === 'cancelled') {
      return NextResponse.json({ message: 'Eintrag kann nicht mehr abgebrochen werden' }, { status: 400 })
    }

    await prisma.wohnenEmailOutbox.update({
      where: { id },
      data: { status: 'cancelled' },
    })
    await logAdminAudit({
      adminUserId: session.user.id,
      action: 'WOHNEN_OUTBOX_CANCEL',
      entityType: 'WohnenEmailOutbox',
      entityId: id,
      metadata: { previousStatus: row.status, kind: row.kind },
    })
    return NextResponse.json({ success: true, message: 'Outbox-Eintrag abgebrochen' })
  }

  const result = await processWohnenEmailOutboxRowNow(id)
  if (!result.ok) {
    if (result.status === 'not_found') {
      return NextResponse.json({ message: 'Outbox-Eintrag nicht gefunden' }, { status: 404 })
    }
    if (result.status === 'terminal') {
      return NextResponse.json({ message: 'Eintrag wurde bereits abgeschlossen oder abgebrochen' }, { status: 400 })
    }
    return NextResponse.json({ message: result.error || 'Erneuter Versand fehlgeschlagen' }, { status: 502 })
  }

  await logAdminAudit({
    adminUserId: session.user.id,
    action: 'WOHNEN_OUTBOX_RETRY_NOW',
    entityType: 'WohnenEmailOutbox',
    entityId: id,
    metadata: { previousStatus: row.status, attempts: row.attempts, kind: row.kind },
  })

  return NextResponse.json({ success: true, message: 'E-Mail wurde sofort erneut verarbeitet' })
}
