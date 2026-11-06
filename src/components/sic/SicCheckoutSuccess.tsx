'use client'

import { sicConfirmOutcome } from '@/lib/sic/checkout-confirm-outcome'
import { sicPaths } from '@/lib/sic/config'
import { FileCheck2, Loader2, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

type State =
  | { status: 'loading' | 'ok' }
  /** Wartet auf den Zahlungsanbieter oder überbrückt einen kurzen Aussetzer. */
  | { status: 'pending'; exhausted: boolean; hiccup: boolean }
  /** Seite ohne Zahlung aufgerufen. */
  | { status: 'missing' }
  | { status: 'error'; message?: string }

const POLL_MS = 2500
const POLL_MAX = 24 // ~60s

export function SicCheckoutSuccess({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const [state, setState] = useState<State>(sessionId ? { status: 'loading' } : { status: 'missing' })
  /** Jeder Klick auf «Erneut prüfen» startet eine neue Runde mit vollem Zeitbudget. */
  const [round, setRound] = useState(0)
  const done = useRef(false)

  const confirm = useCallback(async () => {
    try {
      const res = await fetch(`/api/sic/checkout/confirm?session_id=${encodeURIComponent(sessionId)}`, {
        credentials: 'same-origin',
      })
      return sicConfirmOutcome(res.status, await res.json().catch(() => null))
    } catch {
      return sicConfirmOutcome(null, null)
    }
  }, [sessionId])

  useEffect(() => {
    if (!sessionId || done.current) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let polls = 0

    async function run() {
      const next = await confirm()
      if (cancelled) return
      if (next.status === 'ok') {
        done.current = true
        setState({ status: 'ok' })
        router.replace(sicPaths.certificateWorkspace)
        return
      }
      if (next.status === 'error') {
        done.current = true
        setState(next)
        return
      }
      // «pending» und «retry»: weiter versuchen, solange das Zeitbudget reicht.
      const exhausted = polls >= POLL_MAX
      setState({ status: 'pending', exhausted, hiccup: next.status === 'retry' })
      if (!exhausted) {
        polls += 1
        timer = setTimeout(run, POLL_MS)
      }
    }
    void run()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [confirm, router, round, sessionId])

  function retryConfirm() {
    done.current = false
    setState({ status: 'loading' })
    setRound(r => r + 1)
  }

  const retryButton = (
    <button
      type="button"
      onClick={retryConfirm}
      className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-sic-action px-5 py-3 text-sm font-semibold text-white hover:bg-sic-action-deep sm:w-auto"
    >
      <RefreshCw className="h-4 w-4" /> Erneut prüfen
    </button>
  )

  const workspaceLink = (
    <Link
      href={sicPaths.certificateWorkspace}
      className="mt-4 touch-target-exempt text-sm font-semibold text-sic-navy hover:underline"
    >
      Mein Zertifikat öffnen
    </Link>
  )

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
          <p className="mt-4 max-w-sm text-xs leading-relaxed text-slate-500">
            Auf diesem Gerät bleibst du sieben Tage angemeldet. Per Mail kommt ein Link, der dein Zertifikat
            öffnet. Stimmt die Adresse nicht, kannst du sie unter «Mein Zertifikat» einmal ändern.
          </p>
        </>
      )}

      {state.status === 'pending' && !state.exhausted && (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-sic-navy" />
          <h1 className="mt-4 font-sic-serif text-xl font-bold tracking-tight text-sic-navy">Zahlung wird verarbeitet</h1>
          <p className="mt-3 text-slate-600">
            Das kann einen Moment dauern. Wir prüfen die Zahlung automatisch weiter …
          </p>
        </>
      )}

      {state.status === 'pending' && state.exhausted && (
        <>
          <h1 className="font-sic-serif text-xl font-bold tracking-tight text-sic-navy">
            Die Bestätigung dauert länger als üblich
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
            {state.hiccup ?
              'Wir erreichen unser System gerade nicht. Eine bezahlte Zahlung geht nicht verloren: sobald sie verbucht ist, bekommst du eine E-Mail mit dem Link zu deinem Zertifikat.'
            : 'Dein Zahlungsanbieter hat die Zahlung noch nicht bestätigt. Sobald sie verbucht ist, bekommst du eine E-Mail mit dem Link zu deinem Zertifikat.'
            }
          </p>
          {retryButton}
          {workspaceLink}
        </>
      )}

      {state.status === 'missing' && (
        <>
          <h1 className="font-sic-serif text-xl font-bold tracking-tight text-sic-navy">Keine Zahlung zu dieser Seite</h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
            Diese Seite erscheint direkt nach einer Zahlung. Hast du bezahlt, öffne den Link aus deiner E-Mail
            oder «Mein Zertifikat».
          </p>
          <Link
            href={sicPaths.certificateWorkspace}
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-sic-action px-5 py-3 text-sm font-semibold text-white hover:bg-sic-action-deep sm:w-auto"
          >
            Mein Zertifikat öffnen
          </Link>
          <Link
            href={sicPaths.landing}
            className="mt-4 touch-target-exempt text-sm font-semibold text-sic-navy hover:underline"
          >
            Zurück zur Startseite
          </Link>
        </>
      )}

      {state.status === 'error' && (
        <>
          <h1 className="font-sic-serif text-xl font-bold tracking-tight text-sic-navy">
            Die Zahlung liess sich nicht bestätigen
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
            {state.message || 'Bitte prüfe später «Mein Zertifikat» oder schreib uns.'}
          </p>
          {retryButton}
          {workspaceLink}
        </>
      )}
    </div>
  )
}
