import { RentalListingLandlordForm } from '@/components/rental/RentalListingLandlordForm'
import { authOptions } from '@/lib/auth'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const PATH = '/matching/properties/new/erfassen'

export const metadata: Metadata = {
  title: 'Inserat manuell erfassen',
  description: 'Mietwohnung auf Helvenda Wohnungen manuell inserieren.',
}

export default async function NewLandlordRentalPropertyManualPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    redirect('/login?callbackUrl=' + encodeURIComponent(PATH))
  }

  return <RentalListingLandlordForm mode="create" backHref="/matching/properties/new" />
}
