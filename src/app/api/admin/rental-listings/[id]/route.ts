import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { prisma } from '@/lib/prisma'
import { encryptLandlordContactForStorage } from '@/lib/rental/pdf-crypto'
import type { Prisma } from '@prisma/client'
import { ImportSource, RentalListingStatus } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const STATUS_VALUES = new Set<string>(Object.values(RentalListingStatus))
const SOURCE_SET = new Set<string>(Object.values(ImportSource))

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!(await isAdmin(session))) {
      return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ message: 'Fehlt' }, { status: 400 })
    }

    const existing = await prisma.rentalListing.findFirst({ where: { id } })
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
    if (typeof body.requiresCreditCheck === 'boolean') {
      data.requiresCreditCheck = body.requiresCreditCheck
    }
    if (body.photos !== undefined) {
      const photoArr = Array.isArray(body.photos) ? body.photos.filter((u): u is string => typeof u === 'string') : []
      if (photoArr.length > 10) {
        return NextResponse.json({ message: 'Maximal 10 Fotos' }, { status: 400 })
      }
      data.photos = JSON.stringify(photoArr)
    }
    if (typeof body.status === 'string') {
      const st = body.status as string
      if (!STATUS_VALUES.has(st)) {
        return NextResponse.json({ message: 'Ungültiger Status' }, { status: 400 })
      }
      data.status = st as RentalListingStatus
    }

    if (typeof body.importSource === 'string' && SOURCE_SET.has(body.importSource)) {
      data.importSource = body.importSource as ImportSource
    }
    if (body.importedFrom !== undefined) {
      if (body.importedFrom === null || body.importedFrom === '') {
        data.importedFrom = null
      } else if (typeof body.importedFrom === 'string') {
        data.importedFrom = body.importedFrom.trim().slice(0, 2000)
      }
    }

    if (typeof body.landlordContactPlain === 'string') {
      const t = body.landlordContactPlain.trim()
      data.landlordContact = t ? encryptLandlordContactForStorage(t) : null
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ message: 'Keine Felder zum Aktualisieren' }, { status: 400 })
    }

    const updated = await prisma.rentalListing.update({
      where: { id },
      data,
    })

    revalidatePath('/admin/listings')
    revalidatePath(`/admin/listings/${id}/bearbeiten`)
    revalidatePath('/wohnungen')
    revalidatePath(`/wohnungen/${id}`)
    revalidatePath('/matching/properties')

    return NextResponse.json({
      id: updated.id,
      message: 'Inserat aktualisiert',
    })
  } catch (e: unknown) {
    console.error('[admin/rental-listings/[id] PATCH]', e)
    const msg = e instanceof Error ? e.message : 'Fehler'
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!(await isAdmin(session))) {
      return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ message: 'Fehlt' }, { status: 400 })
    }

    const existing = await prisma.rentalListing.findFirst({ where: { id }, select: { id: true } })
    if (!existing) {
      return NextResponse.json({ message: 'Nicht gefunden' }, { status: 404 })
    }

    await prisma.rentalListing.delete({ where: { id } })

    revalidatePath('/admin/listings')
    revalidatePath('/wohnungen')
    revalidatePath('/matching/properties')

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    console.error('[admin/rental-listings/[id] DELETE]', e)
    const msg = e instanceof Error ? e.message : 'Fehler'
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}
