'use server'

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { CreateMatchingPropertyResult } from './create-property-action'
import { getLandlordAccountIdForUser } from './landlord-account'
import { matchingWizardToPrismaPropertyFields } from './matching-property-wizard-db'
import { checkMatchingPropertyUpdateRateLimit } from './matching-rate-limit'
import { recomputeMatchesForProperty } from './persist-matches'
import { matchingPropertyWizardSchema } from './property-wizard-schema'

export async function updateMatchingPropertyFromWizard(
  propertyId: string,
  raw: unknown
): Promise<CreateMatchingPropertyResult> {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    return { ok: false, error: 'Nicht angemeldet.' }
  }

  const rl = await checkMatchingPropertyUpdateRateLimit(userId)
  if (!rl.allowed) {
    const s = Math.max(1, Math.ceil((rl.resetAt.getTime() - Date.now()) / 1000))
    return { ok: false, error: `Zu viele Änderungen. Bitte in ca. ${s}s erneut versuchen.` }
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

  const landlordAccountId = await getLandlordAccountIdForUser(userId)
  if (!landlordAccountId) {
    return { ok: false, error: 'Kein Vermieter-Konto. Bitte zuerst ein Objekt anlegen.' }
  }

  const owned = await prisma.matchingProperty.findFirst({
    where: { id: propertyId, landlordAccountId },
    select: { id: true },
  })
  if (!owned) {
    return { ok: false, error: 'Objekt nicht gefunden oder keine Berechtigung.' }
  }

  const v = parsed.data
  const fields = matchingWizardToPrismaPropertyFields(v)

  try {
    await prisma.matchingProperty.update({
      where: { id: propertyId },
      data: {
        title: fields.title,
        description: fields.description,
        addressLine: fields.addressLine,
        zip: fields.zip,
        city: fields.city,
        canton: fields.canton,
        rooms: fields.rooms,
        areaSqm: fields.areaSqm ?? undefined,
        floor: fields.floor ?? undefined,
        rentPerMonth: fields.rentPerMonth,
        availableFrom: fields.availableFrom,
        availableTo: fields.availableTo ?? undefined,
        petPolicyNote: fields.petPolicyNote,
        rulesJson: fields.rulesJson,
        status: fields.status,
      },
    })

    await recomputeMatchesForProperty(propertyId)
    return { ok: true, propertyId }
  } catch (e) {
    console.error('updateMatchingPropertyFromWizard', e)
    return { ok: false, error: 'Speichern fehlgeschlagen. Bitte später erneut versuchen.' }
  }
}
