import { authOptions } from '@/lib/auth'
import { evaluateMatch, parsePostalCodesList } from '@/lib/matching/evaluate-match'
import { prisma } from '@/lib/prisma'
import { trackRentalMatchMetricsEvent } from '@/lib/rental/match-metrics'
import { decideRentalMatchRollout } from '@/lib/rental/match-rollout'
import type { Prisma } from '@prisma/client'
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

function hasAnyPreferences(profile: {
  preferredCanton: string | null
  preferredPostalCodes: string | null
  preferredBudgetMin: number | null
  preferredBudgetMax: number | null
  preferredMinRooms: number | null
  preferredMaxRooms: number | null
  preferredMoveInEarliest: Date | null
  preferredMoveInLatest: Date | null
} | null): boolean {
  if (!profile) return false
  return Boolean(
    profile.preferredCanton ||
      parsePostalCodesList(profile.preferredPostalCodes).length > 0 ||
      profile.preferredBudgetMin != null ||
      profile.preferredBudgetMax != null ||
      profile.preferredMinRooms != null ||
      profile.preferredMaxRooms != null ||
      profile.preferredMoveInEarliest != null ||
      profile.preferredMoveInLatest != null
  )
}

function parseZimmerParam(raw: string | null, kind: 'min' | 'max'): number | null {
  if (raw == null || raw === '') return null
  if (raw === '5plus') return kind === 'min' ? 5 : null
  const v = parseFloat(String(raw).replace(',', '.'))
  return Number.isFinite(v) ? v : null
}

function parseMaxMieteParam(raw: string | null): number | null {
  if (raw == null || raw === '') return null
  if (raw === '5000plus') return null
  const v = parseInt(String(raw), 10)
  return Number.isFinite(v) ? v : null
}

function parsePositiveInt(raw: string | null): number | null {
  if (raw == null || raw === '') return null
  const v = parseInt(String(raw), 10)
  return Number.isFinite(v) && v > 0 ? v : null
}

