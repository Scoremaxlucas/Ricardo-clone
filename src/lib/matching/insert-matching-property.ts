import { MatchPropertySource, MatchPropertyStatus, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { recomputeMatchesForProperty } from './persist-matches'
import type { MatchingPropertyWizardInput } from './property-wizard-schema'

export async function insertMatchingPropertyForLandlord(opts: {
  landlordAccountId: string
  v: MatchingPropertyWizardInput
  source: MatchPropertySource
}): Promise<{ id: string }> {
  const { landlordAccountId, v, source } = opts
  const rulesJson: Prisma.InputJsonValue = { allowPets: v.allowPets }

  const property = await prisma.matchingProperty.create({
    data: {
      landlordAccountId,
      source,
      title: v.title,
      description: v.description,
      addressLine: v.addressLine,
      zip: v.zip,
      city: v.city,
      canton: v.canton,
      rooms: new Prisma.Decimal(v.rooms.toFixed(1)),
      areaSqm: v.areaSqm ?? undefined,
      floor: v.floor ?? undefined,
      rentPerMonth: v.rentPerMonth,
      availableFrom: v.availableFrom,
      availableTo: v.availableTo ?? undefined,
      petPolicyNote: v.petPolicyNote,
      rulesJson,
      status: v.status === 'active' ? MatchPropertyStatus.active : MatchPropertyStatus.draft,
    },
  })

  if (property.status === MatchPropertyStatus.active) {
    await recomputeMatchesForProperty(property.id)
  }

  return { id: property.id }
}
