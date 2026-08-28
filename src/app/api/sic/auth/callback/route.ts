import { sicPaths, sicUrl } from '@/lib/sic/config'
import { consumeSicMagicLink, safeSicNextPath } from '@/lib/sic/magic-link'
import { SIC_SESSION_COOKIE, sicSessionCookieOptions, signSicSessionToken } from '@/lib/sic/session'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** Löst den Magic-Link ein, setzt die Session und leitet weiter (Workspace oder Verlängerung). */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || ''
  const result = await consumeSicMagicLink(token)

  if (!result) {
    const failed = new URL(sicUrl(sicPaths.landing))
    failed.searchParams.set('login', 'invalid')
    return NextResponse.redirect(failed)
  }

  const dest = new URL(sicUrl(safeSicNextPath(req.nextUrl.searchParams.get('next'))))
  const res = NextResponse.redirect(dest)
  res.cookies.set(SIC_SESSION_COOKIE, signSicSessionToken(result.email), sicSessionCookieOptions())
  return res
}
