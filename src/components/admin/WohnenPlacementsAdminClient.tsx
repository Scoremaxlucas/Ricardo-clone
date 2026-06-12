'use client'

import { formatTenantBonusChf } from '@/lib/wohnen/pricing'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

type PlacementRow = {
  id: string
  createdAt: string
  rentalApplicationId: string
  netRentPerMonth: number
  commissionAmountChf: number
  commissionTotalChf: number
  commissionStatus: string
  tenantBonusAmountChf: number
  tenantBonusStatus: string
  moveInDate: string | null
  listingTitle: string
  listingCity: string
  applicantEmail: string | null
  applicantName: string | null
  adminNotes: string | null
}

export function WohnenPlacementsAdminClient() {
  const [rows, setRows] = useState<PlacementRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [applicationId, setApplicationId] = useState('')
  const [moveInDate, setMoveInDate] = useState('')
  const [netRent, setNetRent] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/wohnen/placements')
      const data = (await res.json()) as { placements?: PlacementRow[] }
      setRows(Array.isArray(data.placements) ? data.placements : [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const createPlacement = async () => {
    if (!applicationId.trim()) {
      toast.error('Bewerbungs-ID eingeben')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/admin/wohnen/placements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: applicationId.trim(),
          moveInDate: moveInDate || undefined,
          netRentPerMonth: netRent === '' ? undefined : Number(netRent),
          adminNotes: adminNotes.trim() || undefined,
        }),
      })
      const data = (await res.json()) as { message?: string }
      if (!res.ok) {
        toast.error(data.message || 'Erfassung fehlgeschlagen')
        return
      }
      toast.success('Vermittlung erfasst')
      setApplicationId('')
      setMoveInDate('')
      setNetRent('')
      setAdminNotes('')
      void load()
    } finally {
      setCreating(false)
    }
  }

  const patchStatus = async (id: string, body: Record<string, string>) => {
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/wohnen/placements/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = (await res.json()) as { message?: string }
      if (!res.ok) {
        toast.error(data.message || 'Update fehlgeschlagen')
        return
      }
      toast.success('Gespeichert')
      void load()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Vermittlung erfassen</h2>
        <p className="mt-2 text-sm text-slate-600">
          Nach erfolgtem Einzug: Bewerbungs-ID aus dem Lead-Dossier eintragen. Provision und{' '}
          {formatTenantBonusChf()}-Bonus werden automatisch berechnet bzw. vorgemerkt.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            Bewerbungs-ID
            <input
              value={applicationId}
              onChange={e => setApplicationId(e.target.value)}
              placeholder="cuid…"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Einzugsdatum
            <input
              type="date"
              value={moveInDate}
              onChange={e => setMoveInDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Netto-Miete (optional, sonst Inserat)
            <input
              type="number"
              value={netRent}
              onChange={e => setNetRent(e.target.value)}
              placeholder="z. B. 1850"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            Admin-Notiz
            <textarea
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <button
          type="button"
          disabled={creating}
          onClick={() => void createPlacement()}
          className="mt-4 rounded-xl bg-[#18a87c] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {creating ? 'Wird gespeichert…' : 'Vermittlung speichern'}
        </button>
      </section>

      <section>
        <h2 className="text-lg font-bold text-slate-900">Erfasste Vermittlungen</h2>
        {loading ?
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Lädt…
          </p>
        : rows.length === 0 ?
          <p className="mt-4 text-sm text-slate-500">Noch keine Vermittlungen erfasst.</p>
        : (
          <ul className="mt-4 space-y-3">
            {rows.map(row => (
              <li key={row.id} className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{row.listingTitle}</p>
                    <p className="text-slate-600">
                      {row.listingCity} · {row.applicantName || row.applicantEmail || '—'}
                    </p>
                    <p className="mt-1 font-mono text-xs text-slate-500">{row.rentalApplicationId}</p>
                  </div>
                  <p className="text-xs text-slate-500">
                    {new Date(row.createdAt).toLocaleDateString('de-CH')}
                  </p>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <p>
                    <span className="text-slate-500">Provision (exkl. MwSt.):</span>{' '}
                    <strong>CHF {row.commissionAmountChf.toLocaleString('de-CH')}</strong>
                    <span className="text-slate-500"> · total CHF {row.commissionTotalChf.toLocaleString('de-CH')}</span>
                  </p>
                  <p>
                    <span className="text-slate-500">Mieter-Bonus:</span>{' '}
                    <strong>CHF {row.tenantBonusAmountChf.toLocaleString('de-CH')}</strong>
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <select
                    value={row.commissionStatus}
                    disabled={busyId === row.id}
                    onChange={e => void patchStatus(row.id, { commissionStatus: e.target.value })}
                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-medium"
                  >
                    <option value="pending">Provision: offen</option>
                    <option value="invoiced">Provision: fakturiert</option>
                    <option value="paid">Provision: bezahlt</option>
                    <option value="waived">Provision: erlassen</option>
                    <option value="cancelled">Provision: storniert</option>
                  </select>
                  <select
                    value={row.tenantBonusStatus}
                    disabled={busyId === row.id}
                    onChange={e => void patchStatus(row.id, { tenantBonusStatus: e.target.value })}
                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-medium"
                  >
                    <option value="eligible">Bonus: berechtigt</option>
                    <option value="pending_payout">Bonus: Auszahlung vorbereitet</option>
                    <option value="paid">Bonus: ausgezahlt</option>
                    <option value="excluded">Bonus: ausgeschlossen</option>
                    <option value="not_eligible">Bonus: nicht berechtigt</option>
                  </select>
                  <Link
                    href={`/admin/applications/${row.rentalApplicationId}/dossier`}
                    className="rounded-lg border border-teal-200 px-2 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-50"
                  >
                    Dossier
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
