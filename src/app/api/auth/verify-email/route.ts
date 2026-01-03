import { getWelcomeEmail, sendEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ message: 'Kein Token angegeben' }, { status: 400 })
    }

    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        nickname: true,
        emailVerificationTokenExpires: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: 'Ungültiger oder abgelaufener Token' }, { status: 400 })
    }

    if (user.emailVerificationTokenExpires && user.emailVerificationTokenExpires < new Date()) {
      return NextResponse.json(
        { message: 'Token ist abgelaufen. Bitte fordern Sie einen neuen Bestätigungslink an.' },
        { status: 400 }
      )
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationTokenExpires: null,
      },
    })

    // Send welcome email
    const userName = user.firstName || user.nickname || 'Benutzer'
    try {
      const { subject, html, text } = getWelcomeEmail(userName)
      await sendEmail({
        to: user.email,
        subject,
        html,
        text,
      })
      console.log(`[verify-email] Welcome email sent to ${user.email}`)
    } catch (emailError: any) {
      console.error(`[verify-email] Failed to send welcome email:`, emailError)
      // Don't fail verification if welcome email fails
    }

    // Create welcome notification
    try {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'system',
          title: '🎉 Willkommen bei Helvenda!',
          message:
            'Ihr Konto wurde erfolgreich verifiziert. Sie können nun alle Funktionen nutzen.',
        },
      })
    } catch (notifError: any) {
      console.error(`[verify-email] Failed to create notification:`, notifError)
    }

    console.log(`[verify-email] Email verified for user ${user.id}`)

    return NextResponse.json(
      { message: 'E-Mail-Adresse erfolgreich bestätigt! Sie können sich jetzt anmelden.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json({ message: 'Ein Fehler ist aufgetreten' }, { status: 500 })
  }
}
