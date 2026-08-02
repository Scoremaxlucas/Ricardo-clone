import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { getServerSession } from 'next-auth/next'

/** Prüft Admin-Zugang für SIC-Backoffice-Routen. Gibt die User-ID zurück oder null. */
export async function requireSicAdmin(): Promise<{ userId: string } | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  if (!(await isAdmin(session))) return null
  return { userId: session.user.id }
}
