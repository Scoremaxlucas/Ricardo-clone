'use client'

import { Check, ExternalLink, Loader2, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

type Doc = { id: string; fileName: string; contentType: string; uploadedAt: string }
type Module = { moduleKind: string; status: string; reviewNote: string | null; documents: Doc[] }
type Item = { id: string; email: string; certificateCode: string; expiresAt: string; modules: Module[] }

const STATUS_LABEL: Record<string, string> = {
  PENDING_DOCS: 'Nachweise ausstehend',
  IN_REVIEW: 'In Prüfung',
  VERIFIED: 'Verifiziert',
  REJECTED: 'Abgelehnt',
}

export function SicAdminReview() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/sic/admin/review')
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.ok) setItems(data.items)
      else toast.error(data?.message || 'Laden fehlgeschlagen.')
    } catch {
      toast.error('Netzwerkfehler.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

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
      await load()
    } catch {
      toast.error('Netzwerkfehler.')
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="text-2xl font-bold text-[#0f2b5e]">SIC — Prüfung</h1>
      <p className="mt-1 text-sm text-slate-500">{items.length} Zertifikat(e) mit offenen Modulen.</p>

      {items.length === 0 ?
        <p className="mt-10 text-slate-500">Nichts zu prüfen.</p>
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
        </div>
      }
    </div>
  )
}
