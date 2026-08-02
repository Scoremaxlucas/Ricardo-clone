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

/** www / apex Marktplatz-Host — Mieter-UI soll auf wohnen.helvenda.ch laufen (Navbar/Footer). */
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

/** Auf dem Marktplatz-Host diese Pfade zur Wohnen-Subdomain umleiten (ein Layout, eine Session). */
function tenantPathsRedirectToWohnen(pathname: string): boolean {
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

/**
 * Nur Matching-MVP + Auth + minimale APIs. Kein Marktplatz-/Miet-Inserat-UI auf dieser Subdomain.
 */
function isSicRoute(pathname: string): boolean {
  return pathname === '/sic' || pathname.startsWith('/sic/') || pathname.startsWith('/api/sic')
}

function isAllowedOnWohnen(pathname: string): boolean {
  // Swiss Immo Cert (eigenständiges Produkt, eigenes Layout).
  if (isSicRoute(pathname)) return true
  if (pathname.startsWith('/api/auth')) return true
  if (pathname.startsWith('/api/internal/matching-maintenance')) return true
  if (pathname.startsWith('/api/rental/import-listing')) return true
  if (pathname.startsWith('/api/matching')) return true
  if (pathname.startsWith('/api/upload')) return true
  if (pathname.startsWith('/api/user/')) return true
  if (pathname.startsWith('/api/rental-listings')) return true
  if (pathname.startsWith('/api/admin/rental-listings')) return true
  if (pathname.startsWith('/api/admin/ingest')) return true
  if (pathname.startsWith('/api/admin/stats')) return true
  if (pathname.startsWith('/api/admin/credit-check')) return true
  if (pathname.startsWith('/api/admin/applications')) return true
  if (pathname.startsWith('/api/admin/wohnen/placements')) return true
  if (pathname.startsWith('/api/admin/rental-listing-invites')) return true
  if (pathname.startsWith('/api/admin/rental-ingest')) return true
  if (pathname.startsWith('/api/public/rental-listing-invite')) return true
  if (pathname.startsWith('/api/public/landlord-lead')) return true
  if (pathname.startsWith('/api/rental-applications')) return true
  if (pathname.startsWith('/api/contact')) return true
  if (pathname === '/wohnungen' || pathname.startsWith('/wohnungen/')) return true
  if (pathname === '/profil' || pathname.startsWith('/profil/')) return true
  if (pathname.startsWith('/api/tenant-profile')) return true
  if (pathname.startsWith('/api/certificate')) return true
  if (pathname === '/meine-bewerbungen') return true
  if (pathname === '/meine-matches') return true
  if (pathname === '/') return true
  if (pathname === '/matching' || pathname.startsWith('/matching/')) return true
  if (pathname === '/admin/listings' || pathname.startsWith('/admin/listings/')) return true
  if (pathname === '/admin/wohnen' || pathname.startsWith('/admin/wohnen/')) return true
  if (pathname.startsWith('/admin/dashboard')) return true
  if (pathname.startsWith('/admin/matching')) return true
  if (pathname === '/admin/applications' || pathname.startsWith('/admin/applications/')) return true
  if (pathname === '/einladung-inserat' || pathname.startsWith('/einladung-inserat/')) return true
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
  if (pathname === '/verify' || pathname.startsWith('/verify/')) return true
  if (pathname.startsWith('/vermieter/')) return true
  if (pathname === '/zertifikat') return true
  if (pathname === '/contact' || pathname.startsWith('/contact')) return true
  if (pathname === '/faq' || pathname.startsWith('/faq')) return true
  if (pathname === '/terms') return true
  if (pathname === '/privacy') return true
  if (pathname === '/imprint') return true
  return false
}

function redirectToMain(pathname: string, search: string) {
  const url = new URL(pathname + search, MAIN_SHOP_ORIGIN)
  return NextResponse.redirect(url)
}

/** Weiterreichen und SIC-Routen dem Root-Layout signalisieren (eigenes Layout ohne Wohnen-Shell). */
function proceed(request: NextRequest, isSic: boolean) {
  if (!isSic) return NextResponse.next()
  const headers = new Headers(request.headers)
  headers.set('x-sic-route', '1')
  return NextResponse.next({ request: { headers } })
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

  const isSic = isSicRoute(pathname)

  const host = rawHost(request)

  // Marktplatz (www / apex): gesamte Mieter- und Vermieter-Matching-UI nur auf wohnen.helvenda.ch
  if (!isWohnenTenant(request) && isMainHelvendaMarketplaceHost(host) && tenantPathsRedirectToWohnen(pathname)) {
    const target = new URL(pathname + search, WOHNEN_SITE_ORIGIN)
    return NextResponse.redirect(target)
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
    pathname.startsWith('/api/admin/rental-ingest') ||
    pathname.startsWith('/sic/admin') ||
    pathname.startsWith('/api/sic/admin')
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
    if (isWohnenTenant(request) && pathname === '/admin/dashboard') {
      return NextResponse.redirect(new URL('/admin/wohnen', request.url))
    }
    return proceed(request, isSic)
  }

  if (isWohnenTenant(request)) {
    if (!isAllowedOnWohnen(pathname)) {
      return redirectToMain(pathname, search)
    }
    return proceed(request, isSic)
  }

  return proceed(request, isSic)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)'],
}
