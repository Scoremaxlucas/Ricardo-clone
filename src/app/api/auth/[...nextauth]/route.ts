import { getAuthOptionsForHost } from '@/lib/auth'
import NextAuth from 'next-auth/next'
import type { NextRequest } from 'next/server'

function handler(req: NextRequest, context: { params: { nextauth: string[] } }) {
  return NextAuth(getAuthOptionsForHost(req.headers.get('host')))(req as never, context as never)
}

export { handler as GET, handler as POST }
