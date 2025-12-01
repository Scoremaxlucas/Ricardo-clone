import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const data = await request.json()
    const { currentPassword, newPassword } = data

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: 'Bitte füllen Sie alle Felder aus' }, { status: 400 })
    }

    // Validierung des neuen Passworts
    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: 'Das neue Passwort muss mindestens 6 Zeichen lang sein' },
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
      select: { id: true, password: true },
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

    // Hash das neue Passwort
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Aktualisiere das Passwort
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    })

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
