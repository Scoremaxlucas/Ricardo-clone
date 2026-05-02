import { prisma } from '@/lib/prisma'
import { encryptLandlordContactForStorage } from '@/lib/rental/pdf-crypto'
import type { AdminIngestOrchestratorResult } from '@/lib/rental/listing-ingest-orchestrator'
import { ImportSource } from '@prisma/client'
import { revalidatePath } from 'next/cache'

function padDescription(desc: string): string {
  const t = desc.trim()
  if (t.length >= 50) return t
  return `${t}\n\n(Automatisch aus Inserat-URL übernommen — bitte prüfen und ergänzen.)`.trim()
}

export function validateIngestForAutoCreate(
  listing: AdminIngestOrchestratorResult['listing'],
  sourceUrl: string
): { ok: true } | { ok: false; reason: string } {
  const title = (listing.title || '').trim()
  const description = padDescription(listing.description || '')
  const zip = (listing.zip || '').replace(/\D/g, '').slice(0, 4)
  const city = (listing.city || '').trim()
  const canton = (listing.canton || '').trim().toUpperCase().slice(0, 2)
  const rooms = listing.rooms
  const areaSqm = listing.areaSqm
  const rent = listing.rentPerMonth

  if (!title) return { ok: false, reason: 'Titel fehlt' }
  if (description.length < 50) return { ok: false, reason: 'Beschreibung zu kurz' }
  if (!zip || zip.length !== 4) return { ok: false, reason: 'PLZ ungültig' }
  if (!city) return { ok: false, reason: 'Ort fehlt' }
  if (!canton || canton.length !== 2) return { ok: false, reason: 'Kanton fehlt' }
  if (rooms == null || !Number.isFinite(Number(rooms))) return { ok: false, reason: 'Zimmerzahl fehlt' }
  if (areaSqm == null || !Number.isFinite(Number(areaSqm)) || Number(areaSqm) < 1) {
    return { ok: false, reason: 'Fläche ungültig' }
  }
  if (rent == null || !Number.isFinite(Number(rent)) || Number(rent) < 1) {
    return { ok: false, reason: 'Miete fehlt oder 0' }
  }
  if (!sourceUrl.trim()) return { ok: false, reason: 'Quell-URL fehlt' }
  return { ok: true }
}

/**
 * Legt ein Mietinserat aus Orchestrator-Ergebnis an (Admin als owner).
 * `contactPrefixLine` steht zuerst im verschlüsselten Vermieter-Kontakt (z. B. Einladungs-Mail oder Bulk-Import).
 */
export async function createRentalListingFromIngestOrchestrator(params: {
  adminUserId: string
  ingest: AdminIngestOrchestratorResult
  sourceUrl: string
  contactPrefixLine: string
}): Promise<{ ok: true; listingId: string } | { ok: false; reason: string }> {
  const { listing, photos } = params.ingest
  const sourceUrl = params.sourceUrl
  const v = validateIngestForAutoCreate(listing, sourceUrl)
  if (!v.ok) return { ok: false, reason: v.reason }

  const description = padDescription(listing.description || '')
  const roomsN = Number(listing.rooms)
  const areaN = Math.round(Number(listing.areaSqm))
  const rentN = Math.round(Number(listing.rentPerMonth))
  let utilN: number | null = null
  if (listing.utilitiesPerMonth != null && Number.isFinite(Number(listing.utilitiesPerMonth))) {
    utilN = Math.round(Number(listing.utilitiesPerMonth))
  }
  let depN: number | null = null
  if (listing.depositAmount != null && Number.isFinite(Number(listing.depositAmount))) {
    depN = Math.round(Number(listing.depositAmount))
  }
  let floorN: number | null = null
  if (listing.floor != null && Number.isFinite(Number(listing.floor))) {
    floorN = Math.round(Number(listing.floor))
  }
  const availStr = (listing.availableFrom || '').trim()
  const avail =
    /^\d{4}-\d{2}-\d{2}$/.test(availStr) ? new Date(`${availStr}T12:00:00`) : new Date(new Date().toISOString().slice(0, 10) + 'T12:00:00')
  if (Number.isNaN(avail.getTime())) {
    return { ok: false, reason: 'Einzugsdatum ungültig' }
  }

  const importSource = ImportSource.IMPORTED
  const importedFrom = sourceUrl.trim().slice(0, 2000)
  const ingestPermissionBasis = 'public_authority_url'
  const landlordPlain = [params.contactPrefixLine.trim()]
  if (listing.landlordName?.trim()) landlordPlain.push(`Name (laut Inserat): ${listing.landlordName.trim()}`)
  if (listing.landlordContact?.trim()) landlordPlain.push(`Kontakt (laut Inserat): ${listing.landlordContact.trim()}`)
  const landlordContact = encryptLandlordContactForStorage(landlordPlain.join('\n'))

  const photoArr = photos.filter(u => typeof u === 'string' && u.startsWith('http'))

  try {
    const row = await prisma.rentalListing.create({
      data: {
        userId: params.adminUserId,
        title: (listing.title || '').trim().slice(0, 200),
        description,
        address: (listing.address || '').trim().slice(0, 500),
        zip: (listing.zip || '').replace(/\D/g, '').slice(0, 4),
        city: (listing.city || '').trim().slice(0, 120),
        canton: (listing.canton || '').trim().toUpperCase().slice(0, 2),
        rooms: roomsN,
        areaSqm: areaN,
        floor: floorN,
        rentPerMonth: rentN,
        utilitiesPerMonth: utilN,
        depositAmount: depN,
        availableFrom: avail,
        requiresCreditCheck: true,
        photos: JSON.stringify(photoArr),
        status: 'active',
        importSource,
        importedFrom,
        landlordContact,
        ingestPermissionBasis,
        listingExpiresOn: null,
        needsExpiryReview: false,
      },
    })
    revalidatePath('/admin/listings')
    revalidatePath('/wohnungen')
    revalidatePath('/matching/properties')
    return { ok: true, listingId: row.id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'DB-Fehler'
    return { ok: false, reason: msg }
  }
}
