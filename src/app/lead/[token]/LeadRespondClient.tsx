'use client'

import { Logo } from '@/components/ui/Logo'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

type LeadPayload = {
  ok: true
  listing: { title: string; addressLine: string; rentLabel: string }
  applicant: {
    fullName: string
    phone: string | null
    email: string | null
    employmentLine: string | null
    incomeLabel: string | null
    summary: string | null
    message: string | null
  }
  state: {
    alreadyResponded: boolean
    rejected: boolean
    viewingRequested: boolean
    viewingDate: string | null
  }
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'done'; data: LeadPayload }

function timeOptions(): string[] {
  const out: string[] = []
  for (let h = 8; h <= 20; h++) {
    for (const m of [0, 30]) {
      if (h === 20 && m === 30) break
      out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return out
}

export function LeadRespondClient({ token }: { token: string }) {
  const [load, setLoad] = useState<LoadState>({ kind: 'loading' })
  const [mode, setMode] = useState<'choose' | 'viewing' | 'done'>('choose')
  const [busy, setBusy] = useState(false)
  const [viewDate, setViewDate] = useState('')
  const [viewTime, setViewTime] = useState('10:00')
  const [viewNote, setViewNote] = useState('')
  const [doneMessage, setDoneMessage] = useState('')
  const fetched = useRef(false)

  const reload = useCallback(async () => {
    const res = await fetch(`/api/lead/${encodeURIComponent(token)}`)
    const json = (await res.json().catch(() => ({}))) as LeadPayload & {
      reason?: string
      message?: string
    }
    if (res.status === 410) {
      setLoad({ kind: 'error', message: 'Dieser Link ist abgelaufen. Bitte den Bewerber oder Helvenda kontaktieren.' })
      return
    }
    if (!res.ok || !json.ok) {
      setLoad({ kind: 'error', message: 'Link ungültig oder nicht mehr verfügbar.' })
      return
    }
    setLoad({ kind: 'done', data: json })
    if (json.state.alreadyResponded) setMode('done')
  }, [token])

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    void reload()
  }, [reload])

  async function respond(action: string, extra?: Record<string, string>) {
    setBusy(true)
    try {
      const res = await fetch(`/api/lead/${encodeURIComponent(token)}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      })
      const json = (await res.json().catch(() => ({}))) as { message?: string }
      if (!res.ok) throw new Error(json.message || 'Speichern fehlgeschlagen')
      if (action === 'reject') {
        setDoneMessage('Die Absage wurde erfasst. Der Bewerber wird per E-Mail informiert.')
      } else if (action === 'request_viewing') {
        setDoneMessage('Der Besichtigungstermin wurde erfasst. Der Bewerber erhält eine Einladung per E-Mail.')
      } else {
        setDoneMessage('Danke — der Bewerber wird informiert, dass Sie sich direkt melden.')
      }
      setMode('done')
      await reload()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setBusy(false)
    }
  }

  function submitViewing() {
    if (!viewDate) {
      alert('Bitte Datum wählen')
      return
    }
    const iso = new Date(`${viewDate}T${viewTime}:00`).toISOString()
    void respond('request_viewing', { viewingDate: iso, viewingNote: viewNote })
  }

  return (
    <div className="min-h-screen bg-[#f5fdfb] text-[#0d2b1f]">
      <header className="border-b border-[#e8f7f2] bg-white/90 px-6 py-4">
        <Link href="/" className="inline-flex items-center gap-3">
          <Logo className="h-10 w-10" />
          <span className="text-sm font-bold tracking-tight">Helvenda Wohnungen</span>
        </Link>
      </header>

      <main className="mx-auto max-w-lg px-4 py-10">
        <p className="text-center text-xs font-semibold uppercase tracking-wide text-[#8aa89e]">
          Bewerbung beantworten
        </p>

        {load.kind === 'loading' ?
          <p className="mt-8 text-center text-sm text-slate-600">Laden…</p>
        : load.kind === 'error' ?
          <p className="mt-8 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {load.message}
          </p>
        : <>
            <h1 className="mt-4 text-center text-xl font-bold">{load.data.listing.title}</h1>
            <p className="mt-1 text-center text-sm text-slate-600">
              {load.data.listing.addressLine} · {load.data.listing.rentLabel}/Monat
            </p>

            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">Bewerber</p>
              <p className="mt-1 text-lg font-bold">{load.data.applicant.fullName}</p>
              {load.data.applicant.phone ?
                <p className="mt-2 text-sm">
                  Telefon:{' '}
                  <a className="font-semibold text-teal-800" href={`tel:${load.data.applicant.phone}`}>
                    {load.data.applicant.phone}
                  </a>
                </p>
              : null}
              {load.data.applicant.email ?
                <p className="mt-1 text-sm">
                  E-Mail:{' '}
                  <a className="font-semibold text-teal-800" href={`mailto:${load.data.applicant.email}`}>
                    {load.data.applicant.email}
                  </a>
                </p>
              : null}
              {load.data.applicant.summary ?
                <p className="mt-3 rounded-lg bg-teal-50/80 px-3 py-2 text-sm text-slate-700">
                  {load.data.applicant.summary}
                </p>
              : null}
            </div>

            {mode === 'done' || load.data.state.alreadyResponded ?
              <div className="mt-6 rounded-xl border border-teal-200 bg-teal-50 px-4 py-4 text-sm text-teal-950">
                <p className="font-semibold">Antwort erfasst</p>
                <p className="mt-2">{doneMessage || 'Für diese Bewerbung liegt bereits eine Rückmeldung vor.'}</p>
              </div>
            : mode === 'viewing' ?
              <div className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5">
                <p className="font-semibold">Besichtigung vorschlagen</p>
                <label className="block text-sm">
                  Datum
                  <input
                    type="date"
                    value={viewDate}
                    onChange={e => setViewDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  Uhrzeit
                  <select
                    value={viewTime}
                    onChange={e => setViewTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    {timeOptions().map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  Notiz (optional)
                  <textarea
                    value={viewNote}
                    onChange={e => setViewNote(e.target.value)}
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void submitViewing()}
                    className="rounded-lg bg-[#18a87c] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                  >
                    Termin senden
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('choose')}
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"
                  >
                    Zurück
                  </button>
                </div>
              </div>
            : <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setMode('viewing')}
                  className="w-full rounded-xl bg-[#18a87c] px-4 py-3.5 text-sm font-bold text-white disabled:opacity-60"
                >
                  Besichtigung vorschlagen
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm('Bewerbung wirklich absagen? Der Bewerber wird informiert.')) {
                      void respond('reject')
                    }
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-semibold text-slate-800 disabled:opacity-60"
                >
                  Bewerbung absagen
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void respond('contact_directly')}
                  className="w-full rounded-xl border border-teal-200 bg-teal-50 px-4 py-3.5 text-sm font-semibold text-teal-900 disabled:opacity-60"
                >
                  Ich melde mich direkt beim Bewerber
                </button>
              </div>
            }

            <p className="mt-8 text-center text-xs text-slate-500">
              Kein Helvenda-Konto nötig. Dieser Link ist nur für Sie bestimmt.
            </p>
          </>
        }
      </main>
    </div>
  )
}
