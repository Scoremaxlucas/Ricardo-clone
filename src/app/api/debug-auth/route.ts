import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

/**
 * Debug endpoint to test authentication
 * This helps identify why login is failing
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

    // Test database connection
    let dbConnected = false
    try {
      await prisma.$connect()
      dbConnected = true
    } catch (error: any) {
      return NextResponse.json({
        error: 'Database connection failed',
        details: error.message,
      })
    }

    // Find user
    let user = null
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
        },
      })
    } catch (error: any) {
      return NextResponse.json({
        error: 'Database query failed',
        details: error.message,
        code: error.code,
      })
    }

    if (!user) {
      // List some users for debugging
      const sampleUsers = await prisma.user.findMany({
        select: { email: true },
        take: 5,
      })

      return NextResponse.json({
        error: 'User not found',
        searchedEmail: normalizedEmail,
        sampleUsers: sampleUsers.map(u => u.email),
      })
    }

    // Check if blocked
    if (user.isBlocked === true) {
      return NextResponse.json({
        error: 'User is blocked',
        isBlocked: user.isBlocked,
      })
    }

    // Check password
    if (!user.password) {
      return NextResponse.json({
        error: 'User has no password',
      })
    }

    const passwordIsHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$')
    let passwordValid = false

    if (passwordIsHashed) {
      try {
        passwordValid = await bcrypt.compare(password, user.password)
      } catch (error: any) {
        return NextResponse.json({
          error: 'Bcrypt comparison failed',
          details: error.message,
        })
      }
    } else {
      passwordValid = password === user.password
    }

    return NextResponse.json({
      success: passwordValid,
      user: {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
        isBlocked: user.isBlocked,
        emailVerified: user.emailVerified,
      },
      passwordCheck: {
        isHashed: passwordIsHashed,
        isValid: passwordValid,
        storedLength: user.password.length,
        storedStartsWith: user.password.substring(0, 10),
      },
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Unexpected error',
      details: error.message,
      stack: error.stack?.substring(0, 500),
    })
  }
}

