import { sicPaths } from '@/lib/sic/config'
import { consumeSicMagicLink, safeSicNextPath } from '@/lib/sic/magic-link'
import { SIC_SESSION_COOKIE, sicSessionCookieOptions, signSicSessionToken } from '@/lib/sic/session'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function confirmRedirect(req: NextRequest, token: string, next: string | null): NextResponse {
  const dest = new URL(sicPaths.loginConfirm, req.url)
  if (token) dest.searchParams.set('token', token)
  const safe = safeSicNextPath(next)
  if (safe !== sicPaths.certificateWorkspace) dest.searchParams.set('next', safe)
  return NextResponse.redirect(dest, 303)
}

function invalidLoginRedirect(req: NextRequest): NextResponse {
  const failed = new URL(sicPaths.landing, req.url)
  failed.searchParams.set('login', 'invalid')
  return NextResponse.redirect(failed, 303)
}

function sessionRedirect(req: NextRequest, email: string, next: string | null): NextResponse {
  // Gleicher Host wie der Klick (www oder Apex) — sonst geht das Session-Cookie verloren.
  // 303 nach POST: Browser muss GET machen. Default 307 würde POST auf /sic/zertifikat
  // wiederholen → oft «keine Reaktion».
  const dest = new URL(safeSicNextPath(next), req.url)
  const res = NextResponse.redirect(dest, 303)
  res.cookies.set(SIC_SESSION_COOKIE, signSicSessionToken(email), sicSessionCookieOptions())
  res.headers.set('Cache-Control', 'no-store')
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
  return confirmRedirect(req, token, req.nextUrl.searchParams.get('next'))
}

/** Erst der bewusste POST (Knopf «Anmelden») löst den Token ein. */
export async function POST(req: NextRequest) {
  const { token, next } = await readTokenAndNext(req)
  const result = await consumeSicMagicLink(token)
  if (!result) return invalidLoginRedirect(req)
  return sessionRedirect(req, result.email, next)
}
