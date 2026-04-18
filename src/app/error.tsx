'use client'

import Link from 'next/link'
import { Home, RefreshCw } from 'lucide-react'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-slate-50 px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Etwas ist schiefgelaufen</h1>
      <p className="mt-3 max-w-md text-sm text-slate-600">
        Bitte lade die Seite neu oder kehre zur Startseite zurück.
      </p>
      {error.digest ? (
        <p className="mt-4 text-xs text-slate-400">Referenz: {error.digest}</p>
      ) : null}
      <div className="mt-10 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[#0f766e] bg-white px-6 py-3 text-sm font-semibold text-teal-900 shadow-sm transition hover:bg-teal-50"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          Seite neu laden
        </button>
        <Link
          href="/"
          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#18a87c] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
        >
          <Home className="h-4 w-4" aria-hidden />
          Zur Startseite
        </Link>
      </div>
    </div>
  )
}
