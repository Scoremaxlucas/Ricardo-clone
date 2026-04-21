import { ADMIN_FORBIDDEN_HTML } from '@/lib/auth/admin-forbidden-html'
import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { MAIN_SHOP_ORIGIN, WOHNEN_SITE_ORIGIN } from '@/lib/site-urls'

const WOHNEN_PREVIEW_COOKIE = 'helvenda-wohnen-preview'

function rawHost(request: NextRequest): string {
  return (request.headers.get('host') || '').split(':')[0].toLowerCase()
}

function isProductionWohnenHost(host: string): boolean {
  return host === 'wohnen.helvenda.ch'
}

function isWohnenTenant(request: NextRequest): boolean {
  const host = rawHost(request)
  if (isProductionWohnenHost(host)) return true
  if (host === 'localhost' || host === '127.0.0.1') {
    if (request.nextUrl.searchParams.get('subdomain') === 'wohnen') return true
    if (request.cookies.get(WOHNEN_PREVIEW_COOKIE)?.value === '1') return true
  }
  return false
}

/**
 * Nur Matching-MVP + Auth + minimale APIs. Kein Marktplatz-/Miet-Inserat-UI auf dieser Subdomain.
 */
function isAllowedOnWohnen(pathname: string): boolean {
  if (pathname.startsWith('/api/auth')) return true
  if (pathname.startsWith('/api/internal/matching-maintenance')) return true
  if (pathname.startsWith('/api/rental/import-listing')) return true
  if (pathname.startsWith('/api/matching')) return true
  if (pathname.startsWith('/api/upload')) return true
  if (pathname.startsWith('/api/user/')) return true
  if (pathname.startsWith('/api/rental-listings')) return true
  if (pathname.startsWith('/api/admin/rental-listings')) return true
  if (pathname.startsWith('/api/admin/ingest')) return true
  if (pathname.startsWith('/api/rental-applications')) return true
  if (pathname === '/wohnungen' || pathname.startsWith('/wohnungen/')) return true
  if (pathname === '/profil' || pathname.startsWith('/profil/')) return true
  if (pathname.startsWith('/api/tenant-profile')) return true
  if (pathname === '/meine-bewerbungen') return true
  if (pathname === '/') return true
  if (pathname === '/matching' || pathname.startsWith('/matching/')) return true
  if (pathname === '/admin/listings' || pathname.startsWith('/admin/listings/')) return true
  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password' ||
    pathname === '/verify-email' ||
    pathname === '/verify-email-notice'
  ) {
    return true
  }
  return false
}

function redirectToMain(pathname: string, search: string) {
  const url = new URL(pathname + search, MAIN_SHOP_ORIGIN)
  return NextResponse.redirect(url)
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/fonts/')
  ) {
    return NextResponse.next()
  }

  const host = rawHost(request)

  // Marktplatz (www): Matching-Einstieg nur auf wohnen.helvenda.ch
  if (pathname === '/matching' || pathname.startsWith('/matching/')) {
    let mainHost = ''
    try {
      mainHost = new URL(MAIN_SHOP_ORIGIN).hostname.toLowerCase()
    } catch {
      mainHost = ''
    }
    if (mainHost && host === mainHost && !isWohnenTenant(request)) {
      const target = new URL(pathname + search, WOHNEN_SITE_ORIGIN)
      return NextResponse.redirect(target)
    }
  }

  // localhost: ?subdomain=wohnen → Cookie setzen und Query entfernen (damit Folge-Klicks funktionieren)
  if ((host === 'localhost' || host === '127.0.0.1') && request.nextUrl.searchParams.get('subdomain') === 'wohnen') {
    const clean = request.nextUrl.clone()
    clean.searchParams.delete('subdomain')
    const res = NextResponse.redirect(clean)
    res.cookies.set(WOHNEN_PREVIEW_COOKIE, '1', {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })
    return res
  }

  if (
    pathname.startsWith('/admin/listings') ||
    pathname.startsWith('/api/admin/rental-listings') ||
    pathname.startsWith('/api/admin/ingest')
  ) {
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) {
      return pathname.startsWith('/api/')
        ? NextResponse.json({ message: 'Server-Konfiguration fehlt' }, { status: 500 })
        : new NextResponse('Server-Konfiguration fehlt', { status: 500 })
    }
    const token = (await getToken({ req: request, secret })) as {
      id?: string
      sub?: string
      isAdmin?: boolean
    } | null
    const userId = token?.id || token?.sub
    if (!userId) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
      }
      const login = new URL('/login', request.url)
      login.searchParams.set('callbackUrl', pathname + search)
      return NextResponse.redirect(login)
    }
    if (!token?.isAdmin) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
      }
      return new NextResponse(ADMIN_FORBIDDEN_HTML, {
        status: 403,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      })
    }
    return NextResponse.next()
  }

  if (isWohnenTenant(request)) {
    if (!isAllowedOnWohnen(pathname)) {
      return redirectToMain(pathname, search)
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)'],
}
