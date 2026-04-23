'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

type Phase = 'loading' | 'ready' | 'used' | 'error' | 'done'

export function ListingInviteSubmitClient({ token }: { token: string }) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('loading')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [url, setUrl] = useState('')
  const [banner, setBanner] = useState<string | null>(null)
  const [detail, setDetail] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setPhase('loading')
    setBanner(null)
    try {
      const res = await fetch(`/api/public/rental-listing-invite/${encodeURIComponent(token)}`)
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        message?: string
        maskedEmail?: string
        alreadyUsed?: boolean
        status?: string
      }
      if (res.status === 410) {
        setPhase('error')
        setBanner(data.message || 'Einladung abgelaufen.')
        return
      }
      if (!res.ok) {
        setPhase('error')
        setBanner(data.message || 'Link ungültig.')
        return
      }
      if (data.alreadyUsed) {
        setPhase('used')
        setBanner(
          data.status === 'LISTING_CREATED' ?
            'Zu dieser Einladung wurde bereits ein Inserat erstellt. Vielen Dank!'
          : 'Diese Einladung wurde bereits bearbeitet.'
        )
        return
      }
      setMaskedEmail(data.maskedEmail || '')
      setPhase('ready')
    } catch {
      setPhase('error')
      setBanner('Netzwerkfehler.')
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  const submit = async () => {
    setSubmitting(true)
    setBanner(null)
    setDetail(null)
    try {
      const res = await fetch(`/api/public/rental-listing-invite/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        message?: string
        status?: string
        detail?: string
      }
      if (res.status === 409) {
        setPhase('used')
        setBanner(data.message || 'Bereits verwendet.')
        return
      }
      if (!res.ok) {
        setBanner(data.message || 'Senden fehlgeschlagen.')
        return
      }
      setDetail(typeof data.detail === 'string' ? data.detail : null)
      setPhase('done')
      setBanner(data.message || 'Wir haben deine URL erhalten.')
    } catch {
      setBanner('Netzwerkfehler.')
    } finally {
      setSubmitting(false)
    }
  }

  const showFooterCta = phase === 'used' || phase === 'done' || phase === 'error'

  return (
    <main className="mx-auto max-w-lg px-4 py-12 sm:py-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-wide text-[#107a5a]">Helvenda Wohnungen</p>
        <h1 className="mt-2 text-2xl font-extrabold text-[#0d2b1f]">Inserat-Link einreichen</h1>

        {phase === 'loading' ?
          <p className="mt-6 text-slate-600">Laden…</p>
        : null}

        {phase === 'error' && banner ?
          <p className="mt-6 text-red-700">{banner}</p>
        : null}

        {(phase === 'used' || phase === 'done') && banner ?
          <div className="mt-6 space-y-3">
            <p className="text-slate-800">{banner}</p>
            {detail ?
              <p className="text-sm text-slate-500">{detail}</p>
            : null}
          </div>
        : null}

        {phase === 'ready' ?
          <>
            <p className="mt-4 text-sm text-slate-600">
              Eingeladen als <span className="font-semibold text-slate-900">{maskedEmail}</span>. Füge die{' '}
              <strong>öffentliche URL</strong> zum Mietinserat ein (z. B. Homegate, Tutti, ImmoScout24). Wir lesen die
              Daten automatisch aus.
            </p>
            <label className="mt-6 block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">Inserat-URL</span>
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://…"
                className="h-12 w-full rounded-lg border border-slate-200 px-3 text-sm shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
              />
            </label>
            {banner ?
              <p className="mt-3 text-sm text-red-600">{banner}</p>
            : null}
            <button
              type="button"
              disabled={submitting || !url.trim()}
              onClick={() => void submit()}
              className="mt-6 w-full rounded-xl bg-[#18a87c] py-3.5 text-sm font-bold text-white shadow-md hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Wird gesendet…' : 'URL senden & prüfen'}
            </button>
          </>
        : null}

        {showFooterCta ?
          <button
            type="button"
            onClick={() => router.push('/wohnungen')}
            className="mt-8 w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Zu den Wohnungen
          </button>
        : null}
      </div>
    </main>
  )
}
