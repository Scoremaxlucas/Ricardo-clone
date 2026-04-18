import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function safeParsePhotos(raw: string): string[] {
  try {
    const j = JSON.parse(raw)
    return Array.isArray(j) ? j.filter((x: unknown) => typeof x === 'string') : []
  } catch {
    return []
  }
}

/** GET: nur aktive Inserate, öffentlich — oder `?own=true` für eingeloggten Vermieter (Navbar). */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    if (searchParams.get('own') === 'true') {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return NextResponse.json({ hasListings: false })
      }
      const count = await prisma.rentalListing.count({
        where: { userId: session.user.id },
      })
      return NextResponse.json({ hasListings: count > 0 })
    }

    const canton = searchParams.get('canton')?.trim() || ''
    const minRooms = searchParams.get('minRooms')
    const maxRent = searchParams.get('maxRent')
    const availableFrom = searchParams.get('availableFrom')?.trim() || ''

    const where: Record<string, unknown> = {
      status: 'active',
    }

    if (canton) {
      where.canton = canton
    }
    if (minRooms != null && minRooms !== '') {
      const v = parseFloat(minRooms)
      if (!Number.isNaN(v)) {
        where.rooms = { gte: v }
      }
    }
    if (maxRent != null && maxRent !== '') {
      const v = parseInt(maxRent, 10)
      if (!Number.isNaN(v)) {
        where.rentPerMonth = { lte: v }
      }
    }
    if (availableFrom) {
      const d = new Date(availableFrom)
      if (!Number.isNaN(d.getTime())) {
        where.availableFrom = { gte: d }
      }
    }

    const listings = await prisma.rentalListing.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        title: true,
        zip: true,
        city: true,
        canton: true,
        rooms: true,
        areaSqm: true,
        floor: true,
        rentPerMonth: true,
        utilitiesPerMonth: true,
        availableFrom: true,
        depositAmount: true,
        requiresCreditCheck: true,
        photos: true,
        createdAt: true,
        user: {
          select: { id: true, nickname: true, name: true, image: true },
        },
      },
    })

    const parsed = listings.map(l => ({
      ...l,
      availableFrom: l.availableFrom.toISOString(),
      createdAt: l.createdAt.toISOString(),
      imageUrls: safeParsePhotos(l.photos),
    }))

    return NextResponse.json({ listings: parsed })
  } catch (e: unknown) {
    console.error('[rental-listings GET]', e)
    const msg = e instanceof Error ? e.message : 'Fehler'
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}

/** POST: neues Inserat (auth) */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      address,
      zip,
      city,
      canton,
      rooms,
      areaSqm,
      floor,
      rentPerMonth,
      utilitiesPerMonth,
      depositAmount,
      availableFrom,
      requiresCreditCheck,
      photos,
    } = body

    if (!title || !description || !address || !zip || !city || !canton) {
      return NextResponse.json({ message: 'Pflichtfelder fehlen' }, { status: 400 })
    }
    if (String(description).trim().length < 50) {
      return NextResponse.json({ message: 'Beschreibung mindestens 50 Zeichen' }, { status: 400 })
    }

    const roomsN = parseFloat(rooms)
    const areaN = parseInt(String(areaSqm), 10)
    const rentN = parseInt(String(rentPerMonth), 10)
    if (Number.isNaN(roomsN) || Number.isNaN(areaN) || Number.isNaN(rentN) || areaN < 1 || rentN < 0) {
      return NextResponse.json({ message: 'Ungültige Zahlenwerte' }, { status: 400 })
    }

    let floorN: number | null = null
    if (floor !== '' && floor != null) {
      const f = parseInt(String(floor), 10)
      floorN = Number.isNaN(f) ? null : f
    }

    let utilN: number | null = null
    if (utilitiesPerMonth !== '' && utilitiesPerMonth != null) {
      const u = parseInt(String(utilitiesPerMonth), 10)
      utilN = Number.isNaN(u) ? null : u
    }

    let depN: number | null = null
    if (depositAmount !== '' && depositAmount != null) {
      const d = parseInt(String(depositAmount), 10)
      depN = Number.isNaN(d) ? null : d
    }

    if (!availableFrom) {
      return NextResponse.json({ message: 'Verfügbar ab erforderlich' }, { status: 400 })
    }
    const avail = new Date(availableFrom)
    if (Number.isNaN(avail.getTime())) {
      return NextResponse.json({ message: 'Ungültiges Datum' }, { status: 400 })
    }

    const photoArr = Array.isArray(photos) ? photos.filter((u: unknown) => typeof u === 'string') : []
    if (photoArr.length < 3 || photoArr.length > 10) {
      return NextResponse.json({ message: 'Mindestens 3 und maximal 10 Fotos' }, { status: 400 })
    }

    const listing = await prisma.rentalListing.create({
      data: {
        userId: session.user.id,
        title: String(title).trim(),
        description: String(description).trim(),
        address: String(address).trim(),
        zip: String(zip).trim(),
        city: String(city).trim(),
        canton: String(canton).trim().toUpperCase(),
        rooms: roomsN,
        areaSqm: areaN,
        floor: floorN,
        rentPerMonth: rentN,
        utilitiesPerMonth: utilN,
        depositAmount: depN,
        availableFrom: avail,
        requiresCreditCheck: Boolean(requiresCreditCheck),
        photos: JSON.stringify(photoArr),
        status: 'active',
      },
    })

    return NextResponse.json({
      id: listing.id,
      message: 'Inserat erstellt',
    })
  } catch (e: unknown) {
    console.error('[rental-listings POST]', e)
    const msg = e instanceof Error ? e.message : 'Fehler'
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}
