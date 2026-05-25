import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import {
  normalizeExternalLandlordEmail,
  normalizeExternalLandlordPhone,
} from '@/lib/external-landlords/crm'
import { prisma } from '@/lib/prisma'
import { encryptLandlordContactForStorage } from '@/lib/rental/pdf-crypto'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'
import { logAdminAudit } from '@/lib/admin/auditLog'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !(await isAdmin(session))) {
    return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
  }

  const { id, contactId } = await params
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!id || !contactId || !body) {
    return NextResponse.json({ message: 'Ungültige Anfrage' }, { status: 400 })
  }

  const contact = await prisma.externalLandlordContact.findFirst({
    where: { id: contactId, externalLandlordId: id },
    select: { id: true, kind: true, isPrimary: true },
  })
  if (!contact) {
    return NextResponse.json({ message: 'Kontakt nicht gefunden' }, { status: 404 })
  }

  const value = typeof body.value === 'string' ? body.value.trim() : ''
  if (!value) {
    return NextResponse.json({ message: 'Kontaktwert fehlt' }, { status: 400 })
  }

  const normalizedValue =
    contact.kind === 'email' ? normalizeExternalLandlordEmail(value)
    : contact.kind === 'phone' || contact.kind === 'whatsapp' ? normalizeExternalLandlordPhone(value)
    : null

  if ((contact.kind === 'email' || contact.kind === 'phone' || contact.kind === 'whatsapp') && !normalizedValue) {
    return NextResponse.json({ message: 'Kontaktwert ungültig' }, { status: 400 })
  }

  const duplicate =
    normalizedValue ?
      await prisma.externalLandlordContact.findFirst({
        where: {
          externalLandlordId: id,
          kind: contact.kind,
          normalizedValue,
          id: { not: contact.id },
        },
        select: { id: true },
      })
    : null
  if (duplicate) {
    return NextResponse.json({ message: 'Kontakt existiert bereits' }, { status: 409 })
  }

  const label = typeof body.label === 'string' ? body.label.trim() : ''
  const note = typeof body.note === 'string' ? body.note.trim() : ''
  const isPrimary = body.isPrimary === true

  await prisma.$transaction(async tx => {
    if (isPrimary && (contact.kind === 'email' || contact.kind === 'phone' || contact.kind === 'whatsapp')) {
      await tx.externalLandlordContact.updateMany({
        where: { externalLandlordId: id, kind: contact.kind, isPrimary: true, id: { not: contact.id } },
        data: { isPrimary: false },
      })
    }

    await tx.externalLandlordContact.update({
      where: { id: contact.id },
      data: {
        label: label || null,
        note: note || null,
        valueEncrypted: encryptLandlordContactForStorage(value)!,
        normalizedValue,
        isPrimary,
      },
    })

    const [primaryEmail, primaryPhone] = await Promise.all([
      tx.externalLandlordContact.findFirst({
        where: { externalLandlordId: id, isPrimary: true, kind: 'email' },
        select: { normalizedValue: true },
      }),
      tx.externalLandlordContact.findFirst({
        where: {
          externalLandlordId: id,
          isPrimary: true,
          kind: { in: ['phone', 'whatsapp'] },
        },
        select: { normalizedValue: true },
      }),
    ])

    await tx.externalLandlord.update({
      where: { id },
      data: {
        normalizedPrimaryEmail: primaryEmail?.normalizedValue ?? null,
        normalizedPrimaryPhone: primaryPhone?.normalizedValue ?? null,
      },
    })
  })

  await logAdminAudit({
    adminUserId: session.user.id,
    action: 'EXTERNAL_LANDLORD_CONTACT_PATCH',
    entityType: 'ExternalLandlordContact',
    entityId: contact.id,
    metadata: { landlordId: id, kind: contact.kind, isPrimary },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !(await isAdmin(session))) {
    return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
  }

  const { id, contactId } = await params
  if (!id || !contactId) {
    return NextResponse.json({ message: 'Ungültige Anfrage' }, { status: 400 })
  }

  const contact = await prisma.externalLandlordContact.findFirst({
    where: { id: contactId, externalLandlordId: id },
    select: { id: true, isPrimary: true, kind: true },
  })
  if (!contact) {
    return NextResponse.json({ message: 'Kontakt nicht gefunden' }, { status: 404 })
  }

  await prisma.$transaction(async tx => {
    await tx.externalLandlordContact.delete({
      where: { id: contact.id },
    })

    if (contact.isPrimary) {
      const [primaryEmail, primaryPhone] = await Promise.all([
        tx.externalLandlordContact.findFirst({
          where: { externalLandlordId: id, isPrimary: true, kind: 'email' },
          select: { normalizedValue: true },
        }),
        tx.externalLandlordContact.findFirst({
          where: {
            externalLandlordId: id,
            isPrimary: true,
            kind: { in: ['phone', 'whatsapp'] },
          },
          select: { normalizedValue: true },
        }),
      ])

      await tx.externalLandlord.update({
        where: { id },
        data: {
          normalizedPrimaryEmail: primaryEmail?.normalizedValue ?? null,
          normalizedPrimaryPhone: primaryPhone?.normalizedValue ?? null,
        },
      })
    }
  })

  await logAdminAudit({
    adminUserId: session.user.id,
    action: 'EXTERNAL_LANDLORD_CONTACT_DELETE',
    entityType: 'ExternalLandlordContact',
    entityId: contact.id,
    metadata: { landlordId: id, kind: contact.kind, wasPrimary: contact.isPrimary },
  })

  return NextResponse.json({ success: true })
}
