'use client'

import { WohnenEmptyState } from '@/components/wohnen/WohnenEmptyState'
import type { RentalApplicationStatus } from '@prisma/client'
import { Building2, ChevronDown, ChevronUp, Inbox } from 'lucide-react'
import { formatRentalListingAddress } from '@/lib/rental/format-listing-address'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'

export type MeineBewerbungRow = {
  id: string
  createdAt: string
  status: RentalApplicationStatus
  message: string | null
  viewingRequestedAt: string | null
  staleReportedAt: string | null
  listing: {
    id: string
    title: string
    address: string
    zip: string
    city: string
    rooms: number
    rentPerMonth: number
    firstPhotoUrl: string | null
  }
}

function statusBadge(app: MeineBewerbungRow): { text: string; className: string } {
  if (app.viewingRequestedAt) {
    return {
      text: '📅 Besichtigung angefragt',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    }
  }
  switch (app.status) {
    case 'approved':
      return {
        text: '📨 Gesendet — wartet auf Rückmeldung',
        className: 'border-blue-200 bg-blue-50 text-blue-900',
      }
    case 'pending_credit_check':
      return {
        text: '🔄 Betreibungsregisterauszug wird geprüft',
        className: 'border-amber-200 bg-amber-50 text-amber-900',
      }
    case 'pending_manual_review':
      return {
        text: '🔍 Manuelle Prüfung',
        className: 'border-orange-200 bg-orange-50 text-orange-950',
      }
    case 'rejected':
      return {
        text: 'Nicht berücksichtigt',
        className: 'border-slate-200 bg-slate-100 text-slate-700',
      }
    default:
      return { text: app.status, className: 'border-slate-200 bg-slate-50 text-slate-800' }
  }
}

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

function canShowStaleReport(app: MeineBewerbungRow): boolean {
  if (app.status !== 'approved') return false
  if (app.staleReportedAt) return false
  const age = Date.now() - new Date(app.createdAt).getTime()
  return age >= THREE_DAYS_MS
}

function BewerbungCard({ app }: { app: MeineBewerbungRow }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [staleOpen, setStaleOpen] = useState(false)
  const [staleNote, setStaleNote] = useState('')
  const [staleBusy, setStaleBusy] = useState(false)
  const badge = statusBadge(app)
  const date = new Date(app.createdAt).toLocaleDateString('de-CH')
  const showStale = canShowStaleReport(app)

  const submitStale = async () => {
    setStaleBusy(true)
    try {
      const res = await fetch(`/api/rental-applications/${encodeURIComponent(app.id)}/report-stale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: staleNote.trim() || undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data as { message?: string }).message || 'Melden fehlgeschlagen')
        return
      }
      toast.success('Danke für deine Meldung — wir prüfen das Inserat.')
      setStaleOpen(false)
      setStaleNote('')
      router.refresh()
    } finally {
      setStaleBusy(false)
    }
  }

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-stretch sm:justify-between sm:p-5">
      <div className="flex min-w-0 gap-3">
        <div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
          {app.listing.firstPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={app.listing.firstPhotoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-300">
              <Building2 className="h-7 w-7 opacity-40" aria-hidden />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h2 className="font-bold text-slate-900">{app.listing.title}</h2>
          <p className="mt-1 text-xs text-slate-600">
            {formatRentalListingAddress({
              address: app.listing.address,
              zip: app.listing.zip,
              city: app.listing.city,
            })}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            {app.listing.rooms} Zi. · CHF {app.listing.rentPerMonth.toLocaleString('de-CH')}.— / Monat
          </p>
          <Link href={`/wohnungen/${app.listing.id}`} className="mt-2 inline-block text-xs font-semibold text-teal-800 underline-offset-2 hover:underline">
            Zum Inserat →
          </Link>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-stretch gap-2 sm:max-w-md sm:items-end sm:text-right">
        <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[11px] font-semibold ${badge.className}`}>
          {badge.text}
        </span>
        <p className="text-xs text-slate-500">Beworben am {date}</p>
        {app.message?.trim() ? (
          <div className="w-full text-left sm:text-right">
            <button
              type="button"
              onClick={() => setOpen(o => !o)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 hover:underline"
            >
              Deine Nachricht {open ? 'ausblenden' : 'anzeigen'}
              {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            {open ? (
              <p className="mt-2 rounded-lg border border-slate-100 bg-slate-50 p-2 text-left text-xs text-slate-700 sm:text-right">
                {app.message}
              </p>
            ) : null}
          </div>
        ) : null}
        {showStale ?
          <div className="w-full text-left sm:text-right">
            <button
              type="button"
              onClick={() => setStaleOpen(true)}
              className="text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
            >
              Wohnung bereits vergeben?
            </button>
          </div>
        : null}
      </div>

      {staleOpen ?
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">Wohnung als vergeben melden</h2>
            <p className="mt-2 text-sm text-slate-600">
              Hast du erfahren, dass diese Wohnung nicht mehr verfügbar ist? Deine Meldung hilft anderen Suchenden.
            </p>
            <label className="mt-4 block text-sm font-medium text-slate-800">
              Was hast du erfahren? (optional)
              <textarea
                value={staleNote}
                onChange={e => setStaleNote(e.target.value.slice(0, 200))}
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Kurz beschreiben …"
              />
            </label>
            <p className="mt-1 text-xs text-slate-500">{staleNote.length} / 200</p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setStaleOpen(false)
                  setStaleNote('')
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Abbrechen
              </button>
              <button
                type="button"
                disabled={staleBusy}
                onClick={() => void submitStale()}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {staleBusy ? 'Wird gesendet…' : 'Ja, Wohnung ist vergeben'}
              </button>
            </div>
          </div>
        </div>
      : null}
    </article>
  )
}

export function MeineBewerbungenClient({
  applications,
  profileComplete,
}: {
  applications: MeineBewerbungRow[]
  profileComplete: boolean
}) {
  const incompleteBanner = !profileComplete ?
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950 shadow-sm">
      <p className="font-semibold">Profil vervollständigen</p>
      <p className="mt-1 text-amber-900/90">
        Ohne vollständiges Profil können Sie keine neuen Bewerbungen absenden. Sie sehen hier trotzdem Ihre bisherigen Bewerbungen.
      </p>
      <Link
        href={'/profil/erstellen?next=' + encodeURIComponent('/meine-bewerbungen')}
        className="mt-3 inline-flex rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
      >
        Zum Profil
      </Link>
    </div>
  : null

  if (applications.length === 0) {
    return (
      <>
        {incompleteBanner}
        <WohnenEmptyState
          icon={Inbox}
          title="Noch keine Bewerbungen"
          description="Bewirb dich auf passende Inserate — der Vermieter wird automatisch informiert."
          actionHref="/wohnungen"
          actionLabel="Wohnungen suchen"
        />
      </>
    )
  }

  return (
    <>
      {incompleteBanner}
      <div className="space-y-4">
        {applications.map(app => (
          <BewerbungCard key={app.id} app={app} />
        ))}
      </div>
    </>
  )
}
