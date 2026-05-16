import type { Metadata } from 'next'
import { LeadRespondClient } from './LeadRespondClient'

export const metadata: Metadata = {
  title: 'Bewerbung beantworten',
  robots: { index: false, follow: false },
}

export default async function LandlordLeadRespondPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  return <LeadRespondClient token={decodeURIComponent(token)} />
}
