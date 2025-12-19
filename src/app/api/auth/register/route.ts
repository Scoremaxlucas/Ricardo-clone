import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, nickname, email, password } = await request.json()

    // Normalize and trim all input fields first
    const trimmedFirstName = firstName?.trim() || ''
    const trimmedLastName = lastName?.trim() || ''
    const trimmedNickname = nickname?.trim() || ''
    const trimmedEmail = email?.trim() || ''
    const trimmedPassword = password?.trim() || ''

    // Validate required fields after trimming
    if (
      !trimmedFirstName ||
      !trimmedLastName ||
      !trimmedNickname ||
      !trimmedEmail ||
      !trimmedPassword
    ) {
      return NextResponse.json(
        { message: 'Bitte füllen Sie alle Pflichtfelder aus' },
        { status: 400 }
      )
    }

    // Validate nickname length (minimum 6 characters as per frontend validation)
    if (trimmedNickname.length < 6) {
      return NextResponse.json(
        { message: 'Nickname muss mindestens 6 Zeichen lang sein' },
        { status: 400 }
      )
    }

    // Normalize email (lowercase and trim)
    const normalizedEmail = trimmedEmail.toLowerCase()

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein' },
        { status: 400 }
      )
    }

    // Normalize nickname for case-insensitive comparison (store original case, but check lowercase)
    const normalizedNicknameForCheck = trimmedNickname.toLowerCase()

    // Check if user already exists
    let existingUser
    try {
      existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      })
    } catch (dbError: any) {
      console.error('[register] Database error checking existing user:', dbError)
      throw dbError
    }

    if (existingUser) {
      return NextResponse.json(
        {
          message:
            'Diese E-Mail-Adresse wird bereits von einem anderen Benutzer verwendet. Bitte verwenden Sie eine andere E-Mail-Adresse oder melden Sie sich mit Ihrem bestehenden Konto an.',
        },
        { status: 400 }
      )
    }

    // Check if nickname already exists (case-insensitive for PostgreSQL)
    let existingNickname
    try {
      existingNickname = await prisma.user.findFirst({
        where: {
          nickname: {
            equals: normalizedNicknameForCheck,
            mode: 'insensitive',
          },
        },
      })
    } catch (dbError: any) {
      // Fallback: if insensitive mode fails, try case-sensitive check
      console.warn(
        '[register] Case-insensitive check failed, trying case-sensitive:',
        dbError.message
      )
      existingNickname = await prisma.user.findFirst({
        where: {
          nickname: trimmedNickname,
        },
      })
    }

    if (existingNickname) {
      return NextResponse.json(
        {
          message: 'Dieser Nickname ist bereits vergeben. Bitte wählen Sie einen anderen Nickname.',
        },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(trimmedPassword, 12)

    // Create user with emailVerified: true (email verification disabled)
    const user = await prisma.user.create({
      data: {
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        nickname: trimmedNickname, // Store original case, but checked case-insensitively
        name: `${trimmedFirstName} ${trimmedLastName}`, // Für Kompatibilität
        email: normalizedEmail,
        password: hashedPassword,
        emailVerified: true, // Email verification disabled - users can login immediately
        emailVerifiedAt: new Date(), // Set verification date to now
      },
    })

    console.log(
      `[register] ✅ User created: ${trimmedFirstName} ${trimmedLastName} (${normalizedEmail})`
    )
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
    console.error('[register] Registration error:', error)
    console.error('[register] Error details:', {
      code: error.code,
      message: error.message,
      meta: error.meta,
      name: error.name,
      stack: error.stack?.substring(0, 500),
    })

    // Prüfe auf eindeutigen Constraint-Fehler (falls die Prüfung oben fehlgeschlagen ist)
    if (error.code === 'P2002') {
      // Prisma unique constraint violation
      const target = error.meta?.target || []
      if (Array.isArray(target) && target.includes('email')) {
        return NextResponse.json(
          {
            message:
              'Diese E-Mail-Adresse wird bereits von einem anderen Benutzer verwendet. Bitte verwenden Sie eine andere E-Mail-Adresse oder melden Sie sich mit Ihrem bestehenden Konto an.',
          },
          { status: 400 }
        )
      }
      if (Array.isArray(target) && target.includes('nickname')) {
        return NextResponse.json(
          {
            message:
              'Dieser Nickname ist bereits vergeben. Bitte wählen Sie einen anderen Nickname.',
          },
          { status: 400 }
        )
      }
      // Generic unique constraint error
      return NextResponse.json(
        {
          message: 'Ein Wert ist bereits vergeben. Bitte verwenden Sie andere Angaben.',
        },
        { status: 400 }
      )
    }

    // Database connection errors
    if (
      error.code === 'P1001' ||
      error.code === 'P1002' ||
      error.message?.toLowerCase().includes('connect') ||
      error.message?.toLowerCase().includes('timeout') ||
      error.message?.toLowerCase().includes('connection')
    ) {
      console.error('[register] Database connection error')
      return NextResponse.json(
        {
          message:
            'Verbindungsfehler zur Datenbank. Bitte versuchen Sie es in ein paar Momenten erneut.',
        },
        { status: 503 }
      )
    }

    // Schema validation errors
    if (error.code === 'P2003' || error.message?.toLowerCase().includes('foreign key constraint')) {
      console.error('[register] Schema validation error')
      return NextResponse.json(
        {
          message:
            'Ein Fehler ist aufgetreten beim Erstellen des Kontos. Bitte kontaktieren Sie den Support.',
        },
        { status: 500 }
      )
    }

    // Prisma query errors
    if (error.code?.startsWith('P')) {
      console.error('[register] Prisma error:', error.code)
      return NextResponse.json(
        {
          message:
            'Ein Datenbankfehler ist aufgetreten. Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.',
        },
        { status: 500 }
      )
    }

    // Generic error response
    return NextResponse.json(
      {
        message:
          'Ein Fehler ist aufgetreten beim Erstellen des Kontos. Bitte versuchen Sie es erneut.',
        ...(process.env.NODE_ENV === 'development' && {
          error: error.message,
          code: error.code,
        }),
      },
      { status: 500 }
    )
  }
}
