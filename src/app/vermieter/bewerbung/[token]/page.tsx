import { LandlordLeadClient } from '@/components/rental/LandlordLeadClient'
import { loadLandlordLeadApplicationView } from '@/lib/rental/landlord-lead-application-view'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Bewerbung verwalten | Helvenda Wohnungen',
  robots: { index: false, follow: false },
}

export default async function LandlordLeadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const view = await loadLandlordLeadApplicationView(token)
  if (!view) notFound()

  return <LandlordLeadClient token={token} initial={view} />
}
