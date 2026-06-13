import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import {
  normalizeExternalLandlordEmail,
  normalizeExternalLandlordPhone,
} from '@/lib/external-landlords/crm'
import { logAdminAudit } from '@/lib/admin/auditLog'
import { prisma } from '@/lib/prisma'
import { ExternalLandlordKind } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const KIND_VALUES = new Set<string>(Object.values(ExternalLandlordKind))

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !(await isAdmin(session))) {
    return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
  }

  const { id } = await params
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!id || !body) {
    return NextResponse.json({ message: 'Ungültige Anfrage' }, { status: 400 })
  }

  const existing = await prisma.externalLandlord.findUnique({ where: { id }, select: { id: true } })
  if (!existing) {
    return NextResponse.json({ message: 'Vermieter nicht gefunden' }, { status: 404 })
  }

  const data: Record<string, unknown> = {}
  if ('displayName' in body) {
    const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : ''
    data.displayName = displayName || null
  }
  if ('kind' in body) {
    const kind = typeof body.kind === 'string' ? body.kind : ''
    if (!KIND_VALUES.has(kind)) {
      return NextResponse.json({ message: 'Ungültige Vermieter-Art' }, { status: 400 })
    }
    data.kind = kind
  }
  if ('internalNotes' in body) {
    data.internalNotes = typeof body.internalNotes === 'string' && body.internalNotes.trim() ? body.internalNotes.trim() : null
  }
  if ('normalizedPrimaryEmail' in body) {
    const email =
      typeof body.normalizedPrimaryEmail === 'string' ?
        normalizeExternalLandlordEmail(body.normalizedPrimaryEmail)
      : null
    if (typeof body.normalizedPrimaryEmail === 'string' && body.normalizedPrimaryEmail.trim() && !email) {
      return NextResponse.json({ message: 'Ungültige Primär-E-Mail' }, { status: 400 })
    }
    data.normalizedPrimaryEmail = email
  }
  if ('normalizedPrimaryPhone' in body) {
    const phone =
      typeof body.normalizedPrimaryPhone === 'string' ?
        normalizeExternalLandlordPhone(body.normalizedPrimaryPhone)
      : null
    if (typeof body.normalizedPrimaryPhone === 'string' && body.normalizedPrimaryPhone.trim() && !phone) {
      return NextResponse.json({ message: 'Ungültige Primär-Telefonnummer' }, { status: 400 })
    }
    data.normalizedPrimaryPhone = phone
  }
  const cleanText = (value: unknown): string | null => {
    if (typeof value !== 'string') return null
    const trimmed = value.trim()
    return trimmed ? trimmed : null
  }
  if ('postalStreet' in body) data.postalStreet = cleanText(body.postalStreet)
  if ('postalCity' in body) data.postalCity = cleanText(body.postalCity)
  if ('postalCountry' in body) data.postalCountry = cleanText(body.postalCountry)
  if ('postalZip' in body) {
    const zip = cleanText(body.postalZip)
    if (zip && !/^[A-Za-z0-9 -]{2,12}$/.test(zip)) {
      return NextResponse.json({ message: 'Ungültige PLZ' }, { status: 400 })
    }
    data.postalZip = zip
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ message: 'Keine Änderungen' }, { status: 400 })
  }

  await prisma.externalLandlord.update({
    where: { id },
    data,
  })

  await logAdminAudit({
    adminUserId: session.user.id,
    action: 'EXTERNAL_LANDLORD_PATCH',
    entityType: 'ExternalLandlord',
    entityId: id,
    metadata: { patchedFields: Object.keys(data) },
  })

  return NextResponse.json({ success: true })
}
