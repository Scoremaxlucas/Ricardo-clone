import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { prisma } from '@/lib/prisma'
import {
  ExternalLandlordEvidenceSource,
  ExternalLandlordPermissionKind,
} from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const KIND_VALUES = new Set<string>(Object.values(ExternalLandlordPermissionKind))
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

  await prisma.externalLandlordPermission.create({
    data: {
      externalLandlordId: id,
      rentalListingId,
      kind: kind as ExternalLandlordPermissionKind,
      source: source as ExternalLandlordEvidenceSource,
      grantedAt,
      summary,
    },
  })

  return NextResponse.json({ success: true })
}
