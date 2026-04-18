import { Building2, Calendar, MapPin } from 'lucide-react'
import Link from 'next/link'

export type RentalListingCardData = {
  id: string
  title: string
  city: string
  canton: string
  rooms: number
  areaSqm: number
  floor?: number | null
  rentPerMonth: number
  utilitiesPerMonth?: number | null
  /** ISO date string or Date-serializable */
  availableFrom?: string | Date | null
  photos: string[]
  requiresCreditCheck: boolean
  createdAt: Date
}

type Props = {
  listing: RentalListingCardData
}

function firstPhoto(urls: string[]): string | null {
  const u = urls[0]?.trim()
  if (!u) return null
  if (u.startsWith('https://') || u.startsWith('http://') || u.startsWith('//')) return u
  return null
}

export function RentalListingCard({ listing: l }: Props) {
  const main = firstPhoto(l.photos)
  const now = Date.now()
  const isNew = now - new Date(l.createdAt).getTime() < 48 * 3600000
  const avail =
    l.availableFrom != null && l.availableFrom !== ''
      ? typeof l.availableFrom === 'string'
        ? l.availableFrom
        : l.availableFrom.toISOString()
      : null

  return (
    <Link
      href={`/wohnungen/${l.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:cursor-pointer hover:border-teal-300 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] bg-slate-100">
        {main ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={main} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <Building2 className="h-14 w-14" aria-hidden />
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          {isNew ? (
            <span className="rounded-full bg-teal-600 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
              Neu
            </span>
          ) : null}
        </div>
        {l.requiresCreditCheck ? (
          <span className="absolute right-2 top-2 rounded-full border border-teal-200 bg-white/95 px-2 py-0.5 text-[11px] font-medium text-teal-800 shadow-sm">
            📄 Betreibungsregister
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 font-bold text-slate-900 group-hover:text-teal-800">{l.title}</h3>
        <p className="mt-1 text-sm text-slate-600">
          {l.rooms} Zi. · {l.areaSqm} m²
          {l.floor != null && l.floor !== undefined ? ` · Etage ${l.floor}` : ''}
        </p>
        <p className="mt-2 text-lg font-bold text-[#18a87c]">
          CHF {l.rentPerMonth.toLocaleString('de-CH')}.— / Monat
        </p>
        {l.utilitiesPerMonth != null ? (
          <p className="text-xs text-slate-500">+ NK CHF {l.utilitiesPerMonth.toLocaleString('de-CH')}.—</p>
        ) : null}
        <p className="mt-2 flex items-center gap-1 text-xs text-slate-600">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
          {l.city} · {l.canton}
        </p>
        {avail ? (
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Verfügbar ab {new Date(avail).toLocaleDateString('de-CH')}
          </p>
        ) : null}
      </div>
    </Link>
  )
}
