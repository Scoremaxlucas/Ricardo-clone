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
          <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
          <p className="mt-4 text-slate-600">Zahlung wird bestätigt …</p>
        </>
      )}

      {state.status === 'ok' && (
        <>
          <CheckCircle2 className="h-12 w-12 text-teal-600" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Zahlung erfolgreich</h1>
          <p className="mt-3 text-slate-600">
            Wir haben Ihnen einen Anmeldelink an {state.email ? <strong>{state.email}</strong> : 'Ihre E-Mail'} gesendet.
            Öffnen Sie den Link, um Ihre Nachweise hochzuladen.
          </p>
          <div className="mt-6 flex items-center gap-2 rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-800">
            <MailCheck className="h-4 w-4" /> Prüfen Sie Ihr Postfach (auch den Spam-Ordner).
          </div>
          <Link href={sicPaths.dossier} className="mt-6 text-sm font-medium text-teal-700 hover:underline">
            Zum Dossier
          </Link>
        </>
      )}

      {state.status === 'pending' && (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
          <h1 className="mt-4 text-xl font-bold text-slate-900">Zahlung wird verarbeitet</h1>
          <p className="mt-3 text-slate-600">
            Das kann einen Moment dauern. Sie erhalten in Kürze einen Anmeldelink per E-Mail.
          </p>
        </>
      )}

      {state.status === 'error' && (
        <>
          <h1 className="text-xl font-bold text-slate-900">Etwas ist schiefgelaufen</h1>
          <p className="mt-3 text-slate-600">
            {state.message || 'Bitte prüfen Sie später Ihr Dossier oder kontaktieren Sie uns.'}
          </p>
          <Link href={sicPaths.landing} className="mt-6 text-sm font-medium text-teal-700 hover:underline">
            Zurück zur Startseite
          </Link>
        </>
      )}
    </div>
  )
}
