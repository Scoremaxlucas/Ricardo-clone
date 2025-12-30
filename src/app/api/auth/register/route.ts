import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'

// Force dynamic - no caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/c628c1bf-3a6f-4be8-9f99-acdcbe2e7d79', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'register/route.ts:5',
      message: 'Function entry - checking env and prisma',
      data: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        dbUrlLength: process.env.DATABASE_URL?.length || 0,
        hasPrisma: !!prisma,
        nodeEnv: process.env.NODE_ENV,
      },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'A,B',
    }),
  }).catch(() => {})
  // #endregion
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/c628c1bf-3a6f-4be8-9f99-acdcbe2e7d79', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'register/route.ts:6',
      message: 'POST handler entry',
      data: { hasRequest: !!request },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'A,B,C',
    }),
  }).catch(() => {})
  // #endregion

  // Declare variables outside try block so they're accessible in catch block
  let user: any = null
  let userCreated = false

  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c628c1bf-3a6f-4be8-9f99-acdcbe2e7d79', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'register/route.ts:8',
        message: 'Before request.json()',
        data: {},
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'F',
      }),
    }).catch(() => {})
    // #endregion
    const { firstName, lastName, nickname, email, password } = await request.json()
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c628c1bf-3a6f-4be8-9f99-acdcbe2e7d79', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'register/route.ts:10',
        message: 'After request.json()',
        data: {
          hasFirstName: !!firstName,
          hasLastName: !!lastName,
          hasNickname: !!nickname,
          hasEmail: !!email,
          hasPassword: !!password,
          emailLength: email?.length || 0,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'F',
      }),
    }).catch(() => {})
    // #endregion

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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c628c1bf-3a6f-4be8-9f99-acdcbe2e7d79', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'register/route.ts:56',
        message: 'Before email check query',
        data: { normalizedEmail, hasPrisma: !!prisma },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A,B',
      }),
    }).catch(() => {})
    // #endregion
    try {
      existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      })
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/c628c1bf-3a6f-4be8-9f99-acdcbe2e7d79', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'register/route.ts:60',
          message: 'After email check query',
          data: { foundUser: !!existingUser },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'A,B',
        }),
      }).catch(() => {})
      // #endregion
    } catch (dbError: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/c628c1bf-3a6f-4be8-9f99-acdcbe2e7d79', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'register/route.ts:63',
          message: 'Email check query error',
          data: {
            errorCode: dbError?.code,
            errorMessage: dbError?.message?.substring(0, 200),
            errorName: dbError?.name,
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'A,B',
        }),
      }).catch(() => {})
      // #endregion
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c628c1bf-3a6f-4be8-9f99-acdcbe2e7d79', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'register/route.ts:77',
        message: 'Before nickname check query',
        data: { normalizedNicknameForCheck },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A,B',
      }),
    }).catch(() => {})
    // #endregion
    try {
      existingNickname = await prisma.user.findFirst({
        where: {
          nickname: {
            equals: normalizedNicknameForCheck,
            mode: 'insensitive',
          },
        },
      })
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/c628c1bf-3a6f-4be8-9f99-acdcbe2e7d79', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'register/route.ts:87',
          message: 'After nickname check query',
          data: { foundNickname: !!existingNickname },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'A,B',
        }),
      }).catch(() => {})
      // #endregion
    } catch (dbError: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/c628c1bf-3a6f-4be8-9f99-acdcbe2e7d79', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'register/route.ts:90',
          message: 'Nickname check error, trying fallback',
          data: { errorCode: dbError?.code, errorMessage: dbError?.message?.substring(0, 200) },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'A,B',
        }),
      }).catch(() => {})
      // #endregion
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c628c1bf-3a6f-4be8-9f99-acdcbe2e7d79', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'register/route.ts:108',
        message: 'Before bcrypt.hash()',
        data: { passwordLength: trimmedPassword.length },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'D',
      }),
    }).catch(() => {})
    // #endregion
    const hashedPassword = await bcrypt.hash(trimmedPassword, 12)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c628c1bf-3a6f-4be8-9f99-acdcbe2e7d79', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'register/route.ts:110',
        message: 'After bcrypt.hash()',
        data: { hasHash: !!hashedPassword, hashLength: hashedPassword?.length || 0 },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'D',
      }),
    }).catch(() => {})
    // #endregion

    // Create user with emailVerified: true (email verification disabled)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c628c1bf-3a6f-4be8-9f99-acdcbe2e7d79', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'register/route.ts:112',
        message: 'Before prisma.user.create()',
        data: {
          hasFirstName: !!trimmedFirstName,
          hasLastName: !!trimmedLastName,
          hasNickname: !!trimmedNickname,
          hasEmail: !!normalizedEmail,
          hasPassword: !!hashedPassword,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A,B,C,E',
      }),
    }).catch(() => {})
    // #endregion
    // Build name field - ensure it's null if empty, not empty string
    const fullName = `${trimmedFirstName} ${trimmedLastName}`.trim()

    console.log('[register] Attempting to create user:', {
      email: normalizedEmail,
      nickname: trimmedNickname,
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      nameLength: fullName?.length || 0,
      hasPassword: !!hashedPassword,
    })

    // DEFENSIVE: Start with minimal required fields that are guaranteed to exist
    // Then progressively try adding more fields
    const createUserWithFallback = async () => {
      // Attempt 1: Try with all fields including emailVerified and emailVerifiedAt
      const fullUserData = {
        email: normalizedEmail,
        password: hashedPassword,
        nickname: trimmedNickname,
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        name: fullName || null,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      }

      console.log('[register] Attempt 1: Creating user with all fields')
      try {
        const createdUser = await prisma.user.create({ data: fullUserData })
        console.log('[register] ✅ Attempt 1 succeeded:', createdUser.id)
        return createdUser
      } catch (err1: any) {
        console.error('[register] Attempt 1 failed:', err1?.code, err1?.message?.substring(0, 200))

        // Attempt 2: Try without emailVerifiedAt (DateTime might be problematic)
        if (err1?.code === 'P2022' || err1?.code === 'P2011' || err1?.code === 'P2012') {
          console.log('[register] Attempt 2: Creating user without emailVerifiedAt')
          const dataWithoutVerifiedAt = { ...fullUserData }
          delete (dataWithoutVerifiedAt as any).emailVerifiedAt

          try {
            const createdUser = await prisma.user.create({ data: dataWithoutVerifiedAt })
            console.log('[register] ✅ Attempt 2 succeeded:', createdUser.id)
            return createdUser
          } catch (err2: any) {
            console.error(
              '[register] Attempt 2 failed:',
              err2?.code,
              err2?.message?.substring(0, 200)
            )

            // Attempt 3: Try without emailVerified as well
            if (err2?.code === 'P2022' || err2?.code === 'P2011' || err2?.code === 'P2012') {
              console.log('[register] Attempt 3: Creating user without emailVerified fields')
              const dataWithoutVerified = { ...dataWithoutVerifiedAt }
              delete (dataWithoutVerified as any).emailVerified

              try {
                const createdUser = await prisma.user.create({ data: dataWithoutVerified })
                console.log('[register] ✅ Attempt 3 succeeded:', createdUser.id)
                return createdUser
              } catch (err3: any) {
                console.error(
                  '[register] Attempt 3 failed:',
                  err3?.code,
                  err3?.message?.substring(0, 200)
                )

                // Attempt 4: Try with minimal fields only (email, password, nickname)
                if (err3?.code === 'P2022' || err3?.code === 'P2011' || err3?.code === 'P2012') {
                  console.log('[register] Attempt 4: Creating user with minimal fields only')
                  const minimalData = {
                    email: normalizedEmail,
                    password: hashedPassword,
                    nickname: trimmedNickname,
                  }

                  try {
                    const createdUser = await prisma.user.create({ data: minimalData })
                    console.log('[register] ✅ Attempt 4 succeeded (minimal):', createdUser.id)

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
                      console.log('[register] ✅ Updated user with additional fields')
                    } catch (updateErr: any) {
                      console.warn(
                        '[register] ⚠️ Could not update additional fields:',
                        updateErr?.message?.substring(0, 100)
                      )
                      // Not critical - user was created successfully
                    }

                    return createdUser
                  } catch (err4: any) {
                    console.error(
                      '[register] Attempt 4 failed:',
                      err4?.code,
                      err4?.message?.substring(0, 200)
                    )
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
      console.log('[register] User created successfully:', user.id, user.email)
    } catch (createError: any) {
      console.error('[register] All user creation attempts failed:', {
        code: createError?.code,
        message: createError?.message,
        meta: createError?.meta,
      })
      throw createError
    }
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c628c1bf-3a6f-4be8-9f99-acdcbe2e7d79', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'register/route.ts:125',
        message: 'After prisma.user.create()',
        data: { userId: user?.id, userEmail: user?.email },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A,B,C,E',
      }),
    }).catch(() => {})
    // #endregion

    console.log(
      `[register] ✅ User created: ${trimmedFirstName} ${trimmedLastName} (${normalizedEmail})`
    )
    console.log(`[register] Email verification disabled - user can login immediately`)

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    // CRITICAL: Only return success if user was created successfully
    // If we reach here, user creation succeeded, so it's safe to return success
    return NextResponse.json(
      {
        message: 'Benutzer erfolgreich erstellt. Sie können sich jetzt anmelden.',
        user: userWithoutPassword,
      },
      { status: 201 }
    )
  } catch (error: any) {
    // CRITICAL: If user was created but an error occurred, clean it up to prevent orphaned users
    // This ensures atomicity: if registration fails, no user record remains
    // This cleanup happens BEFORE error-specific handling to ensure it always runs
    if (userCreated && user?.id) {
      console.error('[register] Error occurred after user creation, cleaning up user:', user.id)
      console.error(
        '[register] Error code:',
        error?.code,
        'Error message:',
        error?.message?.substring(0, 200)
      )
      console.error('[register] This prevents orphaned user records when registration fails')
      try {
        await prisma.user.delete({
          where: { id: user.id },
        })
        console.log('[register] ✅ Successfully deleted user after error:', user.id, user.email)
        // Reset flag to prevent double-deletion attempts
        userCreated = false
        user = null
      } catch (deleteError: any) {
        console.error('[register] ❌ Failed to delete user after error:', deleteError)
        console.error('[register] User may remain in database:', user.id, user.email)
        console.error('[register] Manual cleanup may be required for:', user.email)
        // Log but don't throw - we still want to return the original error
      }
    }
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c628c1bf-3a6f-4be8-9f99-acdcbe2e7d79', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'register/route.ts:139',
        message: 'Catch block entry',
        data: {
          errorCode: error?.code,
          errorMessage: error?.message?.substring(0, 300),
          errorName: error?.name,
          hasMeta: !!error?.meta,
          metaTarget: error?.meta?.target,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A,B,C,D,E,F',
      }),
    }).catch(() => {})
    // #endregion
    console.error('[register] Registration error:', error)
    console.error('[register] Error details:', {
      code: error.code,
      message: error.message,
      meta: error.meta,
      name: error.name,
      stack: error.stack?.substring(0, 500),
    })

    // Prüfe auf eindeutigen Constraint-Fehler (P2002 = unique constraint violation)
    if (error.code === 'P2002') {
      // Prisma unique constraint violation
      const target = error.meta?.target || []
      console.error('[register] Unique constraint violation:', {
        code: error.code,
        target,
        meta: error.meta,
      })

      // CRITICAL: If user was created but hit unique constraint, delete it
      // This can happen in race conditions where duplicate checks pass but DB constraint fails
      if (userCreated && user?.id) {
        console.error(
          '[register] Unique constraint error after user creation - cleaning up:',
          user.id
        )
        try {
          await prisma.user.delete({
            where: { id: user.id },
          })
          console.log('[register] ✅ Deleted user after unique constraint error:', user.id)
        } catch (deleteError: any) {
          console.error(
            '[register] ❌ Failed to delete user after unique constraint error:',
            deleteError
          )
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
      // Generic unique constraint error
      return NextResponse.json(
        {
          message: 'Ein Wert ist bereits vergeben. Bitte verwenden Sie andere Angaben.',
          errorCode: error.code,
        },
        { status: 400 }
      )
    }

    // P2022: Column does not exist (schema mismatch)
    // Note: Cleanup already happened above, so we don't need to delete again here
    if (error.code === 'P2022') {
      console.error('[register] Schema mismatch error (P2022):', {
        code: error.code,
        message: error.message,
        meta: error.meta,
      })

      // TEMPORARY: Return full error for debugging
      return NextResponse.json(
        {
          message:
            'Ein Datenbankfehler ist aufgetreten. Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.',
          errorCode: error.code,
          // ALWAYS return error details for debugging P2022
          errorMessage: error.message,
          errorMeta: error.meta,
          column: error.meta?.column,
          table: error.meta?.table,
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

    // Null constraint violations (P2011)
    if (error.code === 'P2011') {
      console.error('[register] Null constraint violation:', error.meta)
      return NextResponse.json(
        {
          message:
            'Ein Fehler ist aufgetreten beim Erstellen des Kontos. Bitte kontaktieren Sie den Support.',
          ...(process.env.NODE_ENV === 'development' && {
            errorCode: error.code,
            errorMeta: error.meta,
          }),
        },
        { status: 500 }
      )
    }

    // Missing required value (P2012)
    if (error.code === 'P2012') {
      console.error('[register] Missing required value:', error.meta)
      return NextResponse.json(
        {
          message:
            'Ein Fehler ist aufgetreten beim Erstellen des Kontos. Bitte kontaktieren Sie den Support.',
          ...(process.env.NODE_ENV === 'development' && {
            errorCode: error.code,
            errorMeta: error.meta,
          }),
        },
        { status: 500 }
      )
    }

    // Prisma query errors
    if (error.code?.startsWith('P')) {
      console.error('[register] Prisma error:', error.code, error.message)
      console.error('[register] Prisma error meta:', JSON.stringify(error.meta, null, 2))
      console.error(
        '[register] Full error object:',
        JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      )
      // Return error code even in production for debugging (safe to expose)
      return NextResponse.json(
        {
          message:
            'Ein Datenbankfehler ist aufgetreten. Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.',
          errorCode: error.code, // Safe to expose - helps with debugging
          ...(process.env.NODE_ENV === 'development' && {
            errorMessage: error.message,
            errorMeta: error.meta,
          }),
        },
        { status: 500 }
      )
    }

    // Generic error response
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c628c1bf-3a6f-4be8-9f99-acdcbe2e7d79', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'register/route.ts:232',
        message: 'Returning generic 500 error',
        data: { errorCode: error?.code, errorMessage: error?.message?.substring(0, 200) },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A,B,C,D,E,F',
      }),
    }).catch(() => {})
    // #endregion
    console.error('[register] Unhandled error type:', {
      errorType: typeof error,
      errorConstructor: error?.constructor?.name,
      hasCode: !!error?.code,
      hasMessage: !!error?.message,
      errorKeys: Object.keys(error || {}),
    })
    return NextResponse.json(
      {
        message:
          'Ein Fehler ist aufgetreten beim Erstellen des Kontos. Bitte versuchen Sie es erneut.',
        ...(process.env.NODE_ENV === 'development' && {
          error: error.message,
          code: error.code,
          errorType: error?.constructor?.name,
          errorKeys: Object.keys(error || {}),
        }),
      },
      { status: 500 }
    )
  }
}
