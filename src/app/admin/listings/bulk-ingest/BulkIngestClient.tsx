'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import toast from 'react-hot-toast'

type BatchRow =
  | { url: string; ok: true; listingId: string }
  | { url: string; ok: false; draftId: string; reason: string }

export function BulkIngestClient() {
  const { status } = useSession()
  const [text, setText] = useState('')
  const [running, setRunning] = useState(false)
  const [rows, setRows] = useState<BatchRow[] | null>(null)
  const [summary, setSummary] = useState<{ total: number; created: number; drafts: number; truncated: boolean } | null>(
    null
  )

  const run = async () => {
    if (status !== 'authenticated') {
      toast.error('Bitte anmelden')
      return
    }
    setRunning(true)
    setRows(null)
    setSummary(null)
    try {
      const res = await fetch('/api/admin/rental-ingest/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data as { message?: string }).message || 'Batch fehlgeschlagen')
        return
      }
      const results = (data as { results?: BatchRow[] }).results
      const sum = (data as { summary?: { total: number; created: number; drafts: number; truncated: boolean } }).summary
      if (!Array.isArray(results) || !sum) {
        toast.error('Unerwartete Antwort')
        return
      }
      setRows(results)
      setSummary(sum)
      toast.success(`${sum.created} erstellt, ${sum.drafts} Entwürfe`)
      if (sum.truncated) toast('Nur die ersten 30 URLs wurden verarbeitet.', { icon: '⚠️' })
    } catch {
      toast.error('Netzwerkfehler')
    } finally {
      setRunning(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <div className="mb-4 flex flex-wrap gap-3">
        <Link href="/admin/listings" className="text-sm font-medium text-teal-800 hover:underline">
          ← Mietinserate
        </Link>
        <Link href="/admin/listings/ingest-entwuerfe" className="text-sm font-medium text-teal-800 hover:underline">
          Import-Entwürfe →
        </Link>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Admin</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">Bulk-URL-Import</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Bis zu 30 Links pro Lauf. Jede URL wird einzeln verarbeitet: bei vollständigen Daten wird das Inserat automatisch
        angelegt; andernfalls entsteht ein Entwurf unter „Import-Entwürfe“, den du im normalen Import-Assistenten
        fertigstellst — die übrigen URLs laufen unabhängig weiter.
      </p>

      <div className="mt-8 space-y-3">
        <label className="block text-sm font-medium text-slate-800">URLs (eine pro Zeile oder durch Komma getrennt)</label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={14}
          disabled={running}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
          placeholder={`https://www.tutti.ch/de/q/wohnung/…\nhttps://…`}
        />
        <button
          type="button"
          disabled={running || !text.trim()}
          onClick={() => void run()}
          className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? 'Verarbeite…' : 'Import starten'}
        </button>
      </div>

      {rows && summary ?
        <div className="mt-10 space-y-4">
          <p className="text-sm font-semibold text-slate-800">
            Ergebnis — {summary.created} Inserate, {summary.drafts} Entwürfe (von {summary.total})
          </p>
          <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white text-sm">
            {rows.map((r, i) => (
              <li key={i} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                <span className="min-w-0 flex-1 break-all text-slate-800">{r.url}</span>
                {r.ok ?
                  <span className="shrink-0 text-emerald-700">
                    Erstellt —{' '}
                    <Link href={`/wohnungen/${r.listingId}`} className="font-medium underline" target="_blank" rel="noreferrer">
                      Inserat ansehen
                    </Link>
                  </span>
                : <span className="shrink-0 text-amber-800">
                    Entwurf —{' '}
                    <Link
                      href={`/admin/listings/ingest?draftId=${encodeURIComponent(r.draftId)}`}
                      className="font-medium underline"
                    >
                      im Import öffnen
                    </Link>
                    <span className="mt-0.5 block text-xs text-slate-600">{r.reason}</span>
                  </span>
                }
              </li>
            ))}
          </ul>
        </div>
      : null}
    </main>
  )
}
