import { MatchingPropertyWizard } from '@/components/matching/MatchingPropertyWizard'
import { authOptions } from '@/lib/auth'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Objekt erfassen',
  description: 'Matching-Objekt manuell erfassen — Adresse, Miete, Regeln.',
}

export default async function NewMatchingPropertyPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/matching/properties/new'))
  }

  return <MatchingPropertyWizard />
}
