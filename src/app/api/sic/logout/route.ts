import { sicPaths, sicUrl } from '@/lib/sic/config'
import { SIC_SESSION_COOKIE, sicSessionCookieOptions } from '@/lib/sic/session'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function logoutRedirect() {
  const res = NextResponse.redirect(new URL(sicUrl(sicPaths.landing)), 303)
  res.cookies.set(SIC_SESSION_COOKIE, '', { ...sicSessionCookieOptions(0), maxAge: 0 })
  return res
}

/** Form-POST von «Abmelden» — Redirect, sonst sieht man Roh-JSON. */
export async function POST() {
  return logoutRedirect()
}

export async function GET() {
  return logoutRedirect()
}
