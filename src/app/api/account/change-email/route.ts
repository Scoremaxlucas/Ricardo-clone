import { authOptions } from '@/lib/auth'
import { getEmailBaseUrl, getEmailChangeVerificationEmail, sendEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/account/change-email
 *
 * Initiiert eine E-Mail-Änderung. Sendet eine Bestätigungs-E-Mail an die neue Adresse.
 * Die Änderung wird erst wirksam, wenn der Link in der E-Mail angeklickt wird.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { newEmail, password } = await request.json()

    // Validierung
    if (!newEmail || typeof newEmail !== 'string') {
      return NextResponse.json(
        { message: 'Bitte geben Sie eine neue E-Mail-Adresse ein' },
        { status: 400 }
      )
    }

    // E-Mail normalisieren
    const normalizedNewEmail = newEmail.trim().toLowerCase()

    // E-Mail-Format prüfen
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedNewEmail)) {
      return NextResponse.json(
        { message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein' },
        { status: 400 }
      )
    }

    // Aktuellen Benutzer laden
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        name: true,
        nickname: true,
        isBlocked: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    if (user.isBlocked) {
      return NextResponse.json(
        { message: 'Ihr Konto ist gesperrt. Kontaktieren Sie den Support.' },
        { status: 403 }
      )
    }

    // Prüfen ob neue E-Mail gleich der alten ist
    if (normalizedNewEmail === user.email?.toLowerCase()) {
      return NextResponse.json(
        { message: 'Die neue E-Mail-Adresse ist identisch mit Ihrer aktuellen' },
        { status: 400 }
      )
    }

    // Passwort-Verifizierung (wenn Passwort vorhanden)
    if (user.password && password) {
      const bcrypt = await import('bcryptjs')
      const isPasswordValid = await bcrypt.compare(password, user.password)
      if (!isPasswordValid) {
        return NextResponse.json(
          { message: 'Das eingegebene Passwort ist falsch' },
          { status: 400 }
        )
      }
    }

    // Prüfen ob die neue E-Mail bereits verwendet wird
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedNewEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        {
          message:
            'Diese E-Mail-Adresse wird bereits von einem anderen Konto verwendet',
        },
        { status: 400 }
      )
    }

    // Prüfen ob bereits eine ausstehende Änderung für diese E-Mail existiert
    const pendingChange = await prisma.user.findFirst({
      where: {
        pendingEmail: normalizedNewEmail,
        pendingEmailTokenExpires: { gt: new Date() },
        id: { not: user.id },
      },
    })

    if (pendingChange) {
      return NextResponse.json(
        {
          message:
            'Diese E-Mail-Adresse wird bereits für eine andere ausstehende Änderung verwendet',
        },
        { status: 400 }
      )
    }

    // Token generieren
    const token = crypto.randomBytes(32).toString('hex')
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 Stunden

    // Pending E-Mail speichern
    await prisma.user.update({
      where: { id: user.id },
      data: {
        pendingEmail: normalizedNewEmail,
        pendingEmailToken: token,
        pendingEmailTokenExpires: tokenExpires,
      },
    })

    // Bestätigungs-URL erstellen
    const baseUrl = getEmailBaseUrl()
    const confirmationUrl = `${baseUrl}/confirm-email-change?token=${token}`

    // E-Mail senden
    const userName = user.firstName || user.name || user.nickname || 'Benutzer'
    const emailContent = getEmailChangeVerificationEmail(
      userName,
      normalizedNewEmail,
      confirmationUrl
    )

    try {
      await sendEmail({
        to: normalizedNewEmail,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      })
    } catch (emailError) {
      console.error('[change-email] E-Mail-Versand fehlgeschlagen:', emailError)
      // Token zurücksetzen wenn E-Mail nicht gesendet werden konnte
      await prisma.user.update({
        where: { id: user.id },
        data: {
          pendingEmail: null,
          pendingEmailToken: null,
          pendingEmailTokenExpires: null,
        },
      })
      return NextResponse.json(
        { message: 'E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `Eine Bestätigungs-E-Mail wurde an ${normalizedNewEmail} gesendet. Bitte klicken Sie auf den Link in der E-Mail, um die Änderung abzuschließen.`,
      success: true,
    })
  } catch (error) {
    console.error('[change-email] Fehler:', error)
    return NextResponse.json(
      { message: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/account/change-email
 *
 * Bricht eine ausstehende E-Mail-Änderung ab.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        pendingEmail: null,
        pendingEmailToken: null,
        pendingEmailTokenExpires: null,
      },
    })

    return NextResponse.json({
      message: 'Ausstehende E-Mail-Änderung wurde abgebrochen',
      success: true,
    })
  } catch (error) {
    console.error('[change-email] Fehler beim Abbrechen:', error)
    return NextResponse.json(
      { message: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/account/change-email
 *
 * Gibt den Status einer ausstehenden E-Mail-Änderung zurück.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        pendingEmail: true,
        pendingEmailTokenExpires: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Prüfen ob eine gültige ausstehende Änderung existiert
    const hasPendingChange =
      user.pendingEmail &&
      user.pendingEmailTokenExpires &&
      user.pendingEmailTokenExpires > new Date()

    return NextResponse.json({
      hasPendingChange,
      pendingEmail: hasPendingChange ? user.pendingEmail : null,
      expiresAt: hasPendingChange ? user.pendingEmailTokenExpires : null,
    })
  } catch (error) {
    console.error('[change-email] Fehler beim Abrufen des Status:', error)
    return NextResponse.json(
      { message: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
