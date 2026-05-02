'use client'

import { WohnenEmptyState } from '@/components/wohnen/WohnenEmptyState'
import type { LandlordListingRowSerialized } from '@/lib/rental/landlord-rental-listings'
import type { RentalListingStatus } from '@prisma/client'
import { Building2, ChevronDown, Loader2, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { formatDate } from '@/lib/utils/formatDate'
import { wohnenToast } from '@/lib/wohnen-toast'
import toast from 'react-hot-toast'

type Props = {
  initialListings: LandlordListingRowSerialized[]
}

function statusBadge(status: RentalListingStatus) {
  if (status === 'active') {
    return <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-900">Aktiv</span>
  }
  if (status === 'rented') {
    return <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">Vermietet</span>
  }
  return <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600">Archiviert</span>
}

export function LandlordRentalListingsClient({ initialListings }: Props) {
  const router = useRouter()
  const [rows, setRows] = useState(initialListings)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  useEffect(() => {
    setRows(initialListings)
  }, [initialListings])

  useEffect(() => {
    if (!openMenu) return
    const close = (e: MouseEvent) => {
      const el = (e.target as HTMLElement)?.closest?.(`[data-landlord-menu="${openMenu}"]`)
      if (!el) setOpenMenu(null)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [openMenu])

  const patchListing = useCallback(
    async (id: string, patch: Record<string, unknown>, optimistic?: (r: LandlordListingRowSerialized) => LandlordListingRowSerialized) => {
      setBusyId(id)
      const prev = rows
      if (optimistic) {
        setRows(cur => cur.map(r => (r.id === id ? optimistic(r) : r)))
      }
      try {
        const res = await fetch(`/api/rental-listings/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setRows(prev)
          toast.error((data as { message?: string }).message || 'Aktion fehlgeschlagen')
          return
        }
        wohnenToast.listingSaved()
        router.refresh()
      } catch {
        setRows(prev)
        toast.error('Netzwerkfehler')
      } finally {
        setBusyId(null)
        setOpenMenu(null)
      }
    },
    [rows, router]
  )

  const deleteListing = useCallback(
    async (id: string) => {
      if (!window.confirm('Inserat endgültig löschen? Alle Bewerbungen werden ebenfalls entfernt.')) return
      setBusyId(id)
      const prev = rows
      setRows(cur => cur.filter(r => r.id !== id))
      try {
        const res = await fetch(`/api/rental-listings/${id}`, { method: 'DELETE' })
        if (!res.ok) {
          setRows(prev)
          const data = await res.json().catch(() => ({}))
          toast.error((data as { message?: string }).message || 'Löschen fehlgeschlagen')
          return
        }
        toast.success('Inserat gelöscht')
        router.refresh()
      } catch {
        setRows(prev)
        toast.error('Netzwerkfehler')
      } finally {
        setBusyId(null)
        setOpenMenu(null)
      }
    },
    [rows, router]
  )

  if (rows.length === 0) {
    return (
      <div className="mt-16">
        <WohnenEmptyState
          icon={Building2}
          title="Noch keine Inserate"
          description="Erstelle dein erstes Mietinserat — kostenlos auf Helvenda Wohnungen."
          actionHref="/matching/properties/new"
          actionLabel="Erstes Inserat erstellen"
        />
      </div>
    )
  }

  return (
    <ul className="mt-8 space-y-4">
      {rows.map(l => (
        <li
          key={l.id}
          className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-stretch sm:justify-between sm:p-5"
        >
          <div className="flex min-w-0 flex-1 gap-3">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
              {l.thumbUrl ?
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.thumbUrl} alt="" className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">Foto</div>}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900">{l.title}</p>
              <p className="mt-1 text-sm text-slate-600">
                {l.address}, {l.zip} {l.city}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {l.rooms} Zi. · {l.areaSqm} m² · CHF {l.rentPerMonth.toLocaleString('de-CH')} / Monat
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Verfügbar ab{' '}
                {formatDate(l.availableFrom)}
              </p>
              {l.listingExpiresOn ?
                <p className="mt-1 text-xs text-slate-600">
                  Gültig bis{' '}
                  <span className="font-medium text-slate-800">
                    {formatDate(`${l.listingExpiresOn}T12:00:00`)}
                  </span>
                </p>
              : l.hasMonitoringHttpUrl ?
                <p className="mt-1 text-xs text-teal-800">
                  Original-URL wird täglich geprüft — kein Kalender-Enddatum nötig.
                </p>
              : <p className="mt-1 text-xs text-amber-900">
                  Kein Enddatum hinterlegt — bitte unter Bearbeiten ein «Gültig bis» setzen.
                </p>}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-3 sm:max-w-[220px] sm:items-end">
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {statusBadge(l.status)}
              <span className="text-sm text-slate-700">
                {l.applicationCount} Bewerbung{l.applicationCount === 1 ? '' : 'en'}
                {l.neueApplicationCount > 0 ?
                  <span className="ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
                    {l.neueApplicationCount}
                  </span>
                : null}
              </span>
            </div>
            <div className="flex flex-col gap-2 sm:w-full">
              <Link
                href={`/matching/properties/${l.id}/bewerbungen`}
                className="inline-flex justify-center rounded-xl bg-[#18a87c] px-4 py-2.5 text-center text-sm font-bold text-white shadow-sm hover:opacity-95"
              >
                Bewerbungen ansehen
              </Link>
              <Link
                href={`/matching/properties/${l.id}/bearbeiten`}
                className="inline-flex justify-center rounded-xl border-2 border-teal-800 px-4 py-2.5 text-center text-sm font-semibold text-teal-900 hover:bg-teal-50"
              >
                Bearbeiten
              </Link>
              <div className="relative" data-landlord-menu={l.id}>
                <button
                  type="button"
                  disabled={busyId === l.id}
                  onClick={e => {
                    e.stopPropagation()
                    setOpenMenu(m => (m === l.id ? null : l.id))
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <MoreHorizontal className="h-4 w-4" aria-hidden />
                  Mehr
                  <ChevronDown className="h-4 w-4 opacity-60" aria-hidden />
                </button>
                {openMenu === l.id ?
                  <div className="absolute right-0 z-20 mt-1 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-50"
                      onClick={() => void patchListing(l.id, { status: 'rented' }, r => ({ ...r, status: 'rented' }))}
                    >
                      Als vermietet markieren
                    </button>
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-50"
                      onClick={() => void patchListing(l.id, { status: 'archived' }, r => ({ ...r, status: 'archived' }))}
                    >
                      Archivieren
                    </button>
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                      onClick={() => void deleteListing(l.id)}
                    >
                      Löschen
                    </button>
                  </div>
                : null}
              </div>
            </div>
            {busyId === l.id ?
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                Bitte warten…
              </span>
            : null}
          </div>
        </li>
      ))}
    </ul>
  )
}
