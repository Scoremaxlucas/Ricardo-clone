'use client'

import type { ImportSource, RentalListingStatus } from '@prisma/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'

export type AdminListingRow = {
  id: string
  title: string
  address: string
  canton: string
  rentPerMonth: number
  status: RentalListingStatus
  createdAt: string
  applicationsCount: number
  creatorKind: 'admin' | 'landlord' | 'import'
  creatorLabel: string
  importSource: ImportSource
  importedFrom: string | null
}

type Props = {
  listings: AdminListingRow[]
  stats: {
    total: number
    active: number
    addedThisWeek: number
    totalApplications: number
  }
}

function statusLabel(s: RentalListingStatus): string {
  if (s === 'active') return 'Aktiv'
  if (s === 'rented') return 'Vermietet'
  return 'Archiviert'
}

export function AdminListingsClient({ listings: initialListings, stats }: Props) {
  const router = useRouter()
  const [listings, setListings] = useState(initialListings)
  const [cantonFilter, setCantonFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | RentalListingStatus>('all')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'admin' | 'landlord' | 'import'>('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return listings.filter(l => {
      if (cantonFilter && l.canton !== cantonFilter) return false
      if (statusFilter !== 'all' && l.status !== statusFilter) return false
      if (sourceFilter !== 'all' && l.creatorKind !== sourceFilter) return false
      return true
    })
  }, [listings, cantonFilter, statusFilter, sourceFilter])

  const cantons = useMemo(() => {
    const s = new Set(listings.map(l => l.canton).filter(Boolean))
    return Array.from(s).sort()
  }, [listings])

  const toggleActive = async (row: AdminListingRow) => {
    const next: RentalListingStatus = row.status === 'active' ? 'archived' : 'active'
    setBusyId(row.id)
    try {
      const res = await fetch(`/api/admin/rental-listings/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data as { message?: string }).message || 'Aktion fehlgeschlagen')
        return
      }
      setListings(prev => prev.map(x => (x.id === row.id ? { ...x, status: next } : x)))
      toast.success(next === 'active' ? 'Inserat aktiviert' : 'Inserat deaktiviert')
      router.refresh()
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    setBusyId(deleteId)
    try {
      const res = await fetch(`/api/admin/rental-listings/${deleteId}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data as { message?: string }).message || 'Löschen fehlgeschlagen')
        return
      }
      setListings(prev => prev.filter(x => x.id !== deleteId))
      toast.success('Inserat gelöscht')
      setDeleteId(null)
      router.refresh()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <div className="mb-2">
        <Link href="/admin/dashboard" className="text-sm font-medium text-teal-800 hover:underline">
          ← Admin-Dashboard
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Inserat-Verwaltung</h1>
      <p className="mt-2 max-w-3xl text-sm text-slate-600">
        Alle Inserate auf der Plattform — erstellt, importiert oder von Vermietern inseriert
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Inserate</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Aktive Inserate</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{stats.active}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Diese Woche</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.addedThisWeek}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Bewerbungen</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.totalApplications}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div>
          <label className="block text-xs font-medium text-slate-600">Kanton</label>
          <select
            value={cantonFilter}
            onChange={e => setCantonFilter(e.target.value)}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Alle</option>
            {cantons.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Status</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as 'all' | RentalListingStatus)}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">Alle</option>
            <option value="active">Aktiv</option>
            <option value="rented">Vermietet</option>
            <option value="archived">Archiviert</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Quelle</label>
          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value as typeof sourceFilter)}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">Alle</option>
            <option value="admin">Admin</option>
            <option value="landlord">Vermieter</option>
            <option value="import">Import</option>
          </select>
        </div>
        <Link
          href="/admin/listings/new"
          className="inline-flex items-center justify-center rounded-lg bg-[#18a87c] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95 sm:ml-auto"
        >
          Neues Inserat
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600">
            <tr>
              <th className="px-3 py-3">Titel</th>
              <th className="px-3 py-3">Adresse</th>
              <th className="px-3 py-3">Kt.</th>
              <th className="px-3 py-3">Miete</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Ersteller</th>
              <th className="px-3 py-3">Erstellt</th>
              <th className="px-3 py-3">Bew.</th>
              <th className="px-3 py-3">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(row => (
              <tr key={row.id} className="hover:bg-slate-50/80">
                <td className="max-w-[200px] truncate px-3 py-2 font-medium text-slate-900">{row.title}</td>
                <td className="max-w-[180px] truncate px-3 py-2 text-slate-700">{row.address}</td>
                <td className="whitespace-nowrap px-3 py-2">{row.canton}</td>
                <td className="whitespace-nowrap px-3 py-2">CHF {row.rentPerMonth}</td>
                <td className="whitespace-nowrap px-3 py-2">{statusLabel(row.status)}</td>
                <td className="max-w-[160px] px-3 py-2 text-slate-700">
                  {row.creatorKind === 'import' ?
                    <span title={row.importedFrom || ''}>Import</span>
                  : row.creatorKind === 'admin' ?
                    'Admin'
                  : <span>Vermieter · {row.creatorLabel}</span>}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                  {new Date(row.createdAt).toLocaleDateString('de-CH')}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-center">{row.applicationsCount}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    <Link
                      href={`/admin/listings/${row.id}/bearbeiten`}
                      className="rounded border border-slate-200 px-2 py-1 text-xs font-medium text-teal-800 hover:bg-teal-50"
                    >
                      Bearbeiten
                    </Link>
                    <button
                      type="button"
                      disabled={busyId === row.id || row.status === 'rented'}
                      onClick={() => void toggleActive(row)}
                      className="rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-40"
                    >
                      {row.status === 'active' ? 'Deaktivieren' : 'Aktivieren'}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => setDeleteId(row.id)}
                      className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-40"
                    >
                      Löschen
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ?
          <p className="px-4 py-8 text-center text-sm text-slate-500">Keine Inserate für diese Filter.</p>
        : null}
      </div>

      {deleteId ?
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">Inserat löschen?</h2>
            <p className="mt-2 text-sm text-slate-600">Diese Aktion kann nicht rückgängig gemacht werden.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => void confirmDelete()}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      : null}
    </div>
  )
}
