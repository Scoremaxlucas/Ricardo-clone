'use server'

import {
  HousingMatchStatus,
  MatchPropertyStatus,
  MatchingApplicationStatus,
  type Prisma,
} from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { appendMatchingAuditLog } from './matching-audit-log'
import {
  checkMatchingApplicationCreateRateLimit,
  checkMatchingApplicationMutateRateLimit,
} from './matching-rate-limit'
import { ensureLandlordAccountForUser } from './landlord-account'
import { ensureSeekerProfileForUser } from './seeker-account'
import { MATCHING_CONSENT_SCOPES, isMatchingConsentScope } from './consent-scopes'

const messageSchema = z
  .string()
  .max(4000)
  .optional()
  .nullable()
  .transform(v => (v == null || v.trim() === '' ? null : v.trim()))

const createSchema = z.object({
  housingMatchId: z.string().min(1),
  message: messageSchema,
})

const consentSchema = z.object({
  applicationId: z.string().min(1),
  scope: z.string().min(1),
  granted: z.boolean(),
})

const landlordDecisionSchema = z.object({
  applicationId: z.string().min(1),
  decision: z.enum(['accepted', 'rejected']),
})

export type ActionResult = { ok: true } | { ok: false; error: string }

function rateLimitHitMessage(resetAt: Date): string {
  const s = Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000))
  return `Zu viele Anfragen. Bitte in ca. ${s}s erneut versuchen.`
}

async function userOwnsLandlordProperty(userId: string, propertyId: string): Promise<boolean> {
  const landlordAccountId = await ensureLandlordAccountForUser(userId)
  const p = await prisma.matchingProperty.findFirst({
    where: { id: propertyId, landlordAccountId },
    select: { id: true },
  })
  return Boolean(p)
}

async function seedConsentRows(tx: Prisma.TransactionClient, applicationId: string) {
  for (const scope of MATCHING_CONSENT_SCOPES) {
    await tx.consentShare.create({
      data: { applicationId, scope },
    })
  }
}

/** Bewerbung aus einem aktiven Treffer anlegen (Entwurf). */
export async function createMatchingApplicationFromMatchAction(raw: unknown): Promise<
  ActionResult & { applicationId?: string }
> {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) return { ok: false, error: 'Nicht angemeldet.' }

  const rl = await checkMatchingApplicationCreateRateLimit(userId)
  if (!rl.allowed) return { ok: false, error: rateLimitHitMessage(rl.resetAt) }

  const parsed = createSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Ungültige Eingabe.' }

  const seekerProfileId = await ensureSeekerProfileForUser(userId)
  const { housingMatchId, message } = parsed.data

  const match = await prisma.housingMatch.findFirst({
    where: {
      id: housingMatchId,
      seekerProfileId,
      hardFailed: false,
      status: HousingMatchStatus.active,
    },
    include: {
      property: { select: { id: true, status: true } },
    },
  })

  if (!match) return { ok: false, error: 'Treffer nicht gefunden oder nicht verfügbar.' }
  if (match.property.status !== MatchPropertyStatus.active) {
    return { ok: false, error: 'Objekt ist nicht aktiv.' }
  }

  const existing = await prisma.matchingApplication.findUnique({
    where: { housingMatchId },
    select: { id: true },
  })
  if (existing) return { ok: false, error: 'Für diesen Treffer existiert bereits eine Bewerbung.' }

  const dup = await prisma.matchingApplication.findFirst({
    where: {
      seekerProfileId,
      propertyId: match.propertyId,
      status: { notIn: [MatchingApplicationStatus.withdrawn, MatchingApplicationStatus.closed] },
    },
    select: { id: true },
  })
  if (dup) return { ok: false, error: 'Du hast für dieses Objekt bereits eine laufende Bewerbung.' }

  try {
    const app = await prisma.$transaction(async tx => {
      const created = await tx.matchingApplication.create({
        data: {
          propertyId: match.propertyId,
          seekerProfileId,
          housingMatchId,
          status: MatchingApplicationStatus.draft,
          message,
        },
      })
      await seedConsentRows(tx, created.id)
      return created
    })
    await appendMatchingAuditLog({
      actorUserId: userId,
      action: 'matching_application.create',
      entityType: 'matching_application',
      entityId: app.id,
      metadata: {
        propertyId: match.propertyId,
        housingMatchId,
        seekerProfileId,
      },
    })
    return { ok: true, applicationId: app.id }
  } catch (e) {
    console.error('createMatchingApplicationFromMatchAction', e)
    return { ok: false, error: 'Speichern fehlgeschlagen.' }
  }
}

