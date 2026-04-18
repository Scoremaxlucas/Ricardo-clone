'use client'

import Link from 'next/link'
import { Home } from 'lucide-react'

/** Einfache 404 — funktioniert auf Marktplatz und wohnen.helvenda.ch ohne zusätzlichen Chrome. */
export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-slate-50 px-4 py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-[#18a87c]">404</p>
      <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">Seite nicht gefunden</h1>
      <p className="mt-3 max-w-md text-sm text-slate-600">
        Diese Seite existiert nicht oder wurde verschoben.
      </p>
      <Link
        href="/"
        className="mt-10 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#18a87c] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
      >
        <Home className="h-4 w-4" aria-hidden />
        Zur Startseite
      </Link>
    </div>
  )
}
