import { sicPaths } from '@/lib/sic/config'
import { clearSicSessionCookie, SIC_SESSION_COOKIE } from '@/lib/sic/session'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function logoutRedirect(req: NextRequest) {
  // Relativ zum aktuellen Host — nicht hart auf Apex umbiegen.
  const dest = new URL(sicPaths.landing, req.url)
  dest.searchParams.set('loggedOut', '1')
  const res = NextResponse.redirect(dest, 303)
  clearSicSessionCookie(res)
  res.cookies.delete(SIC_SESSION_COOKIE)
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  return res
}

/** Form-POST oder Link-GET von «Abmelden» — immer harter Redirect auf die Landing. */
export async function POST(req: NextRequest) {
  return logoutRedirect(req)
}

export async function GET(req: NextRequest) {
  return logoutRedirect(req)
}
