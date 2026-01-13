import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
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

    const userId = params.userId

    // Request Body parsen
    let newEmail: string
    let reason: string | undefined
    
    try {
      const body = await request.json()
      newEmail = body.newEmail
      reason = body.reason
    } catch {
      return NextResponse.json({ message: 'Ungültiger Request Body' }, { status: 400 })
    }

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
      return NextResponse.json({ message: 'Benutzer nicht gefunden' }, { status: 404 })
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
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    })
    
    // Versuche auch pending-Felder zu löschen (falls sie existieren)
    try {
      await prisma.$executeRaw`UPDATE users SET "pendingEmail" = NULL, "pendingEmailToken" = NULL, "pendingEmailTokenExpires" = NULL WHERE id = ${userId}`
    } catch {
      // Felder existieren möglicherweise nicht - ignorieren
    }

    console.log(
      `[admin-change-email] Admin ${session.user.id} changed email for user ${userId}: ${oldEmail} -> ${normalizedEmail}${reason ? ` (Reason: ${reason})` : ''}`
    )

    return NextResponse.json({
      message: 'E-Mail-Adresse erfolgreich geändert',
      success: true,
      oldEmail,
      newEmail: normalizedEmail,
    })
  } catch (error: any) {
    console.error('[admin-change-email] Error:', error)
    return NextResponse.json({ message: 'Fehler beim Ändern der E-Mail-Adresse' }, { status: 500 })
  }
}