export async function updateMatchingApplicationMessageAction(raw: unknown): Promise<ActionResult> {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) return { ok: false, error: 'Nicht angemeldet.' }

  const rl0 = await checkMatchingApplicationMutateRateLimit(userId)
  if (!rl0.allowed) return { ok: false, error: rateLimitHitMessage(rl0.resetAt) }

  const schema = z.object({
    applicationId: z.string().min(1),
    message: messageSchema,
  })
  const parsed = schema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Ungültige Eingabe.' }

  const seekerProfileId = await ensureSeekerProfileForUser(userId)
  const { applicationId, message } = parsed.data

  const app = await prisma.matchingApplication.findFirst({
    where: { id: applicationId, seekerProfileId, status: MatchingApplicationStatus.draft },
    select: { id: true },
  })
  if (!app) return { ok: false, error: 'Bewerbung nicht als Entwurf bearbeitbar.' }

  try {
    await prisma.matchingApplication.update({
      where: { id: applicationId },
      data: { message },
    })
    await appendMatchingAuditLog({
      actorUserId: userId,
      action: 'matching_application.message_update',
      entityType: 'matching_application',
      entityId: applicationId,
      metadata: {},
    })
    return { ok: true }
  } catch (e) {
    console.error('updateMatchingApplicationMessageAction', e)
    return { ok: false, error: 'Speichern fehlgeschlagen.' }
  }
}

export async function submitMatchingApplicationAction(applicationId: string): Promise<ActionResult> {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) return { ok: false, error: 'Nicht angemeldet.' }

  const rl0 = await checkMatchingApplicationMutateRateLimit(userId)
  if (!rl0.allowed) return { ok: false, error: rateLimitHitMessage(rl0.resetAt) }

  const seekerProfileId = await ensureSeekerProfileForUser(userId)
  const app = await prisma.matchingApplication.findFirst({
    where: { id: applicationId, seekerProfileId, status: MatchingApplicationStatus.draft },
    select: { id: true },
  })
  if (!app) return { ok: false, error: 'Nur Entwürfe können eingereicht werden.' }

  try {
    await prisma.matchingApplication.update({
      where: { id: applicationId },
      data: { status: MatchingApplicationStatus.submitted },
    })
    await appendMatchingAuditLog({
      actorUserId: userId,
      action: 'matching_application.submit',
      entityType: 'matching_application',
      entityId: applicationId,
      metadata: {},
    })
    return { ok: true }
  } catch (e) {
    console.error('submitMatchingApplicationAction', e)
    return { ok: false, error: 'Einreichen fehlgeschlagen.' }
  }
}

export async function withdrawMatchingApplicationAction(applicationId: string): Promise<ActionResult> {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) return { ok: false, error: 'Nicht angemeldet.' }

  const rl0 = await checkMatchingApplicationMutateRateLimit(userId)
  if (!rl0.allowed) return { ok: false, error: rateLimitHitMessage(rl0.resetAt) }

  const seekerProfileId = await ensureSeekerProfileForUser(userId)
  const app = await prisma.matchingApplication.findFirst({
    where: {
      id: applicationId,
      seekerProfileId,
      status: { in: [MatchingApplicationStatus.draft, MatchingApplicationStatus.submitted] },
    },
    select: { id: true },
  })
  if (!app) return { ok: false, error: 'Zurückziehen nicht möglich.' }

  try {
    await prisma.matchingApplication.update({
      where: { id: applicationId },
      data: { status: MatchingApplicationStatus.withdrawn },
    })
    await appendMatchingAuditLog({
      actorUserId: userId,
      action: 'matching_application.withdraw',
      entityType: 'matching_application',
      entityId: applicationId,
      metadata: {},
    })
    return { ok: true }
  } catch (e) {
    console.error('withdrawMatchingApplicationAction', e)
    return { ok: false, error: 'Fehler beim Zurückziehen.' }
  }
}

