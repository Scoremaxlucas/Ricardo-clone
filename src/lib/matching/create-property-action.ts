'use server'

import { MatchPropertyStatus, Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ensureLandlordAccountForUser } from './landlord-account'
import { matchingPropertyWizardSchema } from './property-wizard-schema'
import { recomputeMatchesForProperty } from './persist-matches'

export type CreateMatchingPropertyResult =
  | { ok: true; propertyId: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

export async function createMatchingPropertyFromWizard(
  raw: unknown
): Promise<CreateMatchingPropertyResult> {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    return { ok: false, error: 'Nicht angemeldet.' }
  }

  const parsed = matchingPropertyWizardSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (typeof key === 'string' && !fieldErrors[key]) {
        fieldErrors[key] = issue.message
      }
    }
    return { ok: false, error: 'Bitte Eingaben prüfen.', fieldErrors }
  }

  const v = parsed.data
  const landlordAccountId = await ensureLandlordAccountForUser(userId)

  const rulesJson: Prisma.InputJsonValue = { allowPets: v.allowPets }

  try {
    const property = await prisma.matchingProperty.create({
      data: {
        landlordAccountId,
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

    return { ok: true, propertyId: property.id }
  } catch (e) {
    console.error('createMatchingPropertyFromWizard', e)
    return { ok: false, error: 'Speichern fehlgeschlagen. Bitte später erneut versuchen.' }
  }
}
