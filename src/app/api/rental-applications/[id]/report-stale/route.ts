import { authOptions } from '@/lib/auth'
import { sendAdminListingDeactivatedStaleReportsEmail } from '@/lib/rental/emails'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000
const NOTE_MAX = 200

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ message: 'Fehlt' }, { status: 400 })
    }

    let note: string | null = null
    try {
      const body = await request.json().catch(() => null) as { note?: unknown } | null
      if (body && typeof body.note === 'string') {
        const t = body.note.trim().slice(0, NOTE_MAX)
        note = t || null
      }
    } catch {
      note = null
    }

    const now = new Date()
    const minCreated = new Date(now.getTime() - THREE_DAYS_MS)

    const applicantUserId = session.user.id

    const result = await prisma.$transaction(async tx => {
      const app = await tx.rentalApplication.findFirst({
        where: { id, applicantUserId },
      })

      if (!app) {
        return { ok: false as const, error: 'Nicht gefunden', status: 404 }
      }
      if (app.status !== 'approved') {
        return { ok: false as const, error: 'Melden nur bei eingereichten Bewerbungen möglich', status: 400 }
      }
      if (app.createdAt > minCreated) {
        return { ok: false as const, error: 'Melden frühestens 3 Tage nach Bewerbung möglich', status: 400 }
      }
      if (app.staleReportedAt) {
        return { ok: false as const, error: 'Bereits gemeldet', status: 400 }
      }

      await tx.rentalApplication.update({
        where: { id: app.id },
        data: {
          staleReportedAt: now,
          staleReportNote: note,
        },
      })

      const listing = await tx.rentalListing.update({
        where: { id: app.rentalListingId },
        data: {
          staleReportCount: { increment: 1 },
          staleReportedAt: now,
        },
        select: {
          id: true,
          title: true,
          address: true,
          staleReportCount: true,
          status: true,
        },
      })

      let deactivated = false
      if (listing.staleReportCount >= 2 && listing.status === 'active') {
        await tx.rentalListing.update({
          where: { id: listing.id },
          data: {
            status: 'archived',
            autoDeactivatedAt: now,
            autoDeactivatedReason: 'STALE_REPORTS',
          },
        })
        deactivated = true
      }

      return {
        ok: true as const,
        listingId: listing.id,
        listingTitle: listing.title,
        address: listing.address,
        staleReportCount: listing.staleReportCount,
        deactivated,
      }
    })

    if (result.ok === false) {
      return NextResponse.json({ message: result.error }, { status: result.status })
    }

    if (result.deactivated) {
      const reports = await prisma.rentalApplication.findMany({
        where: {
          rentalListingId: result.listingId,
          staleReportedAt: { not: null },
        },
        select: { staleReportNote: true, staleReportedAt: true },
        orderBy: { staleReportedAt: 'desc' },
      })
      const notes = reports
        .map(r => {
          const n = r.staleReportNote?.trim()
          if (!n) return null
          const d = r.staleReportedAt?.toLocaleString('de-CH') ?? ''
          return `${d}: ${n}`
        })
        .filter((x): x is string => Boolean(x))

      try {
        await sendAdminListingDeactivatedStaleReportsEmail({
          listingId: result.listingId,
          listingTitle: result.listingTitle,
          address: result.address,
          staleReportCount: result.staleReportCount,
          lastReportAt: now,
          notes: notes.length ? notes : ['(Keine Notizen)'],
        })
      } catch (e) {
        console.error('[report-stale] Admin-E-Mail', e)
      }
    }

    revalidatePath('/meine-bewerbungen')
    revalidatePath('/admin/listings')
    revalidatePath('/wohnungen')
    revalidatePath(`/wohnungen/${result.listingId}`)

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    console.error('[report-stale POST]', e)
    const msg = e instanceof Error ? e.message : 'Fehler'
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}
