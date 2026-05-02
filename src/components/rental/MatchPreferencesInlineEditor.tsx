'use client'

import { SWISS_CANTONS } from '@/lib/swiss-cantons'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'

const ROOM_OPTIONS = ['', '1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5.5', '6'] as const
const MAX_RENT_OPTIONS = ['', '1000', '1500', '2000', '2500', '3000', '3500', '4000', '5000', '7000'] as const

type Props = {
  initial: {
    preferredCanton: string | null
    preferredMinRooms: number | null
    preferredBudgetMax: number | null
    preferredMoveInEarliest: string | null
  }
  className?: string
}

export function MatchPreferencesInlineEditor({ initial, className = '' }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [preferredCanton, setPreferredCanton] = useState(initial.preferredCanton ?? '')
  const [preferredMinRooms, setPreferredMinRooms] = useState(initial.preferredMinRooms != null ? String(initial.preferredMinRooms) : '')
  const [preferredBudgetMax, setPreferredBudgetMax] = useState(
    initial.preferredBudgetMax != null ? String(initial.preferredBudgetMax) : ''
  )
  const [preferredMoveInEarliest, setPreferredMoveInEarliest] = useState(
    initial.preferredMoveInEarliest ? initial.preferredMoveInEarliest.slice(0, 10) : ''
  )

  function onCancel() {
    setPreferredCanton(initial.preferredCanton ?? '')
    setPreferredMinRooms(initial.preferredMinRooms != null ? String(initial.preferredMinRooms) : '')
    setPreferredBudgetMax(initial.preferredBudgetMax != null ? String(initial.preferredBudgetMax) : '')
    setPreferredMoveInEarliest(initial.preferredMoveInEarliest ? initial.preferredMoveInEarliest.slice(0, 10) : '')
    setOpen(false)
  }

  async function onSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/tenant-profile', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferredCanton: preferredCanton || null,
          preferredMinRooms: preferredMinRooms === '' ? null : Number(preferredMinRooms),
          preferredBudgetMax: preferredBudgetMax === '' ? null : Number(preferredBudgetMax),
          preferredMoveInEarliest: preferredMoveInEarliest || null,
        }),
      })
      const json = (await res.json().catch(() => ({}))) as { message?: string }
      if (!res.ok) throw new Error(json.message || 'Speichern fehlgeschlagen')
      toast.success('Präferenzen gespeichert ✓')
      router.refresh()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Speichern fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className={`mt-4 ${className}`.trim()}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex min-h-[48px] w-full items-center justify-center rounded-full border border-teal-300 px-4 text-sm font-semibold text-teal-700 hover:bg-teal-50 md:inline-flex md:min-h-0 md:w-auto md:px-3 md:py-1.5 md:text-xs"
      >
        Präferenzen anpassen
      </button>

      <div
        className={`overflow-hidden rounded-b-xl border-x border-b border-teal-200 bg-white shadow-sm transition-all duration-250 ease-in-out ${
          open ? 'mt-3 max-h-[560px] border-t-[3px] opacity-100' : 'mt-0 max-h-0 border-t-0 opacity-0'
        }`}
      >
        <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Bevorzugter Kanton
            <select
              title="Bevorzugter Kanton"
              value={preferredCanton}
              onChange={e => setPreferredCanton(e.target.value)}
              className="min-h-[48px] w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900 md:min-h-0 md:text-sm"
            >
              <option value="">Alle</option>
              {SWISS_CANTONS.map(c => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Zimmer (min.)
            <select
              title="Minimum Zimmer"
              value={preferredMinRooms}
              onChange={e => setPreferredMinRooms(e.target.value)}
              className="min-h-[48px] w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900 md:min-h-0 md:text-sm"
            >
              {ROOM_OPTIONS.map(v => (
                <option key={v || 'all'} value={v}>
                  {v || 'Alle'}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Max. Miete CHF
            <select
              title="Maximale Miete"
              value={preferredBudgetMax}
              onChange={e => setPreferredBudgetMax(e.target.value)}
              className="min-h-[48px] w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900 md:min-h-0 md:text-sm"
            >
              {MAX_RENT_OPTIONS.map(v => (
                <option key={v || 'all'} value={v}>
                  {v || 'Kein Limit'}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Verfügbar ab
            <input
              type="date"
              value={preferredMoveInEarliest}
              onChange={e => setPreferredMoveInEarliest(e.target.value)}
              className="min-h-[48px] w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900 md:min-h-0 md:text-sm"
            />
          </label>

          <div className="flex flex-col gap-2 md:col-span-2 md:flex-row md:flex-wrap">
            <button
              type="button"
              onClick={() => void onSave()}
              disabled={saving}
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60 md:w-auto"
            >
              {saving ? 'Speichern…' : 'Speichern & aktualisieren'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 md:w-auto"
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
