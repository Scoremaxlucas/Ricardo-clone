import { WohnenBetriebClient } from '@/components/admin/WohnenBetriebClient'
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

      <WohnenBetriebClient
        outboxRows={outboxRows.map(row => ({
          id: row.id,
          createdAt: row.createdAt.toISOString(),
          kind: row.kind,
          status: row.status,
          attempts: row.attempts,
          lastError: row.lastError,
          sentAt: row.sentAt?.toISOString() ?? null,
          nextAttemptAt: row.nextAttemptAt?.toISOString() ?? null,
        }))}
        urlConcernListings={urlConcernListings.map(row => ({
          id: row.id,
          title: row.title,
          city: row.city,
          lastCheckStatus: row.lastCheckStatus,
          urlUnreachableStreak: row.urlUnreachableStreak,
          importedFrom: row.importedFrom,
          lastCheckedAt: row.lastCheckedAt?.toISOString() ?? null,
        }))}
      />
    </main>
  )
}
