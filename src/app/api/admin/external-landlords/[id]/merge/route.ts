import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { logAdminAudit } from '@/lib/admin/auditLog'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function normalizedMatchKeys(input: {
  normalizedPrimaryEmail: string | null
  normalizedPrimaryPhone: string | null
  contacts: Array<{ normalizedValue: string | null }>
}): Set<string> {
  return new Set(
    [input.normalizedPrimaryEmail, input.normalizedPrimaryPhone, ...input.contacts.map(contact => contact.normalizedValue)]
      .map(value => value?.trim() || null)
      .filter((value): value is string => Boolean(value))
  )
}

function mergedNotes(target: string | null, source: string | null): string | null {
  const parts = [target?.trim(), source?.trim()].filter(Boolean)
  if (!parts.length) return null
  return Array.from(new Set(parts)).join('\n\n---\n\n')
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !(await isAdmin(session))) {
    return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
  }

  const { id: sourceId } = await params
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const targetLandlordId =
    typeof body?.targetLandlordId === 'string' && body.targetLandlordId.trim() ? body.targetLandlordId.trim() : ''

  if (!sourceId || !targetLandlordId) {
    return NextResponse.json({ message: 'Quelle oder Ziel fehlt' }, { status: 400 })
  }
  if (sourceId === targetLandlordId) {
    return NextResponse.json({ message: 'Quelle und Ziel sind identisch' }, { status: 400 })
  }

  const [source, target] = await Promise.all([
    prisma.externalLandlord.findUnique({
      where: { id: sourceId },
      select: {
        id: true,
        displayName: true,
        normalizedPrimaryEmail: true,
        normalizedPrimaryPhone: true,
        internalNotes: true,
        contacts: { select: { normalizedValue: true } },
      },
    }),
    prisma.externalLandlord.findUnique({
      where: { id: targetLandlordId },
      select: {
        id: true,
        displayName: true,
        normalizedPrimaryEmail: true,
        normalizedPrimaryPhone: true,
        internalNotes: true,
        contacts: { select: { normalizedValue: true } },
      },
    }),
  ])

  if (!source || !target) {
    return NextResponse.json({ message: 'Quelle oder Ziel nicht gefunden' }, { status: 404 })
  }

  const sourceKeys = normalizedMatchKeys(source)
  const targetKeys = normalizedMatchKeys(target)
  const overlaps = Array.from(sourceKeys).filter(key => targetKeys.has(key))
  if (overlaps.length === 0) {
    return NextResponse.json(
      {
        message:
          'Merge aus Sicherheitsgründen abgelehnt: Quelle und Ziel teilen keine identische normalisierte E-Mail oder Telefonnummer.',
      },
      { status: 400 }
    )
  }

  await prisma.$transaction(async tx => {
    await tx.externalLandlord.update({
      where: { id: targetLandlordId },
      data: {
        displayName: target.displayName?.trim() || !source.displayName?.trim() ? undefined : source.displayName.trim(),
        normalizedPrimaryEmail:
          target.normalizedPrimaryEmail || source.normalizedPrimaryEmail || undefined,
        normalizedPrimaryPhone:
          target.normalizedPrimaryPhone || source.normalizedPrimaryPhone || undefined,
        internalNotes: mergedNotes(target.internalNotes, source.internalNotes),
      },
    })

    await tx.externalLandlordContact.updateMany({
      where: { externalLandlordId: sourceId },
      data: { externalLandlordId: targetLandlordId },
    })
    await tx.externalLandlordPermission.updateMany({
      where: { externalLandlordId: sourceId },
      data: { externalLandlordId: targetLandlordId },
    })
    await tx.externalLandlordAttachment.updateMany({
      where: { externalLandlordId: sourceId },
      data: { externalLandlordId: targetLandlordId },
    })
    await tx.rentalListing.updateMany({
      where: { externalLandlordId: sourceId },
      data: { externalLandlordId: targetLandlordId },
    })

    await tx.externalLandlord.delete({
      where: { id: sourceId },
    })
  })

  await logAdminAudit({
    adminUserId: session.user.id,
    action: 'EXTERNAL_LANDLORD_MERGE',
    entityType: 'ExternalLandlord',
    entityId: targetLandlordId,
    metadata: {
      sourceLandlordId: sourceId,
      sharedKeys: overlaps,
    },
  })

  return NextResponse.json({ success: true, targetLandlordId })
}
