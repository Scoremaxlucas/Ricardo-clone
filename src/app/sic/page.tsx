import { SicLandingClient } from '@/components/sic/SicLandingClient'
import { getSicLandingAccount } from '@/lib/sic/landing-account'

export const dynamic = 'force-dynamic'

export default async function SicLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ loggedOut?: string }>
}) {
  const params = await searchParams
  // Nach Abmelden Session-Cookie muss weg; falls der Clear noch hängt, keine Returning-UX.
  const account = params.loggedOut ? null : await getSicLandingAccount()
  return <SicLandingClient account={account} />
}
