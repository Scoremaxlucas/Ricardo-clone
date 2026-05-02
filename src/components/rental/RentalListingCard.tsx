'use client'

import { isVercelBlobImageUrl } from '@/lib/rental/remote-image'
import { formatCHF } from '@/lib/utils/formatCurrency'
import { formatDate } from '@/lib/utils/formatDate'
import { Building2, Calendar, MapPin } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

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
  matchScore?: number
  /** Hinweis auf Karten (z. B. /meine-matches ohne gueltigen Betreibungsregisterauszug) */
  creditCheckOverlay?: boolean
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

function matchBadge(score: number): { label: string; cls: string } {
  if (score >= 80) return { label: 'Sehr gut', cls: 'bg-emerald-600 text-white' }
  if (score >= 60) return { label: 'Gut', cls: 'border border-emerald-500 bg-white text-emerald-700' }
  return { label: 'Passabel', cls: 'bg-slate-200 text-slate-700' }
}

function ListingQualificationBadge({ listingId }: { listingId: string }) {
  const { status } = useSession()
  const [qualified, setQualified] = useState(false)

  useEffect(() => {
    if (status !== 'authenticated') {
      setQualified(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/rental-applications/qualify?listingId=${encodeURIComponent(listingId)}`, {
          credentials: 'same-origin',
        })
        const data = (await res.json().catch(() => ({}))) as { qualified?: boolean }
        if (!cancelled) setQualified(data.qualified === true)
      } catch {
        if (!cancelled) setQualified(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [listingId, status])

  if (!qualified) return null
  return (
    <span className="shrink-0 whitespace-nowrap rounded-[20px] bg-emerald-600 px-2 py-[3px] text-[11px] font-semibold text-white shadow-sm">
      ✓ Passt zu dir
    </span>
  )
}

export function RentalListingCard({
  listing: l,
  imagePriority = false,
  matchScore,
  creditCheckOverlay = false,
}: Props) {
  const main = firstPhoto(l.photos)
  const rawCreated = l.createdAt
  const createdMs =
    rawCreated instanceof Date
      ? rawCreated.getTime()
      : new Date(rawCreated as string | number).getTime()
  const isNew =
    Number.isFinite(createdMs) && Date.now() - createdMs < 48 * 60 * 60 * 1000
  const available = validDate(l.availableFrom ?? null)

  const linkClass =
    'group relative flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.07)] transition-[box-shadow,transform] duration-200 ease-in-out hover:-translate-y-[3px] hover:cursor-pointer hover:shadow-[0_8px_28px_rgba(0,0,0,0.12)]'

  const inner = (
    <>
      <div className="relative aspect-video w-full shrink-0 bg-slate-100 md:aspect-[4/3]">
        <div className="absolute inset-0 overflow-hidden rounded-t-2xl">
          {main ?
            <Image
              src={main}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 640px) 92vw, (max-width: 768px) 85vw, (max-width: 1280px) 50vw, 33vw"
              priority={imagePriority}
              unoptimized={!isVercelBlobImageUrl(main)}
            />
          : <div className="flex h-full w-full items-center justify-center text-slate-400">
              <Building2 className="h-14 w-14" aria-hidden />
            </div>
          }
        </div>
        <div className="pointer-events-none absolute left-2 top-2 z-10 flex max-w-[calc(100%-0.75rem)] flex-wrap items-start gap-1.5 pr-1">
          {isNew ?
            <span className="shrink-0 rounded-full bg-teal-600 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
              Neu
            </span>
          : null}
          <ListingQualificationBadge listingId={l.id} />
          {typeof matchScore === 'number' ? (
            <span
              className={`shrink-0 whitespace-nowrap rounded-full px-2 py-[3px] text-[11px] font-bold shadow-sm ${matchBadge(matchScore).cls}`}
              title={`Match-Score ${matchScore}`}
            >
              {matchBadge(matchScore).label}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col rounded-b-2xl p-4">
        <h3 className="line-clamp-2 min-h-[calc(17px*1.4*2)] overflow-hidden text-[17px] font-bold leading-[1.4] text-[#0d2b1f] group-hover:text-teal-800">
          {l.title}
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          {l.rooms} Zi. · {l.areaSqm} m²
          {l.floor != null && l.floor !== undefined ? ` · Etage ${l.floor}` : ''}
        </p>
        {l.matchHighlights && l.matchHighlights.length > 0 ? (
          <p className="mt-2 text-xs font-medium text-emerald-700">
            {l.matchHighlights.slice(0, 2).join(' · ')}
          </p>
        ) : null}
        {/* Füllt den Rest: Miete + Meta sitzen unten gleich hoch in Raster-Karten */}
        <div className="min-h-[0.5rem] flex-1" aria-hidden />
        <p className="text-xl font-bold text-[#18a87c] md:text-[28px] md:leading-none">{formatCHF(l.rentPerMonth)} / Monat</p>
        {l.utilitiesPerMonth != null ?
          <p className="text-xs text-slate-500">+ NK {formatCHF(l.utilitiesPerMonth)}</p>
        : <div className="h-[1.125rem]" aria-hidden />}
        <p className="mt-2 flex items-center gap-1 text-xs text-slate-600">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
          {l.city} · {l.canton}
        </p>
        {available ?
          <p className="mt-1 flex min-h-[1.125rem] items-center gap-1 text-xs text-slate-500">
            <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Verfügbar ab {formatDate(available)}
          </p>
        : <div className="mt-1 min-h-[1.125rem]" aria-hidden />}
      </div>
    </>
  )

  if (!creditCheckOverlay) {
    return (
      <Link href={`/wohnungen/${l.id}`} className={linkClass}>
        {inner}
      </Link>
    )
  }

  return (
    <div className="relative h-full min-h-0">
      <Link href={`/wohnungen/${l.id}`} className={`${linkClass} pointer-events-none`} tabIndex={-1}>
        {inner}
      </Link>
      <div className="absolute inset-0 z-20 flex items-end justify-center rounded-2xl bg-slate-900/50 pb-6">
        <Link
          href="/profil/betreibungsregister"
          className="rounded-full bg-white px-4 py-2.5 text-center text-xs font-bold text-[#0d2b1f] shadow-lg ring-2 ring-[#18a87c] hover:bg-[#f5fdfb]"
        >
          Betreibungsregister erforderlich
        </Link>
      </div>
    </div>
  )
}
