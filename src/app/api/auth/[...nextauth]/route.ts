import { getAuthOptionsForHost } from '@/lib/auth'
import NextAuth from 'next-auth/next'
import type { NextRequest } from 'next/server'

function requestHost(req: NextRequest): string {
  return (req.headers.get('x-forwarded-host') || req.headers.get('host') || '').split(',')[0].trim()
}

function handler(req: NextRequest, context: { params: { nextauth: string[] } }) {
  return NextAuth(getAuthOptionsForHost(requestHost(req)))(req as never, context as never)
}

export { handler as GET, handler as POST }
