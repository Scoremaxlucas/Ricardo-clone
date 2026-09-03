'use client'

import { sicPaths } from '@/lib/sic/config'
import {
  canResumeSicCheckout,
  sicCheckoutRetryRequestBody,
  type SicCheckoutRetry,
} from '@/lib/sic/checkout-retry'
import { getSicModule } from '@/lib/sic/modules'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export function SicCheckoutCancel({ retry }: { retry: SicCheckoutRetry | null }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canResume = retry ? canResumeSicCheckout(retry) : false
  const backHref = retry?.renewal ? sicPaths.certificateWorkspace : sicPaths.landing
  const moduleLabels =
    retry && !retry.renewal ? retry.moduleIds.map(id => getSicModule(id).title) : []

  async function resumeCheckout() {
    if (!retry || !canResume) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/sic/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(sicCheckoutRetryRequestBody(retry)),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.url) {
        setError(data?.message || 'Zahlung konnte nicht erneut gestartet werden.')
        return
      }
      window.location.href = data.url as string
    } catch {
      setError('Netzwerkfehler. Bitte erneut versuchen.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-5 py-20 text-center">
      <h1 className="font-sic-serif text-2xl font-bold tracking-tight text-sic-navy sm:text-3xl">Zahlung abgebrochen</h1>
      <p className="mt-3 text-slate-600">
        Es wurde nichts belastet.
        {canResume ?
          ' Deine Angaben sind gespeichert — du kannst direkt weiter zur Zahlung.'
        : ' Du kannst das Zertifikat jederzeit erneut anlegen.'}
      </p>
      {retry?.renewal ?
        <p className="mt-2 text-sm text-slate-500">Verlängerung — ein Klick, und du bist wieder bei Stripe.</p>
      : null}
      {moduleLabels.length > 0 ?
        <p className="mt-2 text-sm text-slate-500">{moduleLabels.join(', ')}</p>
      : null}

      {error ?
        <p className="mt-4 text-sm text-red-700">{error}</p>
      : null}

      {canResume ?
        <button
          type="button"
          onClick={() => void resumeCheckout()}
          disabled={busy}
          className="mt-6 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-sic-action px-5 py-3.5 text-sm font-semibold text-white hover:bg-sic-action-deep disabled:opacity-60"
        >
          {busy ?
            <Loader2 className="h-4 w-4 animate-spin" />
          : null}
          {busy ? 'Wird vorbereitet …' : 'Weiter zur Zahlung'}
        </button>
      : (
        <Link
          href={`${sicPaths.landing}#anlegen`}
          className="mt-6 flex min-h-11 w-full items-center justify-center rounded-xl bg-sic-action px-5 py-3.5 text-sm font-semibold text-white hover:bg-sic-action-deep"
        >
          Weiter zur Zahlung
        </Link>
      )}

      <Link href={backHref} className="mt-4 touch-target-exempt text-sm font-semibold text-sic-navy hover:underline">
        Zurück
      </Link>
    </div>
  )
}
