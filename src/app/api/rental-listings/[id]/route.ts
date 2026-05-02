import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  parseListingExpiresOnFromBody,
  rentalListingHasMonitoringHttpUrl,
  todayYmdInZurich,
  validateListingExpiresOnForUpsert,
} from '@/lib/rental/rental-listing-expiry-on'
import type { Prisma } from '@prisma/client'
import { RentalListingStatus } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const STATUS_VALUES = new Set<string>(Object.values(RentalListingStatus))

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ message: 'Fehlt' }, { status: 400 })
    }

    const listing = await prisma.rentalListing.findFirst({
      where: { id, status: 'active' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            nickname: true,
            image: true,
            verified: true,
            createdAt: true,
          },
        },
      },
    })

    if (!listing) {
      return NextResponse.json({ message: 'Nicht gefunden' }, { status: 404 })
    }

    let imageUrls: string[] = []
    try {
      imageUrls = JSON.parse(listing.photos)
      if (!Array.isArray(imageUrls)) imageUrls = []
    } catch {
      imageUrls = []
    }

    return NextResponse.json({
      listing: {
        id: listing.id,
        title: listing.title,
        description: listing.description,
        address: listing.address,
        zip: listing.zip,
        city: listing.city,
        canton: listing.canton,
        rooms: listing.rooms,
        areaSqm: listing.areaSqm,
        floor: listing.floor,
        rentPerMonth: listing.rentPerMonth,
        utilitiesPerMonth: listing.utilitiesPerMonth,
        depositAmount: listing.depositAmount,
        availableFrom: listing.availableFrom.toISOString(),
        requiresCreditCheck: listing.requiresCreditCheck,
        status: listing.status,
        userId: listing.userId,
        createdAt: listing.createdAt.toISOString(),
        updatedAt: listing.updatedAt.toISOString(),
        landlord: listing.user
          ? {
              id: listing.user.id,
              name: listing.user.name,
              firstName: listing.user.firstName,
              nickname: listing.user.nickname,
              image: listing.user.image,
              verified: listing.user.verified,
              createdAt: listing.user.createdAt.toISOString(),
            }
          : null,
        images: imageUrls,
      },
    })
  } catch (e: unknown) {
    console.error('[rental-listings/[id] GET]', e)
    const msg = e instanceof Error ? e.message : 'Fehler'
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}

