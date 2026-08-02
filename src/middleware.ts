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

/**
 * Früher «Helvenda Wohnen» — jetzt Swiss Immo Cert Host.
 * Vorschau lokal: ?subdomain=wohnen oder Cookie.
 */
function isSicHost(request: NextRequest): boolean {
  const host = rawHost(request)
  if (isProductionWohnenHost(host)) return true
  if (host === 'localhost' || host === '127.0.0.1') {
    if (request.nextUrl.searchParams.get('subdomain') === 'wohnen') return true
    if (request.cookies.get(WOHNEN_PREVIEW_COOKIE)?.value === '1') return true
  }
  return false
}

function isMainHelvendaMarketplaceHost(host: string): boolean {
  const h = host.toLowerCase()
  if (!h || h === 'localhost' || h === '127.0.0.1') return false
  try {
    const mainHost = new URL(MAIN_SHOP_ORIGIN).hostname.toLowerCase()
    if (h === mainHost) return true
    if (mainHost.startsWith('www.')) {
      const apex = mainHost.slice(4)
      if (h === apex) return true
    }
  } catch {
    /* ignore */
  }
  return h === 'helvenda.ch' || h === 'www.helvenda.ch'
}

/** Alte Wohnen-/Matching-Pfade auf dem Marktplatz → SIC auf wohnen.helvenda.ch. */
function marketplacePathsRedirectToSic(pathname: string): boolean {
  if (pathname === '/meine-matches') return true
  if (pathname === '/meine-bewerbungen') return true
  if (pathname === '/verify' || pathname.startsWith('/verify/')) return true
  if (pathname === '/zertifikat') return true
  if (pathname === '/wohnungen' || pathname.startsWith('/wohnungen/')) return true
  if (pathname === '/profil' || pathname.startsWith('/profil/')) return true
  if (pathname === '/matching' || pathname.startsWith('/matching/')) return true
  if (pathname === '/einladung-inserat' || pathname.startsWith('/einladung-inserat/')) return true
  return false
}

function isSicAppRoute(pathname: string): boolean {
  return pathname === '/sic' || pathname.startsWith('/sic/') || pathname.startsWith('/api/sic')
}

/** Was auf dem SIC-Host erlaubt bleibt (Rest → Redirect auf /). */
function isAllowedOnSicHost(pathname: string): boolean {
  if (isSicAppRoute(pathname)) return true
  if (pathname.startsWith('/api/auth')) return true
  if (pathname.startsWith('/api/stripe')) return true
  if (pathname.startsWith('/api/cron')) return true
  if (pathname === '/robots.txt' || pathname === '/sitemap.xml') return true
  // Admin-Login (NextAuth) für /sic/admin
  if (
    pathname === '/login' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password' ||
    pathname === '/verify-email' ||
    pathname === '/verify-email-notice'
  ) {
    return true
  }
  return false
}

/** Gesamten SIC-Host ohne Wohnen-Shell rendern. */
function withSicHostHeaders(request: NextRequest, rewriteUrl?: URL) {
  const headers = new Headers(request.headers)
  headers.set('x-sic-route', '1')
  headers.set('x-sic-host', '1')
  if (rewriteUrl) {
    return NextResponse.rewrite(rewriteUrl, { request: { headers } })
  }
  return NextResponse.next({ request: { headers } })
}

function redirectToSicHome(request: NextRequest) {
  const url = new URL('/', request.url)
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
  const onSicHost = isSicHost(request)

  // Marktplatz: alte Mieter-/Wohnungs-Pfade → SIC-Homepage auf dem SIC-Host
  if (!onSicHost && isMainHelvendaMarketplaceHost(host) && marketplacePathsRedirectToSic(pathname)) {
    return NextResponse.redirect(new URL('/' + search, WOHNEN_SITE_ORIGIN))
  }

  // localhost Preview für SIC-Host
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

  // ─── SIC-Host: nur Swiss Immo Cert ───────────────────────────────────────
  if (onSicHost) {
    // Saubere Root-URL zeigt SIC-Landing (ohne /sic in der Adresszeile)
    if (pathname === '/') {
      const rewrite = request.nextUrl.clone()
      rewrite.pathname = '/sic'
      return withSicHostHeaders(request, rewrite)
    }

    // Legacy-Wohnen-Admin → SIC-Prüfung
    if (
      pathname.startsWith('/admin/wohnen') ||
      pathname.startsWith('/admin/listings') ||
      pathname.startsWith('/admin/matching') ||
      pathname.startsWith('/admin/applications') ||
      pathname === '/admin/dashboard'
    ) {
      return NextResponse.redirect(new URL('/sic/admin', request.url))
    }

    // Alte Wohnen-/Matching-URLs → SIC-Home
    if (!isAllowedOnSicHost(pathname)) {
      return redirectToSicHome(request)
    }

    // SIC-Admin-Gates
    if (pathname.startsWith('/sic/admin') || pathname.startsWith('/api/sic/admin')) {
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
    }

    return withSicHostHeaders(request)
  }

  // ─── Marktplatz / übrige Hosts: bestehende Admin-Gates für Helvenda ───────
  if (
    pathname.startsWith('/admin/listings') ||
    pathname.startsWith('/admin/wohnen') ||
    pathname.startsWith('/admin/dashboard') ||
    pathname.startsWith('/admin/matching') ||
    pathname.startsWith('/admin/applications') ||
    pathname.startsWith('/api/admin/rental-listings') ||
    pathname.startsWith('/api/admin/ingest') ||
    pathname.startsWith('/api/admin/stats') ||
    pathname.startsWith('/api/admin/credit-check') ||
    pathname.startsWith('/api/admin/applications') ||
    pathname.startsWith('/api/admin/wohnen/placements') ||
    pathname.startsWith('/api/admin/rental-listing-invites') ||
    pathname.startsWith('/api/admin/rental-ingest')
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

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)'],
}
