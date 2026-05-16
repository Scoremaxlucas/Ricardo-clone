import { authOptions } from '@/lib/auth'
import { applyLandlordApplicationDecision } from '@/lib/rental/apply-landlord-application-decision'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { RentalApplicationStatus } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const APP_STATUSES = new Set<string>(Object.values(RentalApplicationStatus))

/** Vermieter: Detail einer Anfrage für eigenes Inserat */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { id } = await params
    const app = await prisma.rentalApplication.findUnique({
      where: { id },
      include: {
        listing: { select: { id: true, title: true, userId: true } },
        applicant: {
          select: {
            id: true,
            name: true,
            firstName: true,
            nickname: true,
            email: true,
            image: true,
            verified: true,
          },
        },
      },
    })

    if (!app || !app.listing) {
      return NextResponse.json({ message: 'Nicht gefunden' }, { status: 404 })
    }

    if (app.listing.userId !== session.user.id) {
      return NextResponse.json({ message: 'Kein Zugriff' }, { status: 403 })
    }

    return NextResponse.json({
      application: {
        id: app.id,
        createdAt: app.createdAt.toISOString(),
        status: app.status,
        message: app.message,
        creditCheckResult: app.creditCheckResult,
        listing: { id: app.listing.id, title: app.listing.title },
        applicant: app.applicant,
      },
    })
  } catch (e: unknown) {
    console.error('[rental-applications GET]', e)
    const msg = e instanceof Error ? e.message : 'Fehler'
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ message: 'Fehlt' }, { status: 400 })
    }

    const app = await prisma.rentalApplication.findUnique({
      where: { id },
      include: {
        listing: {
          select: {
            id: true,
            userId: true,
            title: true,
            address: true,
            zip: true,
            city: true,
          },
        },
        applicant: { select: { id: true, email: true, firstName: true, name: true } },
      },
    })

    if (!app || !app.listing) {
      return NextResponse.json({ message: 'Nicht gefunden' }, { status: 404 })
    }
    if (app.listing.userId !== session.user.id) {
      return NextResponse.json({ message: 'Kein Zugriff' }, { status: 403 })
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ message: 'Ungültiger Body' }, { status: 400 })
    }

    const viewingNote =
      typeof body.viewingNote === 'string' ? body.viewingNote.trim() || null : null

    if (body.action === 'reject' || body.action === 'request_viewing') {
      const result = await applyLandlordApplicationDecision({
        applicationId: id,
        action: body.action,
        viewingDate: body.viewingDate != null ? String(body.viewingDate) : undefined,
        viewingNote,
        rejectionNote: typeof body.rejectionNote === 'string' ? body.rejectionNote : undefined,
      })
      if (!result.ok) {
        return NextResponse.json({ message: result.message }, { status: result.status })
      }
      const updated = await prisma.rentalApplication.findUnique({ where: { id } })
      revalidatePath(`/matching/properties/${app.listing.id}/bewerbungen`)
      revalidatePath('/matching/properties')
      revalidatePath('/meine-bewerbungen')
      return NextResponse.json({
        application: {
          id: updated!.id,
          status: updated!.status,
          viewingDate: updated!.viewingDate?.toISOString() ?? null,
          viewingRequestedAt: updated!.viewingRequestedAt?.toISOString() ?? null,
          rejectedAt: updated!.rejectedAt?.toISOString() ?? null,
          rejectionNote: updated!.rejectionNote,
        },
      })
    }

    const data: Prisma.RentalApplicationUpdateInput = {}

    {
      if (typeof body.status === 'string') {
        if (!APP_STATUSES.has(body.status)) {
          return NextResponse.json({ message: 'Ungültiger Status' }, { status: 400 })
        }
        data.status = body.status as RentalApplicationStatus
      }

      if (body.viewingRequestedAt !== undefined) {
        if (body.viewingRequestedAt === null) {
          data.viewingRequestedAt = null
        } else {
          const d = new Date(String(body.viewingRequestedAt))
          if (Number.isNaN(d.getTime())) {
            return NextResponse.json({ message: 'Ungültiges viewingRequestedAt' }, { status: 400 })
          }
          data.viewingRequestedAt = d
        }
      }

      if (body.viewingDate !== undefined) {
        if (body.viewingDate === null) {
          data.viewingDate = null
        } else {
          const d = new Date(String(body.viewingDate))
          if (Number.isNaN(d.getTime())) {
            return NextResponse.json({ message: 'Ungültiges viewingDate' }, { status: 400 })
          }
          data.viewingDate = d
        }
      }

      if (body.rejectedAt !== undefined) {
        if (body.rejectedAt === null) {
          data.rejectedAt = null
        } else {
          const d = new Date(String(body.rejectedAt))
          data.rejectedAt = Number.isNaN(d.getTime()) ? new Date() : d
        }
      }

      if (body.rejectionNote !== undefined) {
        data.rejectionNote =
          body.rejectionNote === null || body.rejectionNote === '' ? null : String(body.rejectionNote).trim()
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ message: 'Keine Felder zum Aktualisieren' }, { status: 400 })
    }

    const updated = await prisma.rentalApplication.update({
      where: { id },
      data,
    })

    revalidatePath(`/matching/properties/${app.listing.id}/bewerbungen`)
    revalidatePath('/matching/properties')

    return NextResponse.json({
      application: {
        id: updated.id,
        status: updated.status,
        viewingDate: updated.viewingDate?.toISOString() ?? null,
        viewingRequestedAt: updated.viewingRequestedAt?.toISOString() ?? null,
        rejectedAt: updated.rejectedAt?.toISOString() ?? null,
        rejectionNote: updated.rejectionNote,
      },
    })
  } catch (e: unknown) {
    console.error('[rental-applications PATCH]', e)
    const msg = e instanceof Error ? e.message : 'Fehler'
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}
