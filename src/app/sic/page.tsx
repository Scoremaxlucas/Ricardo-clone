import { SicLandingClient } from '@/components/sic/SicLandingClient'
import { getSicLandingAccount } from '@/lib/sic/landing-account'

export const dynamic = 'force-dynamic'

export default async function SicLandingPage() {
  const account = await getSicLandingAccount()
  return <SicLandingClient account={account} />
}
