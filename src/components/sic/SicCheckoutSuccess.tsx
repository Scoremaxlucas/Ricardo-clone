'use client'

import { sicPaths } from '@/lib/sic/config'
import { FileCheck2, Loader2, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

type State = {
  status: 'loading' | 'ok' | 'pending' | 'error'
  message?: string
}

const POLL_MS = 2500
const POLL_MAX = 24 // ~60s

export function SicCheckoutSuccess({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const [state, setState] = useState<State>({ status: 'loading' })
  const polls = useRef(0)
  const done = useRef(false)

  const confirm = useCallback(async (): Promise<State> => {
    if (!sessionId) return { status: 'error', message: 'Es fehlt eine Sitzungs-ID.' }
    try {
      const res = await fetch(
        `/api/sic/checkout/confirm?session_id=${encodeURIComponent(sessionId)}`,
        {
          credentials: 'same-origin',
        }
      )
      const data = await res.json().catch(() => ({}))
      if (data?.ok) return { status: 'ok' }
      if (data?.pending) return { status: 'pending' }
      return { status: 'error', message: data?.message }
    } catch {
      return { status: 'error', message: 'Netzwerkfehler.' }
    }
  }, [sessionId])

  const goToWorkspace = useCallback(() => {
    router.replace(sicPaths.certificateWorkspace)
  }, [router])

  useEffect(() => {
    if (done.current) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    async function run() {
      const next = await confirm()
      if (cancelled) return
      setState(next)
      if (next.status === 'ok') {
        done.current = true
        goToWorkspace()
        return
      }
      if (next.status === 'error') {
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
  }, [confirm, goToWorkspace])

  async function retryConfirm() {
    done.current = false
    setState({ status: 'loading' })
    const next = await confirm()
    setState(next)
    if (next.status === 'ok') {
      done.current = true
      goToWorkspace()
      return
    }
    if (next.status === 'error') done.current = true
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-5 py-20 text-center">
      {state.status === 'loading' && (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-sic-navy" />
          <p className="mt-4 text-slate-600">Zahlung wird bestätigt …</p>
        </>
      )}

      {state.status === 'ok' && (
        <>
          <h1 className="font-sic-serif text-2xl font-bold tracking-tight text-sic-navy">Zahlung bestätigt</h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
            Als Nächstes: Unterlagen hochladen, damit das PDF für die Bewerbung entstehen kann.
          </p>
          <Link
            href={sicPaths.certificateWorkspace}
            className="mt-6 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-sic-action px-5 py-3.5 text-sm font-semibold text-white hover:bg-sic-action-deep"
          >
            <FileCheck2 className="h-4 w-4" /> Unterlagen hochladen
          </Link>
          <p className="mt-4 max-w-sm text-xs leading-relaxed text-slate-400">
            Auf diesem Gerät bleibst du sieben Tage angemeldet. Per Mail kommt ein Link, der dein Zertifikat
            öffnet. Stimmt die Adresse nicht, kannst du sie unter «Mein Zertifikat» einmal ändern.
          </p>
        </>
      )}

      {state.status === 'pending' && (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-sic-navy" />
          <h1 className="mt-4 font-sic-serif text-xl font-bold tracking-tight text-sic-navy">Zahlung wird verarbeitet</h1>
          <p className="mt-3 text-slate-600">
            Das kann einen Moment dauern. Wir prüfen die Zahlung automatisch weiter …
          </p>
          {polls.current >= POLL_MAX ?
            <button
              type="button"
              onClick={() => void retryConfirm()}
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-sic-action px-5 py-3 text-sm font-semibold text-white hover:bg-sic-action-deep sm:w-auto"
            >
              <RefreshCw className="h-4 w-4" /> Erneut prüfen
            </button>
          : null}
        </>
      )}

      {state.status === 'error' && (
        <>
          <h1 className="font-sic-serif text-xl font-bold tracking-tight text-sic-navy">Etwas ist schiefgelaufen</h1>
          <p className="mt-3 text-slate-600">
            {state.message || 'Bitte prüfe später «Mein Zertifikat» oder kontaktiere uns.'}
          </p>
          <button
            type="button"
            onClick={() => void retryConfirm()}
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-sic-action px-5 py-3 text-sm font-semibold text-white hover:bg-sic-action-deep sm:w-auto"
          >
            <RefreshCw className="h-4 w-4" /> Erneut prüfen
          </button>
          <Link
            href={sicPaths.landing}
            className="mt-4 touch-target-exempt text-sm font-semibold text-sic-navy hover:underline"
          >
            Zurück zur Startseite
          </Link>
        </>
      )}
    </div>
  )
}
