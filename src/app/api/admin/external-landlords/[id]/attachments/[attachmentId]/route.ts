import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'
import { ExternalLandlordEvidenceSource } from '@prisma/client'
import { logAdminAudit } from '@/lib/admin/auditLog'

export const dynamic = 'force-dynamic'

const SOURCE_VALUES = new Set<string>(Object.values(ExternalLandlordEvidenceSource))

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !(await isAdmin(session))) {
    return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
  }

  const { id, attachmentId } = await params
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!id || !attachmentId || !body) {
    return NextResponse.json({ message: 'Ungültige Anfrage' }, { status: 400 })
  }

  const attachment = await prisma.externalLandlordAttachment.findFirst({
    where: { id: attachmentId, externalLandlordId: id },
    select: { id: true },
  })
  if (!attachment) {
    return NextResponse.json({ message: 'Anhang nicht gefunden' }, { status: 404 })
  }

  if (typeof body.source === 'string' && !SOURCE_VALUES.has(body.source)) {
    return NextResponse.json({ message: 'Ungültige Quelle' }, { status: 400 })
  }
  const source =
    typeof body.source === 'string' && SOURCE_VALUES.has(body.source) ?
      (body.source as ExternalLandlordEvidenceSource)
    : null

  const rentalListingId =
    typeof body.rentalListingId === 'string' && body.rentalListingId.trim() ? body.rentalListingId.trim() : null
  if (rentalListingId) {
    const listing = await prisma.rentalListing.findUnique({
      where: { id: rentalListingId },
      select: { externalLandlordId: true },
    })
    if (!listing || listing.externalLandlordId !== id) {
      return NextResponse.json({ message: 'Inserat gehört nicht zu diesem Vermieter' }, { status: 400 })
    }
  }

  const permissionId =
    typeof body.permissionId === 'string' && body.permissionId.trim() ? body.permissionId.trim() : null
  if (permissionId) {
    const permission = await prisma.externalLandlordPermission.findUnique({
      where: { id: permissionId },
      select: { externalLandlordId: true },
    })
    if (!permission || permission.externalLandlordId !== id) {
      return NextResponse.json({ message: 'Berechtigung gehört nicht zu diesem Vermieter' }, { status: 400 })
    }
  }

  await prisma.externalLandlordAttachment.update({
    where: { id: attachment.id },
    data: {
      rentalListingId,
      permissionId,
      source,
      label: typeof body.label === 'string' && body.label.trim() ? body.label.trim() : null,
      note: typeof body.note === 'string' && body.note.trim() ? body.note.trim() : null,
    },
  })

  await logAdminAudit({
    adminUserId: session.user.id,
    action: 'EXTERNAL_LANDLORD_ATTACHMENT_PATCH',
    entityType: 'ExternalLandlordAttachment',
    entityId: attachment.id,
    metadata: { landlordId: id, rentalListingId, permissionId, source },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !(await isAdmin(session))) {
    return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
  }

  const { id, attachmentId } = await params
  if (!id || !attachmentId) {
    return NextResponse.json({ message: 'Ungültige Anfrage' }, { status: 400 })
  }

  const attachment = await prisma.externalLandlordAttachment.findFirst({
    where: { id: attachmentId, externalLandlordId: id },
    select: { id: true },
  })
  if (!attachment) {
    return NextResponse.json({ message: 'Anhang nicht gefunden' }, { status: 404 })
  }

  await prisma.externalLandlordAttachment.delete({
    where: { id: attachment.id },
  })

  await logAdminAudit({
    adminUserId: session.user.id,
    action: 'EXTERNAL_LANDLORD_ATTACHMENT_DELETE',
    entityType: 'ExternalLandlordAttachment',
    entityId: attachment.id,
    metadata: { landlordId: id },
  })

  return NextResponse.json({ success: true })
}
