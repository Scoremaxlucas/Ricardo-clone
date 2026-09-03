import { ADMIN_FORBIDDEN_HTML } from '@/lib/auth/admin-forbidden-html'
import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isSicAdminEmail } from '@/lib/sic/admin-access'
import {
  isSicProductionHostname,
  sicApiBlockedOffHost,
  sicAppBlockedOffHost,
  SIC_PREVIEW_COOKIE,
} from '@/lib/sic/config'

function rawHost(request: NextRequest): string {
  const forwarded = (request.headers.get('x-forwarded-host') || '').split(',')[0].trim()
  return (forwarded || request.headers.get('host') || '').split(':')[0].toLowerCase()
}

/**
 * Swiss Immo Cert Host: swissimmocert.ch (+ www).
 * Lokal: ?subdomain=sic oder Preview-Cookie `sic-preview`.
 */
function isSicHost(request: NextRequest): boolean {
  const host = rawHost(request)
  if (isSicProductionHostname(host)) return true
  if (host === 'localhost' || host === '127.0.0.1') {
    const sub = request.nextUrl.searchParams.get('subdomain')
    if (sub === 'sic') return true
    if (request.cookies.get(SIC_PREVIEW_COOKIE)?.value === '1') return true
  }
  return false
}

function isSicAppRoute(pathname: string): boolean {
  return pathname === '/sic' || pathname.startsWith('/sic/') || pathname.startsWith('/api/sic')
}

/** Was auf dem SIC-Host erlaubt bleibt (Rest → Redirect auf /). */
function isAllowedOnSicHost(pathname: string): boolean {
  if (isSicAppRoute(pathname)) return true
  if (pathname === '/icon' || pathname === '/apple-icon') return true
  if (pathname.startsWith('/api/auth')) return true
  if (pathname.startsWith('/api/stripe')) return true
  if (pathname.startsWith('/api/cron')) return true
  if (pathname === '/robots.txt' || pathname === '/sitemap.xml') return true
  if (pathname === '/login') return true
  return false
}

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

function setSicPreviewCookie(res: NextResponse) {
  const opts = {
    path: '/' as const,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7,
  }
  res.cookies.set(SIC_PREVIEW_COOKIE, '1', opts)
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/fonts/')
  ) {
    return NextResponse.next()
  }

  const host = rawHost(request)
  const onSicHost = isSicHost(request)

  // Safari holt immer /favicon.ico — das App-Router-ICO war das Helvenda-H.
  if (
    pathname === '/favicon.ico' ||
    pathname === '/apple-touch-icon.png' ||
    pathname === '/apple-touch-icon-precomposed.png'
  ) {
    if (onSicHost) {
      const rewrite = request.nextUrl.clone()
      rewrite.pathname = pathname === '/favicon.ico' ? '/sic/icons/favicon.ico' : '/apple-icon'
      return withSicHostHeaders(request, rewrite)
    }
    return NextResponse.next()
  }

  if (sicApiBlockedOffHost(onSicHost, pathname)) {
    return NextResponse.json({ message: 'Nicht gefunden' }, { status: 404 })
  }

  if (sicAppBlockedOffHost(onSicHost, pathname)) {
    return new NextResponse('Nicht gefunden', { status: 404 })
  }

  // localhost Preview für SIC-Host
  if (host === 'localhost' || host === '127.0.0.1') {
    const sub = request.nextUrl.searchParams.get('subdomain')
    if (sub === 'sic') {
      const clean = request.nextUrl.clone()
      clean.searchParams.delete('subdomain')
      const res = NextResponse.redirect(clean)
      setSicPreviewCookie(res)
      return res
    }
  }

  // ─── SIC-Host: nur Swiss Immo Cert ───────────────────────────────────────
  // www und Apex beide bedienen. Vercel leitet den Apex auf www (308, vor Next).
  // Ein Gegen-Redirect www → Apex in der Middleware erzeugt eine Schleife
  // (Safari: Too many redirects).
  if (onSicHost) {
    if (pathname === '/') {
      const rewrite = request.nextUrl.clone()
      rewrite.pathname = '/sic'
      return withSicHostHeaders(request, rewrite)
    }

    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
      return redirectToSicHome(request)
    }

    if (!isAllowedOnSicHost(pathname)) {
      return redirectToSicHome(request)
    }

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
        email?: string
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
      if (!isSicAdminEmail(token?.email)) {
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
  matcher: [
    '/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|txt|xml|webmanifest)$).*)',
    '/favicon.ico',
    '/apple-touch-icon.png',
    '/apple-touch-icon-precomposed.png',
  ],
}
