import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/users/[userId]/change-email
 *
 * Ermöglicht einem Admin, die E-Mail-Adresse eines Benutzers direkt zu ändern.
 * KEINE Verifizierung erforderlich - die E-Mail wird sofort geändert.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    // Authentifizierung prüfen
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Admin-Status prüfen
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!admin?.isAdmin) {
      return NextResponse.json(
        { message: 'Keine Admin-Berechtigung' },
        { status: 403 }
      )
    }

    const { userId } = await params
    const { newEmail, reason } = await request.json()

    // Validierung
    if (!newEmail || typeof newEmail !== 'string') {
      return NextResponse.json(
        { message: 'Neue E-Mail-Adresse ist erforderlich' },
        { status: 400 }
      )
    }

    const normalizedEmail = newEmail.trim().toLowerCase()

    // E-Mail-Format prüfen
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { message: 'Ungültiges E-Mail-Format' },
        { status: 400 }
      )
    }

    // Zielbenutzer laden
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        name: true,
        nickname: true,
      },
    })

    if (!targetUser) {
      return NextResponse.json(
        { message: 'Benutzer nicht gefunden' },
        { status: 404 }
      )
    }

    // Prüfen ob die neue E-Mail gleich der alten ist
    if (normalizedEmail === targetUser.email?.toLowerCase()) {
      return NextResponse.json(
        { message: 'Die neue E-Mail-Adresse ist identisch mit der aktuellen' },
        { status: 400 }
      )
    }

    // Prüfen ob die E-Mail bereits verwendet wird
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Diese E-Mail-Adresse wird bereits von einem anderen Konto verwendet' },
        { status: 400 }
      )
    }

    const oldEmail = targetUser.email

    // E-Mail direkt ändern (ohne Verifizierung)
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: normalizedEmail,
        // Da der Admin dies ändert, setzen wir E-Mail als verifiziert
        emailVerified: true,
        emailVerifiedAt: new Date(),
        // Ausstehende E-Mail-Änderungen zurücksetzen
        pendingEmail: null,
        pendingEmailToken: null,
        pendingEmailTokenExpires: null,
      },
    })

    // Protokollierung in Konsole
    console.log(`[admin-change-email] Admin ${session.user.id} hat E-Mail von Benutzer ${userId} geändert: ${oldEmail} -> ${normalizedEmail}${reason ? ` (Grund: ${reason})` : ''}`)

    return NextResponse.json({
      message: 'E-Mail-Adresse erfolgreich geändert',
      success: true,
      oldEmail,
      newEmail: normalizedEmail,
    })
  } catch (error) {
    console.error('[admin-change-email] Fehler:', error)
    return NextResponse.json(
      { message: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
