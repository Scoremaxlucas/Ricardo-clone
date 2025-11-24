import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

/**
 * Test-Endpoint für Authentifizierung
 * Prüft ob Login funktionieren sollte
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email und Passwort erforderlich' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    console.log('[TEST-AUTH] Testing login for:', normalizedEmail)

    // Finde User
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        isBlocked: true,
        isAdmin: true
      }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User nicht gefunden',
        debug: {
          searchedEmail: normalizedEmail,
          userCount: await prisma.user.count()
        }
      })
    }

    console.log('[TEST-AUTH] User found:', user.email)

    // Prüfe Blockierung
    if (user.isBlocked) {
      return NextResponse.json({
        success: false,
        error: 'User ist blockiert',
        user: { email: user.email, isBlocked: user.isBlocked }
      })
    }

    // Prüfe Passwort
    if (!user.password) {
      return NextResponse.json({
        success: false,
        error: 'Kein Passwort gesetzt',
        user: { email: user.email }
      })
    }

    const isValid = await bcrypt.compare(password, user.password)

    return NextResponse.json({
      success: isValid,
      error: isValid ? null : 'Passwort ungültig',
      debug: {
        email: user.email,
        name: user.name,
        hasPassword: !!user.password,
        passwordLength: user.password.length,
        passwordStart: user.password.substring(0, 30),
        isBlocked: user.isBlocked,
        passwordValid: isValid
      }
    })

  } catch (error: any) {
    console.error('[TEST-AUTH] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}





