import { sicPaths, sicUrl } from '@/lib/sic/config'
import { consumeSicMagicLink, safeSicNextPath } from '@/lib/sic/magic-link'
import { SIC_SESSION_COOKIE, sicSessionCookieOptions, signSicSessionToken } from '@/lib/sic/session'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function confirmRedirect(token: string, next: string | null): NextResponse {
  const dest = new URL(sicUrl(sicPaths.loginConfirm))
  if (token) dest.searchParams.set('token', token)
  const safe = safeSicNextPath(next)
  if (safe !== sicPaths.certificateWorkspace) dest.searchParams.set('next', safe)
  return NextResponse.redirect(dest)
}

function invalidLoginRedirect(): NextResponse {
  const failed = new URL(sicUrl(sicPaths.landing))
  failed.searchParams.set('login', 'invalid')
  return NextResponse.redirect(failed)
}

async function sessionRedirect(email: string, next: string | null): Promise<NextResponse> {
  const dest = new URL(sicUrl(safeSicNextPath(next)))
  const res = NextResponse.redirect(dest)
  res.cookies.set(SIC_SESSION_COOKIE, signSicSessionToken(email), sicSessionCookieOptions())
  return res
}

async function readTokenAndNext(req: NextRequest): Promise<{ token: string; next: string | null }> {
  const ctype = req.headers.get('content-type') || ''
  if (ctype.includes('application/json')) {
    const body = await req.json().catch(() => ({}))
    return {
      token: typeof body?.token === 'string' ? body.token : '',
      next: typeof body?.next === 'string' ? body.next : null,
    }
  }
  const form = await req.formData().catch(() => null)
  if (!form) return { token: '', next: null }
  const nextRaw = form.get('next')
  return {
    token: String(form.get('token') || ''),
    next: typeof nextRaw === 'string' ? nextRaw : null,
  }
}

/**
 * GET darf den Token nicht verbrauchen — Mailprogramme und Slack rufen den
 * Link vorab auf. Alte Mails, die noch auf diese API zeigen, landen auf der
 * Anmeldeseite mit Knopf.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || ''
  return confirmRedirect(token, req.nextUrl.searchParams.get('next'))
}

/** Erst der bewusste POST (Knopf «Anmelden») löst den Token ein. */
export async function POST(req: NextRequest) {
  const { token, next } = await readTokenAndNext(req)
  const result = await consumeSicMagicLink(token)
  if (!result) return invalidLoginRedirect()
  return sessionRedirect(result.email, next)
}
