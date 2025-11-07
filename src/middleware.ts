import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')

    // Wenn es eine Admin-Route ist, prüfe Admin-Rechte
    if (isAdminRoute) {
      // Prüfe Admin-Status aus Token oder E-Mail
      const isAdmin = token?.isAdmin === true || 
                     token?.isAdmin === 1 ||
                     (token?.email && token.email.toLowerCase() === 'admin@admin.ch')
      
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
      }
    }
  }
)

export const config = {
  matcher: ['/admin/:path*']
}
