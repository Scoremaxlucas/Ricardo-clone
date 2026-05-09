import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { prisma } from '@/lib/prisma'
import { encryptLandlordContactForStorage } from '@/lib/rental/pdf-crypto'
import {
  parseListingExpiresOnFromBody,
  rentalListingHasMonitoringHttpUrl,
  todayYmdInZurich,
  validateListingExpiresOnForUpsert,
} from '@/lib/rental/rental-listing-expiry-on'
import {
  normalizeAndValidateLandlordNotifyEmail,
  resolveLandlordApplicationNotifyEmail,
} from '@/lib/rental/resolve-landlord-notify-email'
import type { Prisma } from '@prisma/client'
import { DeactivationReason, ImportSource, RentalListingStatus } from '@prisma/client'
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
      const next = st as RentalListingStatus
      data.status = next
      if (
        next === 'archived' &&
        (existing.status === 'active' || existing.status === 'rented')
      ) {
        data.autoDeactivatedAt = new Date()
        data.autoDeactivatedReason = DeactivationReason.MANUAL_ADMIN
      }
      if (next === 'active' && existing.status === 'archived') {
        data.autoDeactivatedAt = null
        data.autoDeactivatedReason = null
        data.needsExpiryReview = false
      }
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

    let mergedImportedFrom = existing.importedFrom
    if (body.importedFrom !== undefined) {
      mergedImportedFrom =
        body.importedFrom === null || body.importedFrom === '' ?
          null
        : typeof body.importedFrom === 'string' ?
          body.importedFrom.trim().slice(0, 2000)
        : existing.importedFrom
    }

    const onlyNeedsExpiryReviewDismiss =
      Object.keys(body).length === 1 && Object.prototype.hasOwnProperty.call(body, 'needsExpiryReview')

    if (!onlyNeedsExpiryReviewDismiss) {
      const hasMonitoringUrl = rentalListingHasMonitoringHttpUrl(mergedImportedFrom)
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
        !rentalListingHasMonitoringHttpUrl(mergedImportedFrom)
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
    }

    if (typeof body.needsExpiryReview === 'boolean') {
      data.needsExpiryReview = body.needsExpiryReview
    }

    if ('landlordNotifyEmail' in body) {
      if (body.landlordNotifyEmail === '' || body.landlordNotifyEmail === null) {
        data.landlordNotifyEmail = null
      } else if (typeof body.landlordNotifyEmail === 'string') {
        const v = normalizeAndValidateLandlordNotifyEmail(body.landlordNotifyEmail)
        if (!v) {
          return NextResponse.json({ message: 'Ungültige E-Mail für Bewerbungs-Benachrichtigungen.' }, { status: 400 })
        }
        data.landlordNotifyEmail = v
      }
    }

    if (typeof body.landlordContactPlain === 'string') {
      const t = body.landlordContactPlain.trim()
      data.landlordContact = t ? encryptLandlordContactForStorage(t) : null
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ message: 'Keine Felder zum Aktualisieren' }, { status: 400 })
    }

    const finalStatusAdmin = (typeof body.status === 'string' ? body.status : existing.status) as RentalListingStatus
    if (finalStatusAdmin === 'active' && !onlyNeedsExpiryReviewDismiss) {
      let effNotify: string | null = existing.landlordNotifyEmail
      if ('landlordNotifyEmail' in data) {
        effNotify =
          data.landlordNotifyEmail === null ?
            null
          : typeof data.landlordNotifyEmail === 'string' ?
            data.landlordNotifyEmail
          : existing.landlordNotifyEmail
      }
      let nextContactStored: string | null = existing.landlordContact
      if (typeof body.landlordContactPlain === 'string') {
        const t = body.landlordContactPlain.trim()
        nextContactStored = t ? encryptLandlordContactForStorage(t) : null
      }
      const owner = await prisma.user.findUnique({
        where: { id: existing.userId },
        select: { email: true },
      })
      const resolved = resolveLandlordApplicationNotifyEmail({
        landlordNotifyEmail: effNotify,
        landlordContactStored: nextContactStored,
        ownerAccountEmail: owner?.email ?? null,
      })
      if (!resolved) {
        return NextResponse.json(
          {
            message:
              'Für ein aktives Inserat muss eine gültige E-Mail für Bewerbungs-Benachrichtigungen erreichbar sein (Feld «E-Mail für Bewerbungen», oder E-Mail im Vermieter-Kontakt, oder die E-Mail des Helvenda-Kontos des Inserats-Inhabers).',
          },
          { status: 400 },
        )
      }
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
