import { getPasswordChangedEmail, sendEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
import { getUserPreferredLanguage } from '@/lib/user-language'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Rate limiting - max 5 reset attempts per IP per hour
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               request.headers.get('x-real-ip') ||
               'unknown'
    const rateLimitResult = await checkRateLimit({
      identifier: `reset-password:${ip}`,
      limit: 5,
      window: 3600, // 1 hour
    })

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { message: 'Zu viele Versuche. Bitte versuchen Sie es später erneut.' },
        { status: 429 }
      )
    }

    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ message: 'Token und Passwort sind erforderlich' }, { status: 400 })
    }

    // Validierung des neuen Passworts (vereinheitlicht mit change-password)
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Das Passwort muss mindestens 8 Zeichen lang sein' },
        { status: 400 }
      )
    }

    if (!/\d/.test(password)) {
      return NextResponse.json(
        { message: 'Das Passwort muss mindestens eine Zahl enthalten' },
        { status: 400 }
      )
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return NextResponse.json(
        { message: 'Das Passwort muss mindestens ein Sonderzeichen enthalten' },
        { status: 400 }
      )
    }

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetTokenExpires: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        nickname: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        {
          message: 'Der Link ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen Link an.',
        },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Get client info for security email
    const forwarded = request.headers.get('x-forwarded-for')
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : 'Unbekannt'
    const userAgent = request.headers.get('user-agent') || 'Unbekannt'

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetTokenExpires: null,
        passwordChangedAt: new Date(),
      },
    })

    // Send confirmation email
    const userName = user.firstName || user.nickname || 'Benutzer'
    const locale = await getUserPreferredLanguage(user.id)
    const { subject, html, text } = getPasswordChangedEmail(userName, ipAddress, userAgent, locale)

    await sendEmail({
      to: user.email,
      subject,
      html,
      text,
    })

    console.log(`[reset-password] Password reset successful for ${user.email}`)

    return NextResponse.json({
      message: 'Ihr Passwort wurde erfolgreich geändert. Sie können sich jetzt anmelden.',
      success: true,
    })
  } catch (error: any) {
    console.error('[reset-password] Error:', error)
    return NextResponse.json(
      { message: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.' },
      { status: 500 }
    )
  }
}

// Verify token validity (for frontend validation)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ valid: false }, { status: 400 })
    }

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetTokenExpires: {
          gt: new Date(),
        },
      },
      select: { id: true },
    })

    return NextResponse.json({ valid: !!user })
  } catch (error: any) {
    console.error('[reset-password] Token verification error:', error)
    return NextResponse.json({ valid: false }, { status: 500 })
  }
}

