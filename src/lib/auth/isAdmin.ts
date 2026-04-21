import type { Session } from 'next-auth'

import { prisma } from '@/lib/prisma'

/**
 * True wenn der eingeloggte User in der Datenbank Admin ist.
 * Immer DB prüfen (JWT kann veraltet sein).
 */
export async function isAdmin(session: Session | null): Promise<boolean> {
  const id = session?.user?.id
  if (!id) return false
  const row = await prisma.user.findUnique({
    where: { id },
    select: { isAdmin: true },
  })
  return row?.isAdmin === true
}
