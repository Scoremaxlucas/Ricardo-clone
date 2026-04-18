import { SeekerOnboardingWizard } from '@/components/matching/SeekerOnboardingWizard'
import { authOptions } from '@/lib/auth'
import { loadSeekerOnboardingSnapshot } from '@/lib/matching/seeker-account'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Suchprofil',
  description: 'Matching: Suchkriterien, Haushalt, Beruf, Finanzen und Nachweise.',
}

export default async function MatchingSeekerOnboardingPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/matching/onboarding'))
  }

  const snapshot = await loadSeekerOnboardingSnapshot(userId)

  return <SeekerOnboardingWizard key={snapshot.profileUpdatedAt} initial={snapshot} />
}
