import { LandlordMembershipRole } from '@prisma/client'
import { prisma } from '@/lib/prisma'

/** Nur lesen — legt kein Konto an (z. B. Objektliste ohne Seiteneffekt). */
export async function getLandlordAccountIdForUser(userId: string): Promise<string | null> {
  const row = await prisma.landlordMembership.findFirst({
    where: { userId },
    select: { landlordAccountId: true },
    orderBy: { createdAt: 'asc' },
  })
  return row?.landlordAccountId ?? null
}

/**
 * Liefert die `LandlordAccount`-ID für den Nutzer — legt Konto + Owner-Mitgliedschaft an, falls noch nicht vorhanden.
 */
export async function ensureLandlordAccountForUser(userId: string): Promise<string> {
  const existing = await prisma.landlordMembership.findFirst({
    where: { userId },
    select: { landlordAccountId: true },
    orderBy: { createdAt: 'asc' },
  })
  if (existing) return existing.landlordAccountId

  const account = await prisma.landlordAccount.create({
    data: {},
  })
  await prisma.landlordMembership.create({
    data: {
      landlordAccountId: account.id,
      userId,
      role: LandlordMembershipRole.owner,
    },
  })
  return account.id
}
