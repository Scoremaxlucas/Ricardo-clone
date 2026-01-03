import { getPasswordChangedEmail, sendEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ message: 'Token und Passwort sind erforderlich' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Das Passwort muss mindestens 8 Zeichen lang sein' },
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
    const { subject, html, text } = getPasswordChangedEmail(userName, ipAddress, userAgent)

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

