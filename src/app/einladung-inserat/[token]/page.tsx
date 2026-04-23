import type { Metadata } from 'next'
import { ListingInviteSubmitClient } from './ListingInviteSubmitClient'

export const metadata: Metadata = {
  title: 'Inserat-Link einreichen',
  robots: { index: false, follow: false },
}

export default async function EinladungInseratPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <ListingInviteSubmitClient token={token} />
}
