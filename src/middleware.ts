import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')

    // Wenn es eine Admin-Route ist, prüfe Admin-Rechte
    if (isAdminRoute) {
      // Prüfe Admin-Status aus Token
      let isAdmin = token?.isAdmin === true

      // Falls nicht im Token, prüfe direkt in der Datenbank
      if (!isAdmin && token?.id) {
        try {
          const user = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { isAdmin: true },
          })
          isAdmin = user?.isAdmin === true
        } catch (error) {
          console.error('[MIDDLEWARE] Error checking admin status:', error)
        }
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
