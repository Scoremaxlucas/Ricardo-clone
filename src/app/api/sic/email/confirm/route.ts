import { sicPaths, sicUrl } from '@/lib/sic/config'
import { confirmSicEmailChange } from '@/lib/sic/email-change'
import { SIC_SESSION_COOKIE, sicSessionCookieOptions, signSicSessionToken } from '@/lib/sic/session'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function confirmPageRedirect(token: string, error?: string): NextResponse {
  const dest = new URL(sicUrl(sicPaths.emailConfirm))
  if (token) dest.searchParams.set('token', token)
  if (error) dest.searchParams.set('error', error)
  return NextResponse.redirect(dest, 303)
}

async function readToken(req: NextRequest): Promise<string> {
  const ctype = req.headers.get('content-type') || ''
  if (ctype.includes('application/json')) {
    const body = await req.json().catch(() => ({}))
    return typeof body?.token === 'string' ? body.token : ''
  }
  const form = await req.formData().catch(() => null)
  if (!form) return ''
  return String(form.get('token') || '')
}

/**
 * GET darf den Token nicht verbrauchen — Mailprogramme rufen den Link vorab auf.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || ''
  return confirmPageRedirect(token)
}

/** Erst der bewusste POST (Knopf «Bestätigen») übernimmt die neue Adresse. */
export async function POST(req: NextRequest) {
  const token = await readToken(req)
  const result = await confirmSicEmailChange(token)
  if (!result.ok) return confirmPageRedirect(token, result.code)

  const dest = new URL(sicUrl(sicPaths.certificateWorkspace))
  dest.searchParams.set('email', 'changed')
  const res = NextResponse.redirect(dest, 303)
  res.cookies.set(SIC_SESSION_COOKIE, signSicSessionToken(result.email), sicSessionCookieOptions())
  return res
}
