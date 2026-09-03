import { sicPaths } from '@/lib/sic/config'
import { clearSicSessionCookie, SIC_SESSION_COOKIE } from '@/lib/sic/session'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function logoutRedirect(req: NextRequest) {
  // Relativ zum aktuellen Host — nicht hart auf Apex umbiegen.
  // Sonst bleibt das Cookie auf www (oder Apex) stehen und «Abmelden» wirkt nicht.
  const res = NextResponse.redirect(new URL(sicPaths.landing, req.url), 303)
  clearSicSessionCookie(res)
  // Extra: Next.js-Delete für denselben Host
  res.cookies.delete(SIC_SESSION_COOKIE)
  res.headers.set('Cache-Control', 'no-store')
  return res
}

/** Form-POST von «Abmelden» — Redirect, sonst sieht man Roh-JSON. */
export async function POST(req: NextRequest) {
  return logoutRedirect(req)
}

export async function GET(req: NextRequest) {
  return logoutRedirect(req)
}
