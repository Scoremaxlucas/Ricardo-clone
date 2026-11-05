import { SicLandingClient } from '@/components/sic/SicLandingClient'
import { SIC_SITE_ORIGIN } from '@/lib/sic/config'
import { getSicLandingAccount } from '@/lib/sic/landing-account'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

// Die Landing ist unter «/» und «/sic» erreichbar — eine Adresse für Suchmaschinen.
export const metadata: Metadata = {
  alternates: { canonical: SIC_SITE_ORIGIN },
}

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
