import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { prisma } from '@/lib/prisma'
import { ExternalLandlordEvidenceSource } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SOURCE_VALUES = new Set<string>(Object.values(ExternalLandlordEvidenceSource))

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

  const fileUrl = typeof body.fileUrl === 'string' ? body.fileUrl.trim() : ''
  if (!/^https?:\/\//i.test(fileUrl)) {
    return NextResponse.json({ message: 'Ungültige Datei-URL' }, { status: 400 })
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

  await prisma.externalLandlordAttachment.create({
    data: {
      externalLandlordId: id,
      rentalListingId,
      permissionId,
      source,
      label: typeof body.label === 'string' && body.label.trim() ? body.label.trim() : null,
      fileName: typeof body.fileName === 'string' && body.fileName.trim() ? body.fileName.trim() : null,
      mimeType: typeof body.mimeType === 'string' && body.mimeType.trim() ? body.mimeType.trim() : null,
      fileUrl,
      note: typeof body.note === 'string' && body.note.trim() ? body.note.trim() : null,
    },
  })

  return NextResponse.json({ success: true })
}
