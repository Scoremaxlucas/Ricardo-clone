'use client'

import { SWISS_CANTONS } from '@/lib/swiss-cantons'
import { formatCHF } from '@/lib/utils/formatCurrency'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

const ZIMMER = ['1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5plus'] as const
const MAX_MIETE = ['1000', '1500', '2000', '2500', '3000', '4000', '5000plus'] as const
const MIN_MIETE = ['500', '1000', '1500', '2000', '2500', '3000'] as const
const MIN_FLAECH = ['30', '40', '50', '60', '70', '80', '90', '100', '120'] as const

const SORT_OPTS = [
  { value: 'neueste', label: 'Neueste zuerst' },
  { value: 'miete_asc', label: 'Miete aufsteigend' },
  { value: 'miete_desc', label: 'Miete absteigend' },
  { value: 'flaeche_desc', label: 'Grösste Fläche' },
] as const

function labelZimmer(v: string) {
  return v === '5plus' ? '5+' : v
}

function labelMaxMiete(v: string) {
  return v === '5000plus' ? "5'000+ (kein Limit)" : `${formatCHF(Number(v))}/Mo. max.`
}

export function WohnungenSearchFilters() {
  const router = useRouter()
  const sp = useSearchParams()
  const [moreOpen, setMoreOpen] = useState(false)

  const kanton = sp.get('kanton') ?? ''
  const zimmer = sp.get('zimmer') ?? ''
  const maxzimmer = sp.get('maxzimmer') ?? ''
  const maxmiete = sp.get('maxmiete') ?? ''
  const minmiete = sp.get('minmiete') ?? ''
  const minflaeche = sp.get('minflaeche') ?? ''
  const verfuegbar = sp.get('verfuegbar') ?? ''
  const q = sp.get('q') ?? ''
  const sort = sp.get('sort') || 'neueste'

  const current = useMemo(
    () => ({
      kanton,
      zimmer,
      maxzimmer,
      maxmiete,
      minmiete,
      minflaeche,
      verfuegbar,
      q,
      sort,
    }),
    [kanton, zimmer, maxzimmer, maxmiete, minmiete, minflaeche, verfuegbar, q, sort]
  )

  const update = useCallback(
    (patch: Partial<typeof current>) => {
      const merged = { ...current, ...patch }
      const p = new URLSearchParams()
      if (merged.kanton) p.set('kanton', merged.kanton)
      if (merged.zimmer) p.set('zimmer', merged.zimmer)
      if (merged.maxzimmer) p.set('maxzimmer', merged.maxzimmer)
      if (merged.maxmiete) p.set('maxmiete', merged.maxmiete)
      if (merged.minmiete) p.set('minmiete', merged.minmiete)
      if (merged.minflaeche) p.set('minflaeche', merged.minflaeche)
      if (merged.verfuegbar) p.set('verfuegbar', merged.verfuegbar)
      if (merged.q.trim()) p.set('q', merged.q.trim())
      if (merged.sort && merged.sort !== 'neueste') p.set('sort', merged.sort)
      const qs = p.toString()
      router.push(qs ? `/wohnungen?${qs}` : '/wohnungen')
    },
    [router, current]
  )

  const reset = () => {
    setMoreOpen(false)
    router.push('/wohnungen')
  }

  const resetAdvanced = () => {
    update({
      zimmer: '',
      maxzimmer: '',
      maxmiete: '',
      minmiete: '',
      minflaeche: '',
      verfuegbar: '',
      sort: 'neueste',
    })
  }

  const advancedActiveCount = useMemo(() => {
    let n = 0
    if (zimmer) n++
    if (maxzimmer) n++
    if (maxmiete) n++
    if (minmiete) n++
    if (minflaeche) n++
    if (verfuegbar) n++
    if (sort && sort !== 'neueste') n++
    return n
  }, [zimmer, maxzimmer, maxmiete, minmiete, minflaeche, verfuegbar, sort])

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = []
    if (q.trim()) {
      chips.push({
        key: 'q',
        label: `«${q.trim().slice(0, 28)}${q.trim().length > 28 ? '…' : ''}»`,
        clear: () => update({ q: '' }),
      })
    }
    if (kanton) {
      const name = SWISS_CANTONS.find(c => c.code === kanton)?.name ?? kanton
      chips.push({ key: 'kanton', label: `Kanton ${kanton} (${name})`, clear: () => update({ kanton: '' }) })
    }
    if (zimmer) {
      chips.push({ key: 'zimmer', label: `ab ${labelZimmer(zimmer)} Zi.`, clear: () => update({ zimmer: '' }) })
    }
    if (maxzimmer) {
      chips.push({
        key: 'maxzimmer',
        label: `bis ${labelZimmer(maxzimmer)} Zi.`,
        clear: () => update({ maxzimmer: '' }),
      })
    }
    if (maxmiete) {
      chips.push({ key: 'maxmiete', label: labelMaxMiete(maxmiete), clear: () => update({ maxmiete: '' }) })
    }
    if (minmiete) {
      chips.push({
        key: 'minmiete',
        label: `ab ${formatCHF(Number(minmiete))}/Mo.`,
        clear: () => update({ minmiete: '' }),
      })
    }
    if (minflaeche) {
      chips.push({
        key: 'minflaeche',
        label: `ab ${minflaeche} m²`,
        clear: () => update({ minflaeche: '' }),
      })
    }
    if (verfuegbar) {
      chips.push({
        key: 'verfuegbar',
        label: `Einzug ab ${verfuegbar}`,
        clear: () => update({ verfuegbar: '' }),
      })
    }
    if (sort && sort !== 'neueste') {
      const lab = SORT_OPTS.find(o => o.value === sort)?.label ?? sort
      chips.push({ key: 'sort', label: lab, clear: () => update({ sort: 'neueste' }) })
    }
    return chips
  }, [q, kanton, zimmer, maxzimmer, maxmiete, minmiete, minflaeche, verfuegbar, sort, update])

  const hasFilters = activeChips.length > 0

  const scrollToResults = () => {
    document.getElementById('wohnungen-ergebnisse')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    if (!moreOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [moreOpen])

  const selectCls =
    'h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100'

  return (
    <section className="mb-8 rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 py-3 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] sm:pl-5 sm:pr-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#e8f7f2] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#107a5a]">
            Nur Miete
          </span>
          <span className="text-xs text-slate-500">Kein Kauf — nur Mietwohnungen</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/meine-matches"
            className="text-xs font-semibold text-teal-700 underline-offset-2 hover:underline sm:text-sm"
          >
            Meine Matches
          </Link>
          <span className="hidden text-slate-300 sm:inline">|</span>
          <button type="button" onClick={reset} className="text-xs font-semibold text-slate-600 hover:text-slate-900 sm:text-sm">
            Alle Filter löschen
          </button>
        </div>
      </div>

      <div className="py-4 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] sm:py-5 sm:pl-5 sm:pr-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-3">
          <div className="min-w-0 flex-1">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-600">Ort, PLZ oder Titel</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                enterKeyHint="search"
                placeholder="z. B. Zürich, 8001, Wollishofen…"
                className="h-12 w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100 sm:text-sm"
                value={q}
                onChange={e => update({ q: e.target.value })}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    scrollToResults()
                  }
                }}
              />
            </span>
          </div>

          <div className="w-full sm:max-w-[220px] lg:w-52 lg:shrink-0">
            <label htmlFor="wohnungen-kanton" className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
              Kanton
            </label>
            <select
              id="wohnungen-kanton"
              className={selectCls}
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
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-end lg:w-auto lg:shrink-0">
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg border-2 border-teal-600 bg-white px-4 text-sm font-bold text-teal-800 shadow-sm hover:bg-teal-50 sm:flex-initial sm:min-w-[160px]"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
              Weitere Filter
              {advancedActiveCount > 0 ? (
                <span className="rounded-full bg-teal-600 px-2 py-0.5 text-xs font-bold text-white">{advancedActiveCount}</span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => scrollToResults()}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-[#18a87c] px-5 text-sm font-bold text-white shadow-md hover:opacity-95 sm:min-w-[120px]"
            >
              <Search className="h-4 w-4" aria-hidden />
              Suchen
            </button>
          </div>
        </div>

        {hasFilters ? (
          <div className="mt-4 flex flex-nowrap gap-2 overflow-x-auto pb-1 pl-0.5 pr-0.5 pt-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] scroll-pl-1 scroll-pr-1 sm:scroll-pl-0 [&::-webkit-scrollbar]:hidden">
            {activeChips.map(c => (
              <button
                key={c.key + c.label}
                type="button"
                onClick={c.clear}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-[20px] bg-[#e8f7f2] py-[5px] pl-3 pr-2 text-xs font-semibold text-[#107a5a] ring-1 ring-teal-100/80 hover:bg-[#dff5eb]"
              >
                <span>{c.label}</span>
                <X className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {moreOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/45 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-[max(2.5rem,env(safe-area-inset-top,0px))] pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:pt-16"
          role="presentation"
          onClick={e => {
            if (e.target === e.currentTarget) setMoreOpen(false)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="wohnungen-filter-panel-title"
            className="mb-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 id="wohnungen-filter-panel-title" className="text-lg font-bold text-[#0d2b1f]">
                Weitere Filter
              </h2>
              <div className="flex items-center gap-3">
                <button type="button" onClick={resetAdvanced} className="text-xs font-semibold text-teal-700 hover:underline">
                  Zurücksetzen
                </button>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                  aria-label="Schliessen"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="max-h-[min(70vh,560px)] overflow-y-auto px-5 py-5">
              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Zimmer</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-semibold text-slate-600">Ab</span>
                      <select className={selectCls} value={zimmer} onChange={e => update({ zimmer: e.target.value })}>
                        <option value="">Beliebig</option>
                        {ZIMMER.map(z => (
                          <option key={z} value={z}>
                            {labelZimmer(z)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-semibold text-slate-600">Bis</span>
                      <select className={selectCls} value={maxzimmer} onChange={e => update({ maxzimmer: e.target.value })}>
                        <option value="">Beliebig</option>
                        {ZIMMER.map(z => (
                          <option key={z} value={z}>
                            {labelZimmer(z)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Nettomiete / Monat</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-semibold text-slate-600">Ab</span>
                      <select className={selectCls} value={minmiete} onChange={e => update({ minmiete: e.target.value })}>
                        <option value="">Beliebig</option>
                        {MIN_MIETE.map(m => (
                          <option key={m} value={m}>
                            {formatCHF(Number(m))}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-semibold text-slate-600">Bis</span>
                      <select className={selectCls} value={maxmiete} onChange={e => update({ maxmiete: e.target.value })}>
                        <option value="">Kein Limit</option>
                        {MAX_MIETE.map(m => (
                          <option key={m} value={m}>
                            {labelMaxMiete(m)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Fläche &amp; Einzug</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-semibold text-slate-600">Wohnfläche ab</span>
                      <select className={selectCls} value={minflaeche} onChange={e => update({ minflaeche: e.target.value })}>
                        <option value="">Beliebig</option>
                        {MIN_FLAECH.map(f => (
                          <option key={f} value={f}>
                            {f} m²
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-semibold text-slate-600">Verfügbar ab</span>
                      <input
                        type="date"
                        className={selectCls}
                        value={verfuegbar}
                        onChange={e => update({ verfuegbar: e.target.value })}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label htmlFor="wohnungen-sort" className="mb-3 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Sortierung
                  </label>
                  <select id="wohnungen-sort" className={selectCls} value={sort} onChange={e => update({ sort: e.target.value })}>
                    {SORT_OPTS.map(o => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false)
                  scrollToResults()
                }}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#18a87c] text-sm font-bold text-white shadow-md hover:opacity-95"
              >
                <Search className="h-4 w-4" aria-hidden />
                Ergebnisse anzeigen
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
