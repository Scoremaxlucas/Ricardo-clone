import { getPasswordResetEmail, sendEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ message: 'E-Mail-Adresse ist erforderlich' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        firstName: true,
        nickname: true,
      },
    })

    // Always return success to prevent email enumeration attacks
    if (!user) {
      console.log(`[forgot-password] No user found for email: ${normalizedEmail}`)
      return NextResponse.json({
        message:
          'Falls ein Konto mit dieser E-Mail existiert, haben wir Ihnen einen Link zum Zurücksetzen des Passworts gesendet.',
        success: true,
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const tokenExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetTokenExpires: tokenExpires,
      },
    })

    // Generate reset URL
    const { getEmailBaseUrl } = await import('@/lib/email')
    const baseUrl = getEmailBaseUrl()
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`

    // Send email
    const userName = user.firstName || user.nickname || 'Benutzer'
    const { subject, html, text } = getPasswordResetEmail(userName, resetUrl)

    const emailResult = await sendEmail({
      to: user.email,
      subject,
      html,
      text,
    })

    if (!emailResult.success) {
      console.error('[forgot-password] Failed to send email:', emailResult.error)
      // Still return success to prevent email enumeration
    } else {
      console.log(`[forgot-password] Reset email sent to ${user.email}`)
    }

    return NextResponse.json({
      message:
        'Falls ein Konto mit dieser E-Mail existiert, haben wir Ihnen einen Link zum Zurücksetzen des Passworts gesendet.',
      success: true,
    })
  } catch (error: any) {
    console.error('[forgot-password] Error:', error)
    return NextResponse.json(
      { message: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.' },
      { status: 500 }
    )
  }
}