async function assertListingOwner(listingId: string, userId: string) {
  const row = await prisma.rentalListing.findFirst({
    where: { id: listingId, userId },
    select: { id: true },
  })
  return Boolean(row)
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

    const existing = await prisma.rentalListing.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!existing) {
      return NextResponse.json({ message: 'Nicht gefunden' }, { status: 404 })
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ message: 'Ungültiger Body' }, { status: 400 })
    }

    const data: Prisma.RentalListingUpdateInput = {}

    if (typeof body.title === 'string') data.title = body.title.trim()
    if (typeof body.description === 'string') {
      if (body.description.trim().length < 50) {
        return NextResponse.json({ message: 'Beschreibung mindestens 50 Zeichen' }, { status: 400 })
      }
      data.description = body.description.trim()
    }
    if (typeof body.address === 'string') data.address = body.address.trim()
    if (typeof body.zip === 'string') data.zip = body.zip.trim()
    if (typeof body.city === 'string') data.city = body.city.trim()
    if (typeof body.canton === 'string') data.canton = body.canton.trim().toUpperCase()

    if (body.rooms !== undefined) {
      const roomsN = parseFloat(String(body.rooms))
      if (Number.isNaN(roomsN)) {
        return NextResponse.json({ message: 'Ungültige Zimmeranzahl' }, { status: 400 })
      }
      data.rooms = roomsN
    }
    if (body.areaSqm !== undefined) {
      const areaN = parseInt(String(body.areaSqm), 10)
      if (Number.isNaN(areaN) || areaN < 1) {
        return NextResponse.json({ message: 'Ungültige Fläche' }, { status: 400 })
      }
      data.areaSqm = areaN
    }
    if (body.floor !== undefined) {
      if (body.floor === '' || body.floor === null) {
        data.floor = null
      } else {
        const f = parseInt(String(body.floor), 10)
        data.floor = Number.isNaN(f) ? null : f
      }
    }
    if (body.rentPerMonth !== undefined) {
      const rentN = parseInt(String(body.rentPerMonth), 10)
      if (Number.isNaN(rentN) || rentN < 0) {
        return NextResponse.json({ message: 'Ungültige Miete' }, { status: 400 })
      }
      data.rentPerMonth = rentN
    }
    if (body.utilitiesPerMonth !== undefined) {
      if (body.utilitiesPerMonth === '' || body.utilitiesPerMonth === null) {
        data.utilitiesPerMonth = null
      } else {
        const u = parseInt(String(body.utilitiesPerMonth), 10)
        data.utilitiesPerMonth = Number.isNaN(u) ? null : u
      }
    }
    if (body.depositAmount !== undefined) {
      if (body.depositAmount === '' || body.depositAmount === null) {
        data.depositAmount = null
      } else {
        const d = parseInt(String(body.depositAmount), 10)
        data.depositAmount = Number.isNaN(d) ? null : d
      }
    }
    if (body.availableFrom !== undefined && body.availableFrom !== '') {
      const avail = new Date(String(body.availableFrom))
      if (Number.isNaN(avail.getTime())) {
        return NextResponse.json({ message: 'Ungültiges Datum' }, { status: 400 })
      }
      data.availableFrom = avail
    }
    if (body.photos !== undefined) {
      const photoArr = Array.isArray(body.photos) ? body.photos.filter((u): u is string => typeof u === 'string') : []
      if (photoArr.length < 3 || photoArr.length > 10) {
        return NextResponse.json({ message: 'Mindestens 3 und maximal 10 Fotos' }, { status: 400 })
      }
      data.photos = JSON.stringify(photoArr)
    }
    if (typeof body.status === 'string') {
      const st = body.status as string
      if (!STATUS_VALUES.has(st)) {
        return NextResponse.json({ message: 'Ungültiger Status' }, { status: 400 })
      }
      const nextSt = st as RentalListingStatus
      data.status = nextSt
      if (nextSt === 'active' && existing.status === 'archived') {
        data.autoDeactivatedAt = null
        data.autoDeactivatedReason = null
        data.needsExpiryReview = false
      }
    }

    const hasMonitoringUrl = rentalListingHasMonitoringHttpUrl(existing.importedFrom)
    const nextListingExpiresOn =
      'listingExpiresOn' in body ? parseListingExpiresOnFromBody(body) : existing.listingExpiresOn
    const expiryVal = validateListingExpiresOnForUpsert({
      hasMonitoringUrl,
      listingExpiresOn: nextListingExpiresOn,
      intent: 'edit',
      existingListingExpiresOn: existing.listingExpiresOn,
    })
    if (!expiryVal.ok) {
      return NextResponse.json({ message: expiryVal.message }, { status: 400 })
    }
    if ('listingExpiresOn' in body) {
      data.listingExpiresOn = expiryVal.value
    }

    if (
      typeof body.status === 'string' &&
      body.status === 'active' &&
      existing.status === 'archived' &&
      !rentalListingHasMonitoringHttpUrl(existing.importedFrom)
    ) {
      const effExpires = 'listingExpiresOn' in body ? expiryVal.value : existing.listingExpiresOn
      const today = todayYmdInZurich()
      if (!effExpires || effExpires < today) {
        return NextResponse.json(
          {
            message:
              'Zum Reaktivieren ohne überwachbare Original-URL (https://…) bitte ein neues «Gültig bis»-Datum in der Zukunft setzen.',
          },
          { status: 400 },
        )
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ message: 'Keine Felder zum Aktualisieren' }, { status: 400 })
    }

    const updated = await prisma.rentalListing.update({
      where: { id },
      data,
    })

    revalidatePath('/matching/properties')
    revalidatePath(`/matching/properties/${id}/bearbeiten`)
    revalidatePath(`/matching/properties/${id}/bewerbungen`)
    revalidatePath(`/wohnungen/${id}`)
    revalidatePath('/wohnungen')

    return NextResponse.json({
      id: updated.id,
      message: 'Inserat aktualisiert',
    })
  } catch (e: unknown) {
    console.error('[rental-listings/[id] PATCH]', e)
    const msg = e instanceof Error ? e.message : 'Fehler'
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }
    const { id } = await params
    if (!id) {
      return NextResponse.json({ message: 'Fehlt' }, { status: 400 })
    }

    const ok = await assertListingOwner(id, session.user.id)
    if (!ok) {
      return NextResponse.json({ message: 'Nicht gefunden' }, { status: 404 })
    }

    await prisma.rentalListing.delete({ where: { id } })

    revalidatePath('/matching/properties')
    revalidatePath('/wohnungen')

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    console.error('[rental-listings/[id] DELETE]', e)
    const msg = e instanceof Error ? e.message : 'Fehler'
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}
