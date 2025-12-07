import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

/**
 * CRITICAL: Test endpoint to verify login functionality
 * This simulates the exact same logic as auth.ts authorize function
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Test 1: Database connection
    let dbTest = { connected: false, error: null as any }
    try {
      await prisma.$queryRaw`SELECT 1`
      dbTest.connected = true
    } catch (error: any) {
      dbTest.error = {
        message: error.message,
        code: error.code,
      }
    }

    // Test 2: Find user
    let user = null
    let userQueryError = null
    try {
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: {
          id: true,
          email: true,
          password: true,
          isBlocked: true,
          isAdmin: true,
          emailVerified: true,
          name: true,
          firstName: true,
          lastName: true,
        },
      })
    } catch (error: any) {
      userQueryError = {
        message: error.message,
        code: error.code,
      }
    }

    // Test 3: List all users (for debugging)
    let allUsers: any[] = []
    try {
      allUsers = await prisma.user.findMany({
        select: { email: true, id: true },
        take: 20,
      })
    } catch (error) {
      // Ignore
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        searchedEmail: normalizedEmail,
        allUsers: allUsers.map(u => ({ email: u.email, id: u.id })),
        dbTest,
        userQueryError,
      })
    }

    // Test 4: Check if blocked
    const isBlocked = user.isBlocked === true

    if (isBlocked) {
      return NextResponse.json({
        success: false,
        error: 'User is blocked',
        isBlocked: user.isBlocked,
        user: {
          id: user.id,
          email: user.email,
        },
      })
    }

    // Test 5: Password validation (EXACT same logic as auth.ts)
    if (!user.password) {
      return NextResponse.json({
        success: false,
        error: 'User has no password',
        user: {
          id: user.id,
          email: user.email,
        },
      })
    }

    const passwordIsHashed =
      user.password.startsWith('$2a$') ||
      user.password.startsWith('$2b$') ||
      user.password.startsWith('$2y$') ||
      user.password.startsWith('$2x$')

    let isPasswordValid = false
    const passwordChecks: any[] = []

    // Strategy 1: Try bcrypt if hashed
    if (passwordIsHashed) {
      try {
        isPasswordValid = await bcrypt.compare(password, user.password)
        passwordChecks.push({ strategy: 'bcrypt', result: isPasswordValid })
      } catch (bcryptError: any) {
        passwordChecks.push({ strategy: 'bcrypt', error: bcryptError.message })
        // Fallback: Try direct comparison
        isPasswordValid = password === user.password
        passwordChecks.push({ strategy: 'direct_fallback', result: isPasswordValid })
      }
    } else {
      // Strategy 2: Try direct comparison if not hashed
      isPasswordValid = password === user.password
      passwordChecks.push({ strategy: 'direct', result: isPasswordValid })

      // Strategy 3: Fallback to bcrypt if direct fails
      if (!isPasswordValid) {
        try {
          isPasswordValid = await bcrypt.compare(password, user.password)
          passwordChecks.push({ strategy: 'bcrypt_fallback', result: isPasswordValid })
        } catch (bcryptError: any) {
          passwordChecks.push({ strategy: 'bcrypt_fallback', error: bcryptError.message })
        }
      }
    }

    return NextResponse.json({
      success: isPasswordValid,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
        isAdmin: user.isAdmin === true,
        isBlocked: user.isBlocked,
        emailVerified: user.emailVerified,
      },
      passwordCheck: {
        isHashed: passwordIsHashed,
        isValid: isPasswordValid,
        storedLength: user.password.length,
        storedStartsWith: user.password.substring(0, 15),
        checks: passwordChecks,
      },
      dbTest,
      allUsersCount: allUsers.length,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error.message,
      stack: error.stack?.substring(0, 500),
    })
  }
}

