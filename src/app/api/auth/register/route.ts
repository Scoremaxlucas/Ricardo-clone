import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { sendEmail, getEmailVerificationEmail } from '@/lib/email'

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

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const tokenExpires = new Date()
    tokenExpires.setHours(tokenExpires.getHours() + 24) // Token gültig für 24 Stunden

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        nickname,
        name: `${firstName} ${lastName}`, // Für Kompatibilität
        email: normalizedEmail,
        password: hashedPassword,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpires: tokenExpires,
      },
    })

    // E-Mail versenden mit Bestätigungslink (E-Mail-Bestätigung erforderlich)
    const baseUrl =
      process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`

    console.log('\n📧 ===== REGISTRIERUNG: E-MAIL-VERSAND =====')
    console.log(`[register] User: ${firstName} ${lastName}`)
    console.log(`[register] Email: ${normalizedEmail}`)
    console.log(`[register] Verification URL: ${verificationUrl}`)
    console.log(`[register] Base URL: ${baseUrl}`)

    let emailSent = false
    let emailError: string | null = null
    
    try {
      const { subject, html, text } = getEmailVerificationEmail(firstName, verificationUrl)

      console.log(`[register] E-Mail-Template generiert:`)
      console.log(`  Subject: ${subject}`)
      console.log(`  HTML Length: ${html.length} Zeichen`)
      console.log(`  To Email: ${normalizedEmail}`)
      console.log(`  Verification URL: ${verificationUrl}`)

      const emailResult = await sendEmail({
        to: normalizedEmail,
        subject,
        html,
        text,
      })

      console.log(`[register] E-Mail-Versand Ergebnis:`)
      console.log(`  Success: ${emailResult.success}`)
      console.log(`  Method: ${emailResult.method}`)
      console.log(`  Message ID: ${emailResult.messageId || 'N/A'}`)
      console.log(`  Error: ${emailResult.error || 'Keine'}`)

      if (emailResult.success) {
        emailSent = true
        console.log(`[register] ✅ E-Mail-Bestätigung erfolgreich gesendet an ${normalizedEmail}`)
      } else {
        emailError = emailResult.error || 'Unbekannter Fehler'
        console.error(`[register] ❌ Fehler beim Senden der E-Mail-Bestätigung:`)
        console.error(`  Error: ${emailError}`)
        console.error(`  Method: ${emailResult.method}`)
        // Versuche trotzdem fortzufahren, aber logge den Fehler
      }
    } catch (emailErrorException: any) {
      emailError = emailErrorException.message || 'Unbekannte Exception'
      console.error('[register] ❌ Exception beim Senden der E-Mail-Bestätigung:')
      console.error(`  Message: ${emailErrorException.message}`)
      console.error(`  Stack: ${emailErrorException.stack}`)
      // Versuche trotzdem fortzufahren
    }

    console.log(`[register] Email Sent Flag: ${emailSent}`)
    console.log('📧 ===== REGISTRIERUNG: E-MAIL-VERSAND ENDE =====\n')

    // Token zurückgeben wenn E-Mail nicht versendet werden konnte
    // Damit kann der User sich manuell verifizieren oder Admin kann helfen
    const shouldReturnToken = !emailSent

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      {
        message: emailSent
          ? 'Benutzer erfolgreich erstellt. Bitte überprüfen Sie Ihr E-Mail-Postfach und klicken Sie auf den Bestätigungslink.'
          : 'Benutzer erfolgreich erstellt. Bitte überprüfen Sie Ihr E-Mail-Postfach. Falls keine E-Mail ankommt, kontaktieren Sie bitte den Support.',
        user: userWithoutPassword,
        // Token zurückgeben wenn E-Mail nicht versendet werden konnte (für manuelle Verifizierung)
        verificationToken: shouldReturnToken ? verificationToken : undefined,
        verificationUrl: shouldReturnToken ? verificationUrl : undefined,
        emailSent: emailSent,
        emailError: emailError || undefined,
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
