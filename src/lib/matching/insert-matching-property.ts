import { MatchPropertySource, MatchPropertyStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { matchingWizardToPrismaPropertyFields } from './matching-property-wizard-db'
import { recomputeMatchesForProperty } from './persist-matches'
import type { MatchingPropertyWizardInput } from './property-wizard-schema'

export async function insertMatchingPropertyForLandlord(opts: {
  landlordAccountId: string
  v: MatchingPropertyWizardInput
  source: MatchPropertySource
}): Promise<{ id: string }> {
  const { landlordAccountId, v, source } = opts
  const fields = matchingWizardToPrismaPropertyFields(v)

  const property = await prisma.matchingProperty.create({
    data: {
      landlordAccountId,
      source,
      ...fields,
      areaSqm: fields.areaSqm ?? undefined,
      floor: fields.floor ?? undefined,
      availableTo: fields.availableTo ?? undefined,
    },
  })

  if (property.status === MatchPropertyStatus.active) {
    await recomputeMatchesForProperty(property.id)
  }

  return { id: property.id }
}
