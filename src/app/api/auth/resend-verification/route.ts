import { getEmailVerificationEmail, sendEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { parseSignupIntent } from '@/lib/signup-intent'
import { buildVerificationEmailLink } from '@/lib/verification-email-url'
import { getUserPreferredLanguage } from '@/lib/user-language'
import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route zum erneuten Versenden einer Verifizierungs-E-Mail
 * User kann auf Login-Seite "E-Mail erneut senden" klicken
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ message: 'E-Mail-Adresse ist erforderlich' }, { status: 400 })
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim()

    // Finde User
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        firstName: true,
        name: true,
        emailVerified: true,
        emailVerificationToken: true,
        emailVerificationTokenExpires: true,
        signupIntent: true,
      },
    })

    // Aus Sicherheitsgründen: Immer Erfolg zurückgeben, auch wenn User nicht existiert
    // (verhindert E-Mail-Enumeration-Angriffe)
    if (!user) {
      // Log für Debugging, aber User sieht Erfolgsmeldung
      console.log(`[resend-verification] User nicht gefunden: ${normalizedEmail}`)
      return NextResponse.json(
        {
          message:
            'Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde eine neue Verifizierungs-E-Mail gesendet.',
          success: true,
        },
        { status: 200 }
      )
    }

    // Wenn bereits verifiziert, keine neue E-Mail senden
    if (user.emailVerified) {
      return NextResponse.json(
        {
          message: 'Diese E-Mail-Adresse ist bereits verifiziert. Sie können sich anmelden.',
          success: true,
          alreadyVerified: true,
        },
        { status: 200 }
      )
    }

    // Generiere neuen Verifizierungstoken
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const tokenExpires = new Date()
    tokenExpires.setHours(tokenExpires.getHours() + 24) // Token gültig für 24 Stunden

    // Update User mit neuem Token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpires: tokenExpires,
      },
    })

    const signupIntent = parseSignupIntent(user.signupIntent)
    const verificationUrl = buildVerificationEmailLink(verificationToken, signupIntent)

    // Versende E-Mail
    const userName = user.firstName || user.name || 'Benutzer'
    const locale = await getUserPreferredLanguage(user.id)
    const { subject, html, text } = getEmailVerificationEmail(
      userName,
      verificationUrl,
      locale,
      signupIntent
    )

    const emailResult = await sendEmail({
      to: user.email,
      subject,
      html,
      text,
      useNoReply: true, // E-Mail-Verifizierung: automatische System-E-Mail
    })

    if (emailResult.success) {
      console.log(
        `[resend-verification] ✅ Verifizierungs-E-Mail erfolgreich gesendet an ${user.email}`
      )
      return NextResponse.json(
        {
          message:
            'Eine neue Verifizierungs-E-Mail wurde gesendet. Bitte überprüfen Sie Ihr E-Mail-Postfach.',
          success: true,
        },
        { status: 200 }
      )
    } else {
      console.error(`[resend-verification] ❌ Fehler beim Versenden der E-Mail:`, emailResult.error)
      // Auch bei E-Mail-Fehler Erfolg zurückgeben, aber Link bereitstellen
      return NextResponse.json(
        {
          message:
            'Die E-Mail konnte nicht automatisch versendet werden. Bitte kontaktieren Sie den Support.',
          success: false,
          error: emailResult.error,
          verificationUrl: emailResult.method === 'none' ? verificationUrl : undefined,
        },
        { status: 200 }
      )
    }
  } catch (error: any) {
    console.error('[resend-verification] Fehler:', error)
    return NextResponse.json(
      {
        message: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}