/** Filter + Sortierung für öffentliche Wohnungsliste (GET ohne mode=match). */
function buildPublicListingQuery(sp: URLSearchParams): {
  where: Prisma.RentalListingWhereInput
  orderBy: Prisma.RentalListingOrderByWithRelationInput[]
} {
  const canton = sp.get('canton')?.trim() || sp.get('kanton')?.trim() || ''
  const minRoomsRaw = sp.get('minRooms') ?? sp.get('zimmer') ?? ''
  const maxRoomsRaw = sp.get('maxzimmer') ?? sp.get('maxRooms') ?? ''
  const maxRentRaw = sp.get('maxRent') ?? sp.get('maxmiete') ?? ''
  const minRentRaw = sp.get('minRent') ?? sp.get('minmiete') ?? ''
  const availableFrom = sp.get('availableFrom')?.trim() || sp.get('verfuegbar')?.trim() || ''
  const minAreaRaw = sp.get('minArea') ?? sp.get('minflaeche') ?? ''
  const q = (sp.get('q') || sp.get('ort') || '').trim().slice(0, 100)
  const auszug = (sp.get('auszug') || '').trim().toLowerCase()
  const sort = (sp.get('sort') || 'neueste').trim().toLowerCase()

  const andParts: Prisma.RentalListingWhereInput[] = [{ status: 'active' }]

  if (canton) {
    andParts.push({ canton })
  }

  const rMin = parseZimmerParam(minRoomsRaw, 'min')
  const rMax = parseZimmerParam(maxRoomsRaw, 'max')
  const roomFilter: Prisma.FloatFilter = {}
  if (rMin != null) roomFilter.gte = rMin
  if (rMax != null) roomFilter.lte = rMax
  if (Object.keys(roomFilter).length > 0) {
    andParts.push({ rooms: roomFilter })
  }

  const maxRent = parseMaxMieteParam(maxRentRaw)
  if (maxRent != null) {
    andParts.push({ rentPerMonth: { lte: maxRent } })
  }
  const minRent = parsePositiveInt(minRentRaw)
  if (minRent != null) {
    andParts.push({ rentPerMonth: { gte: minRent } })
  }

  if (availableFrom) {
    const d = new Date(availableFrom)
    if (!Number.isNaN(d.getTime())) {
      andParts.push({ availableFrom: { gte: d } })
    }
  }

  const minArea = parsePositiveInt(minAreaRaw)
  if (minArea != null) {
    andParts.push({ areaSqm: { gte: minArea } })
  }

  if (q.length >= 2) {
    andParts.push({
      OR: [
        { city: { contains: q, mode: 'insensitive' } },
        { zip: { contains: q, mode: 'insensitive' } },
        { title: { contains: q, mode: 'insensitive' } },
      ],
    })
  }

  if (auszug === 'pflicht') {
    andParts.push({ requiresCreditCheck: true })
  } else if (auszug === 'freiwillig' || auszug === 'optional') {
    andParts.push({ requiresCreditCheck: false })
  }

  let orderBy: Prisma.RentalListingOrderByWithRelationInput[] = [{ createdAt: 'desc' }]
  if (sort === 'miete_asc') orderBy = [{ rentPerMonth: 'asc' }, { createdAt: 'desc' }]
  else if (sort === 'miete_desc') orderBy = [{ rentPerMonth: 'desc' }, { createdAt: 'desc' }]
  else if (sort === 'flaeche_desc') orderBy = [{ areaSqm: 'desc' }, { createdAt: 'desc' }]

  return { where: { AND: andParts }, orderBy }
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

    const mode = searchParams.get('mode') === 'match' ? 'match' : 'all'
    const { where, orderBy } = buildPublicListingQuery(searchParams)

    const listings = await prisma.rentalListing.findMany({
      where,
      orderBy,
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

    if (mode !== 'match') {
      await trackRentalMatchMetricsEvent(request, null, {
        mode: 'all',
        isLoggedIn: false,
        needsPreferences: false,
        rolloutBlocked: false,
        rolloutReason: 'mode_all',
        totalResults: parsed.length,
        matchedResults: parsed.length,
      })
      return NextResponse.json({
        listings: parsed,
        meta: {
          mode: 'all',
          isLoggedIn: false,
          needsPreferences: false,
          totalMatched: parsed.length,
        },
      })
    }

    const session = await getServerSession(authOptions)
    const userId = session?.user?.id ?? null
    const user = userId
      ? await prisma.user.findUnique({
          where: { id: userId },
          select: { isAdmin: true },
        })
      : null
    const rollout = decideRentalMatchRollout({ userId, isAdmin: Boolean(user?.isAdmin) })

    if (!rollout.enabled) {
      await trackRentalMatchMetricsEvent(request, userId, {
        mode: 'match',
        isLoggedIn: Boolean(userId),
        needsPreferences: false,
        rolloutBlocked: true,
        rolloutReason: rollout.reason,
        totalResults: 0,
        matchedResults: 0,
      })
      return NextResponse.json({
        listings: [],
        meta: {
          mode: 'match',
          isLoggedIn: Boolean(userId),
          needsPreferences: false,
          totalMatched: 0,
          rolloutEnabled: false,
          rolloutReason: rollout.reason,
        },
      })
    }

    if (!userId) {
      await trackRentalMatchMetricsEvent(request, null, {
        mode: 'match',
        isLoggedIn: false,
        needsPreferences: false,
        rolloutBlocked: false,
        rolloutReason: 'missing_user',
        totalResults: 0,
        matchedResults: 0,
      })
      return NextResponse.json({
        listings: [],
        meta: {
          mode: 'match',
          isLoggedIn: false,
          needsPreferences: false,
          totalMatched: 0,
          rolloutEnabled: true,
          rolloutReason: 'enabled',
        },
      })
    }

    const profile = await prisma.tenantProfile.findUnique({
      where: { userId },
      select: {
        preferredCanton: true,
        preferredPostalCodes: true,
        preferredBudgetMin: true,
        preferredBudgetMax: true,
        preferredMinRooms: true,
        preferredMaxRooms: true,
        preferredMoveInEarliest: true,
        preferredMoveInLatest: true,
      },
    })

    if (!hasAnyPreferences(profile)) {
      await trackRentalMatchMetricsEvent(request, userId, {
        mode: 'match',
        isLoggedIn: true,
        needsPreferences: true,
        rolloutBlocked: false,
        rolloutReason: 'needs_preferences',
        totalResults: 0,
        matchedResults: 0,
      })
      return NextResponse.json({
        listings: [],
        meta: {
          mode: 'match',
          isLoggedIn: true,
          needsPreferences: true,
          totalMatched: 0,
          rolloutEnabled: true,
          rolloutReason: 'enabled',
        },
      })
    }

    const seeker = {
      cantonPreference: profile?.preferredCanton ?? null,
      postalCodesWanted: profile?.preferredPostalCodes ?? null,
      budgetMin: profile?.preferredBudgetMin ?? null,
      budgetMax: profile?.preferredBudgetMax ?? null,
      minRooms: profile?.preferredMinRooms ?? null,
      maxRooms: profile?.preferredMaxRooms ?? null,
      moveInEarliest: profile?.preferredMoveInEarliest ?? null,
      moveInLatest: profile?.preferredMoveInLatest ?? null,
      hasPets: false,
    }

    const ranked = parsed
      .map(l => {
        const result = evaluateMatch(
          seeker,
          {
            id: l.id,
            canton: l.canton,
            zip: l.zip,
            rooms: Number(l.rooms),
            rentPerMonth: l.rentPerMonth,
            availableFrom: new Date(l.availableFrom),
            status: 'active',
          },
          {}
        )
        return { listing: l, result }
      })
      .filter(x => !x.result.hardFailed)
      .map(x => ({
        ...x.listing,
        matchScore: x.result.score,
        matchHighlights: x.result.reasons
          .filter(r => r.kind === 'soft')
          .slice(0, 2)
          .map(r => r.detail || 'Guter Match'),
      }))
      .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    await trackRentalMatchMetricsEvent(request, userId, {
      mode: 'match',
      isLoggedIn: true,
      needsPreferences: false,
      rolloutBlocked: false,
      rolloutReason: 'enabled',
      totalResults: parsed.length,
      matchedResults: ranked.length,
      scoreValues: ranked.map(x => x.matchScore ?? 0),
    })

    return NextResponse.json({
      listings: ranked,
      meta: {
        mode: 'match',
        isLoggedIn: true,
        needsPreferences: false,
        totalMatched: ranked.length,
        rolloutEnabled: true,
        rolloutReason: 'enabled',
      },
    })
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
