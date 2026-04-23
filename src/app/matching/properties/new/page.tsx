import { RentalListingNewEntryLanding } from '@/components/rental/RentalListingNewEntryLanding'
import { authOptions } from '@/lib/auth'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Neues Inserat',
  description: 'Mietwohnung auf Helvenda Wohnungen inserieren — manuell oder per URL-Import.',
}

export default async function NewLandlordRentalPropertyPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/matching/properties/new'))
  }

  return <RentalListingNewEntryLanding />
}
