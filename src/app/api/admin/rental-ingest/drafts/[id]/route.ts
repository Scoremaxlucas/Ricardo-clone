import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function getAccessibleDraft(id: string) {
  return await prisma.rentalListingIngestDraft.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          name: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  })
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !(await isAdmin(session))) {
    return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
  }
  const { id } = await params
  const row = await getAccessibleDraft(id)
  if (!row) return NextResponse.json({ message: 'Nicht gefunden' }, { status: 404 })

  return NextResponse.json({
    draft: {
      id: row.id,
      sourceUrl: row.sourceUrl,
      lastError: row.lastError,
      status: row.status,
      draftPayload: row.draftPayload,
      createdBy: row.createdBy,
    },
  })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !(await isAdmin(session))) {
    return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
  }
  const { id } = await params
  const row = await getAccessibleDraft(id)
  if (!row) return NextResponse.json({ message: 'Nicht gefunden' }, { status: 404 })

  let body: { status?: string; resolvedListingId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Ungültiger JSON-Body' }, { status: 400 })
  }

  if (body.status === 'RESOLVED') {
    await prisma.rentalListingIngestDraft.update({
      where: { id: row.id },
      data: {
        status: 'RESOLVED',
        resolvedListingId: typeof body.resolvedListingId === 'string' ? body.resolvedListingId : null,
        lastError: null,
      },
    })
    return NextResponse.json({ ok: true })
  }

  if (body.status === 'DISCARDED') {
    await prisma.rentalListingIngestDraft.update({
      where: { id: row.id },
      data: { status: 'DISCARDED' },
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ message: 'Ungültiger status' }, { status: 400 })
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !(await isAdmin(session))) {
    return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
  }
  const { id } = await params
  const row = await getAccessibleDraft(id)
  if (!row) return NextResponse.json({ message: 'Nicht gefunden' }, { status: 404 })

  await prisma.rentalListingIngestDraft.update({
    where: { id: row.id },
    data: { status: 'DISCARDED' },
  })
  return NextResponse.json({ ok: true })
}
