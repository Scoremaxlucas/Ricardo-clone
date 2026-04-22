'use client'

import { SWISS_CANTONS } from '@/lib/swiss-cantons'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'

const ZIMMER = ['1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5plus'] as const
const MAX_MIETE = ['1000', '1500', '2000', '2500', '3000', '4000', '5000plus'] as const

function labelZimmer(v: string) {
  return v === '5plus' ? '5+' : v
}

function labelMaxMiete(v: string) {
  return v === '5000plus' ? '5000+' : v
}

export function WohnungenSearchFilters() {
  const router = useRouter()
  const sp = useSearchParams()
  const [mobileOpen, setMobileOpen] = useState(false)

  const kanton = sp.get('kanton') ?? ''
  const zimmer = sp.get('zimmer') ?? ''
  const maxmiete = sp.get('maxmiete') ?? ''
  const verfuegbar = sp.get('verfuegbar') ?? ''
  const mode = sp.get('mode') === 'match' ? 'match' : 'all'

  const pushParams = useCallback(
    (next: Record<string, string>) => {
      const p = new URLSearchParams()
      Object.entries(next).forEach(([k, v]) => {
        if (v) p.set(k, v)
      })
      const q = p.toString()
      router.push(q ? `/wohnungen?${q}` : '/wohnungen')
    },
    [router]
  )

  const current = useMemo(
    () => ({ mode, kanton, zimmer, maxmiete, verfuegbar }),
    [mode, kanton, zimmer, maxmiete, verfuegbar]
  )

  const update = (patch: Partial<typeof current>) => {
    pushParams({ ...current, ...patch })
  }

  const reset = () => {
    router.push('/wohnungen')
    setMobileOpen(false)
  }

  const filterFields = (
    <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end md:gap-3">
      <label className="flex min-w-[140px] flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
        Kanton
        <select
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          value={kanton}
          onChange={e => update({ kanton: e.target.value })}
        >
          <option value="">Alle</option>
          {SWISS_CANTONS.map(c => (
            <option key={c.code} value={c.code}>
              {c.code} — {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-w-[120px] flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
        Zimmer (min.)
        <select
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          value={zimmer}
          onChange={e => update({ zimmer: e.target.value })}
        >
          <option value="">Alle</option>
          {ZIMMER.map(z => (
            <option key={z} value={z}>
              {labelZimmer(z)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-w-[140px] flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
        Max. Miete CHF
        <select
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          value={maxmiete}
          onChange={e => update({ maxmiete: e.target.value })}
        >
          <option value="">Kein Limit</option>
          {MAX_MIETE.map(m => (
            <option key={m} value={m}>
              {labelMaxMiete(m)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-w-[160px] flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
        Verfügbar ab
        <input
          type="date"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          value={verfuegbar}
          onChange={e => update({ verfuegbar: e.target.value })}
        />
      </label>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 md:shrink-0"
      >
        Filter zurücksetzen
      </button>
    </div>
  )

  return (
    <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="mb-3 hidden gap-2 md:flex">
          <button
            type="button"
            onClick={() => update({ mode: 'all' })}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
              mode === 'all' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Alle Wohnungen
          </button>
          <button
            type="button"
            onClick={() => update({ mode: 'match' })}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
              mode === 'match' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Für dich
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 md:hidden">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => update({ mode: 'all' })}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                mode === 'all' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Alle
            </button>
            <button
              type="button"
              onClick={() => update({ mode: 'match' })}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                mode === 'match' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Für dich
            </button>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-teal-800"
            onClick={() => setMobileOpen(o => !o)}
          >
            {mobileOpen ? (
              <>
                Schliessen <ChevronUp className="h-4 w-4" aria-hidden />
              </>
            ) : (
              <>
                Anzeigen <ChevronDown className="h-4 w-4" aria-hidden />
              </>
            )}
          </button>
        </div>
        <div className={mobileOpen ? 'mt-3 block' : 'mt-0 hidden md:block'}>{filterFields}</div>
      </div>
    </div>
  )
}
