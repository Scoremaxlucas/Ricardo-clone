import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

// NOTE: Middleware runs on Edge Runtime - NO Prisma/database access allowed!
// Admin checks are done via JWT token only. If token doesn't have isAdmin,
// the API routes will verify against the database.

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')

    // For admin routes, check the isAdmin flag in the JWT token
    if (isAdminRoute) {
      const isAdmin = token?.isAdmin === true

      if (!isAdmin) {
        // Redirect non-admins to homepage
        return NextResponse.redirect(new URL('/', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')

        // For admin routes, user must be logged in
        if (isAdminRoute) {
          return !!token
        }

        // For other routes, allow without token
        return true
      },
    },
  }
)

export const config = {
  matcher: ['/admin/:path*'],
}
