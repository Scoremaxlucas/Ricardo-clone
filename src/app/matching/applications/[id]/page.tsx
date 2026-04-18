import { MatchingSeekerApplicationClient } from '@/components/matching/MatchingSeekerApplicationClient'
import { authOptions } from '@/lib/auth'
import { getSeekerApplicationDetail } from '@/lib/matching/matching-application-queries'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { notFound, redirect } from 'next/navigation'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return { title: 'Bewerbung' }
}

export default async function MatchingSeekerApplicationDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) {
    redirect('/login?callbackUrl=' + encodeURIComponent(`/matching/applications/${(await params).id}`))
  }

  const { id } = await params
  const app = await getSeekerApplicationDetail(userId, id)
  if (!app) notFound()

  const consentShares = app.consentShares.map(c => ({
    scope: c.scope,
    grantedAt: c.grantedAt?.toISOString() ?? null,
    revokedAt: c.revokedAt?.toISOString() ?? null,
  }))

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Bewerbung</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Details</h1>
      <div className="mt-8">
        <MatchingSeekerApplicationClient
          applicationId={app.id}
          status={app.status}
          message={app.message}
          propertyTitle={app.property.title}
          propertyCity={app.property.city}
          matchScore={app.housingMatch?.score ?? null}
          consentShares={consentShares}
        />
      </div>
    </main>
  )
}
