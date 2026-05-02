import { authOptions } from '@/lib/auth'
import { getVerificationApprovalEmail, sendEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { parseSignupIntent } from '@/lib/signup-intent'
import { getUserPreferredLanguage } from '@/lib/user-language'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// POST: Admin manually verifies user's email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { userId } = await params

    // Get admin info
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true, nickname: true },
    })

    const adminName = admin?.firstName || admin?.nickname || 'Administrator'

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        nickname: true,
        emailVerified: true,
        signupIntent: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { message: 'E-Mail-Adresse ist bereits verifiziert' },
        { status: 400 }
      )
    }

    // Verify the user's email
    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationTokenExpires: null,
      },
    })

    const signupIntent = parseSignupIntent(user.signupIntent)

    // Send verification approval email (the preferred email template)
    const userName = user.firstName || user.nickname || 'Benutzer'
    try {
      const locale = await getUserPreferredLanguage(user.id)
      const { subject, html, text } = getVerificationApprovalEmail(
        userName,
        user.email,
        locale,
        signupIntent
      )
      await sendEmail({
        to: user.email,
        subject,
        html,
        text,
        useNoReply: true, // Verification confirmation: automatic system email
      })
      console.log(`[admin/verify-email] Verification approval email sent to ${user.email}`)
    } catch (emailError: any) {
      console.error(`[admin/verify-email] Failed to send verification email:`, emailError)
      // Don't fail verification if email fails
    }

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: userId,
        type: 'system',
        title: 'E-Mail-Adresse verifiziert',
        message:
          'Ihr Konto wurde von unserem Team verifiziert. Sie können nun alle Funktionen nutzen.',
      },
    })

    console.log(`[admin/verify-email] Admin ${session.user.id} verified email for user ${userId}`)

    return NextResponse.json({
      message: 'E-Mail-Adresse erfolgreich verifiziert',
      success: true,
    })
  } catch (error: any) {
    console.error('[admin/verify-email] Error:', error)
    return NextResponse.json({ message: 'Ein Fehler ist aufgetreten' }, { status: 500 })
  }
}

