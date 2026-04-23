import { MatchingPropertyImportHub } from '@/components/matching/MatchingPropertyImportHub'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Objekte importieren',
  description: 'Matching-Objekte per bestehendem Inserat-Link importieren.',
}

const LOGIN_CALLBACK_PATH = '/matching/properties/import'

export default async function RentalListingImportPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    redirect('/login?callbackUrl=' + encodeURIComponent(LOGIN_CALLBACK_PATH))
  }

  const forAdminRental = await isAdmin(session)

  return <MatchingPropertyImportHub forAdminRental={forAdminRental} />
}
