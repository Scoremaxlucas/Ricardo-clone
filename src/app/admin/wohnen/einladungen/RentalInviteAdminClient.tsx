'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

type Row = {
  id: string
  email: string
  status: string
  createdAt: string
  expiresAt: string
  sourceUrl: string | null
  rentalListingId: string | null
  lastError: string | null
  draftPayload: unknown | null
  createdBy: {
    name: string | null
    firstName: string | null
    lastName: string | null
    email: string | null
  }
}

export function RentalInviteAdminClient() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/rental-listing-invites', { credentials: 'same-origin' })
      const data = (await res.json().catch(() => ({}))) as { invites?: Row[] }
      if (res.ok && Array.isArray(data.invites)) setRows(data.invites)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const send = async () => {
    setSending(true)
    setMsg(null)
    try {
      const res = await fetch('/api/admin/rental-listing-invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = (await res.json().catch(() => ({}))) as { message?: string }
      if (!res.ok) {
        setMsg(data.message || 'Versand fehlgeschlagen')
        return
      }
      setMsg('Einladung versendet.')
      setEmail('')
      await load()
    } catch {
      setMsg('Netzwerkfehler')
    } finally {
      setSending(false)
    }
  }

  const statusDe = (s: string) => {
    switch (s) {
      case 'SENT':
        return 'Gesendet (wartet auf URL)'
      case 'URL_SUBMITTED':
        return 'URL erhalten'
      case 'LISTING_CREATED':
        return 'Inserat erstellt'
      case 'NEEDS_ADMIN':
        return 'Entwurf / manuell'
      default:
        return s
    }
  }

  const creatorLabel = (row: Row) => {
    const fullName = [row.createdBy.firstName, row.createdBy.lastName].filter(Boolean).join(' ').trim()
    return row.createdBy.name || fullName || row.createdBy.email || 'Admin'
  }

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
        <h2 className="text-lg font-bold text-[#0d2b1f]">Neue Einladung</h2>
        <p className="mt-2 text-sm text-slate-600">
          E-Mail-Adresse eingeben und senden. Die Person erhält einen Link zu einer Seite, auf der sie die Inserat-URL
          eintragen kann — anschliessend wird automatisch importiert oder ein Entwurf für dich angelegt.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">E-Mail</span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@beispiel.ch"
              className="h-12 w-full rounded-lg border border-slate-200 px-3 text-sm shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
            />
          </label>
          <button
            type="button"
            disabled={sending || !email.includes('@')}
            onClick={() => void send()}
            className="h-12 shrink-0 rounded-xl bg-[#18a87c] px-6 text-sm font-bold text-white shadow-md hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? 'Senden…' : 'Einladung senden'}
          </button>
        </div>
        {msg ?
          <p className={`mt-3 text-sm ${msg.includes('fehl') || msg.includes('Fehl') ? 'text-red-600' : 'text-emerald-800'}`}>{msg}</p>
        : null}
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
        <h2 className="text-lg font-bold text-[#0d2b1f]">Letzte Einladungen</h2>
        {loading ?
          <p className="mt-4 text-sm text-slate-600">Laden…</p>
        : rows.length === 0 ?
          <p className="mt-4 text-sm text-slate-600">Noch keine Einladungen.</p>
        : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-3">Zeit</th>
                  <th className="py-2 pr-3">E-Mail</th>
                  <th className="py-2 pr-3">Erstellt von</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Quell-URL</th>
                  <th className="py-2 pr-3">Inserat</th>
                  <th className="py-2">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} className="border-b border-slate-100 align-top">
                    <td className="py-3 pr-3 whitespace-nowrap text-slate-700">
                      <div>{new Date(r.createdAt).toLocaleString('de-CH', { dateStyle: 'short', timeStyle: 'short' })}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        Ablauf {new Date(r.expiresAt).toLocaleDateString('de-CH')}
                      </div>
                    </td>
                    <td className="py-3 pr-3 font-medium text-slate-900">{r.email}</td>
                    <td className="py-3 pr-3 text-slate-700">{creatorLabel(r)}</td>
                    <td className="py-3 pr-3 text-slate-700">
                      <div>{statusDe(r.status)}</div>
                      {r.lastError ? <div className="mt-1 max-w-xs text-xs text-amber-900">{r.lastError}</div> : null}
                    </td>
                    <td className="py-3 pr-3">
                      {r.sourceUrl ?
                        <a
                          href={r.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all text-teal-800 underline-offset-2 hover:underline"
                        >
                          {r.sourceUrl.length > 48 ? `${r.sourceUrl.slice(0, 48)}…` : r.sourceUrl}
                        </a>
                      : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      {r.rentalListingId ?
                        <Link href={`/admin/listings/${r.rentalListingId}/bearbeiten`} className="font-semibold text-teal-800 hover:underline">
                          Öffnen
                        </Link>
                      : (
                        '—'
                      )}
                    </td>
                    <td className="py-3">
                      {r.status === 'NEEDS_ADMIN' ?
                        <button
                          type="button"
                          onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                          className="text-xs font-bold text-amber-800 underline-offset-2 hover:underline"
                        >
                          {expanded === r.id ? 'Details ausblenden' : 'Entwurf / Fehler anzeigen'}
                        </button>
                      : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {expanded ?
              (() => {
                const r = rows.find(x => x.id === expanded)
                const json =
                  r?.draftPayload != null ?
                    JSON.stringify(r.draftPayload, null, 2).slice(0, 12000)
                  : ''
                return (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-950">
                    <p className="font-bold">Fehler / Hinweis</p>
                    <p className="mt-1 whitespace-pre-wrap">{r?.lastError || '—'}</p>
                    {json ?
                      <>
                        <p className="mt-4 font-bold">Rohdaten (Import)</p>
                        <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-white/90 p-3 text-[11px] text-slate-800 ring-1 ring-amber-200/80">
                          {json}
                        </pre>
                      </>
                    : null}
                    <p className="mt-4 font-bold">Nächste Schritte</p>
                    <p className="mt-1">
                      URL-Ingest öffnen und Daten manuell ergänzen. Dieser Fall ist für alle Admins sichtbar:{' '}
                      <Link href="/admin/listings/ingest" className="font-semibold underline">
                        URL-Ingest
                      </Link>
                    </p>
                  </div>
                )
              })()
            : null}
          </div>
        )}
      </section>
    </div>
  )
}
