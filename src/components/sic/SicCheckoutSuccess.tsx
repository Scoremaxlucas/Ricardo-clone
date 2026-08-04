'use client'

import { sicPaths } from '@/lib/sic/config'
import { CheckCircle2, FileCheck2, Loader2, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

type State = {
  status: 'loading' | 'ok' | 'pending' | 'error'
  email?: string
  message?: string
}

const POLL_MS = 2500
const POLL_MAX = 24 // ~60s

export function SicCheckoutSuccess({ sessionId }: { sessionId: string }) {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [resendBusy, setResendBusy] = useState(false)
  const polls = useRef(0)
  const done = useRef(false)

  const confirm = useCallback(async (): Promise<State> => {
    if (!sessionId) return { status: 'error', message: 'Es fehlt eine Sitzungs-ID.' }
    try {
      const res = await fetch(`/api/sic/checkout/confirm?session_id=${encodeURIComponent(sessionId)}`, {
        credentials: 'same-origin',
      })
      const data = await res.json().catch(() => ({}))
      if (data?.ok) return { status: 'ok', email: data.email }
      if (data?.pending) return { status: 'pending' }
      return { status: 'error', message: data?.message }
    } catch {
      return { status: 'error', message: 'Netzwerkfehler.' }
    }
  }, [sessionId])

  useEffect(() => {
    if (done.current) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    async function run() {
      const next = await confirm()
      if (cancelled) return
      setState(next)
      if (next.status === 'ok' || next.status === 'error') {
        done.current = true
        return
      }
      if (next.status === 'pending' && polls.current < POLL_MAX) {
        polls.current += 1
        timer = setTimeout(run, POLL_MS)
      }
    }
    run()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [confirm])

  async function retryConfirm() {
    setState({ status: 'loading' })
    const next = await confirm()
    setState(next)
  }

  async function resendLink() {
    if (!state.email) return
    setResendBusy(true)
    try {
      const res = await fetch('/api/sic/magic-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: state.email }),
      })
      if (res.ok) toast.success('Anmeldelink erneut gesendet — prüfe dein Postfach.')
      else toast.error('Senden fehlgeschlagen. Bitte später erneut.')
    } catch {
      toast.error('Netzwerkfehler.')
    } finally {
      setResendBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-5 py-20 text-center">
      {state.status === 'loading' && (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-[#0f2b5e]" />
          <p className="mt-4 text-slate-600">Zahlung wird bestätigt …</p>
        </>
      )}

      {state.status === 'ok' && (
        <>
          <CheckCircle2 className="h-12 w-12 text-[#2f9e44]" />
          <h1 className="mt-4 text-2xl font-bold text-[#0f2b5e]">Zahlung erfolgreich</h1>
          <p className="mt-3 text-slate-600">Dein Zertifikat ist angelegt. So geht’s weiter:</p>

          <ol className="mt-6 w-full space-y-3 text-left text-sm text-slate-700">
            <li className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-[#0f2b5e] text-xs font-bold text-white">
                1
              </span>
              <span>
                <strong className="font-semibold text-[#0f2b5e]">Zahlung bestätigt</strong>
                <br />
                Deine Module sind freigeschaltet. Du kannst jetzt Nachweise hochladen.
              </span>
            </li>
            <li className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 ring-2 ring-[#0f2b5e]/15">
              <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-[#0f2b5e] text-xs font-bold text-white">
                2
              </span>
              <span>
                <strong className="font-semibold text-[#0f2b5e]">Formulare &amp; Nachweise</strong>
                <br />
                Unter «Mein Zertifikat» lädst du Belege hoch und holst PDF-Formulare für Arbeitgeber
                bzw. Vermieter.
              </span>
            </li>
            <li className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-slate-400 text-xs font-bold text-white">
                3
              </span>
              <span>
                <strong className="font-semibold text-slate-600">Anmeldelink gesendet</strong>
                <br />
                Wir haben einen Link an{' '}
                {state.email ? <strong>{state.email}</strong> : 'deine E-Mail'} geschickt, damit du
                später jederzeit zu «Mein Zertifikat» zurückkehren kannst.
              </span>
            </li>
          </ol>

          <Link
            href={sicPaths.certificateWorkspace}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f2b5e] px-5 py-3.5 text-sm font-semibold text-white hover:bg-[#0a1f45]"
          >
            <FileCheck2 className="h-4 w-4" /> Zertifikat ausfüllen
          </Link>

          {state.email ?
            <button
              type="button"
              onClick={resendLink}
              disabled={resendBusy}
              className="mt-4 text-sm font-semibold text-[#0f2b5e] hover:underline disabled:opacity-60"
            >
              {resendBusy ? 'Wird gesendet …' : 'Anmeldelink erneut senden'}
            </button>
          : null}
        </>
      )}

      {state.status === 'pending' && (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-[#0f2b5e]" />
          <h1 className="mt-4 text-xl font-bold text-[#0f2b5e]">Zahlung wird verarbeitet</h1>
          <p className="mt-3 text-slate-600">Das kann einen Moment dauern. Wir prüfen die Zahlung automatisch weiter …</p>
          {polls.current >= POLL_MAX ?
            <button
              type="button"
              onClick={retryConfirm}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0f2b5e] px-5 py-3 text-sm font-semibold text-white"
            >
              <RefreshCw className="h-4 w-4" /> Erneut prüfen
            </button>
          : null}
        </>
      )}

      {state.status === 'error' && (
        <>
          <h1 className="text-xl font-bold text-slate-900">Etwas ist schiefgelaufen</h1>
          <p className="mt-3 text-slate-600">
            {state.message || 'Bitte prüfe später «Mein Zertifikat» oder kontaktiere uns.'}
          </p>
          <button
            type="button"
            onClick={retryConfirm}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0f2b5e] px-5 py-3 text-sm font-semibold text-white"
          >
            <RefreshCw className="h-4 w-4" /> Erneut prüfen
          </button>
          <Link href={sicPaths.landing} className="mt-4 text-sm font-semibold text-[#0f2b5e] hover:underline">
            Zurück zur Startseite
          </Link>
        </>
      )}
    </div>
  )
}
