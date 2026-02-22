import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function checkAdmin(session: any): Promise<boolean> {
  if (!session?.user?.id) return false
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  })
  return user?.isAdmin === true
}

/**
 * PATCH /api/admin/marketing/contacts
 * Update a contact: { id, email?, tags?, status? }
 */
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!(await checkAdmin(session))) {
    return NextResponse.json({ error: 'Admin-Rechte erforderlich' }, { status: 403 })
  }

  const body = await request.json()
  const { id, email, tags, status } = body

  if (!id) {
    return NextResponse.json({ error: 'Kontakt-ID ist erforderlich' }, { status: 400 })
  }

  const existing = await prisma.marketingContact.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Kontakt nicht gefunden' }, { status: 404 })
  }

  const updateData: any = {}

  if (email !== undefined) {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return NextResponse.json({ error: 'Ungültige E-Mail-Adresse' }, { status: 400 })
    }
    if (trimmed !== existing.email) {
      const duplicate = await prisma.marketingContact.findUnique({ where: { email: trimmed } })
      if (duplicate) {
        return NextResponse.json({ error: 'Diese E-Mail-Adresse existiert bereits' }, { status: 409 })
      }
    }
    updateData.email = trimmed

    const user = await prisma.user.findUnique({ where: { email: trimmed }, select: { id: true } })
    updateData.userId = user?.id || null
  }

  if (tags !== undefined) {
    updateData.tags = JSON.stringify(Array.isArray(tags) ? tags : [])
  }

  if (status !== undefined) {
    updateData.status = status
  }

  const updated = await prisma.marketingContact.update({
    where: { id },
    data: updateData,
  })

  const parsedTags: string[] = (() => {
    try { return JSON.parse(updated.tags) } catch { return [] }
  })()

  return NextResponse.json({ contact: { ...updated, tags: parsedTags } })
}

/**
 * DELETE /api/admin/marketing/contacts
 * Delete a contact: { id }
 */
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!(await checkAdmin(session))) {
    return NextResponse.json({ error: 'Admin-Rechte erforderlich' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Kontakt-ID ist erforderlich' }, { status: 400 })
  }

  await prisma.marketingRecipient.deleteMany({ where: { contactId: id } })
  await prisma.marketingContact.delete({ where: { id } })

  return NextResponse.json({ success: true })
}

/**
 * GET /api/admin/marketing/contacts
 * List contacts with search, tag filter, pagination, show/hide unsubscribed
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!(await checkAdmin(session))) {
    return NextResponse.json({ error: 'Admin-Rechte erforderlich' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const tag = searchParams.get('tag') || ''
  const showUnsubscribed = searchParams.get('showUnsubscribed') === 'true'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))
  const offset = (page - 1) * limit

  const where: any = {}

  if (!showUnsubscribed) {
    where.status = 'active'
  }

  if (search) {
    where.email = { contains: search, mode: 'insensitive' }
  }

  if (tag) {
    where.tags = { contains: tag }
  }

  const [contacts, total] = await Promise.all([
    prisma.marketingContact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.marketingContact.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  return NextResponse.json({
    contacts: contacts.map(c => ({
      ...c,
      tags: (() => {
        try { return JSON.parse(c.tags) } catch { return [] }
      })(),
    })),
    total,
    page,
    totalPages,
    limit,
  })
}

/**
 * POST /api/admin/marketing/contacts
 * Import contacts: { emails: string, tags: string, source: string }
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!(await checkAdmin(session))) {
    return NextResponse.json({ error: 'Admin-Rechte erforderlich' }, { status: 403 })
  }

  const body = await request.json()
  const { emails, tags, source } = body

  if (!emails || typeof emails !== 'string') {
    return NextResponse.json({ error: 'E-Mail-Adressen sind erforderlich' }, { status: 400 })
  }

  const emailList = emails
    .split(/[\n,;]+/)
    .map((e: string) => e.trim().toLowerCase())
    .filter((e: string) => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))

  if (emailList.length === 0) {
    return NextResponse.json({ error: 'Keine gültigen E-Mail-Adressen gefunden' }, { status: 400 })
  }

  const tagArray = tags
    ? tags.split(',').map((t: string) => t.trim()).filter(Boolean)
    : ['marketing']
  const tagsJson = JSON.stringify(tagArray)
  const contactSource = source || 'manual'

  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (const email of emailList) {
    try {
      const existing = await prisma.marketingContact.findUnique({ where: { email } })
      if (existing) {
        // Merge tags
        const existingTags: string[] = (() => {
          try { return JSON.parse(existing.tags) } catch { return [] }
        })()
        const mergedTags = Array.from(new Set([...existingTags, ...tagArray]))
        await prisma.marketingContact.update({
          where: { email },
          data: { tags: JSON.stringify(mergedTags) },
        })
        skipped++
      } else {
        // Link to user if exists
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        })

        await prisma.marketingContact.create({
          data: {
            email,
            tags: tagsJson,
            source: contactSource,
            userId: user?.id || null,
          },
        })
        imported++
      }
    } catch (err: any) {
      errors.push(`${email}: ${err.message}`)
    }
  }

  return NextResponse.json({
    message: `${imported} importiert, ${skipped} aktualisiert`,
    imported,
    skipped,
    errors: errors.length > 0 ? errors : undefined,
  })
}
