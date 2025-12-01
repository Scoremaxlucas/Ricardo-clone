import { Session } from 'next-auth'
import { prisma } from './prisma'

/**
 * Server-seitige Funktion zum Prüfen ob ein User Admin ist
 * Kann sowohl per ID als auch per E-Mail prüfen
 */
export async function checkAdmin(session: Session | null): Promise<boolean> {
  if (!session?.user?.id && !session?.user?.email) {
    return false
  }

  // Prüfe Admin-Status aus Session
  const isAdminInSession = session?.user?.isAdmin === true || session?.user?.isAdmin === 1

  // Prüfe ob User Admin ist (per ID oder E-Mail)
  let user = null
  if (session.user.id) {
    user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true, email: true },
    })
  }

  // Falls nicht gefunden per ID, versuche per E-Mail
  if (!user && session.user.email) {
    user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true, email: true },
    })
  }

  // Prüfe Admin-Status: Session ODER Datenbank
  const isAdminInDb = user?.isAdmin === true || user?.isAdmin === 1
  const isAdmin = isAdminInSession || isAdminInDb

  return isAdmin
}
