import type { ImportSource, RentalListingStatus } from '@prisma/client'

/** Initiale Werte für das Miet-Inserat-Formular (Server + Client). */
export type RentalListingLandlordInitial = {
  title: string
  externalLandlordId?: string | null
  landlordInternalName?: string | null
  landlordInternalContact?: string | null
  landlordInternalNote?: string | null
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
  /** Interne Referenz (z. B. Homegate) — Admin-only. */
  referenceUrl: string | null
  /** Automatische Frische-Prüfung (Tutti, UrbanHome, …). */
  monitoringUrl: string | null
}
