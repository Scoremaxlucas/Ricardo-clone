'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

export type ExternalLandlordIndexRow = {
  id: string
  label: string
  kind: string
  primaryEmail: string | null
  primaryPhone: string | null
  listingsCount: number
  contactsCount: number
  permissionsCount: number
  attachmentsCount: number
  updatedAtLabel: string
  hasPotentialDuplicate: boolean
}

export function ExternalLandlordsIndexClient({ rows }: { rows: ExternalLandlordIndexRow[] }) {
  const [query, setQuery] = useState('')
  const [kindFilter, setKindFilter] = useState<'all' | string>('all')
  const [duplicatesOnly, setDuplicatesOnly] = useState(false)

  const kinds = useMemo(() => Array.from(new Set(rows.map(row => row.kind))).sort(), [rows])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter(row => {
      if (kindFilter !== 'all' && row.kind !== kindFilter) return false
      if (duplicatesOnly && !row.hasPotentialDuplicate) return false
      if (!q) return true
      return (
        row.label.toLowerCase().includes(q) ||
        (row.primaryEmail || '').toLowerCase().includes(q) ||
        (row.primaryPhone || '').toLowerCase().includes(q)
      )
    })
  }, [rows, query, kindFilter, duplicatesOnly])

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-[16rem] flex-1">
          <label className="block text-xs font-medium text-slate-600">Suche</label>
          <input
            aria-label="Vermieter suchen"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Name, E-Mail oder Telefon"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Art</label>
          <select
            aria-label="Vermieter-Art filtern"
            value={kindFilter}
            onChange={e => setKindFilter(e.target.value)}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">Alle</option>
            {kinds.map(kind => (
              <option key={kind} value={kind}>
                {kind}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={duplicatesOnly} onChange={e => setDuplicatesOnly(e.target.checked)} />
          Nur potenzielle Duplikate
        </label>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="pb-3 pr-4 font-semibold">Vermieter</th>
              <th className="pb-3 pr-4 font-semibold">Primärkontakt</th>
              <th className="pb-3 pr-4 font-semibold">CRM</th>
              <th className="pb-3 pr-4 font-semibold">Aktualisiert</th>
              <th className="pb-3 font-semibold">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(row => (
              <tr key={row.id} className="border-b border-slate-100 align-top">
                <td className="py-4 pr-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{row.label}</p>
                    {row.hasPotentialDuplicate ?
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                        Duplikat prüfen
                      </span>
                    : null}
                  </div>
                  <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{row.kind}</p>
                </td>
                <td className="py-4 pr-4 text-slate-700">
                  <p>{row.primaryEmail || '—'}</p>
                  <p className="mt-1">{row.primaryPhone || '—'}</p>
                </td>
                <td className="py-4 pr-4 text-slate-700">
                  <p>{row.listingsCount} Inserate</p>
                  <p className="mt-1">{row.contactsCount} Kontakte</p>
                  <p className="mt-1">
                    {row.permissionsCount} Berechtigungen · {row.attachmentsCount} Anhänge
                  </p>
                </td>
                <td className="py-4 pr-4 text-slate-600">{row.updatedAtLabel}</td>
                <td className="py-4">
                  <Link href={`/admin/landlords/${row.id}`} className="font-semibold text-teal-800 hover:underline">
                    Öffnen
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? <p className="py-6 text-sm text-slate-600">Keine CRM-Einträge für diese Filter.</p> : null}
      </div>
    </section>
  )
}
