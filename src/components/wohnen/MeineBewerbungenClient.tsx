'use client'

import { WohnenEmptyState } from '@/components/wohnen/WohnenEmptyState'
import { formatRentalListingAddress } from '@/lib/rental/format-listing-address'
import type { RentalApplicationStatus } from '@prisma/client'
import {
  Building2,
  ChevronDown,
  ChevronUp,
  Clock,
  Inbox,
  MapPin,
  Search,
  Send,
} from 'lucide-react'
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

type StatusVisual = {
  label: string
  className: string
  Icon: typeof Send
}

function statusVisual(app: MeineBewerbungRow): StatusVisual {
  if (app.viewingRequestedAt) {
    return {
      label: 'Besichtigung angefragt',
      className: 'border-emerald-200/80 bg-emerald-50 text-emerald-900',
      Icon: Clock,
    }
  }
  switch (app.status) {
    case 'approved':
      return {
        label: 'An Vermieter gesendet',
        className: 'border-[#bfe8d4] bg-[#e8f7f2] text-[#0d4a38]',
        Icon: Send,
      }
    case 'pending_credit_check':
      return {
        label: 'Register wird geprüft',
        className: 'border-amber-200 bg-amber-50 text-amber-950',
        Icon: Clock,
      }
    case 'pending_manual_review':
      return {
        label: 'Manuelle Prüfung',
        className: 'border-orange-200 bg-orange-50 text-orange-950',
        Icon: Search,
      }
    case 'rejected':
      return {
        label: 'Nicht berücksichtigt',
        className: 'border-slate-200 bg-slate-100 text-slate-600',
        Icon: Clock,
      }
    default:
      return {
        label: app.status,
        className: 'border-slate-200 bg-slate-50 text-slate-700',
        Icon: Clock,
      }
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
  const visual = statusVisual(app)
  const StatusIcon = visual.Icon
  const date = new Date(app.createdAt).toLocaleDateString('de-CH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const showStale = canShowStaleReport(app)
  const addressLine = formatRentalListingAddress({
    address: app.listing.address,
    zip: app.listing.zip,
    city: app.listing.city,
  })

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
    <article className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-stretch">
        <Link
          href={`/wohnungen/${app.listing.id}`}
          className="relative block aspect-[16/10] w-full shrink-0 overflow-hidden bg-slate-100 sm:aspect-auto sm:w-44 sm:min-h-[168px] md:w-52"
        >
          {app.listing.firstPhotoUrl ?
            // eslint-disable-next-line @next/next/no-img-element
            <img src={app.listing.firstPhotoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          : <div className="flex h-full min-h-[140px] items-center justify-center text-slate-300 sm:min-h-full">
              <Building2 className="h-10 w-10 opacity-35" aria-hidden />
            </div>
          }
        </Link>

        <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${visual.className}`}
              >
                <StatusIcon className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                {visual.label}
              </span>
              <h2 className="mt-3 text-base font-bold leading-snug text-[#0d2b1f] sm:text-[1.0625rem]">
                <Link href={`/wohnungen/${app.listing.id}`} className="hover:text-[#18a87c]">
                  {app.listing.title}
                </Link>
              </h2>
              <p className="mt-1.5 flex items-start gap-1.5 text-sm text-slate-600">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                <span>{addressLine}</span>
              </p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {app.listing.rooms} Zi. · CHF {app.listing.rentPerMonth.toLocaleString('de-CH')}.— / Monat
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-500">Beworben am {date}</p>
            <Link
              href={`/wohnungen/${app.listing.id}`}
              className="text-sm font-semibold text-[#107a5a] underline-offset-2 hover:text-[#18a87c] hover:underline"
            >
              Inserat ansehen
            </Link>
          </div>

          {app.message?.trim() ?
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#107a5a] hover:underline"
              >
                Deine Nachricht {open ? 'ausblenden' : 'anzeigen'}
                {open ?
                  <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                : <ChevronDown className="h-3.5 w-3.5" aria-hidden />}
              </button>
              {open ?
                <p className="mt-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm leading-relaxed text-slate-700">
                  {app.message}
                </p>
              : null}
            </div>
          : null}

          {showStale ?
            <button
              type="button"
              onClick={() => setStaleOpen(true)}
              className="mt-3 text-left text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
            >
              Wohnung bereits vergeben?
            </button>
          : null}
        </div>
      </div>

      {staleOpen ?
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">Wohnung als vergeben melden</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Hast du erfahren, dass diese Wohnung nicht mehr verfügbar ist? Deine Meldung hilft anderen Suchenden.
            </p>
            <label className="mt-4 block text-sm font-medium text-slate-800">
              Was hast du erfahren? (optional)
              <textarea
                value={staleNote}
                onChange={e => setStaleNote(e.target.value.slice(0, 200))}
                rows={3}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#18a87c] focus:outline-none focus:ring-2 focus:ring-[#18a87c]/20"
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
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Abbrechen
              </button>
              <button
                type="button"
                disabled={staleBusy}
                onClick={() => void submitStale()}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
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
  const incompleteBanner =
    !profileComplete ?
      <div className="mb-6 rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-4 text-sm text-amber-950">
        <p className="font-semibold">Profil vervollständigen</p>
        <p className="mt-1 text-amber-900/90">
          Ohne vollständiges Profil kannst du keine neuen Bewerbungen absenden. Hier siehst du trotzdem deine
          bisherigen Bewerbungen.
        </p>
        <Link
          href={'/profil/erstellen?next=' + encodeURIComponent('/meine-bewerbungen')}
          className="mt-3 inline-flex rounded-xl bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
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
          description="Bewirb dich auf passende Inserate — der Vermieter wird automatisch mit deinem verifizierten Profil informiert."
          actionHref="/meine-matches"
          actionLabel="Meine Matches"
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
