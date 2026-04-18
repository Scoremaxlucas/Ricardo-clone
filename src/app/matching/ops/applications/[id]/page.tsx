import { authOptions } from '@/lib/auth'
import { requireMatchingAdmin } from '@/lib/matching/matching-ops-auth'
import { getOpsMatchingApplicationDetail } from '@/lib/matching/ops-submitted-applications'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await params
  return { title: 'Ops · Bewerbung' }
}

export default async function MatchingOpsApplicationDetailPage({ params }: Props) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=' + encodeURIComponent(`/matching/ops/applications/${id}`))
  }

  const gate = await requireMatchingAdmin()
  if (!gate.ok) redirect('/matching')

  const app = await getOpsMatchingApplicationDetail(id)
  if (!app) notFound()

  const u = app.seekerProfile.user
  const displayName =
    [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.nickname || u.email

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Ops · vertraulich</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Bewerbung {app.id}</h1>
      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        Interne Ansicht: Kontaktdaten nur für autorisierte Helvenda-Ops. Keine Weitergabe an Dritte.
      </div>

      <section className="mt-8 space-y-2 rounded-xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Suchender</h2>
        <p>
          <span className="text-slate-500">Name:</span> {displayName}
        </p>
        <p>
          <span className="text-slate-500">E-Mail:</span> {u.email}
        </p>
        {u.phone ? (
          <p>
            <span className="text-slate-500">Telefon:</span> {u.phone}
          </p>
        ) : null}
        <p>
          <span className="text-slate-500">User-ID:</span>{' '}
          <code className="rounded bg-slate-100 px-1 text-xs">{u.id}</code>
        </p>
      </section>

      <section className="mt-6 space-y-2 rounded-xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Objekt</h2>
        <p className="font-medium text-slate-800">{app.property.title}</p>
        <p className="text-slate-600">
          {app.property.zip} {app.property.city} · {app.property.canton}
        </p>
        <p className="text-xs text-slate-500">Property-ID: {app.property.id}</p>
      </section>

      <section className="mt-6 space-y-2 rounded-xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Bewerbung</h2>
        <p>
          <span className="text-slate-500">Status:</span> {app.status}
        </p>
        {app.housingMatch ? (
          <p>
            <span className="text-slate-500">Match-Score:</span> {Math.round(app.housingMatch.score)}
          </p>
        ) : null}
        <p className="text-slate-500">Nachricht</p>
        <p className="whitespace-pre-wrap rounded bg-slate-50 p-3 text-slate-800">{app.message || '—'}</p>
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Consent-Zeilen</h2>
        <ul className="mt-2 space-y-1 text-xs text-slate-700">
          {app.consentShares.map(c => (
            <li key={c.id}>
              {c.scope}: grantedAt={c.grantedAt?.toISOString() ?? '—'} revokedAt=
              {c.revokedAt?.toISOString() ?? '—'}
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-10 text-sm text-slate-500">
        <Link
          href={`/matching/ops/audit?entityType=matching_application&entityId=${encodeURIComponent(app.id)}`}
          className="font-medium text-teal-800 underline-offset-2 hover:underline"
        >
          Audit zu dieser Bewerbung
        </Link>
        {' · '}
        <Link href="/matching/ops/applications" className="font-medium text-teal-800 underline-offset-2 hover:underline">
          Liste
        </Link>
        {' · '}
        <Link href="/matching/ops" className="font-medium text-teal-800 underline-offset-2 hover:underline">
          Ops-Hub
        </Link>
      </p>
    </main>
  )
}
