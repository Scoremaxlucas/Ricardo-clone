import {
  batchPostalCodeToCoordinates,
  calculateDistance,
  isValidSwissPostalCode,
  postalCodeToCoordinates,
} from '@/lib/geolocation'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route für geografische Suche (Feature 3: Lokale Karte)
 *
 * GET /api/watches/nearby?postalCode=8000&radius=10&limit=20
 *
 * Gibt Produkte in der Nähe einer Postleitzahl zurück
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postalCode = searchParams.get('postalCode') || ''
    const radius = parseFloat(searchParams.get('radius') || '10') // Default: 10km
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!postalCode || !isValidSwissPostalCode(postalCode)) {
      return NextResponse.json(
        {
          error:
            'Ungültige Postleitzahl. Bitte geben Sie eine 4-stellige Schweizer Postleitzahl ein.',
        },
        { status: 400 }
      )
    }

    // Hole Koordinaten für die Postleitzahl
    const centerCoords = await postalCodeToCoordinates(postalCode)
    if (!centerCoords) {
      return NextResponse.json(
        { error: 'Koordinaten für diese Postleitzahl konnten nicht gefunden werden.' },
        { status: 404 }
      )
    }

    // Hole alle Produkte mit Postleitzahl
    // RICARDO-STYLE: Exclude blocked, removed, ended (not just rejected)
    const now = new Date()
    const watches = await prisma.watch.findMany({
      where: {
        AND: [
          {
            OR: [
              { moderationStatus: null },
              { moderationStatus: { notIn: ['rejected', 'blocked', 'removed', 'ended'] } },
            ],
          },
          {
            // Nicht verkauft
            OR: [{ purchases: { none: {} } }, { purchases: { every: { status: 'cancelled' } } }],
          },
          {
            // Auktionen noch nicht abgelaufen
            OR: [{ auctionEnd: null }, { auctionEnd: { gt: now } }],
          },
          {
            // Seller hat Postleitzahl
            seller: {
              postalCode: { not: null },
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        brand: true,
        model: true,
        price: true,
        images: true,
        createdAt: true,
        isAuction: true,
        auctionEnd: true,
        seller: {
          select: {
            id: true,
            name: true,
            city: true,
            postalCode: true,
          },
        },
      },
      take: 100, // Hole mehr für Filterung, dann limitieren wir nach Distanz
    })

    // OPTIMIERT: Batch-Konvertierung aller eindeutigen Postleitzahlen
    const uniquePostalCodes = Array.from(
      new Set(watches.map(w => w.seller?.postalCode).filter(Boolean) as string[])
    )
    const coordinatesMap = await batchPostalCodeToCoordinates(uniquePostalCodes)

    // Berechne Distanz für jedes Produkt und filtere nach Radius
    const watchesWithDistance = watches
      .map(watch => {
        const sellerPostalCode = watch.seller?.postalCode
        if (!sellerPostalCode) {
          return null
        }

        const watchCoords = coordinatesMap.get(sellerPostalCode)
        if (!watchCoords) {
          return null
        }

        const distance = calculateDistance(
          centerCoords.lat,
          centerCoords.lon,
          watchCoords.lat,
          watchCoords.lon
        )

        if (distance > radius) {
          return null
        }

        return {
          ...watch,
          postalCode: sellerPostalCode,
          city: watch.seller?.city || null,
          distance,
          coordinates: watchCoords,
        }
      })
      .filter((w): w is NonNullable<typeof w> => w !== null)

    // Filtere null-Werte und sortiere nach Distanz
    const nearbyWatches = watchesWithDistance
      .filter((w): w is NonNullable<typeof w> => w !== null)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit)

    return NextResponse.json({
      center: {
        postalCode,
        coordinates: centerCoords,
      },
      radius,
      watches: nearbyWatches,
      count: nearbyWatches.length,
    })
  } catch (error: any) {
    console.error('Error fetching nearby watches:', error)
    return NextResponse.json(
      {
        error: 'Fehler beim Laden der Produkte in der Nähe',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
