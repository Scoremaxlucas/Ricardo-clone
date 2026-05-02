import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { prisma } from '@/lib/prisma'
import { encryptLandlordContactForStorage } from '@/lib/rental/pdf-crypto'
import {
  parseListingExpiresOnFromBody,
  rentalListingHasMonitoringHttpUrl,
  validateListingExpiresOnForUpsert,
} from '@/lib/rental/rental-listing-expiry-on'
import { ImportSource } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SOURCE_SET = new Set<string>(Object.values(ImportSource))

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!(await isAdmin(session))) {
      return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
    }
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
      photos,
      importSource: rawSource,
      importedFrom: rawImported,
      landlordContactPlain,
      status: rawCreateStatus,
      ingestPermissionBasis: rawIngestBasis,
      landlordConsentAck,
    } = body

    if (!title || !description || !zip || !city || !canton) {
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
    if (photoArr.length > 10) {
      return NextResponse.json({ message: 'Maximal 10 Fotos' }, { status: 400 })
    }

    const importSource =
      typeof rawSource === 'string' && SOURCE_SET.has(rawSource) ? (rawSource as ImportSource) : ImportSource.SELF
    let importedFrom: string | null =
      typeof rawImported === 'string' && rawImported.trim() ? String(rawImported).trim().slice(0, 2000) : null

    const ingestPermissionBasis =
      typeof rawIngestBasis === 'string' && rawIngestBasis.trim()
        ? String(rawIngestBasis).trim().slice(0, 120)
        : null

    if (ingestPermissionBasis === 'landlord_consent' && !Boolean(landlordConsentAck)) {
      return NextResponse.json(
        { message: 'Bitte bestätigen: Vermieter hat ausdrücklich zugestimmt.' },
        { status: 400 }
      )
    }

    if (importSource === ImportSource.IMPORTED && !importedFrom) {
      if (ingestPermissionBasis === 'landlord_consent' && Boolean(landlordConsentAck)) {
        importedFrom = 'Vermieter-Einwilligung (keine öffentliche URL)'
      } else {
        return NextResponse.json({ message: 'Import: Original-URL erforderlich' }, { status: 400 })
      }
    }
    if (importSource === ImportSource.SELF) {
      importedFrom = null
    }

    const landlordContact =
      typeof landlordContactPlain === 'string' && landlordContactPlain.trim()
        ? encryptLandlordContactForStorage(landlordContactPlain.trim())
        : null

    const createStatus = rawCreateStatus === 'archived' ? 'archived' : 'active'

    const hasMonitoringUrl = rentalListingHasMonitoringHttpUrl(importedFrom)
    const bodyRecord = body as Record<string, unknown>
    const parsedExpires = parseListingExpiresOnFromBody(bodyRecord)
    const expiryCheck = validateListingExpiresOnForUpsert({
      hasMonitoringUrl,
      listingExpiresOn: parsedExpires,
      intent: 'create',
    })
    if (!expiryCheck.ok) {
      return NextResponse.json({ message: expiryCheck.message }, { status: 400 })
    }

    const listing = await prisma.rentalListing.create({
      data: {
        userId: session.user.id,
        title: String(title).trim(),
        description: String(description).trim(),
        address: typeof address === 'string' ? address.trim() : '',
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
        requiresCreditCheck: true,
        photos: JSON.stringify(photoArr),
        status: createStatus,
        importSource,
        importedFrom,
        landlordContact,
        ingestPermissionBasis,
        listingExpiresOn: expiryCheck.value,
      },
    })

    revalidatePath('/admin/listings')
    revalidatePath('/wohnungen')
    revalidatePath('/matching/properties')

    return NextResponse.json({
      id: listing.id,
      message: 'Inserat erstellt',
    })
  } catch (e: unknown) {
    console.error('[admin/rental-listings POST]', e)
    const msg = e instanceof Error ? e.message : 'Fehler'
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}
