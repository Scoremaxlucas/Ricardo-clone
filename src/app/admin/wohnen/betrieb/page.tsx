import { getWohnenAdminOverview } from '@/lib/admin/wohnen-admin-overview'
import { authOptions } from '@/lib/auth'
import { throwAdminForbidden } from '@/lib/auth/admin-forbidden-html'
import { isAdmin } from '@/lib/auth/isAdmin'
import { prisma } from '@/lib/prisma'
import { CheckStatus, RentalListingStatus } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Betrieb — Helvenda Wohnungen Admin',
  robots: { index: false, follow: false },
}

export default async function AdminWohnenBetriebPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login?callbackUrl=' + encodeURIComponent('/admin/wohnen/betrieb'))
  if (!(await isAdmin(session))) throwAdminForbidden()

  const [overview, outboxRows, urlConcernListings] = await Promise.all([
    getWohnenAdminOverview(),
    prisma.wohnenEmailOutbox.findMany({
      orderBy: { createdAt: 'desc' },
      take: 35,
      select: {
        id: true,
        createdAt: true,
        kind: true,
        status: true,
        attempts: true,
        lastError: true,
        dedupeKey: true,
        sentAt: true,
        nextAttemptAt: true,
      },
    }),
    prisma.rentalListing.findMany({
      where: {
        status: RentalListingStatus.active,
        OR: [
          { lastCheckStatus: CheckStatus.GONE },
          { lastCheckStatus: CheckStatus.UNREACHABLE },
          { urlUnreachableStreak: { gte: 2 } },
        ],
      },
      orderBy: { lastCheckedAt: 'desc' },
      take: 25,
      select: {
        id: true,
        title: true,
        city: true,
        lastCheckStatus: true,
        urlUnreachableStreak: true,
        importedFrom: true,
        lastCheckedAt: true,
      },
    }),
  ])

  const attention =
    overview.outboxPending + overview.outboxFailed + overview.needsExpiryReview + overview.listingsUrlConcern

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin/wohnen" className="text-sm font-medium text-teal-800 hover:underline">
            ← Wohnen-Admin
          </Link>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0d2b1f] sm:text-3xl">Betrieb &amp; Monitoring</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            E-Mail-Outbox (Retries), URL-Monitoring-Hinweise und Gültigkeits-Reviews. Crons:{' '}
            <code className="rounded bg-slate-100 px-1 text-xs">/api/cron/wohnen-email-outbox</code> (10&nbsp;Min),{' '}
            <code className="rounded bg-slate-100 px-1 text-xs">/api/cron/check-listing-urls</code>,{' '}
            <code className="rounded bg-slate-100 px-1 text-xs">/api/cron/rental-listing-expiry</code>.
          </p>
        </div>
        {attention > 0 ?
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
            {attention} offene Punkte (Outbox + Gültigkeit + URL)
          </div>
        : null}
      </div>

      <section className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Outbox pending', value: overview.outboxPending },
          { label: 'Outbox failed', value: overview.outboxFailed },
          { label: 'Gültigkeit offen', value: overview.needsExpiryReview },
          { label: 'Aktive Inserate (URL-Auffällig)', value: overview.listingsUrlConcern },
        ].map(row => (
          <div
            key={row.label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-100"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{row.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{row.value}</p>
          </div>
        ))}
      </section>

      <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
        <h2 className="text-lg font-bold text-slate-900">E-Mail-Outbox (neueste)</h2>
        <p className="mt-1 text-sm text-slate-600">
          Mieter-Bestätigung nach Bewerbung wird bei Fehler hier eingetragen und per Cron erneut versendet.
        </p>
        {outboxRows.length === 0 ?
          <p className="mt-4 text-sm text-slate-500">Keine Einträge.</p>
        : <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                  <th className="py-2 pr-3">Zeit</th>
                  <th className="py-2 pr-3">Art</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Versuche</th>
                  <th className="py-2 pr-3">Nächster Versuch</th>
                  <th className="py-2 pr-3">Fehler</th>
                </tr>
              </thead>
              <tbody>
                {outboxRows.map(r => (
                  <tr key={r.id} className="border-b border-slate-100">
                    <td className="py-2 pr-3 whitespace-nowrap text-slate-700">
                      {r.createdAt.toLocaleString('de-CH', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs text-slate-800">{r.kind}</td>
                    <td className="py-2 pr-3 font-semibold text-slate-900">{r.status}</td>
                    <td className="py-2 pr-3">{r.attempts}</td>
                    <td className="py-2 pr-3 whitespace-nowrap text-slate-600">
                      {r.status === 'sent' || r.status === 'cancelled' ?
                        '—'
                      : r.nextAttemptAt.toLocaleString('de-CH', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="max-w-xs truncate py-2 pr-3 text-xs text-red-800" title={r.lastError ?? ''}>
                      {r.lastError ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
        <h2 className="text-lg font-bold text-slate-900">Aktive Inserate mit URL-Auffälligkeit</h2>
        <p className="mt-1 text-sm text-slate-600">Cron «check-listing-urls» setzt Status; hier zur schnellen Übersicht.</p>
        {urlConcernListings.length === 0 ?
          <p className="mt-4 text-sm text-slate-500">Keine Treffer.</p>
        : <ul className="mt-4 divide-y divide-slate-100">
            {urlConcernListings.map(l => (
              <li key={l.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Link
                    href={`/admin/listings/${l.id}/bearbeiten`}
                    className="font-semibold text-teal-800 hover:underline"
                  >
                    {l.title}
                  </Link>
                  <p className="text-xs text-slate-600">
                    {l.city} · Status {l.lastCheckStatus} · Streak {l.urlUnreachableStreak}
                  </p>
                  {l.importedFrom ?
                    <p className="mt-0.5 truncate text-[11px] text-slate-500" title={l.importedFrom}>
                      {l.importedFrom}
                    </p>
                  : null}
                </div>
                <p className="shrink-0 text-xs text-slate-500">
                  {l.lastCheckedAt ?
                    `Geprüft: ${l.lastCheckedAt.toLocaleString('de-CH', { dateStyle: 'short', timeStyle: 'short' })}`
                  : '—'}
                </p>
              </li>
            ))}
          </ul>
        }
      </section>
    </main>
  )
}
