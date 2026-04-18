import { MatchPropertyStatus, Prisma } from '@prisma/client'
import type { MatchingPropertyWizardInput } from './property-wizard-schema'

export function matchWizardStatusToPrisma(status: MatchingPropertyWizardInput['status']): MatchPropertyStatus {
  switch (status) {
    case 'draft':
      return MatchPropertyStatus.draft
    case 'active':
      return MatchPropertyStatus.active
    case 'paused':
      return MatchPropertyStatus.paused
    case 'archived':
      return MatchPropertyStatus.archived
    default: {
      const _exhaustive: never = status
      return _exhaustive
    }
  }
}

/** Gemeinsame DB-Felder aus Wizard-Eingabe (ohne `landlordAccountId` / `source`). */
export function matchingWizardToPrismaPropertyFields(v: MatchingPropertyWizardInput): {
  title: string
  description: string | null
  addressLine: string | null
  zip: string
  city: string
  canton: string
  rooms: Prisma.Decimal
  areaSqm: number | null
  floor: number | null
  rentPerMonth: number
  availableFrom: Date
  availableTo: Date | null
  petPolicyNote: string | null
  rulesJson: Prisma.InputJsonValue
  status: MatchPropertyStatus
} {
  return {
    title: v.title,
    description: v.description,
    addressLine: v.addressLine,
    zip: v.zip,
    city: v.city,
    canton: v.canton,
    rooms: new Prisma.Decimal(v.rooms.toFixed(1)),
    areaSqm: v.areaSqm ?? null,
    floor: v.floor ?? null,
    rentPerMonth: v.rentPerMonth,
    availableFrom: v.availableFrom,
    availableTo: v.availableTo ?? null,
    petPolicyNote: v.petPolicyNote,
    rulesJson: { allowPets: v.allowPets } satisfies Prisma.InputJsonValue,
    status: matchWizardStatusToPrisma(v.status),
  }
}
