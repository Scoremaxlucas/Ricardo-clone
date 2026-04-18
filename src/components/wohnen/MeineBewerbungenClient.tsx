'use client'

import { WohnenEmptyState } from '@/components/wohnen/WohnenEmptyState'
import type { RentalApplicationStatus } from '@prisma/client'
import { ChevronDown, ChevronUp, Inbox } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export type MeineBewerbungRow = {
  id: string
  createdAt: string
  status: RentalApplicationStatus
  message: string | null
  viewingRequestedAt: string | null
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
        text: '🔄 Betreibungsregister wird geprüft',
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

function BewerbungCard({ app }: { app: MeineBewerbungRow }) {
  const [open, setOpen] = useState(false)
  const badge = statusBadge(app)
  const date = new Date(app.createdAt).toLocaleDateString('de-CH')

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-stretch sm:justify-between sm:p-5">
      <div className="flex min-w-0 gap-3">
        <div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
          {app.listing.firstPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={app.listing.firstPhotoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xl text-slate-300">🏠</div>
          )}
        </div>
        <div className="min-w-0">
          <h2 className="font-bold text-slate-900">{app.listing.title}</h2>
          <p className="mt-1 text-xs text-slate-600">
            {app.listing.address}, {app.listing.zip} {app.listing.city}
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
      </div>
    </article>
  )
}

export function MeineBewerbungenClient({ applications }: { applications: MeineBewerbungRow[] }) {
  if (applications.length === 0) {
    return (
      <WohnenEmptyState
        icon={Inbox}
        title="Noch keine Bewerbungen"
        description="Bewirb dich auf passende Inserate — der Vermieter wird automatisch informiert."
        actionHref="/wohnungen"
        actionLabel="Wohnungen suchen"
      />
    )
  }

  return (
    <div className="space-y-4">
      {applications.map(app => (
        <BewerbungCard key={app.id} app={app} />
      ))}
    </div>
  )
}
