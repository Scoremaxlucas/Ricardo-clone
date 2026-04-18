'use server'

import { MatchPropertySource } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { ensureLandlordAccountForUser } from './landlord-account'
import { insertMatchingPropertyForLandlord } from './insert-matching-property'
import { matchingPropertyWizardSchema } from './property-wizard-schema'

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

  try {
    const property = await insertMatchingPropertyForLandlord({
      landlordAccountId,
      v,
      source: MatchPropertySource.manual,
    })

    return { ok: true, propertyId: property.id }
  } catch (e) {
    console.error('createMatchingPropertyFromWizard', e)
    return { ok: false, error: 'Speichern fehlgeschlagen. Bitte später erneut versuchen.' }
  }
}
