import { authOptions } from '@/lib/auth'
import { throwAdminForbidden } from '@/lib/auth/admin-forbidden-html'
import { isAdmin } from '@/lib/auth/isAdmin'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils/formatDate'
import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Alle Bewerbungen',
  robots: { index: false, follow: false },
}

function statusBadge(status: string): string {
  if (status === 'approved') return 'bg-emerald-100 text-emerald-800'
  if (status === 'rejected') return 'bg-rose-100 text-rose-800'
  if (status === 'pending_manual_review') return 'bg-orange-100 text-orange-900'
  if (status === 'pending') return 'bg-amber-100 text-amber-900'
  return 'bg-slate-100 text-slate-700'
}

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; canton?: string; date?: string; matchPeriod?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  if (!(await isAdmin(session))) throwAdminForbidden()

  const sp = await searchParams
  const matchPeriod = sp.matchPeriod === '24h' || sp.matchPeriod === '30d' || sp.matchPeriod === '90d' ? sp.matchPeriod : '7d'
  const where: Record<string, unknown> = {}
  if (sp.status) where.status = sp.status
  if (sp.date === 'today') where.createdAt = { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
  if (sp.canton) where.listing = { canton: sp.canton.toUpperCase() }

  const [rows, total, pendingManualReview, rejected] = await Promise.all([
    prisma.rentalApplication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        status: true,
        applicant: { select: { name: true, firstName: true, lastName: true, email: true } },
        listing: { select: { title: true, address: true, city: true, canton: true } },
        tenantProfile: { select: { creditCheckStatus: true } },
      },
      take: 500,
    }),
    prisma.rentalApplication.count(),
    prisma.tenantProfile.count({ where: { creditCheckStatus: 'PENDING_MANUAL_REVIEW' } }),
    prisma.rentalApplication.count({ where: { status: 'rejected' } }),
  ])

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayNew = await prisma.rentalApplication.count({ where: { createdAt: { gte: todayStart } } })

  const matchSince = (() => {
    const now = Date.now()
    if (matchPeriod === '24h') return new Date(now - 24 * 60 * 60 * 1000)
    if (matchPeriod === '30d') return new Date(now - 30 * 24 * 60 * 60 * 1000)
    if (matchPeriod === '90d') return new Date(now - 90 * 24 * 60 * 60 * 1000)
    return new Date(now - 7 * 24 * 60 * 60 * 1000)
  })()

  const metricRows = await prisma.analyticsEvent.findMany({
    where: {
      name: 'rental_match_mode_view',
      createdAt: { gte: matchSince },
    },
    select: { metadata: true },
    orderBy: { createdAt: 'desc' },
    take: 3000,
  })

  const matchStats = {
    allModeViews: 0,
    matchModeViews: 0,
    rolloutBlockedInMatchMode: 0,
    notLoggedInInMatchMode: 0,
    missingPreferencesInMatchMode: 0,
    matchedModeWithResults: 0,
    matchedModeWithoutResults: 0,
    scoreBuckets: { '0-49': 0, '50-69': 0, '70-84': 0, '85-100': 0 } as Record<string, number>,
  }
  for (const row of metricRows) {
    let md: Record<string, unknown> = {}
    if (row.metadata) {
      try {
        md = JSON.parse(row.metadata) as Record<string, unknown>
      } catch {
        md = {}
      }
    }
    const mode = md.mode === 'match' ? 'match' : 'all'
    if (mode === 'all') {
      matchStats.allModeViews++
      continue
    }
    matchStats.matchModeViews++
    if (md.rolloutBlocked) matchStats.rolloutBlockedInMatchMode++
    if (!md.isLoggedIn) matchStats.notLoggedInInMatchMode++
    if (md.needsPreferences) matchStats.missingPreferencesInMatchMode++
    if (Number(md.matchedResults || 0) > 0) matchStats.matchedModeWithResults++
    else matchStats.matchedModeWithoutResults++
    const buckets = (md.scoreBuckets || {}) as Record<string, number>
    for (const key of ['0-49', '50-69', '70-84', '85-100']) {
      matchStats.scoreBuckets[key] += Number(buckets[key] || 0)
    }
  }
  const totalScoreBucketItems = Object.values(matchStats.scoreBuckets).reduce((a, b) => a + b, 0)

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-900">Alle Bewerbungen</h1>
      <p className="mt-1 text-sm text-slate-600">Plattformweite Bewerbungs-Transparenz inklusive Credit-Check-Status.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Total Bewerbungen</p><p className="text-2xl font-bold">{total}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Heute neu</p><p className="text-2xl font-bold">{todayNew}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Pending Manual Review</p><p className="text-2xl font-bold">{pendingManualReview}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Abgelehnt</p><p className="text-2xl font-bold">{rejected}</p></div>
      </div>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Matching-Metriken (Für dich)</h2>
            <p className="text-xs text-slate-500">Nutzung und Qualität der neuen Match-Logik.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['24h', '7d', '30d', '90d'] as const).map(p => (
              <Link
                key={p}
                href={`/admin/applications?status=${encodeURIComponent(sp.status || '')}&date=${encodeURIComponent(sp.date || '')}&canton=${encodeURIComponent(sp.canton || '')}&matchPeriod=${p}`}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  matchPeriod === p ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs text-slate-500">Aufrufe Alle</p>
            <p className="text-xl font-bold text-slate-900">{matchStats.allModeViews}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs text-slate-500">Aufrufe Für dich</p>
            <p className="text-xl font-bold text-slate-900">{matchStats.matchModeViews}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs text-slate-500">Rollout blockiert (Für dich)</p>
            <p className="text-xl font-bold text-slate-900">{matchStats.rolloutBlockedInMatchMode}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs text-slate-500">Nicht eingeloggt (Für dich)</p>
            <p className="text-xl font-bold text-slate-900">{matchStats.notLoggedInInMatchMode}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs text-slate-500">Präferenzen fehlen (Für dich)</p>
            <p className="text-xl font-bold text-slate-900">{matchStats.missingPreferencesInMatchMode}</p>
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs text-slate-500">Für dich mit Treffern</p>
            <p className="text-xl font-bold text-emerald-700">{matchStats.matchedModeWithResults}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs text-slate-500">Für dich ohne Treffer</p>
            <p className="text-xl font-bold text-rose-700">{matchStats.matchedModeWithoutResults}</p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-slate-200 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Score-Verteilung</p>
          <div className="space-y-2">
            {(['0-49', '50-69', '70-84', '85-100'] as const).map(bucket => {
              const value = matchStats.scoreBuckets[bucket]
              const pct = totalScoreBucketItems > 0 ? Math.round((value / totalScoreBucketItems) * 100) : 0
              return (
                <div key={bucket}>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                    <span>{bucket}</span>
                    <span>{value} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <form className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
        <select title="Status filtern" name="status" defaultValue={sp.status || ''} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">Alle Status</option>
          <option value="pending">pending</option>
          <option value="approved">approved</option>
          <option value="rejected">rejected</option>
          <option value="pending_manual_review">pending_manual_review</option>
        </select>
        <select title="Datum filtern" name="date" defaultValue={sp.date || ''} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">Alle Daten</option>
          <option value="today">Heute</option>
        </select>
        <input name="canton" defaultValue={sp.canton || ''} placeholder="Kanton (z. B. ZH)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button type="submit" className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white">Filtern</button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">Bewerber</th>
              <th className="px-4 py-3">Listing</th>
              <th className="px-4 py-3">Bewerbungsdatum</th>
              <th className="px-4 py-3">Betreibungsregister</th>
              <th className="px-4 py-3">Bewerbungs-Status</th>
              <th className="px-4 py-3 text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const name = r.applicant.name || [r.applicant.firstName, r.applicant.lastName].filter(Boolean).join(' ').trim() || '—'
              return (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-4 py-3"><p className="font-semibold">{name}</p><p className="text-xs text-slate-500">{r.applicant.email}</p></td>
                  <td className="px-4 py-3"><p className="font-semibold">{r.listing.title}</p><p className="text-xs text-slate-500">{r.listing.address}, {r.listing.city}</p></td>
                  <td className="px-4 py-3">{formatDate(r.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadge(r.tenantProfile?.creditCheckStatus || 'NONE')}`}>
                      {r.tenantProfile?.creditCheckStatus || 'NONE'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadge(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/applications/${r.id}/dossier`} className="font-semibold text-teal-700 hover:underline">Lead-Dossier</Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {rows.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
          Keine Bewerbungen für den gewählten Filter gefunden.
        </div>
      ) : null}
    </main>
  )
}
