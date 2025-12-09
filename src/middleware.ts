import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// OPTIMIERT: Cache für Admin-Checks (5 Minuten TTL)
const adminCache = new Map<string, { isAdmin: boolean; expires: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 Minuten

async function checkAdminStatus(userId: string): Promise<boolean> {
  // Prüfe Cache zuerst
  const cached = adminCache.get(userId)
  if (cached && cached.expires > Date.now()) {
    return cached.isAdmin
  }

  // Falls nicht im Cache, prüfe Datenbank
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    })
    const isAdmin = user?.isAdmin === true

    // Speichere im Cache
    adminCache.set(userId, {
      isAdmin,
      expires: Date.now() + CACHE_TTL,
    })

    return isAdmin
  } catch (error) {
    console.error('[MIDDLEWARE] Error checking admin status:', error)
    return false
  }
}

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')

    // Wenn es eine Admin-Route ist, prüfe Admin-Rechte
    if (isAdminRoute) {
      // Prüfe Admin-Status aus Token zuerst
      let isAdmin = token?.isAdmin === true

      // Falls nicht im Token, prüfe mit Cache
      if (!isAdmin && token?.id) {
        isAdmin = await checkAdminStatus(token.id as string)
      }

      if (!isAdmin) {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')

        // Für Admin-Routes muss der User eingeloggt sein
        if (isAdminRoute) {
          return !!token
        }

        // Für andere Routes ist es OK wenn kein Token vorhanden ist
        return true
      },
    },
  }
)

export const config = {
  matcher: ['/admin/:path*'],
}
