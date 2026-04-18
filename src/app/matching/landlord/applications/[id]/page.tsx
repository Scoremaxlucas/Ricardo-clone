import { MatchingLandlordApplicationClient } from '@/components/matching/MatchingLandlordApplicationClient'
import { authOptions } from '@/lib/auth'
import { getLandlordApplicationDetail } from '@/lib/matching/matching-application-queries'
import { MatchingApplicationStatus } from '@prisma/client'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { notFound, redirect } from 'next/navigation'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await params
  return { title: 'Bewerbung prüfen' }
}

export default async function MatchingLandlordApplicationDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) {
    redirect('/login?callbackUrl=' + encodeURIComponent(`/matching/landlord/applications/${(await params).id}`))
  }

  const { id } = await params
  const bundle = await getLandlordApplicationDetail(userId, id)
  if (!bundle) notFound()

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Vermieter</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Bewerbung prüfen</h1>
      <div className="mt-8">
        <MatchingLandlordApplicationClient
          applicationId={bundle.application.id}
          status={bundle.application.status as MatchingApplicationStatus}
          message={bundle.application.message}
          property={bundle.property}
          match={bundle.match}
          stagedSeeker={bundle.stagedSeeker}
        />
      </div>
    </main>
  )
}
