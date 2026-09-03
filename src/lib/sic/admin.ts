import { authOptions } from '@/lib/auth'
import { isSicAdminEmail } from '@/lib/sic/admin-access'
import { getServerSession } from 'next-auth/next'

/** SIC-Backoffice: Allowlist, nicht Helvenda-`isAdmin`. */
export async function requireSicAdmin(): Promise<{ userId: string } | null> {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  const email = session?.user?.email
  if (!userId || !isSicAdminEmail(email)) return null
  return { userId }
}
