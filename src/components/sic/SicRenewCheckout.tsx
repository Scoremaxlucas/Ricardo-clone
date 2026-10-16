'use client'

import { sicPaths } from '@/lib/sic/config'
import { formatSicChf, SIC_RENEWAL_FEE_CHF, SIC_VALIDITY_MONTHS } from '@/lib/sic/modules'
import { ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

/**
 * Verlängerung: Preis und AGB-Hinweis sichtbar, Weiterleitung zu Stripe erst auf Klick.
 * Vorher lief der Redirect beim Laden der Seite, ohne dass der Betrag je angezeigt wurde.
 */
export function SicRenewCheckout() {
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function start() {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/sic/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          renewal: true,
          moduleIds: [],
          attemptId: crypto.randomUUID().replace(/-/g, ''),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.url) {
        setError(data?.message || 'Verlängerung konnte nicht gestartet werden.')
        setSubmitting(false)
        return
      }
      window.location.href = data.url as string
    } catch {
      setError('Netzwerkfehler. Bitte erneut versuchen.')
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-5 py-20 text-center">
      <h1 className="font-sic-serif text-2xl font-bold tracking-tight text-sic-navy sm:text-3xl">Verlängerung</h1>
      <p className="mt-3 text-slate-600">
        {formatSicChf(SIC_RENEWAL_FEE_CHF)} einmalig. Nach der Zahlung lädst du einen aktuellen Betreibungsauszug
        hoch; die neue Gültigkeit von {SIC_VALIDITY_MONTHS} Monaten läuft ab dessen Datum.
      </p>
      {error ?
        <p className="mt-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      : null}
      <button
        type="button"
        onClick={() => void start()}
        disabled={submitting}
        className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sic-action px-5 py-3 text-sm font-semibold text-white hover:bg-sic-action-deep disabled:opacity-60"
      >
        {submitting ?
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Weiter zur Zahlung …
          </>
        : <>
            Für {formatSicChf(SIC_RENEWAL_FEE_CHF)} verlängern <ArrowRight className="h-4 w-4" />
          </>
        }
      </button>
      <p className="mt-3 text-xs text-slate-500">
        Mit der Zahlung akzeptierst du die{' '}
        <Link href={sicPaths.agb} className="underline underline-offset-2 hover:text-sic-navy">
          AGB
        </Link>
        .
      </p>
      <Link
        href={sicPaths.certificateWorkspace}
        className="mt-6 text-sm font-medium text-slate-500 underline-offset-2 hover:underline"
      >
        Zurück zu Mein Zertifikat
      </Link>
    </div>
  )
}
