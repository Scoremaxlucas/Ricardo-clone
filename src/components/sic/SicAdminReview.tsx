'use client'

import { SicAdminReviewPreview } from '@/components/sic/SicAdminReviewPreview'
import { parseSicAdminSearchQuery } from '@/lib/sic/admin-queue'
import { sicFactFields, type SicFactField, type SicFacts } from '@/lib/sic/facts'
import { isSicModuleId, type SicModuleId } from '@/lib/sic/modules'
import { SIC_REJECTION_REASONS } from '@/lib/sic/review'
import { SIC_REVOKE_REASONS } from '@/lib/sic/revoke'
import { sicReviewSlaLabel, sicReviewSlaState } from '@/lib/sic/review-sla'
import { AlertTriangle, Banknote, Check, ExternalLink, Loader2, Mail, Search, Sparkles, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

type Doc = { id: string; fileName: string; contentType: string; uploadedAt: string }
type Module = {
  moduleKind: string
  title: string
  status: string
  reviewNote: string | null
  reviewedAt: string | null
  reviewedByUserId: string | null
  paidAt: string
  firstUploadAt: string | null
  verifiedFacts: SicFacts | null
  documents: Doc[]
}
type Item = {
  id: string
  email: string
  certificateCode: string
  holderName: string | null
  status: string
  certifiedAt: string | null
  expiresAt: string | null
  updatedAt: string
  modules: Module[]
}
type Counts = { inReview: number; pendingDocs: number; totalOpen: number; slaOverdue: number }
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

function waitingLabel(since: string | null): string | null {
  if (!since) return null
  const days = Math.floor((Date.now() - new Date(since).getTime()) / (24 * 60 * 60 * 1000))
  if (days <= 0) return 'heute eingegangen'
  if (days === 1) return 'wartet seit 1 Tag'
  return `wartet seit ${days} Tagen`
}

function FactForm({
  moduleId,
  values,
  onChange,
}: {
  moduleId: SicModuleId
  values: SicFacts
  onChange: (key: string, value: string) => void
}) {
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {sicFactFields(moduleId).map((field: SicFactField) => (
        <label key={field.key} className="block text-xs">
          <span className="font-semibold text-sic-navy">
            {field.label}
            {field.required ? '' : ' (optional)'}
          </span>
          {field.kind === 'select' ?
            <select
              value={values[field.key] ?? ''}
              onChange={e => onChange(field.key, e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm outline-none focus:border-sic-navy"
            >
              <option value="">— wählen —</option>
              {field.options?.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          : <input
              type={field.kind === 'date' ? 'date' : 'text'}
              value={values[field.key] ?? ''}
              placeholder={field.placeholder}
              onChange={e => onChange(field.key, e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm outline-none focus:border-sic-navy"
            />
          }
          {field.hint ? <span className="mt-1 block text-[11px] text-slate-500">{field.hint}</span> : null}
        </label>
      ))}
    </div>
  )
}

function RejectDialog({
  moduleTitle,
  onCancel,
  onConfirm,
  busy,
}: {
  moduleTitle: string
  onCancel: () => void
  onConfirm: (note: string) => void
  busy: boolean
}) {
  const [note, setNote] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-base font-bold text-sic-navy">«{moduleTitle}» ablehnen</h3>
        <p className="mt-1 text-sm text-slate-600">
          Der Grund geht wörtlich an den Bewerber. Der Anspruch bleibt bestehen — er kann nachreichen.
        </p>
        <div className="mt-4 space-y-2">
          {SIC_REJECTION_REASONS.map(reason => (
            <button
              key={reason}
              type="button"
              onClick={() => setNote(reason)}
              className={`block w-full rounded-lg border px-3 py-2 text-left text-xs leading-relaxed transition-colors ${
                note === reason ?
                  'border-sic-navy bg-sic-navy/5 text-sic-navy'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {reason}
            </button>
          ))}
        </div>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={3}
          placeholder="Grund anpassen oder frei formulieren"
          className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sic-navy"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Abbrechen
          </button>
          <button
            type="button"
            disabled={busy || !note.trim()}
            onClick={() => onConfirm(note.trim())}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sic-danger px-4 py-2 text-sm font-semibold text-white hover:brightness-90 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            Ablehnen und benachrichtigen
          </button>
        </div>
      </div>
    </div>
  )
}

function RefundDialog({
  moduleTitle,
  onCancel,
  onConfirm,
  busy,
}: {
  moduleTitle: string
  onCancel: () => void
  onConfirm: () => void
  busy: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-base font-bold text-sic-navy">«{moduleTitle}» erstatten</h3>
        <p className="mt-1 text-sm text-slate-600">
          AGB §7: nur wenn wir diese Angabe aus Gründen, die bei uns liegen, nicht prüfen können. Keine
          Erstattung bei fehlenden Unterlagen, negativem Inhalt oder wenn ein Vermieter den Bewerber nicht
          berücksichtigt. Die Angabe wird vom Zertifikat entfernt; andere Angaben bleiben.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Abbrechen
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sic-danger px-4 py-2 text-sm font-semibold text-white hover:brightness-90 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
            Erstatten (Stripe)
          </button>
        </div>
      </div>
    </div>
  )
}

function RevokeDialog({
  certificateCode,
  onCancel,
  onConfirm,
  busy,
}: {
  certificateCode: string
  onCancel: () => void
  onConfirm: (reason: string) => void
  busy: boolean
}) {
  const [note, setNote] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-base font-bold text-sic-navy">Zertifikat {certificateCode} widerrufen</h3>
        <p className="mt-1 text-sm text-slate-600">
          AGB §8: ohne Rückerstattung. Die Prüfseite zeigt den Code danach als widerrufen — ohne
          Name, ohne Angaben.
        </p>
        <div className="mt-4 space-y-2">
          {SIC_REVOKE_REASONS.map(reason => (
            <button
              key={reason}
              type="button"
              onClick={() => setNote(reason)}
              className={`block w-full rounded-lg border px-3 py-2 text-left text-xs leading-relaxed transition-colors ${
                note === reason ?
                  'border-sic-navy bg-sic-navy/5 text-sic-navy'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {reason}
            </button>
          ))}
        </div>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={3}
          placeholder="Grund anpassen oder frei formulieren"
          className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sic-navy"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Abbrechen
          </button>
          <button
            type="button"
            disabled={busy || note.trim().length < 8}
            onClick={() => onConfirm(note.trim())}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sic-danger px-4 py-2 text-sm font-semibold text-white hover:brightness-90 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
            Widerrufen ohne Rückerstattung
          </button>
        </div>
      </div>
    </div>
  )
}

export function SicAdminReview() {
  const [filter, setFilter] = useState<Filter>('IN_REVIEW')
  const [items, setItems] = useState<Item[]>([])
  const [counts, setCounts] = useState<Counts>({ inReview: 0, pendingDocs: 0, totalOpen: 0, slaOverdue: 0 })
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [facts, setFacts] = useState<Record<string, SicFacts>>({})
  const [warnings, setWarnings] = useState<Record<string, string[]>>({})
  const [rejecting, setRejecting] = useState<{ certificateId: string; moduleKind: string; title: string } | null>(
    null
  )
  const [revoking, setRevoking] = useState<{ certificateId: string; certificateCode: string } | null>(null)
  const [refunding, setRefunding] = useState<{ certificateId: string; moduleKind: string; title: string } | null>(
    null
  )
  const [queryInput, setQueryInput] = useState('')
  const [activeQuery, setActiveQuery] = useState<string | null>(null)

  const fetchPage = useCallback(async (opts: { filter: Filter; cursor?: string | null; q?: string | null }) => {
    const params = new URLSearchParams({ status: opts.filter, limit: '50' })
    if (opts.cursor) params.set('cursor', opts.cursor)
    if (opts.q) params.set('q', opts.q)
    const res = await fetch(`/api/sic/admin/review?${params}`)
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data?.ok) throw new Error(data?.message || 'Laden fehlgeschlagen.')
    return data as { items: Item[]; nextCursor: string | null; counts: Counts; search?: string | null }
  }, [])

  const seedFacts = useCallback((rows: Item[]) => {
    setFacts(prev => {
      const next = { ...prev }
      for (const item of rows) {
        for (const m of item.modules) {
          const key = `${item.id}:${m.moduleKind}`
          if (!next[key]) next[key] = m.verifiedFacts ?? {}
        }
      }
      return next
    })
  }, [])

  const load = useCallback(
    async (nextFilter: Filter = filter, q: string | null = activeQuery) => {
      setLoading(true)
      try {
        const data = await fetchPage({ filter: nextFilter, q })
        setItems(data.items)
        setNextCursor(data.nextCursor)
        setCounts(data.counts)
        setFacts({})
        seedFacts(data.items)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Laden fehlgeschlagen.')
      } finally {
        setLoading(false)
      }
    },
    [fetchPage, filter, activeQuery, seedFacts]
  )

  useEffect(() => {
    void load(filter, activeQuery)
  }, [filter, activeQuery]) // eslint-disable-line react-hooks/exhaustive-deps -- reload on filter/search change only

  async function loadMore() {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const data = await fetchPage({ filter, cursor: nextCursor, q: activeQuery })
      setItems(prev => [...prev, ...data.items])
      setNextCursor(data.nextCursor)
      setCounts(data.counts)
      seedFacts(data.items)
    } catch {
      toast.error('Weitere Einträge konnten nicht geladen werden.')
    } finally {
      setLoadingMore(false)
    }
  }

  function setFact(key: string, field: string, value: string) {
    setFacts(prev => ({ ...prev, [key]: { ...(prev[key] ?? {}), [field]: value } }))
  }

  async function prefill(certificateId: string, moduleKind: string, documentId: string) {
    const key = `${certificateId}:${moduleKind}`
    setBusy(`${key}:prefill`)
    try {
      const res = await fetch('/api/sic/admin/prefill', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ documentId, moduleKind }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.ok) {
        toast.error(data?.message || 'Auslesen fehlgeschlagen.')
        return
      }
      setFacts(prev => ({ ...prev, [key]: { ...(prev[key] ?? {}), ...(data.facts as SicFacts) } }))
      setWarnings(prev => ({ ...prev, [key]: (data.warnings as string[]) ?? [] }))
      toast.success('Werte vorbefüllt — bitte gegen das Dokument prüfen.')
    } catch {
      toast.error('Netzwerkfehler.')
    } finally {
      setBusy(null)
    }
  }

  async function approve(certificateId: string, moduleKind: string) {
    const key = `${certificateId}:${moduleKind}`
    setBusy(key)
    try {
      const res = await fetch('/api/sic/admin/review', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ certificateId, moduleKind, action: 'approve', facts: facts[key] ?? {} }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.message || 'Freigabe fehlgeschlagen.')
        return
      }
      toast.success('Freigegeben — Zertifikat aktualisiert.')
      await load(filter, activeQuery)
    } catch {
      toast.error('Netzwerkfehler.')
    } finally {
      setBusy(null)
    }
  }

  async function reject(certificateId: string, moduleKind: string, note: string) {
    const key = `${certificateId}:${moduleKind}`
    setBusy(key)
    try {
      const res = await fetch('/api/sic/admin/review', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ certificateId, moduleKind, action: 'reject', note }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.message || 'Aktion fehlgeschlagen.')
        return
      }
      toast.success('Abgelehnt — Bewerber benachrichtigt.')
      setRejecting(null)
      await load(filter, activeQuery)
    } catch {
      toast.error('Netzwerkfehler.')
    } finally {
      setBusy(null)
    }
  }

  async function revoke(certificateId: string, reason: string) {
    setBusy(`revoke:${certificateId}`)
    try {
      const res = await fetch('/api/sic/admin/revoke', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ certificateId, reason }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.message || 'Widerruf fehlgeschlagen.')
        return
      }
      toast.success(
        data?.already ? 'Dieses Zertifikat war bereits widerrufen.' : 'Zertifikat widerrufen — ohne Rückerstattung.'
      )
      setRevoking(null)
      await load(filter, activeQuery)
    } catch {
      toast.error('Netzwerkfehler.')
    } finally {
      setBusy(null)
    }
  }

  async function resendMagicLink(certificateId: string) {
    setBusy(`magic:${certificateId}`)
    try {
      const res = await fetch('/api/sic/admin/magic-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ certificateId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.message || 'Anmeldelink konnte nicht gesendet werden.')
        return
      }
      toast.success(
        typeof data?.email === 'string' ?
          `Anmeldelink an ${data.email} gesendet.`
        : 'Anmeldelink gesendet.'
      )
    } catch {
      toast.error('Netzwerkfehler.')
    } finally {
      setBusy(null)
    }
  }

  async function refundModule(certificateId: string, moduleKind: string) {
    const key = `refund:${certificateId}:${moduleKind}`
    setBusy(key)
    try {
      const res = await fetch('/api/sic/admin/refund', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ certificateId, moduleKind }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.message || 'Erstattung fehlgeschlagen.')
        return
      }
      toast.success(
        data?.already ?
          'Diese Angabe war bereits entfernt.'
        : data?.amountLabel ?
          `Erstattet: ${data.amountLabel}. Angabe vom Zertifikat genommen.`
        : 'Angabe erstattet und vom Zertifikat genommen.'
      )
      setRefunding(null)
      await load(filter, activeQuery)
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
      <h1 className="text-2xl font-bold text-sic-navy">SIC — Prüfung</h1>
      <p className="mt-1 text-sm text-slate-500">
        Queue: <span className="font-semibold text-sic-navy">{counts.inReview}</span> in Prüfung ·{' '}
        <span className="font-semibold text-sic-pending-text">{counts.pendingDocs}</span> Nachweise ausstehend ·{' '}
        {counts.totalOpen} offen · älteste zuerst
      </p>
      <p
        className={`mt-2 rounded-lg px-3 py-2 text-sm ${
          counts.slaOverdue > 0 ?
            'bg-sic-danger-bg font-semibold text-sic-danger-text'
          : 'bg-sic-navy/5 text-sic-navy'
        }`}
      >
        SLA intern: 1 Werktag nach Eingang (Mo–Fr).{' '}
        {counts.slaOverdue > 0 ?
          `${counts.slaOverdue} ${counts.slaOverdue === 1 ? 'Angabe ist' : 'Angaben sind'} überfällig.`
        : 'Nichts überfällig.'}
      </p>

      <form
        className="mt-4 flex flex-wrap items-center gap-2"
        onSubmit={e => {
          e.preventDefault()
          const parsed = parseSicAdminSearchQuery(queryInput)
          if (!parsed) {
            toast.error('Mindestens 3 Zeichen: E-Mail, SIC-Code oder Zahlungs-ID.')
            return
          }
          setActiveQuery(parsed)
        }}
      >
        <label htmlFor="sic-admin-search" className="sr-only">
          Suche
        </label>
        <input
          id="sic-admin-search"
          type="search"
          value={queryInput}
          onChange={e => setQueryInput(e.target.value)}
          placeholder="E-Mail, SIC-Code oder Zahlungs-ID"
          className="min-w-[16rem] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sic-navy"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-lg bg-sic-navy px-3.5 py-2 text-sm font-semibold text-white hover:bg-sic-navy-soft"
        >
          <Search className="h-4 w-4" /> Suchen
        </button>
        {activeQuery ?
          <button
            type="button"
            onClick={() => {
              setQueryInput('')
              setActiveQuery(null)
            }}
            className="text-sm font-semibold text-slate-600 hover:underline"
          >
            Queue zeigen
          </button>
        : null}
      </form>
      {activeQuery ?
        <p className="mt-2 text-xs text-slate-500">
          Suche nach «{activeQuery}» — alle Zertifikate, nicht nur die Queue.
        </p>
      : null}

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
                active ? 'bg-sic-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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

      {depthForFilter > items.length && items.length > 0 && !activeQuery ?
        <p className="mt-3 text-xs text-slate-500">
          Zeige {items.length} von {depthForFilter} — älteste zuerst. Weitere Seiten laden.
        </p>
      : null}

      {loading ?
        <div className="flex items-center justify-center py-24 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      : items.length === 0 ?
        <p className="mt-10 text-slate-500">
          {activeQuery ? 'Kein Zertifikat zu dieser Suche.' : 'Nichts zu prüfen in diesem Filter.'}
        </p>
      : <div className="mt-6 space-y-5">
          {items.map(item => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-sm font-semibold text-slate-900">{item.certificateCode}</span>
                <span className="text-sm text-slate-500">{item.email}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {item.holderName ?
                  `Inhaber: ${item.holderName}`
                : 'Kein Name gesetzt — ohne Namen gibt es kein PDF.'}
                {item.status === 'REVOKED' ?
                  <span className="ml-2 font-semibold text-sic-danger-text">Widerrufen</span>
                : null}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                <button
                  type="button"
                  disabled={busy === `magic:${item.id}`}
                  onClick={() => resendMagicLink(item.id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-sic-navy hover:underline disabled:opacity-50"
                >
                  {busy === `magic:${item.id}` ?
                    <Loader2 className="h-3 w-3 animate-spin" />
                  : <Mail className="h-3 w-3" />}
                  Link erneut senden
                </button>
                {item.status !== 'REVOKED' ?
                  <button
                    type="button"
                    onClick={() => setRevoking({ certificateId: item.id, certificateCode: item.certificateCode })}
                    className="text-xs font-semibold text-sic-danger-text hover:underline"
                  >
                    Zertifikat widerrufen (AGB §8)
                  </button>
                : null}
              </div>

              <ul className="mt-4 space-y-3">
                {item.modules.map(m => {
                  const key = `${item.id}:${m.moduleKind}`
                  const actionable =
                    item.status !== 'REVOKED' && (m.status === 'IN_REVIEW' || m.status === 'PENDING_DOCS')
                  const moduleId = isSicModuleId(m.moduleKind) ? m.moduleKind : null
                  const waiting = waitingLabel(m.firstUploadAt ?? m.paidAt)
                  const sla =
                    m.status === 'IN_REVIEW' && m.firstUploadAt ?
                      sicReviewSlaState(new Date(m.firstUploadAt))
                    : null
                  const slaText =
                    m.status === 'IN_REVIEW' && m.firstUploadAt ?
                      sicReviewSlaLabel(new Date(m.firstUploadAt))
                    : null
                  const moduleWarnings = warnings[key] ?? []
                  return (
                    <li
                      key={m.moduleKind}
                      className={`rounded-xl border p-4 ${
                        sla === 'overdue' ?
                          'border-sic-danger/40 bg-sic-danger-bg/40'
                        : sla === 'due_today' ?
                          'border-sic-pending-text/30 bg-sic-pending-bg'
                        : 'border-slate-100 bg-slate-50'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-800">{m.title}</span>
                        <span className="text-xs font-medium text-slate-500">
                          {STATUS_LABEL[m.status] ?? m.status}
                          {waiting && actionable ? ` · ${waiting}` : ''}
                          {slaText ? ` · ${slaText}` : ''}
                        </span>
                      </div>

                      {m.status === 'VERIFIED' && m.reviewedAt ?
                        <p className="mt-1 text-[11px] text-slate-500">
                          Freigegeben am {new Date(m.reviewedAt).toLocaleDateString('de-CH')}
                          {m.reviewedByUserId ? ` durch ${m.reviewedByUserId}` : ''}
                        </p>
                      : null}

                      {m.documents.length > 0 ?
                        <ul className="mt-2 space-y-1">
                          {m.documents.map(d => (
                            <li key={d.id} className="flex flex-wrap items-center gap-2">
                              <a
                                href={`/api/sic/admin/document/${d.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm text-sic-navy hover:underline"
                              >
                                <ExternalLink className="h-3.5 w-3.5" /> {d.fileName}
                              </a>
                              {actionable && moduleId ?
                                <button
                                  type="button"
                                  disabled={busy === `${key}:prefill`}
                                  onClick={() => prefill(item.id, m.moduleKind, d.id)}
                                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:bg-white disabled:opacity-50"
                                >
                                  {busy === `${key}:prefill` ?
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  : <Sparkles className="h-3 w-3" />}
                                  Werte auslesen
                                </button>
                              : null}
                            </li>
                          ))}
                        </ul>
                      : <p className="mt-2 text-xs text-slate-400">Noch keine Nachweise hochgeladen.</p>}

                      {moduleWarnings.length > 0 ?
                        <ul className="mt-3 space-y-1">
                          {moduleWarnings.map(w => (
                            <li
                              key={w}
                              className="flex items-start gap-1.5 rounded-lg bg-sic-pending-bg px-2.5 py-1.5 text-[11px] text-sic-pending-text"
                            >
                              <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" /> {w}
                            </li>
                          ))}
                        </ul>
                      : null}

                      {m.status === 'REJECTED' && m.reviewNote ?
                        <p className="mt-2 rounded-lg bg-sic-danger-bg px-3 py-2 text-xs text-sic-danger-text">
                          {m.reviewNote}
                        </p>
                      : null}

                      {actionable && moduleId ?
                        <>
                          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Geprüfte Werte für das Zertifikat
                          </p>
                          <FactForm
                            moduleId={moduleId}
                            values={facts[key] ?? {}}
                            onChange={(field, value) => setFact(key, field, value)}
                          />
                          <SicAdminReviewPreview
                            certificateCode={item.certificateCode}
                            holderName={item.holderName}
                            certifiedAt={item.certifiedAt}
                            expiresAt={item.expiresAt}
                            modules={item.modules}
                            draftModuleId={moduleId}
                            draftFacts={facts[key] ?? {}}
                          />
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={busy === key || m.documents.length === 0}
                              onClick={() => approve(item.id, m.moduleKind)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-sic-verified px-3 py-1.5 text-xs font-semibold text-white hover:brightness-90 disabled:opacity-50"
                            >
                              <Check className="h-3.5 w-3.5" /> Freigeben
                            </button>
                            <button
                              type="button"
                              disabled={busy === key}
                              onClick={() =>
                                setRejecting({ certificateId: item.id, moduleKind: m.moduleKind, title: m.title })
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-sic-danger/40 px-3 py-1.5 text-xs font-semibold text-sic-danger-text hover:bg-sic-danger-bg disabled:opacity-50"
                            >
                              <X className="h-3.5 w-3.5" /> Ablehnen
                            </button>
                            {m.status === 'IN_REVIEW' && m.documents.length > 0 ?
                              <button
                                type="button"
                                disabled={busy === `refund:${item.id}:${m.moduleKind}`}
                                onClick={() =>
                                  setRefunding({
                                    certificateId: item.id,
                                    moduleKind: m.moduleKind,
                                    title: m.title,
                                  })
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white disabled:opacity-50"
                              >
                                <Banknote className="h-3.5 w-3.5" /> Erstatten (AGB §7)
                              </button>
                            : null}
                          </div>
                        </>
                      : null}

                      {m.status === 'VERIFIED' && m.verifiedFacts ?
                        <dl className="mt-2 grid gap-1 text-[11px] text-slate-600 sm:grid-cols-2">
                          {Object.entries(m.verifiedFacts).map(([k, v]) => (
                            <div key={k} className="flex gap-1">
                              <dt className="text-slate-400">{k}:</dt>
                              <dd className="font-medium">{v}</dd>
                            </div>
                          ))}
                        </dl>
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
                className="inline-flex items-center gap-2 rounded-xl border border-sic-navy px-5 py-2.5 text-sm font-semibold text-sic-navy hover:bg-sic-navy/5 disabled:opacity-60"
              >
                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Weitere laden
              </button>
            </div>
          : null}
        </div>
      }

      {rejecting ?
        <RejectDialog
          moduleTitle={rejecting.title}
          busy={busy === `${rejecting.certificateId}:${rejecting.moduleKind}`}
          onCancel={() => setRejecting(null)}
          onConfirm={note => reject(rejecting.certificateId, rejecting.moduleKind, note)}
        />
      : null}
      {revoking ?
        <RevokeDialog
          certificateCode={revoking.certificateCode}
          busy={busy === `revoke:${revoking.certificateId}`}
          onCancel={() => setRevoking(null)}
          onConfirm={reason => revoke(revoking.certificateId, reason)}
        />
      : null}
      {refunding ?
        <RefundDialog
          moduleTitle={refunding.title}
          busy={busy === `refund:${refunding.certificateId}:${refunding.moduleKind}`}
          onCancel={() => setRefunding(null)}
          onConfirm={() => refundModule(refunding.certificateId, refunding.moduleKind)}
        />
      : null}
    </div>
  )
}
