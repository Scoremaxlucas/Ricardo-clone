import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * API endpoint to verify all users (set emailVerified: true)
 * This is a one-time operation to disable email verification requirement
 *
 * Requires admin authentication
 * Supports both GET and POST methods for easier access
 */
export async function POST(_request: NextRequest) {
  return verifyAllUsers()
}

export async function GET(_request: NextRequest) {
  return verifyAllUsers()
}

async function verifyAllUsers() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Prüfe ob User Admin ist
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!admin?.isAdmin) {
      return NextResponse.json(
        { message: 'Zugriff verweigert. Admin-Rechte erforderlich.' },
        { status: 403 }
      )
    }

    // Finde alle Benutzer mit emailVerified: false oder null
    // Verwende separate Queries, da Prisma null nicht direkt in OR unterstützt
    const unverifiedUsersFalse = await prisma.user.findMany({
      where: {
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        emailVerified: true,
      },
    })

    // Für null-Werte müssen wir alle User holen und filtern
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        emailVerified: true,
      },
    })

    const unverifiedUsersNull = allUsers.filter(user => user.emailVerified === null)
    const unverifiedUsers = [...unverifiedUsersFalse, ...unverifiedUsersNull]
    const uniqueUsers = Array.from(new Map(unverifiedUsers.map(u => [u.id, u])).values())

    console.log(`[verify-all-users] Gefundene Benutzer ohne Verifizierung: ${uniqueUsers.length}`)

    if (uniqueUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Alle Benutzer sind bereits verifiziert!',
        updatedCount: 0,
      })
    }

    // Aktualisiere alle Benutzer - verwende IDs statt OR mit null
    const userIds = uniqueUsers.map(u => u.id)

    const result = await prisma.user.updateMany({
      where: {
        id: {
          in: userIds,
        },
      },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationTokenExpires: null,
      },
    })

    console.log(`[verify-all-users] ${result.count} Benutzer erfolgreich aktualisiert`)

    return NextResponse.json({
      success: true,
      message: `${result.count} Benutzer erfolgreich verifiziert`,
      updatedCount: result.count,
      updatedUsers: uniqueUsers.map(u => ({
        id: u.id,
        email: u.email,
      })),
    })
  } catch (error: any) {
    console.error('[verify-all-users] Fehler:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Ein Fehler ist aufgetreten beim Verifizieren der Benutzer',
        error: error.message,
      },
      { status: 500 }
    )
  }
}

