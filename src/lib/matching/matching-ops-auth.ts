import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'

export type MatchingAdminGate = { ok: true; userId: string } | { ok: false }

/**
 * Prüft Session + Admin-Flag (Session oder DB).
 */
export async function requireMatchingAdmin(): Promise<MatchingAdminGate> {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) return { ok: false }

  if (session.user?.isAdmin === true) return { ok: true, userId }

  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  })
  if (u?.isAdmin === true) return { ok: true, userId }

  return { ok: false }
}
