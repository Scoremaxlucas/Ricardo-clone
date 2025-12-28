import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    step: 'start',
  }

  try {
    results.step = 'calling getServerSession'
    results.authOptionsExists = !!authOptions
    results.authOptionsType = typeof authOptions

    // This is where it might fail
    const session = await getServerSession(authOptions)

    results.step = 'session retrieved'
    results.sessionExists = !!session
    results.session = session
      ? {
          user: session.user
            ? {
                id: session.user.id,
                email: session.user.email,
                name: session.user.name,
                isAdmin: session.user.isAdmin,
              }
            : null,
        }
      : null

    results.success = true
    return NextResponse.json(results)
  } catch (error: unknown) {
    const err = error as Error & { code?: string }
    results.success = false
    results.error = err.message
    results.errorName = err.name
    results.errorCode = err.code
    results.errorStack = err.stack?.substring(0, 500)

    return NextResponse.json(results, { status: 500 })
  }
}
