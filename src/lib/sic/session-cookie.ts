import { cookies } from 'next/headers'
import { SIC_SESSION_COOKIE, verifySicSessionToken, type SicSession } from '@/lib/sic/session'

/** Liest die aktuelle SIC-Session aus dem Cookie (Server Components / Route Handler). */
export function getSicSession(): SicSession | null {
  const token = cookies().get(SIC_SESSION_COOKIE)?.value
  return verifySicSessionToken(token)
}
