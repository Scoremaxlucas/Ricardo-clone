'use client'

import { Check, ExternalLink, Loader2, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

type Doc = { id: string; fileName: string; contentType: string; uploadedAt: string }
type Module = { moduleKind: string; status: string; reviewNote: string | null; documents: Doc[] }
type Item = { id: string; email: string; certificateCode: string; expiresAt: string; modules: Module[] }
type Counts = { inReview: number; pendingDocs: number; totalOpen: number }
type Filter = 'IN_REVIEW' | 'PENDING_DOCS' | 'all'

const STATUS_LABEL: Record<string, string> = {
  PENDING_DOCS: 'Nachweise ausstehend',
  IN_REVIEW: 'In Prüfung',
  VERIFIED: 'Verifiziert',
  REJECTED: 'Abgelehnt',
}

const TABS: { id: Filter; label: string }[] = [
  { id: 'IN_REVIEW', label: 'In Prüfung' },
  { id: 'PENDING_DOCS', label: 'Nachweise ausstehend' },
  { id: 'all', label: 'Alle' },
]

export function SicAdminReview() {
  const [filter, setFilter] = useState<Filter>('IN_REVIEW')
  const [items, setItems] = useState<Item[]>([])
  const [counts, setCounts] = useState<Counts>({ inReview: 0, pendingDocs: 0, totalOpen: 0 })
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  const fetchPage = useCallback(async (opts: { filter: Filter; cursor?: string | null; append: boolean }) => {
    const params = new URLSearchParams({ status: opts.filter, limit: '50' })
    if (opts.cursor) params.set('cursor', opts.cursor)
    const res = await fetch(`/api/sic/admin/review?${params}`)
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data?.ok) throw new Error(data?.message || 'Laden fehlgeschlagen.')
    return data as {
      items: Item[]
      nextCursor: string | null
      counts: Counts
    }
  }, [])

  const load = useCallback(
    async (nextFilter: Filter = filter) => {
      setLoading(true)
      try {
        const data = await fetchPage({ filter: nextFilter, append: false })
        setItems(data.items)
        setNextCursor(data.nextCursor)
        setCounts(data.counts)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Laden fehlgeschlagen.')
      } finally {
        setLoading(false)
      }
    },
    [fetchPage, filter]
  )

  useEffect(() => {
    void load(filter)
  }, [filter]) // eslint-disable-line react-hooks/exhaustive-deps -- reload on filter change only

  async function loadMore() {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const data = await fetchPage({ filter, cursor: nextCursor, append: true })
      setItems(prev => [...prev, ...data.items])
      setNextCursor(data.nextCursor)
      setCounts(data.counts)
    } catch {
      toast.error('Weitere Einträge konnten nicht geladen werden.')
    } finally {
      setLoadingMore(false)
    }
  }

  async function act(certificateId: string, moduleKind: string, action: 'approve' | 'reject') {
    let note = ''
    if (action === 'reject') {
      note = window.prompt('Grund für die Ablehnung (wird dem Nutzer angezeigt):') || ''
      if (!note.trim()) return
    }
    setBusy(`${certificateId}:${moduleKind}`)
    try {
      const res = await fetch('/api/sic/admin/review', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ certificateId, moduleKind, action, note }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.message || 'Aktion fehlgeschlagen.')
        return
      }
      toast.success(action === 'approve' ? 'Modul freigegeben.' : 'Modul abgelehnt.')
      await load(filter)
    } catch {
      toast.error('Netzwerkfehler.')
    } finally {
      setBusy(null)
    }
  }

  const depthForFilter =
    filter === 'IN_REVIEW' ? counts.inReview
    : filter === 'PENDING_DOCS' ? counts.pendingDocs
    : counts.totalOpen

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="text-2xl font-bold text-[#0f2b5e]">SIC — Prüfung</h1>
      <p className="mt-1 text-sm text-slate-500">
        Queue:{' '}
        <span className="font-semibold text-[#0f2b5e]">{counts.inReview}</span> in Prüfung ·{' '}
        <span className="font-semibold text-amber-700">{counts.pendingDocs}</span> Nachweise ausstehend ·{' '}
        {counts.totalOpen} offen
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map(t => {
          const badge =
            t.id === 'IN_REVIEW' ? counts.inReview
            : t.id === 'PENDING_DOCS' ? counts.pendingDocs
            : counts.totalOpen
          const active = filter === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilter(t.id)}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                active ? 'bg-[#0f2b5e] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  active ? 'bg-white/20 text-white' : 'bg-white text-slate-500'
                }`}
              >
                {badge}
              </span>
            </button>
          )
        })}
      </div>

      {depthForFilter > items.length && items.length > 0 ?
        <p className="mt-3 text-xs text-slate-500">
          Zeige {items.length} von {depthForFilter} — älteste zuerst. Weitere Seiten laden.
        </p>
      : null}

      {loading ?
        <div className="flex items-center justify-center py-24 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      : items.length === 0 ?
        <p className="mt-10 text-slate-500">Nichts zu prüfen in diesem Filter.</p>
      : <div className="mt-6 space-y-5">
          {items.map(item => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-sm font-semibold text-slate-900">{item.certificateCode}</span>
                <span className="text-sm text-slate-500">{item.email}</span>
              </div>
              <ul className="mt-4 space-y-3">
                {item.modules.map(m => {
                  const key = `${item.id}:${m.moduleKind}`
                  const actionable = m.status === 'IN_REVIEW' || m.status === 'PENDING_DOCS'
                  return (
                    <li key={m.moduleKind} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-800">{m.moduleKind}</span>
                        <span className="text-xs font-medium text-slate-500">{STATUS_LABEL[m.status] ?? m.status}</span>
                      </div>

                      {m.documents.length > 0 ?
                        <ul className="mt-2 space-y-1">
                          {m.documents.map(d => (
                            <li key={d.id}>
                              <a
                                href={`/api/sic/admin/document/${d.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm text-[#0f2b5e] hover:underline"
                              >
                                <ExternalLink className="h-3.5 w-3.5" /> {d.fileName}
                              </a>
                            </li>
                          ))}
                        </ul>
                      : <p className="mt-2 text-xs text-slate-400">Noch keine Nachweise hochgeladen.</p>}

                      {actionable ?
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            disabled={busy === key || m.documents.length === 0}
                            onClick={() => act(item.id, m.moduleKind, 'approve')}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2f9e44] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1f7a34] disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" /> Freigeben
                          </button>
                          <button
                            type="button"
                            disabled={busy === key}
                            onClick={() => act(item.id, m.moduleKind, 'reject')}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                          >
                            <X className="h-3.5 w-3.5" /> Ablehnen
                          </button>
                        </div>
                      : null}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}

          {nextCursor ?
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-xl border border-[#0f2b5e] px-5 py-2.5 text-sm font-semibold text-[#0f2b5e] hover:bg-[#0f2b5e]/5 disabled:opacity-60"
              >
                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Weitere laden
              </button>
            </div>
          : null}
        </div>
      }
    </div>
  )
}
