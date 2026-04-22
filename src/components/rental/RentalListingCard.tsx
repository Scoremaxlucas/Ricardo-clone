import { isVercelBlobImageUrl } from '@/lib/rental/remote-image'
import { formatCHF } from '@/lib/utils/formatCurrency'
import { formatDate } from '@/lib/utils/formatDate'
import { Building2, Calendar, MapPin } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { RentalQualificationBadge } from '@/components/rental/RentalQualificationBadge'

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
  matchScore?: number
  matchHighlights?: string[]
}

type Props = {
  listing: RentalListingCardData
  /** LCP: erstes Bild auf der Seite priorisieren */
  imagePriority?: boolean
  emphasizeMatch?: boolean
}

function firstPhoto(urls: string[]): string | null {
  const u = urls[0]?.trim()
  if (!u) return null
  if (u.startsWith('https://') || u.startsWith('http://') || u.startsWith('//')) return u
  return null
}

/** Avoids RangeError from `toISOString()` / Intl when DB or JSON has invalid dates. */
function validDate(d: string | Date | null | undefined): Date | null {
  if (d == null || d === '') return null
  const dt = d instanceof Date ? d : new Date(d)
  return Number.isNaN(dt.getTime()) ? null : dt
}

export function RentalListingCard({ listing: l, imagePriority = false, emphasizeMatch = false }: Props) {
  const main = firstPhoto(l.photos)
  const now = Date.now()
  const created = validDate(l.createdAt)
  const isNew = created != null && now - created.getTime() < 48 * 3600000
  const available = validDate(l.availableFrom ?? null)

  return (
    <Link
      href={`/wohnungen/${l.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:cursor-pointer hover:border-teal-300 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] bg-slate-100">
        {main ?
          <Image
            src={main}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            priority={imagePriority}
            unoptimized={!isVercelBlobImageUrl(main)}
          />
        : <div className="flex h-full w-full items-center justify-center text-slate-400">
            <Building2 className="h-14 w-14" aria-hidden />
          </div>
        }
        <div className="pointer-events-none absolute left-2 top-2 flex flex-wrap gap-1.5">
          {isNew ?
            <span className="rounded-full bg-teal-600 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
              Neu
            </span>
          : null}
          <RentalQualificationBadge listingId={l.id} />
          {typeof l.matchScore === 'number' ? (
            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
              Match {l.matchScore}%
            </span>
          ) : null}
        </div>
        {l.requiresCreditCheck ?
          <span className="pointer-events-none absolute right-2 top-2 rounded-full border border-teal-200 bg-white/95 px-2 py-0.5 text-[11px] font-medium text-teal-800 shadow-sm">
            📄 Betreibungsregister
          </span>
        : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        {emphasizeMatch && typeof l.matchScore === 'number' ? (
          <div className="mb-2 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5">
            <p className="text-xs font-semibold text-emerald-900">Passend für dich</p>
            <p className="text-sm font-extrabold text-emerald-700">{l.matchScore}% Match</p>
          </div>
        ) : null}
        <h3 className="line-clamp-1 font-bold text-slate-900 group-hover:text-teal-800">{l.title}</h3>
        <p className="mt-1 text-sm text-slate-600">
          {l.rooms} Zi. · {l.areaSqm} m²
          {l.floor != null && l.floor !== undefined ? ` · Etage ${l.floor}` : ''}
        </p>
        <p className="mt-2 text-lg font-bold text-[#18a87c]">{formatCHF(l.rentPerMonth)} / Monat</p>
        {l.utilitiesPerMonth != null ?
          <p className="text-xs text-slate-500">+ NK {formatCHF(l.utilitiesPerMonth)}</p>
        : null}
        <p className="mt-2 flex items-center gap-1 text-xs text-slate-600">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
          {l.city} · {l.canton}
        </p>
        {available ?
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Verfügbar ab {formatDate(available)}
          </p>
        : null}
        {l.matchHighlights && l.matchHighlights.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {l.matchHighlights.slice(0, 3).map((reason, idx) => (
              <span
                key={`${reason}-${idx}`}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
              >
                {reason}
              </span>
            ))}
          </div>
        ) : null}
        {emphasizeMatch ? (
          <div className="mt-3 flex gap-2">
            <span className="inline-flex min-h-[34px] items-center rounded-md bg-emerald-600 px-3 text-xs font-semibold text-white">
              Jetzt bewerben
            </span>
            <span className="inline-flex min-h-[34px] items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700">
              Merken
            </span>
          </div>
        ) : null}
      </div>
    </Link>
  )
}
