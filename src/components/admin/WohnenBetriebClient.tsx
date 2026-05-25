'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'

type OutboxRow = {
  id: string
  createdAt: string
  kind: string
  status: string
  attempts: number
  lastError: string | null
  sentAt: string | null
  nextAttemptAt: string | null
}

type UrlConcernRow = {
  id: string
  title: string
  city: string
  lastCheckStatus: string | null
  urlUnreachableStreak: number
  importedFrom: string | null
  lastCheckedAt: string | null
}

type Props = {
  outboxRows: OutboxRow[]
  urlConcernListings: UrlConcernRow[]
}

export function WohnenBetriebClient({ outboxRows, urlConcernListings }: Props) {
  const router = useRouter()
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const runOutboxAction = async (id: string, action: 'retry_now' | 'cancel') => {
    setBusyKey(`outbox:${id}:${action}`)
    try {
      const res = await fetch(`/api/admin/wohnen-email-outbox/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data as { message?: string }).message || 'Aktion fehlgeschlagen')
        return
      }
      toast.success((data as { message?: string }).message || 'Aktion ausgeführt')
      router.refresh()
    } finally {
      setBusyKey(null)
    }
  }

  const runUrlAction = async (id: string, action: 'recheck_now' | 'dismiss_concern') => {
    setBusyKey(`url:${id}:${action}`)
    try {
      const res = await fetch(`/api/admin/rental-listings/${id}/check-url`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data as { message?: string }).message || 'Aktion fehlgeschlagen')
        return
      }
      toast.success((data as { message?: string }).message || 'URL-Prüfung aktualisiert')
      router.refresh()
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <>
      <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
        <h2 className="text-lg font-bold text-slate-900">E-Mail-Outbox (neueste)</h2>
        <p className="mt-1 text-sm text-slate-600">
          Mieter-Bestätigung nach Bewerbung wird bei Fehler hier eingetragen und per Cron erneut versendet.
        </p>
        {outboxRows.length === 0 ?
          <p className="mt-4 text-sm text-slate-500">Keine Einträge.</p>
        : <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                  <th className="py-2 pr-3">Zeit</th>
                  <th className="py-2 pr-3">Art</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Versuche</th>
                  <th className="py-2 pr-3">Nächster Versuch</th>
                  <th className="py-2 pr-3">Fehler</th>
                  <th className="py-2">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {outboxRows.map(r => (
                  <tr key={r.id} className="border-b border-slate-100">
                    <td className="py-2 pr-3 whitespace-nowrap text-slate-700">
                      {new Date(r.createdAt).toLocaleString('de-CH', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs text-slate-800">{r.kind}</td>
                    <td className="py-2 pr-3 font-semibold text-slate-900">{r.status}</td>
                    <td className="py-2 pr-3">{r.attempts}</td>
                    <td className="py-2 pr-3 whitespace-nowrap text-slate-600">
                      {r.status === 'sent' || r.status === 'cancelled' || !r.nextAttemptAt ?
                        '—'
                      : new Date(r.nextAttemptAt).toLocaleString('de-CH', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="max-w-xs truncate py-2 pr-3 text-xs text-red-800" title={r.lastError ?? ''}>
                      {r.lastError ?? '—'}
                    </td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={
                            busyKey === `outbox:${r.id}:retry_now` || r.status === 'sent' || r.status === 'cancelled'
                          }
                          onClick={() => void runOutboxAction(r.id, 'retry_now')}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Retry jetzt
                        </button>
                        <button
                          type="button"
                          disabled={busyKey === `outbox:${r.id}:cancel` || r.status === 'sent' || r.status === 'cancelled'}
                          onClick={() => void runOutboxAction(r.id, 'cancel')}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Abbrechen
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
        <h2 className="text-lg font-bold text-slate-900">Aktive Inserate mit URL-Auffälligkeit</h2>
        <p className="mt-1 text-sm text-slate-600">Cron «check-listing-urls» setzt Status; hier zur schnellen Übersicht.</p>
        {urlConcernListings.length === 0 ?
          <p className="mt-4 text-sm text-slate-500">Keine Treffer.</p>
        : <ul className="mt-4 divide-y divide-slate-100">
            {urlConcernListings.map(l => (
              <li key={l.id} className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <Link
                    href={`/admin/listings/${l.id}/bearbeiten`}
                    className="font-semibold text-teal-800 hover:underline"
                  >
                    {l.title}
                  </Link>
                  <p className="text-xs text-slate-600">
                    {l.city} · Status {l.lastCheckStatus} · Streak {l.urlUnreachableStreak}
                  </p>
                  {l.importedFrom ?
                    <p className="mt-0.5 truncate text-[11px] text-slate-500" title={l.importedFrom}>
                      {l.importedFrom}
                    </p>
                  : null}
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                  <p className="text-xs text-slate-500">
                    {l.lastCheckedAt ?
                      `Geprüft: ${new Date(l.lastCheckedAt).toLocaleString('de-CH', { dateStyle: 'short', timeStyle: 'short' })}`
                    : '—'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyKey === `url:${l.id}:recheck_now`}
                      onClick={() => void runUrlAction(l.id, 'recheck_now')}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Jetzt prüfen
                    </button>
                    <button
                      type="button"
                      disabled={busyKey === `url:${l.id}:dismiss_concern`}
                      onClick={() => void runUrlAction(l.id, 'dismiss_concern')}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Hinweis ausblenden
                    </button>
                    <Link
                      href={`/admin/listings/${l.id}/bearbeiten`}
                      className="rounded-lg bg-[#18a87c] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-95"
                    >
                      Inserat öffnen
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        }
      </section>
    </>
  )
}
