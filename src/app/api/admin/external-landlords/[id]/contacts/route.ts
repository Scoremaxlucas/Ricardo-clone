import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { logAdminAudit } from '@/lib/admin/auditLog'
import {
  normalizeExternalLandlordEmail,
  normalizeExternalLandlordPhone,
} from '@/lib/external-landlords/crm'
import { prisma } from '@/lib/prisma'
import { encryptLandlordContactForStorage } from '@/lib/rental/pdf-crypto'
import { ExternalLandlordContactKind } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const KIND_VALUES = new Set<string>(Object.values(ExternalLandlordContactKind))

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !(await isAdmin(session))) {
    return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
  }

  const { id } = await params
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!id || !body) {
    return NextResponse.json({ message: 'Ungültige Anfrage' }, { status: 400 })
  }

  const landlord = await prisma.externalLandlord.findUnique({ where: { id }, select: { id: true } })
  if (!landlord) {
    return NextResponse.json({ message: 'Vermieter nicht gefunden' }, { status: 404 })
  }

  const kind = typeof body.kind === 'string' ? body.kind : ''
  if (!KIND_VALUES.has(kind)) {
    return NextResponse.json({ message: 'Ungültige Kontakt-Art' }, { status: 400 })
  }

  const value = typeof body.value === 'string' ? body.value.trim() : ''
  if (!value) {
    return NextResponse.json({ message: 'Kontaktwert fehlt' }, { status: 400 })
  }

  const normalizedValue =
    kind === 'email' ? normalizeExternalLandlordEmail(value)
    : kind === 'phone' || kind === 'whatsapp' ? normalizeExternalLandlordPhone(value)
    : null

  if ((kind === 'email' || kind === 'phone' || kind === 'whatsapp') && !normalizedValue) {
    return NextResponse.json({ message: 'Kontaktwert ungültig' }, { status: 400 })
  }

  const isPrimary = body.isPrimary === true
  const label = typeof body.label === 'string' ? body.label.trim() : ''
  const note = typeof body.note === 'string' ? body.note.trim() : ''

  const existing =
    normalizedValue ?
      await prisma.externalLandlordContact.findFirst({
        where: {
          externalLandlordId: id,
          kind: kind as ExternalLandlordContactKind,
          normalizedValue,
        },
        select: { id: true },
      })
    : null
  if (existing) {
    return NextResponse.json({ message: 'Kontakt existiert bereits' }, { status: 409 })
  }

  const created = await prisma.$transaction(async tx => {
    if (isPrimary && (kind === 'email' || kind === 'phone' || kind === 'whatsapp')) {
      await tx.externalLandlordContact.updateMany({
        where: { externalLandlordId: id, kind: kind as ExternalLandlordContactKind, isPrimary: true },
        data: { isPrimary: false },
      })
    }

    const contact = await tx.externalLandlordContact.create({
      data: {
        externalLandlordId: id,
        kind: kind as ExternalLandlordContactKind,
        label: label || null,
        valueEncrypted: encryptLandlordContactForStorage(value)!,
        normalizedValue,
        isPrimary,
        note: note || null,
      },
    })

    if (isPrimary) {
      await tx.externalLandlord.update({
        where: { id },
        data: {
          normalizedPrimaryEmail: kind === 'email' ? normalizedValue : undefined,
          normalizedPrimaryPhone: kind === 'phone' || kind === 'whatsapp' ? normalizedValue : undefined,
        },
      })
    }
    return contact
  })

  await logAdminAudit({
    adminUserId: session.user.id,
    action: 'EXTERNAL_LANDLORD_CONTACT_CREATE',
    entityType: 'ExternalLandlordContact',
    entityId: created.id,
    metadata: { landlordId: id, kind, isPrimary },
  })

  return NextResponse.json({ success: true })
}
