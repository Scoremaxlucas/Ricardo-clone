import { authOptions } from '@/lib/auth'
import { requireMatchingAdmin } from '@/lib/matching/matching-ops-auth'
import { loadRecentMatchingOutboxEvents } from '@/lib/matching/ops-outbox-list'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Ops · Jobs',
  description: 'Matching Outbox / Hintergrundereignisse.',
}

export default async function MatchingOpsJobsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/matching/ops/jobs'))
  }

  const gate = await requireMatchingAdmin()
  if (!gate.ok) redirect('/matching')

  const rows = await loadRecentMatchingOutboxEvents(150)

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Ops</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Jobs & Outbox
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Letzte Einträge aus <code className="rounded bg-slate-100 px-1 text-xs">matching_outbox_events</code> —
        u. a. JSON-Import-Läufe und fehlgeschlagene Neuberechnungen.
      </p>

      <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-3 py-2">Zeit</th>
              <th className="px-3 py-2">Typ</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">payload</th>
              <th className="px-3 py-2">Fehler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Noch keine Outbox-Einträge.
                </td>
              </tr>
            ) : (
              rows.map(r => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-700">
                    {r.createdAt.toLocaleString('de-CH')}
                  </td>
                  <td className="max-w-[160px] truncate px-3 py-2 font-mono text-xs">{r.type}</td>
                  <td className="px-3 py-2 text-xs">{r.status}</td>
                  <td className="max-w-[280px] truncate px-3 py-2 font-mono text-[10px] text-slate-500">
                    {JSON.stringify(r.payload)}
                  </td>
                  <td className="max-w-[200px] truncate px-3 py-2 text-xs text-red-700">
                    {r.lastError ?? '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-10 text-sm text-slate-500">
        <Link href="/matching/ops" className="font-medium text-teal-800 underline-offset-2 hover:underline">
          Ops-Übersicht
        </Link>
      </p>
    </main>
  )
}
