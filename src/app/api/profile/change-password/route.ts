import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getPasswordChangedEmail, sendEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // SECURITY: Rate limiting - max 5 password changes per user per hour
    const rateLimitResult = await checkRateLimit({
      identifier: `change-password:${session.user.id}`,
      limit: 5,
      window: 3600, // 1 hour
    })

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { message: 'Zu viele Versuche. Bitte versuchen Sie es später erneut.' },
        { status: 429 }
      )
    }

    const data = await request.json()
    const { currentPassword, newPassword } = data

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: 'Bitte füllen Sie alle Felder aus' }, { status: 400 })
    }

    // Validierung des neuen Passworts (vereinheitlicht mit reset-password)
    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: 'Das neue Passwort muss mindestens 8 Zeichen lang sein' },
        { status: 400 }
      )
    }

    if (!/\d/.test(newPassword)) {
      return NextResponse.json(
        { message: 'Das neue Passwort muss mindestens eine Zahl enthalten' },
        { status: 400 }
      )
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      return NextResponse.json(
        { message: 'Das neue Passwort muss mindestens ein Sonderzeichen enthalten' },
        { status: 400 }
      )
    }

    // Hole den User aus der Datenbank
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, firstName: true, nickname: true, password: true },
    })

    if (!user) {
      return NextResponse.json({ message: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Prüfe das alte Passwort
    if (!user.password) {
      return NextResponse.json(
        { message: 'Kein Passwort gesetzt. Bitte kontaktieren Sie den Support.' },
        { status: 400 }
      )
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Das aktuelle Passwort ist falsch' }, { status: 400 })
    }

    // Prüfe, ob das neue Passwort dasselbe wie das alte ist
    const isSamePassword = await bcrypt.compare(newPassword, user.password)
    if (isSamePassword) {
      return NextResponse.json(
        { message: 'Das neue Passwort muss sich vom aktuellen Passwort unterscheiden' },
        { status: 400 }
      )
    }

    // Client-Info für Sicherheits-E-Mail
    const forwarded = request.headers.get('x-forwarded-for')
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : 'Unbekannt'
    const userAgent = request.headers.get('user-agent') || 'Unbekannt'

    // Hash das neue Passwort (12 Rounds, vereinheitlicht mit reset-password)
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Aktualisiere das Passwort
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
    })

    // Sende Bestätigungs-E-Mail (Sicherheitsfeature)
    const userName = user.firstName || user.nickname || 'Benutzer'
    const { subject, html, text } = getPasswordChangedEmail(userName, ipAddress, userAgent)

    await sendEmail({
      to: user.email,
      subject,
      html,
      text,
    })

    console.log(`[change-password] Password changed successfully for ${user.email}`)

    return NextResponse.json({
      message: 'Passwort erfolgreich geändert',
    })
  } catch (error: any) {
    console.error('Error changing password:', error)
    return NextResponse.json(
      { message: 'Ein Fehler ist aufgetreten beim Ändern des Passworts: ' + error.message },
      { status: 500 }
    )
  }
}
