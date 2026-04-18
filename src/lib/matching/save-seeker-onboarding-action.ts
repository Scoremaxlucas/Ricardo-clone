'use server'

import { Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import type { ZodError } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { recomputeMatchesForSeeker } from './persist-matches'
import { ensureSeekerProfileForUser } from './seeker-account'
import {
  seekerEmploymentStepSchema,
  seekerFinancialStepSchema,
  seekerHouseholdStepSchema,
  seekerSearchStepSchema,
} from './seeker-onboarding-schema'

export type SaveSeekerStepResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

function collectZodFieldErrors(err: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {}
  for (const issue of err.issues) {
    const key = issue.path[0]
    if (typeof key === 'string' && !fieldErrors[key]) {
      fieldErrors[key] = issue.message
    }
  }
  return fieldErrors
}

export async function saveSeekerSearchStepAction(raw: unknown): Promise<SaveSeekerStepResult> {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) return { ok: false, error: 'Nicht angemeldet.' }

  const parsed = seekerSearchStepSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Bitte Suchschritt prüfen.',
      fieldErrors: collectZodFieldErrors(parsed.error),
    }
  }

  const v = parsed.data
  const seekerProfileId = await ensureSeekerProfileForUser(userId)

  try {
    await prisma.seekerSearchProfile.upsert({
      where: { seekerProfileId },
      create: {
        seekerProfileId,
        cantonPreference: v.cantonPreference ?? null,
        postalCodesWanted: v.postalCodesWanted ?? null,
        budgetMin: v.budgetMin ?? null,
        budgetMax: v.budgetMax ?? null,
        minRooms: v.minRooms != null ? new Prisma.Decimal(v.minRooms.toFixed(1)) : null,
        maxRooms: v.maxRooms != null ? new Prisma.Decimal(v.maxRooms.toFixed(1)) : null,
        moveInEarliest: v.moveInEarliest ?? null,
        moveInLatest: v.moveInLatest ?? null,
      },
      update: {
        cantonPreference: v.cantonPreference ?? null,
        postalCodesWanted: v.postalCodesWanted ?? null,
        budgetMin: v.budgetMin ?? null,
        budgetMax: v.budgetMax ?? null,
        minRooms: v.minRooms != null ? new Prisma.Decimal(v.minRooms.toFixed(1)) : null,
        maxRooms: v.maxRooms != null ? new Prisma.Decimal(v.maxRooms.toFixed(1)) : null,
        moveInEarliest: v.moveInEarliest ?? null,
        moveInLatest: v.moveInLatest ?? null,
      },
    })

    await recomputeMatchesForSeeker(seekerProfileId)
    return { ok: true }
  } catch (e) {
    console.error('saveSeekerSearchStepAction', e)
    return { ok: false, error: 'Speichern fehlgeschlagen.' }
  }
}

export async function saveSeekerHouseholdStepAction(raw: unknown): Promise<SaveSeekerStepResult> {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) return { ok: false, error: 'Nicht angemeldet.' }

  const parsed = seekerHouseholdStepSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Bitte Haushalt prüfen.',
      fieldErrors: collectZodFieldErrors(parsed.error),
    }
  }

  const v = parsed.data
  const seekerProfileId = await ensureSeekerProfileForUser(userId)

  try {
    await prisma.householdProfile.upsert({
      where: { seekerProfileId },
      create: {
        seekerProfileId,
        adults: v.adults,
        children: v.children,
        petsDescription: v.petsDescription ?? null,
      },
      update: {
        adults: v.adults,
        children: v.children,
        petsDescription: v.petsDescription ?? null,
      },
    })

    await recomputeMatchesForSeeker(seekerProfileId)
    return { ok: true }
  } catch (e) {
    console.error('saveSeekerHouseholdStepAction', e)
    return { ok: false, error: 'Speichern fehlgeschlagen.' }
  }
}

export async function saveSeekerEmploymentStepAction(raw: unknown): Promise<SaveSeekerStepResult> {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) return { ok: false, error: 'Nicht angemeldet.' }

  const parsed = seekerEmploymentStepSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Bitte Angaben prüfen.',
      fieldErrors: collectZodFieldErrors(parsed.error),
    }
  }

  const v = parsed.data
  const seekerProfileId = await ensureSeekerProfileForUser(userId)

  try {
    await prisma.employmentProfile.upsert({
      where: { seekerProfileId },
      create: {
        seekerProfileId,
        employmentStatus: v.employmentStatus ?? null,
        employerName: v.employerName ?? null,
      },
      update: {
        employmentStatus: v.employmentStatus ?? null,
        employerName: v.employerName ?? null,
      },
    })
    return { ok: true }
  } catch (e) {
    console.error('saveSeekerEmploymentStepAction', e)
    return { ok: false, error: 'Speichern fehlgeschlagen.' }
  }
}

export async function saveSeekerFinancialStepAction(raw: unknown): Promise<SaveSeekerStepResult> {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) return { ok: false, error: 'Nicht angemeldet.' }

  const parsed = seekerFinancialStepSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Bitte Angaben prüfen.',
      fieldErrors: collectZodFieldErrors(parsed.error),
    }
  }

  const v = parsed.data
  const seekerProfileId = await ensureSeekerProfileForUser(userId)

  try {
    await prisma.financialProfile.upsert({
      where: { seekerProfileId },
      create: {
        seekerProfileId,
        monthlyNetIncomeBand: v.monthlyNetIncomeBand ?? null,
      },
      update: {
        monthlyNetIncomeBand: v.monthlyNetIncomeBand ?? null,
      },
    })
    return { ok: true }
  } catch (e) {
    console.error('saveSeekerFinancialStepAction', e)
    return { ok: false, error: 'Speichern fehlgeschlagen.' }
  }
}
