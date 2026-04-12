import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** GET: Liste mit Filtern (öffentlich) */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postalCode = searchParams.get('postalCode')?.trim() || ''
    const canton = searchParams.get('canton')?.trim() || ''
    const minRooms = searchParams.get('minRooms')
    const maxRooms = searchParams.get('maxRooms')
    const maxRent = searchParams.get('maxRent')

    const where: any = {
      moderationStatus: { not: 'rejected' },
    }

    if (postalCode) {
      where.postalCode = { startsWith: postalCode }
    }
    if (canton) {
      where.canton = canton
    }
    const roomsFilter: { gte?: number; lte?: number } = {}
    if (minRooms != null && minRooms !== '') {
      const v = parseFloat(minRooms)
      if (!Number.isNaN(v)) roomsFilter.gte = v
    }
    if (maxRooms != null && maxRooms !== '') {
      const v = parseFloat(maxRooms)
      if (!Number.isNaN(v)) roomsFilter.lte = v
    }
    if (Object.keys(roomsFilter).length > 0) {
      where.rooms = roomsFilter
    }
    if (maxRent != null && maxRent !== '') {
      const v = parseFloat(maxRent)
      if (!Number.isNaN(v)) where.monthlyRentChf = { lte: v }
    }

    const listings = await prisma.rentalListing.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        title: true,
        postalCode: true,
        canton: true,
        rooms: true,
        livingAreaM2: true,
        floor: true,
        monthlyRentChf: true,
        extraCostsChf: true,
        availableFrom: true,
        depositChf: true,
        requiresCreditCheck: true,
        images: true,
        createdAt: true,
        seller: {
          select: { id: true, nickname: true, name: true, image: true },
        },
      },
    })

    const parsed = listings.map(l => ({
      ...l,
      availableFrom: l.availableFrom.toISOString(),
      createdAt: l.createdAt.toISOString(),
      imageUrls: safeParseImages(l.images),
    }))

    return NextResponse.json({ listings: parsed })
  } catch (e: any) {
    console.error('[rental-listings GET]', e)
    return NextResponse.json({ message: e?.message || 'Fehler' }, { status: 500 })
  }
}

function safeParseImages(raw: string): string[] {
  try {
    const j = JSON.parse(raw)
    return Array.isArray(j) ? j.filter((x: unknown) => typeof x === 'string') : []
  } catch {
    return []
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
      address,
      postalCode,
      canton,
      rooms,
      livingAreaM2,
      floor,
      monthlyRentChf,
      extraCostsChf,
      availableFrom,
      depositChf,
      description,
      requiresCreditCheck,
      images,
    } = body

    if (!title || !address || !postalCode || !canton) {
      return NextResponse.json({ message: 'Pflichtfelder fehlen' }, { status: 400 })
    }
    const roomsN = parseFloat(rooms)
    const areaN = parseFloat(livingAreaM2)
    const rentN = parseFloat(monthlyRentChf)
    const extraN = parseFloat(extraCostsChf)
    if (Number.isNaN(roomsN) || Number.isNaN(areaN) || Number.isNaN(rentN) || Number.isNaN(extraN)) {
      return NextResponse.json({ message: 'Ungültige Zahlenwerte' }, { status: 400 })
    }
    if (!floor || String(floor).trim() === '') {
      return NextResponse.json({ message: 'Etage erforderlich' }, { status: 400 })
    }
    if (!availableFrom || !description) {
      return NextResponse.json({ message: 'Datum und Beschreibung erforderlich' }, { status: 400 })
    }
    const avail = new Date(availableFrom)
    if (Number.isNaN(avail.getTime())) {
      return NextResponse.json({ message: 'Ungültiges Datum' }, { status: 400 })
    }

    const imgArr = Array.isArray(images) ? images.filter((u: unknown) => typeof u === 'string') : []
    if (imgArr.length < 3) {
      return NextResponse.json({ message: 'Mindestens 3 Fotos erforderlich' }, { status: 400 })
    }

    const deposit =
      depositChf === '' || depositChf == null
        ? null
        : parseFloat(String(depositChf))
    if (deposit != null && Number.isNaN(deposit)) {
      return NextResponse.json({ message: 'Ungültige Kaution' }, { status: 400 })
    }

    const listing = await prisma.rentalListing.create({
      data: {
        sellerId: session.user.id,
        title: String(title).trim(),
        address: String(address).trim(),
        postalCode: String(postalCode).trim(),
        canton: String(canton).trim().toUpperCase(),
        rooms: roomsN,
        livingAreaM2: areaN,
        floor: String(floor).trim(),
        monthlyRentChf: rentN,
        extraCostsChf: extraN,
        availableFrom: avail,
        depositChf: deposit,
        description: String(description).trim(),
        requiresCreditCheck: Boolean(requiresCreditCheck),
        images: JSON.stringify(imgArr),
        moderationStatus: 'approved',
      },
    })

    return NextResponse.json({
      id: listing.id,
      message: 'Inserat erstellt',
    })
  } catch (e: any) {
    console.error('[rental-listings POST]', e)
    return NextResponse.json({ message: e?.message || 'Fehler' }, { status: 500 })
  }
}
