'use client'

import { sicPaths } from '@/lib/sic/config'
import { CheckCircle2, Loader2, MailCheck } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

type State = { status: 'loading' | 'ok' | 'pending' | 'error'; email?: string; message?: string }

export function SicCheckoutSuccess({ sessionId }: { sessionId: string }) {
  const [state, setState] = useState<State>({ status: 'loading' })
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true
    if (!sessionId) {
      setState({ status: 'error', message: 'Es fehlt eine Sitzungs-ID.' })
      return
    }
    ;(async () => {
      try {
        const res = await fetch(`/api/sic/checkout/confirm?session_id=${encodeURIComponent(sessionId)}`)
        const data = await res.json().catch(() => ({}))
        if (data?.ok) setState({ status: 'ok', email: data.email })
        else if (data?.pending) setState({ status: 'pending' })
        else setState({ status: 'error', message: data?.message })
      } catch {
        setState({ status: 'error', message: 'Netzwerkfehler.' })
      }
    })()
  }, [sessionId])

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
          <p className="mt-3 text-slate-600">
            Dein Zertifikat ist angelegt. So geht&apos;s weiter:
          </p>

          <ol className="mt-6 w-full space-y-3 text-left text-sm text-slate-700">
            <li className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-[#0f2b5e] text-xs font-bold text-white">
                1
              </span>
              <span>
                <strong className="font-semibold text-[#0f2b5e]">Zahlung bestätigt</strong>
                <br />
                Deine Module sind freigeschaltet für Uploads.
              </span>
            </li>
            <li className="flex gap-3 rounded-xl border border-[#0f2b5e]/20 bg-[#0f2b5e]/[0.04] p-4">
              <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-[#0f2b5e] text-xs font-bold text-white">
                2
              </span>
              <span>
                <strong className="font-semibold text-[#0f2b5e]">Postfach öffnen</strong>
                <br />
                Wir haben einen Anmeldelink an{' '}
                {state.email ? <strong>{state.email}</strong> : 'deine E-Mail'} gesendet. Öffne den Link
                (auch Spam prüfen) — kein Passwort nötig.
              </span>
            </li>
            <li className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-[#0f2b5e] text-xs font-bold text-white">
                3
              </span>
              <span>
                <strong className="font-semibold text-[#0f2b5e]">Formulare &amp; Nachweise</strong>
                <br />
                Im Bereich «Mein Zertifikat» füllst du Formulare aus und lädst Belege hoch.
              </span>
            </li>
          </ol>

          <div className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f2b5e] px-5 py-3.5 text-sm font-semibold text-white">
            <MailCheck className="h-4 w-4" /> Als Nächstes: Postfach öffnen
          </div>

          <p className="mt-4 text-xs text-slate-400">
            Link schon geöffnet / bereits angemeldet?{' '}
            <Link href={sicPaths.certificateWorkspace} className="font-semibold text-[#0f2b5e] hover:underline">
              Zum Zertifikat
            </Link>
          </p>
        </>
      )}

      {state.status === 'pending' && (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-[#0f2b5e]" />
          <h1 className="mt-4 text-xl font-bold text-[#0f2b5e]">Zahlung wird verarbeitet</h1>
          <p className="mt-3 text-slate-600">
            Das kann einen Moment dauern. Du erhältst in Kürze einen Anmeldelink per E-Mail.
          </p>
        </>
      )}

      {state.status === 'error' && (
        <>
          <h1 className="text-xl font-bold text-slate-900">Etwas ist schiefgelaufen</h1>
          <p className="mt-3 text-slate-600">
            {state.message || 'Bitte prüfe später «Mein Zertifikat» oder kontaktiere uns.'}
          </p>
          <Link href={sicPaths.landing} className="mt-6 text-sm font-semibold text-[#0f2b5e] hover:underline">
            Zurück zur Startseite
          </Link>
        </>
      )}
    </div>
  )
}
