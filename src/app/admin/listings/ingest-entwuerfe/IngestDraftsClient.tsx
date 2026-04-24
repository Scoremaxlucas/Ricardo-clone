'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

type DraftRow = {
  id: string
  createdAt: string
  sourceUrl: string
  lastError: string | null
  status: string
}

export function IngestDraftsClient() {
  const { status } = useSession()
  const [rows, setRows] = useState<DraftRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (status !== 'authenticated') return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/rental-ingest/drafts')
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data as { message?: string }).message || 'Laden fehlgeschlagen')
        return
      }
      const drafts = (data as { drafts?: DraftRow[] }).drafts
      setRows(Array.isArray(drafts) ? drafts : [])
    } catch {
      toast.error('Netzwerkfehler')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    void load()
  }, [load])

  const discard = async (id: string) => {
    if (!confirm('Entwurf verwerfen?')) return
    const res = await fetch(`/api/admin/rental-ingest/drafts/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Konnte nicht verwerfen')
      return
    }
    toast.success('Entwurf verworfen')
    void load()
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <div className="mb-4 flex flex-wrap gap-3">
        <Link href="/admin/listings" className="text-sm font-medium text-teal-800 hover:underline">
          ← Mietinserate
        </Link>
        <Link href="/admin/listings/bulk-ingest" className="text-sm font-medium text-teal-800 hover:underline">
          Bulk-Import →
        </Link>
        <Link href="/admin/listings/ingest" className="text-sm font-medium text-teal-800 hover:underline">
          Einzel-Import →
        </Link>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Admin</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">Import-Entwürfe</h1>
      <p className="mt-2 text-sm text-slate-600">
        Offene Entwürfe aus dem Bulk-Import (oder fehlgeschlagene Auto-Erstellung). Die Original-URL steht in der
        Tabelle und wird im Import-Assistenten übernommen.
      </p>

      {loading ?
        <p className="mt-8 text-sm text-slate-500">Laden…</p>
      : rows.length === 0 ?
        <p className="mt-8 rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
          Keine offenen Entwürfe.
        </p>
      : <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Datum</th>
                <th className="px-4 py-3">Original-URL</th>
                <th className="px-4 py-3">Hinweis</th>
                <th className="px-4 py-3">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(r => (
                <tr key={r.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {new Date(r.createdAt).toLocaleString('de-CH', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="max-w-md px-4 py-3">
                    <a
                      href={r.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all font-mono text-xs text-teal-800 underline hover:text-teal-950"
                    >
                      {r.sourceUrl}
                    </a>
                  </td>
                  <td className="max-w-xs px-4 py-3 text-xs text-amber-900">{r.lastError || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link
                      href={`/admin/listings/ingest?draftId=${encodeURIComponent(r.id)}`}
                      className="font-medium text-teal-800 underline"
                    >
                      Im Import öffnen
                    </Link>
                    <button
                      type="button"
                      onClick={() => void discard(r.id)}
                      className="ml-3 text-xs text-slate-500 underline hover:text-red-700"
                    >
                      Verwerfen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
    </main>
  )
}
