'use client'

import { SWISS_CANTONS } from '@/lib/swiss-cantons'
import { formatCHF } from '@/lib/utils/formatCurrency'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'

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

const AUSZUG_OPTS = [
  { value: '', label: 'Alle Inserate' },
  { value: 'pflicht', label: 'Nur mit Betreibungsauszug-Pflicht' },
  { value: 'freiwillig', label: 'Nur ohne Auszug-Pflicht' },
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

  const kanton = sp.get('kanton') ?? ''
  const zimmer = sp.get('zimmer') ?? ''
  const maxzimmer = sp.get('maxzimmer') ?? ''
  const maxmiete = sp.get('maxmiete') ?? ''
  const minmiete = sp.get('minmiete') ?? ''
  const minflaeche = sp.get('minflaeche') ?? ''
  const verfuegbar = sp.get('verfuegbar') ?? ''
  const q = sp.get('q') ?? ''
  const auszug = sp.get('auszug') ?? ''
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
      auszug,
      sort,
    }),
    [kanton, zimmer, maxzimmer, maxmiete, minmiete, minflaeche, verfuegbar, q, auszug, sort]
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
      if (merged.auszug) p.set('auszug', merged.auszug)
      if (merged.sort && merged.sort !== 'neueste') p.set('sort', merged.sort)
      const qs = p.toString()
      router.push(qs ? `/wohnungen?${qs}` : '/wohnungen')
    },
    [router, current]
  )

  const reset = () => {
    router.push('/wohnungen')
  }

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
    if (auszug === 'pflicht') {
      chips.push({
        key: 'auszug',
        label: 'Mit Auszug-Pflicht',
        clear: () => update({ auszug: '' }),
      })
    } else if (auszug === 'freiwillig') {
      chips.push({
        key: 'auszug',
        label: 'Ohne Auszug-Pflicht',
        clear: () => update({ auszug: '' }),
      })
    }
    if (sort && sort !== 'neueste') {
      const lab = SORT_OPTS.find(o => o.value === sort)?.label ?? sort
      chips.push({ key: 'sort', label: lab, clear: () => update({ sort: 'neueste' }) })
    }
    return chips
  }, [q, kanton, zimmer, maxzimmer, maxmiete, minmiete, minflaeche, verfuegbar, auszug, sort, update])

  const hasFilters = activeChips.length > 0

  return (
    <section className="mb-8 rounded-2xl border border-slate-200 bg-white px-4 py-5 shadow-sm sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f7f2] text-[#107a5a]">
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-bold text-[#0d2b1f] sm:text-lg">Suche anpassen</h2>
            <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">
              Ort, Budget, Fläche, Zimmer und Sortierung — näher an grossen Portalen, ohne die Datenqualität zu
              verfälschen.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href="/meine-matches"
            className="rounded-lg border border-teal-300 px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50 sm:text-sm"
          >
            Zu meinen Matches
          </Link>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:text-sm"
          >
            Zurücksetzen
          </button>
        </div>
      </div>

      {hasFilters ? (
        <div className="-mx-1 mt-4 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <label className="flex flex-col gap-1.5 sm:col-span-2 xl:col-span-2">
          <span className="text-xs font-semibold text-slate-600">Ort, PLZ oder Titel</span>
          <span className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="z. B. Zürich, 8001, Wollishofen…"
              className="min-h-[48px] w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100 md:min-h-0"
              value={q}
              onChange={e => update({ q: e.target.value })}
            />
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-600">Kanton</span>
          <select
            className="min-h-[48px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100 md:min-h-0"
            value={kanton}
            onChange={e => update({ kanton: e.target.value })}
          >
            <option value="">Alle Kantone</option>
            {SWISS_CANTONS.map(c => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-600">Zimmer (min.)</span>
          <select
            className="min-h-[48px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100 md:min-h-0"
            value={zimmer}
            onChange={e => update({ zimmer: e.target.value })}
          >
            <option value="">Kein Minimum</option>
            {ZIMMER.map(z => (
              <option key={z} value={z}>
                {labelZimmer(z)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-600">Zimmer (max.)</span>
          <select
            className="min-h-[48px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100 md:min-h-0"
            value={maxzimmer}
            onChange={e => update({ maxzimmer: e.target.value })}
          >
            <option value="">Kein Maximum</option>
            {ZIMMER.map(z => (
              <option key={z} value={z}>
                {labelZimmer(z)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-600">Max. Nettomiete</span>
          <select
            className="min-h-[48px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100 md:min-h-0"
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

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-600">Min. Nettomiete</span>
          <select
            className="min-h-[48px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100 md:min-h-0"
            value={minmiete}
            onChange={e => update({ minmiete: e.target.value })}
          >
            <option value="">Kein Minimum</option>
            {MIN_MIETE.map(m => (
              <option key={m} value={m}>
                ab {formatCHF(Number(m))}/Monat
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-600">Wohnfläche ab</span>
          <select
            className="min-h-[48px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100 md:min-h-0"
            value={minflaeche}
            onChange={e => update({ minflaeche: e.target.value })}
          >
            <option value="">Egal</option>
            {MIN_FLAECH.map(f => (
              <option key={f} value={f}>
                ab {f} m²
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-600">Verfügbar ab</span>
          <input
            type="date"
            className="min-h-[48px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100 md:min-h-0"
            value={verfuegbar}
            onChange={e => update({ verfuegbar: e.target.value })}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-600">Betreibungsauszug</span>
          <select
            className="min-h-[48px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100 md:min-h-0"
            value={auszug}
            onChange={e => update({ auszug: e.target.value })}
          >
            {AUSZUG_OPTS.map(o => (
              <option key={o.value || 'alle'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-600">Sortierung</span>
          <select
            className="min-h-[48px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100 md:min-h-0"
            value={sort}
            onChange={e => update({ sort: e.target.value })}
          >
            {SORT_OPTS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-slate-500 sm:text-xs">
        Homegate &amp; Co. bieten oft noch Möblierung, Haustiere, Balkon usw. — dafür bräuchten wir zusätzliche Felder
        pro Inserat. Heute filterst du nach Standort, Grösse, Budget, Zimmer und Auszug-Regel; persönliche Passung
        bleibt bei{' '}
        <Link href="/meine-matches" className="font-semibold text-teal-700 underline-offset-2 hover:underline">
          Meine Matches
        </Link>
        .
      </p>
    </section>
  )
}
