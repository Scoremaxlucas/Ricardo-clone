import { MatchingPropertyImportHub } from '@/components/matching/MatchingPropertyImportHub'
import { authOptions } from '@/lib/auth'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Objekte importieren',
  description: 'Matching-Objekte per bestehendem Inserat-Link importieren.',
}

export default async function MatchingMatchObjekteImportPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/matching/match-objekte/import'))
  }

  return <MatchingPropertyImportHub />
}
