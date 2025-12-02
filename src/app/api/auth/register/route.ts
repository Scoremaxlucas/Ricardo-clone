import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, nickname, email, password } = await request.json()

    // Validate required fields
    if (!firstName || !lastName || !nickname || !email || !password) {
      return NextResponse.json(
        { message: 'Bitte füllen Sie alle Pflichtfelder aus' },
        { status: 400 }
      )
    }

    // Normalize email (lowercase and trim)
    const normalizedEmail = email.toLowerCase().trim()

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        {
          message:
            'Diese E-Mail-Adresse wird bereits von einem anderen Benutzer verwendet. Bitte verwenden Sie eine andere E-Mail-Adresse oder melden Sie sich mit Ihrem bestehenden Konto an.',
        },
        { status: 400 }
      )
    }

    // Check if nickname already exists
    const existingNickname = await prisma.user.findFirst({
      where: { nickname },
    })

    if (existingNickname) {
      return NextResponse.json({ message: 'Dieser Nickname ist bereits vergeben' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user with emailVerified: true (email verification disabled)
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        nickname,
        name: `${firstName} ${lastName}`, // Für Kompatibilität
        email: normalizedEmail,
        password: hashedPassword,
        emailVerified: true, // Email verification disabled - users can login immediately
        emailVerifiedAt: new Date(), // Set verification date to now
      },
    })

    console.log(`[register] ✅ User created: ${firstName} ${lastName} (${normalizedEmail})`)
    console.log(`[register] Email verification disabled - user can login immediately`)

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      {
        message: 'Benutzer erfolgreich erstellt. Sie können sich jetzt anmelden.',
        user: userWithoutPassword,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Registration error:', error)

    // Prüfe auf eindeutigen Constraint-Fehler (falls die Prüfung oben fehlgeschlagen ist)
    if (error.code === 'P2002') {
      // Prisma unique constraint violation
      if (error.meta?.target?.includes('email')) {
        return NextResponse.json(
          {
            message:
              'Diese E-Mail-Adresse wird bereits von einem anderen Benutzer verwendet. Bitte verwenden Sie eine andere E-Mail-Adresse oder melden Sie sich mit Ihrem bestehenden Konto an.',
          },
          { status: 400 }
        )
      }
      if (error.meta?.target?.includes('nickname')) {
        return NextResponse.json(
          {
            message:
              'Dieser Nickname ist bereits vergeben. Bitte wählen Sie einen anderen Nickname.',
          },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      {
        message:
          'Ein Fehler ist aufgetreten beim Erstellen des Kontos. Bitte versuchen Sie es erneut.',
      },
      { status: 500 }
    )
  }
}
