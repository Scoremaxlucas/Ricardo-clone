import { getEmailVerificationEmail, sendEmail } from '@/lib/email'
import { shouldShowDetailedErrors } from '@/lib/env'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

// Force dynamic - no caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  // Declare variables outside try block so they're accessible in catch block
  let user: any = null
  let userCreated = false

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

    // Build name field - ensure it's null if empty, not empty string
    const fullName = `${trimmedFirstName} ${trimmedLastName}`.trim()

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // DEFENSIVE: Start with minimal required fields that are guaranteed to exist
    // Then progressively try adding more fields
    const createUserWithFallback = async () => {
      // Attempt 1: Try with all fields including emailVerified: false (verification required)
      const fullUserData = {
        email: normalizedEmail,
        password: hashedPassword,
        nickname: trimmedNickname,
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        name: fullName || null,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpires: tokenExpires,
      }

      try {
        const createdUser = await prisma.user.create({ data: fullUserData })
        return createdUser
      } catch (err1: any) {
        // Attempt 2: Try without emailVerifiedAt (DateTime might be problematic)
        if (err1?.code === 'P2022' || err1?.code === 'P2011' || err1?.code === 'P2012') {
          const dataWithoutVerifiedAt = { ...fullUserData }
          delete (dataWithoutVerifiedAt as any).emailVerifiedAt

          try {
            const createdUser = await prisma.user.create({ data: dataWithoutVerifiedAt })
            return createdUser
          } catch (err2: any) {
            // Attempt 3: Try without emailVerified as well
            if (err2?.code === 'P2022' || err2?.code === 'P2011' || err2?.code === 'P2012') {
              const dataWithoutVerified = { ...dataWithoutVerifiedAt }
              delete (dataWithoutVerified as any).emailVerified

              try {
                const createdUser = await prisma.user.create({ data: dataWithoutVerified })
                return createdUser
              } catch (err3: any) {
                // Attempt 4: Try with minimal fields only (email, password, nickname)
                if (err3?.code === 'P2022' || err3?.code === 'P2011' || err3?.code === 'P2012') {
                  const minimalData = {
                    email: normalizedEmail,
                    password: hashedPassword,
                    nickname: trimmedNickname,
                  }

                  try {
                    const createdUser = await prisma.user.create({ data: minimalData })

                    // Try to update with additional fields (non-critical)
                    try {
                      await prisma.user.update({
                        where: { id: createdUser.id },
                        data: {
                          firstName: trimmedFirstName,
                          lastName: trimmedLastName,
                          name: fullName || null,
                        },
                      })
                    } catch {
                      // Not critical - user was created successfully
                    }

                    return createdUser
                  } catch (err4: any) {
                    // All attempts failed, throw the original error
                    throw err1
                  }
                }
                throw err3
              }
            }
            throw err2
          }
        }
        throw err1
      }
    }

    try {
      user = await createUserWithFallback()
      userCreated = true // Mark that user was created
    } catch (createError: any) {
      console.error('[register] All user creation attempts failed:', {
        code: createError?.code,
        message: createError?.message,
      })
      throw createError
    }

    // Send verification email
    const { getEmailBaseUrl } = await import('@/lib/email')
    const baseUrl = getEmailBaseUrl()
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`
    const userName = trimmedFirstName || trimmedNickname || 'Benutzer'

    try {
      const { subject, html, text } = getEmailVerificationEmail(userName, verificationUrl)
      await sendEmail({
        to: normalizedEmail,
        subject,
        html,
        text,
      })
    } catch {
      // Don't fail registration if email fails - user can request resend
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      {
        message:
          'Benutzer erfolgreich erstellt. Bitte überprüfen Sie Ihre E-Mails und bestätigen Sie Ihre E-Mail-Adresse.',
        user: userWithoutPassword,
        requiresEmailVerification: true,
      },
      { status: 201 }
    )
  } catch (error: any) {
    // CRITICAL: If user was created but an error occurred, clean it up to prevent orphaned users
    if (userCreated && user?.id) {
      try {
        await prisma.user.delete({
          where: { id: user.id },
        })
        userCreated = false
        user = null
      } catch {
        // Log but don't throw - we still want to return the original error
      }
    }

    console.error('[register] Registration error:', error?.code, error?.message?.substring(0, 200))

    // Prüfe auf eindeutigen Constraint-Fehler (P2002 = unique constraint violation)
    if (error.code === 'P2002') {
      const target = error.meta?.target || []

      // CRITICAL: If user was created but hit unique constraint, delete it
      if (userCreated && user?.id) {
        try {
          await prisma.user.delete({
            where: { id: user.id },
          })
        } catch {
          // Ignore cleanup errors
        }
      }

      if (Array.isArray(target) && target.includes('email')) {
        return NextResponse.json(
          {
            message:
              'Diese E-Mail-Adresse wird bereits von einem anderen Benutzer verwendet. Bitte verwenden Sie eine andere E-Mail-Adresse oder melden Sie sich mit Ihrem bestehenden Konto an.',
            errorCode: error.code,
          },
          { status: 400 }
        )
      }
      if (Array.isArray(target) && target.includes('nickname')) {
        return NextResponse.json(
          {
            message:
              'Dieser Nickname ist bereits vergeben. Bitte wählen Sie einen anderen Nickname.',
            errorCode: error.code,
          },
          { status: 400 }
        )
      }
      return NextResponse.json(
        {
          message: 'Ein Wert ist bereits vergeben. Bitte verwenden Sie andere Angaben.',
          errorCode: error.code,
        },
        { status: 400 }
      )
    }

    // P2022: Column does not exist (schema mismatch)
    if (error.code === 'P2022') {
      return NextResponse.json(
        {
          message:
            'Ein Datenbankfehler ist aufgetreten. Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.',
          errorCode: error.code,
        },
        { status: 500 }
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
      return NextResponse.json(
        {
          message:
            'Ein Fehler ist aufgetreten beim Erstellen des Kontos. Bitte kontaktieren Sie den Support.',
        },
        { status: 500 }
      )
    }

    // Null constraint violations (P2011) or Missing required value (P2012)
    if (error.code === 'P2011' || error.code === 'P2012') {
      return NextResponse.json(
        {
          message:
            'Ein Fehler ist aufgetreten beim Erstellen des Kontos. Bitte kontaktieren Sie den Support.',
          ...(shouldShowDetailedErrors() && {
            errorCode: error.code,
            errorMeta: error.meta,
          }),
        },
        { status: 500 }
      )
    }

    // Prisma query errors
    if (error.code?.startsWith('P')) {
      return NextResponse.json(
        {
          message:
            'Ein Datenbankfehler ist aufgetreten. Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.',
          errorCode: error.code,
          ...(shouldShowDetailedErrors() && {
            errorMessage: error.message,
            errorMeta: error.meta,
          }),
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
