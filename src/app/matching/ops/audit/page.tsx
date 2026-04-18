import { authOptions } from '@/lib/auth'
import { MATCHING_AUDIT_ENTITY_TYPES, searchMatchingAuditLogs } from '@/lib/matching/matching-audit-log'
import { requireMatchingAdmin } from '@/lib/matching/matching-ops-auth'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Ops · Audit',
  description: 'Matching-Audit-Log durchsuchen.',
}

function first(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined
  return Array.isArray(v) ? v[0] : v
}

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>
}

export default async function MatchingOpsAuditPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/matching/ops/audit'))
  }

  const gate = await requireMatchingAdmin()
  if (!gate.ok) redirect('/matching')

  const entityType = first(searchParams?.entityType)?.trim() || undefined
  const entityId = first(searchParams?.entityId)?.trim() || undefined
  const actorUserId = first(searchParams?.actorUserId)?.trim() || undefined
  const action = first(searchParams?.action)?.trim() || undefined
  const fromStr = first(searchParams?.from)?.trim()
  const toStr = first(searchParams?.to)?.trim()

  let from: Date | null = null
  let to: Date | null = null
  if (fromStr) {
    from = new Date(fromStr + 'T00:00:00.000Z')
    if (Number.isNaN(from.getTime())) from = null
  }
  if (toStr) {
    to = new Date(toStr + 'T23:59:59.999Z')
    if (Number.isNaN(to.getTime())) to = null
  }

  const rows = await searchMatchingAuditLogs({
    entityType: entityType || null,
    entityId: entityId || null,
    actorUserId: actorUserId || null,
    action: action || null,
    from,
    to,
    limit: 100,
  })

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Ops</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Audit-Suche</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Filter auf Entität, Akteur und Zeitraum. «action» wird als Teilstring gesucht (z. B.{' '}
        <code className="rounded bg-slate-100 px-1 text-xs">consent_share</code>).
      </p>

      <form
        method="get"
        className="mt-8 grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-3"
      >
        <div>
          <label className="block text-xs font-medium text-slate-700">entityType</label>
          <select
            name="entityType"
            defaultValue={entityType ?? ''}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">— alle —</option>
            {MATCHING_AUDIT_ENTITY_TYPES.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">entityId</label>
          <input
            name="entityId"
            defaultValue={entityId ?? ''}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="z. B. Bewerbungs-ID"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">actorUserId</label>
          <input
            name="actorUserId"
            defaultValue={actorUserId ?? ''}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">action (enthält)</label>
          <input
            name="action"
            defaultValue={action ?? ''}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="z. B. consent_share"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">Von (Datum)</label>
          <input
            type="date"
            name="from"
            defaultValue={fromStr ?? ''}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">Bis (Datum)</label>
          <input
            type="date"
            name="to"
            defaultValue={toStr ?? ''}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-end sm:col-span-2 lg:col-span-3">
          <button
            type="submit"
            className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Suchen
          </button>
        </div>
      </form>

      <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-3 py-2">Zeit</th>
              <th className="px-3 py-2">Aktion</th>
              <th className="px-3 py-2">entityType</th>
              <th className="px-3 py-2">entityId</th>
              <th className="px-3 py-2">Akteur</th>
              <th className="px-3 py-2">metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Keine Treffer.
                </td>
              </tr>
            ) : (
              rows.map(r => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-700">
                    {new Date(r.createdAt).toLocaleString('de-CH')}
                  </td>
                  <td className="max-w-[180px] truncate px-3 py-2 font-mono text-xs text-slate-800">{r.action}</td>
                  <td className="px-3 py-2 text-xs">{r.entityType}</td>
                  <td className="max-w-[140px] truncate px-3 py-2 font-mono text-xs">{r.entityId}</td>
                  <td className="max-w-[160px] truncate px-3 py-2 text-xs text-slate-600">
                    {r.actorEmail ?? r.actorUserId ?? '—'}
                  </td>
                  <td className="max-w-[240px] truncate px-3 py-2 font-mono text-[10px] text-slate-500">
                    {r.metadata == null ? '—' : JSON.stringify(r.metadata)}
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
