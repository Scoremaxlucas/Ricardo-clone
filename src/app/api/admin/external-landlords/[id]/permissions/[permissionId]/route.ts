import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'
import {
  ExternalLandlordEvidenceSource,
  ExternalLandlordPermissionKind,
} from '@prisma/client'
import { logAdminAudit } from '@/lib/admin/auditLog'

export const dynamic = 'force-dynamic'

const KIND_VALUES = new Set<string>(Object.values(ExternalLandlordPermissionKind))
const SOURCE_VALUES = new Set<string>(Object.values(ExternalLandlordEvidenceSource))

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; permissionId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !(await isAdmin(session))) {
    return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
  }

  const { id, permissionId } = await params
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!id || !permissionId || !body) {
    return NextResponse.json({ message: 'Ungültige Anfrage' }, { status: 400 })
  }

  const permission = await prisma.externalLandlordPermission.findFirst({
    where: { id: permissionId, externalLandlordId: id },
    select: { id: true },
  })
  if (!permission) {
    return NextResponse.json({ message: 'Berechtigung nicht gefunden' }, { status: 404 })
  }

  const kind = typeof body.kind === 'string' ? body.kind : ''
  if (!KIND_VALUES.has(kind)) {
    return NextResponse.json({ message: 'Ungültige Berechtigungs-Art' }, { status: 400 })
  }

  const source = typeof body.source === 'string' ? body.source : 'manual'
  if (!SOURCE_VALUES.has(source)) {
    return NextResponse.json({ message: 'Ungültige Quelle' }, { status: 400 })
  }

  const summary = typeof body.summary === 'string' ? body.summary.trim() : ''
  if (summary.length < 8) {
    return NextResponse.json({ message: 'Bitte eine kurze Zusammenfassung angeben' }, { status: 400 })
  }

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

  const grantedAtRaw = typeof body.grantedAt === 'string' ? body.grantedAt.trim() : ''
  const grantedAt = grantedAtRaw ? new Date(grantedAtRaw) : new Date()
  if (Number.isNaN(grantedAt.getTime())) {
    return NextResponse.json({ message: 'Ungültiges Datum' }, { status: 400 })
  }

  await prisma.externalLandlordPermission.update({
    where: { id: permission.id },
    data: {
      rentalListingId,
      kind: kind as ExternalLandlordPermissionKind,
      source: source as ExternalLandlordEvidenceSource,
      grantedAt,
      summary,
    },
  })

  await logAdminAudit({
    adminUserId: session.user.id,
    action: 'EXTERNAL_LANDLORD_PERMISSION_PATCH',
    entityType: 'ExternalLandlordPermission',
    entityId: permission.id,
    metadata: { landlordId: id, kind, source, rentalListingId },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; permissionId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !(await isAdmin(session))) {
    return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
  }

  const { id, permissionId } = await params
  if (!id || !permissionId) {
    return NextResponse.json({ message: 'Ungültige Anfrage' }, { status: 400 })
  }

  const permission = await prisma.externalLandlordPermission.findFirst({
    where: { id: permissionId, externalLandlordId: id },
    select: { id: true },
  })
  if (!permission) {
    return NextResponse.json({ message: 'Berechtigung nicht gefunden' }, { status: 404 })
  }

  await prisma.externalLandlordPermission.delete({
    where: { id: permission.id },
  })

  await logAdminAudit({
    adminUserId: session.user.id,
    action: 'EXTERNAL_LANDLORD_PERMISSION_DELETE',
    entityType: 'ExternalLandlordPermission',
    entityId: permission.id,
    metadata: { landlordId: id },
  })

  return NextResponse.json({ success: true })
}
