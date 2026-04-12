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

function isProductionMainShopHost(host: string): boolean {
  return host === 'helvenda.ch' || host === 'www.helvenda.ch'
}

function isAllowedOnWohnen(pathname: string): boolean {
  if (pathname.startsWith('/api/auth')) return true
  if (pathname.startsWith('/api/upload')) return true
  if (pathname.startsWith('/api/rental-listings')) return true
  if (pathname.startsWith('/api/rental-applications')) return true
  if (pathname.startsWith('/api/rental/')) return true
  if (pathname.startsWith('/api/user/')) return true
  if (pathname === '/api/favorites' || pathname.startsWith('/api/favorites/')) return true
  if (pathname.startsWith('/api/notifications/')) return true
  if (pathname.startsWith('/api/search/suggestions')) return true
  if (pathname === '/wohnungen' || pathname.startsWith('/wohnungen/')) return true
  if (pathname === '/sell/rent' || pathname.startsWith('/sell/rent/')) return true
  if (pathname === '/wohnen-home' || pathname.startsWith('/wohnen-home/')) return true
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

function isBlockedOnMainShop(pathname: string): boolean {
  if (pathname === '/wohnungen' || pathname.startsWith('/wohnungen/')) return true
  if (pathname === '/sell/rent' || pathname.startsWith('/sell/rent/')) return true
  if (pathname === '/wohnen-home' || pathname.startsWith('/wohnen-home/')) return true
  return false
}

function redirectToMain(pathname: string, search: string) {
  const url = new URL(pathname + search, MAIN_SHOP_ORIGIN)
  return NextResponse.redirect(url)
}

function redirectToWohnen(pathname: string, search: string) {
  const url = new URL(pathname + search, WOHNEN_SITE_ORIGIN)
  return NextResponse.redirect(url)
}

export function middleware(request: NextRequest) {
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

  if (isWohnenTenant(request)) {
    if (pathname === '/') {
      const internal = request.nextUrl.clone()
      internal.pathname = '/wohnen-home'
      return NextResponse.rewrite(internal)
    }
    if (!isAllowedOnWohnen(pathname)) {
      return redirectToMain(pathname, search)
    }
    return NextResponse.next()
  }

  if (isProductionMainShopHost(host) && isBlockedOnMainShop(pathname)) {
    return redirectToWohnen(pathname, search)
  }

  // Unbekannter Host (z.B. Preview): nicht eingreifen
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)'],
}
