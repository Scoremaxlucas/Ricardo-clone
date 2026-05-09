import type { ImportSource, RentalListingStatus } from '@prisma/client'

/** Initiale Werte für das Miet-Inserat-Formular (Server + Client). */
export type RentalListingLandlordInitial = {
  title: string
  description: string
  address: string
  zip: string
  city: string
  canton: string
  rooms: number
  areaSqm: number
  floor: number | null
  rentPerMonth: number
  utilitiesPerMonth: number | null
  depositAmount: number | null
  availableFrom: string
  requiresCreditCheck: boolean
  photos: string[]
  status: RentalListingStatus
  /** YYYY-MM-DD; Pflicht wenn keine http(s)-Original-URL. */
  listingExpiresOn: string | null
  /** Bewerbungs-Leads; leer = aus Kontaktfeld / Konto ableiten. */
  landlordNotifyEmail: string | null
  importedFrom: string | null
  importSource: ImportSource
}
