'use client'

import { SWISS_CANTONS } from '@/lib/swiss-cantons'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'

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

  const kanton = sp.get('kanton') ?? ''
  const zimmer = sp.get('zimmer') ?? ''
  const maxmiete = sp.get('maxmiete') ?? ''
  const verfuegbar = sp.get('verfuegbar') ?? ''

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
    () => ({ kanton, zimmer, maxmiete, verfuegbar }),
    [kanton, zimmer, maxmiete, verfuegbar]
  )

  const update = (patch: Partial<typeof current>) => {
    pushParams({ ...current, ...patch })
  }

  const reset = () => {
    router.push('/wohnungen')
  }

  return (
    <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 md:px-4">
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end md:gap-3">
          <label className="flex w-full min-w-0 flex-col gap-1 text-xs font-medium text-slate-600 md:min-w-[140px] md:flex-1">
            Kanton
            <select
              className="min-h-[48px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 md:min-h-0 md:text-sm"
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
          <label className="flex w-full min-w-0 flex-col gap-1 text-xs font-medium text-slate-600 md:min-w-[120px] md:flex-1">
            Zimmer (min.)
            <select
              className="min-h-[48px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 md:min-h-0 md:text-sm"
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
          <label className="flex w-full min-w-0 flex-col gap-1 text-xs font-medium text-slate-600 md:min-w-[140px] md:flex-1">
            Max. Miete CHF
            <select
              className="min-h-[48px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 md:min-h-0 md:text-sm"
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
          <label className="flex w-full min-w-0 flex-col gap-1 text-xs font-medium text-slate-600 md:min-w-[160px] md:flex-1">
            Verfügbar ab
            <input
              type="date"
              className="min-h-[48px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 md:min-h-0 md:text-sm"
              value={verfuegbar}
              onChange={e => update({ verfuegbar: e.target.value })}
            />
          </label>
          <button
            type="button"
            onClick={reset}
            className="min-h-[48px] w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 md:min-h-0 md:w-auto md:shrink-0"
          >
            Filter zurücksetzen
          </button>
        </div>
      </div>
    </div>
  )
}
