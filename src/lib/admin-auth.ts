/**
 * Admin Authentication Helper
 * Zentralisierte Admin-Prüfung für alle Admin-API-Routes
 */

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'

export interface AdminCheckResult {
  isAdmin: boolean
  userId: string | null
  error?: NextResponse
}

/**
 * Prüft ob der aktuelle Benutzer Admin-Rechte hat
 * @returns AdminCheckResult mit isAdmin status und optional error response
 */
export async function checkAdminAuth(): Promise<AdminCheckResult> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id && !session?.user?.email) {
      return {
        isAdmin: false,
        userId: null,
        error: NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 }),
      }
    }

    // Prüfe Admin-Status aus Session
    const isAdminInSession = session?.user?.isAdmin === true

    // Prüfe ob User Admin ist (per ID oder E-Mail)
    let user = null
    if (session.user.id) {
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, isAdmin: true },
      })
    }

    // Falls nicht gefunden per ID, versuche per E-Mail
    if (!user && session.user.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, isAdmin: true },
      })
    }

    // Prüfe Admin-Status: Session ODER Datenbank
    const isAdminInDb = user?.isAdmin === true
    const isAdmin = isAdminInSession || isAdminInDb

    if (!isAdmin) {
      return {
        isAdmin: false,
        userId: user?.id || session.user.id || null,
        error: NextResponse.json(
          { message: 'Zugriff verweigert. Admin-Rechte erforderlich.' },
          { status: 403 }
        ),
      }
    }

    return {
      isAdmin: true,
      userId: user?.id || session.user.id || null,
    }
  } catch (error) {
    console.error('[admin-auth] Error checking admin status:', error)
    return {
      isAdmin: false,
      userId: null,
      error: NextResponse.json(
        { message: 'Fehler bei der Authentifizierung' },
        { status: 500 }
      ),
    }
  }
}

/**
 * Quick admin check - returns error response or null if authorized
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const { isAdmin, error } = await checkAdminAuth()
  if (!isAdmin && error) {
    return error
  }
  return null
}