/** Suchender: Consent für einen Scope erteilen oder widerrufen. */
export async function setMatchingConsentShareAction(raw: unknown): Promise<ActionResult> {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) return { ok: false, error: 'Nicht angemeldet.' }

  const rl0 = await checkMatchingApplicationMutateRateLimit(userId)
  if (!rl0.allowed) return { ok: false, error: rateLimitHitMessage(rl0.resetAt) }

  const parsed = consentSchema.safeParse(raw)
  if (!parsed.success || !isMatchingConsentScope(parsed.data.scope)) {
    return { ok: false, error: 'Ungültiger Scope.' }
  }

  const seekerProfileId = await ensureSeekerProfileForUser(userId)
  const { applicationId, scope, granted } = parsed.data

  const app = await prisma.matchingApplication.findFirst({
    where: { id: applicationId, seekerProfileId },
    select: { id: true, status: true },
  })
  if (!app) return { ok: false, error: 'Bewerbung nicht gefunden.' }
  if (app.status === MatchingApplicationStatus.withdrawn || app.status === MatchingApplicationStatus.closed) {
    return { ok: false, error: 'Bewerbung ist beendet.' }
  }

  try {
    const now = new Date()
    await prisma.consentShare.upsert({
      where: { applicationId_scope: { applicationId, scope } },
      create: {
        applicationId,
        scope,
        grantedAt: granted ? now : null,
        revokedAt: granted ? null : null,
      },
      update: granted
        ? { grantedAt: now, revokedAt: null }
        : { revokedAt: now },
    })
    await appendMatchingAuditLog({
      actorUserId: userId,
      action: granted ? 'consent_share.grant' : 'consent_share.revoke',
      entityType: 'matching_application',
      entityId: applicationId,
      metadata: { scope, granted },
    })
    return { ok: true }
  } catch (e) {
    console.error('setMatchingConsentShareAction', e)
    return { ok: false, error: 'Freigabe konnte nicht gespeichert werden.' }
  }
}

/** Vermieter: Bewerbung annehmen oder ablehnen. */
export async function landlordDecideMatchingApplicationAction(raw: unknown): Promise<ActionResult> {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) return { ok: false, error: 'Nicht angemeldet.' }

  const rl0 = await checkMatchingApplicationMutateRateLimit(userId)
  if (!rl0.allowed) return { ok: false, error: rateLimitHitMessage(rl0.resetAt) }

  const parsed = landlordDecisionSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Ungültige Eingabe.' }

  const { applicationId, decision } = parsed.data

  const app = await prisma.matchingApplication.findFirst({
    where: {
      id: applicationId,
      status: {
        in: [
          MatchingApplicationStatus.submitted,
          MatchingApplicationStatus.landlord_reviewing,
        ],
      },
    },
    include: { property: { select: { id: true, landlordAccountId: true } } },
  })
  if (!app) return { ok: false, error: 'Bewerbung nicht gefunden oder bereits entschieden.' }

  const allowed = await userOwnsLandlordProperty(userId, app.propertyId)
  if (!allowed) return { ok: false, error: 'Keine Berechtigung für dieses Objekt.' }

  const nextStatus =
    decision === 'accepted'
      ? MatchingApplicationStatus.landlord_accepted
      : MatchingApplicationStatus.landlord_rejected

  try {
    await prisma.matchingApplication.update({
      where: { id: applicationId },
      data: { status: nextStatus },
    })
    await appendMatchingAuditLog({
      actorUserId: userId,
      action: `matching_application.landlord_${decision}`,
      entityType: 'matching_application',
      entityId: applicationId,
      metadata: { nextStatus },
    })
    return { ok: true }
  } catch (e) {
    console.error('landlordDecideMatchingApplicationAction', e)
    return { ok: false, error: 'Entscheidung konnte nicht gespeichert werden.' }
  }
}
