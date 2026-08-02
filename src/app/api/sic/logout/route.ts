import { sicPaths, sicUrl } from '@/lib/sic/config'
import { SIC_SESSION_COOKIE, sicSessionCookieOptions } from '@/lib/sic/session'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SIC_SESSION_COOKIE, '', { ...sicSessionCookieOptions(0), maxAge: 0 })
  return res
}

export async function GET() {
  const res = NextResponse.redirect(new URL(sicUrl(sicPaths.landing)))
  res.cookies.set(SIC_SESSION_COOKIE, '', { ...sicSessionCookieOptions(0), maxAge: 0 })
  return res
}
