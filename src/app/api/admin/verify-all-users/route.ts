import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * API endpoint to verify all users (set emailVerified: true)
 * This is a one-time operation to disable email verification requirement
 *
 * Requires admin authentication
 * Supports both GET and POST methods for easier access
 */
export async function POST(request: NextRequest) {
  return verifyAllUsers()
}

export async function GET(request: NextRequest) {
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
    const unverifiedUsers = await prisma.user.findMany({
      where: {
        OR: [
          { emailVerified: false },
          { emailVerified: null },
        ],
      },
      select: {
        id: true,
        email: true,
        emailVerified: true,
      },
    })

    console.log(`[verify-all-users] Gefundene Benutzer ohne Verifizierung: ${unverifiedUsers.length}`)

    if (unverifiedUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Alle Benutzer sind bereits verifiziert!',
        updatedCount: 0,
      })
    }

    // Aktualisiere alle Benutzer
    const result = await prisma.user.updateMany({
      where: {
        OR: [
          { emailVerified: false },
          { emailVerified: null },
        ],
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
      updatedUsers: unverifiedUsers.map(u => ({
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

