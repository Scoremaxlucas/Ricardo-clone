'use client'

import { RentalListingCard, type RentalListingCardData } from '@/components/rental/RentalListingCard'
import { WohnenEmptyState } from '@/components/wohnen/WohnenEmptyState'
import { Building2, Search } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type ApiListing = {
  id: string
  title: string
  city: string
  canton: string
  rooms: number
  areaSqm: number
  floor: number | null
  rentPerMonth: number
  utilitiesPerMonth: number | null
  availableFrom: string
  requiresCreditCheck: boolean
  createdAt: string
  imageUrls: string[]
  matchScore?: number
  matchHighlights?: string[]
}

type ApiMeta = {
  mode: 'all' | 'match'
  isLoggedIn: boolean
  needsPreferences: boolean
  totalMatched: number
  rolloutEnabled?: boolean
  rolloutReason?: string
}

type ApiResponse = {
  listings: ApiListing[]
  meta: ApiMeta
}

type Props = {
  activeCount: number
}

function toCardData(listing: ApiListing): RentalListingCardData {
  return {
    id: listing.id,
    title: listing.title,
    city: listing.city,
    canton: listing.canton,
    rooms: Number(listing.rooms),
    areaSqm: Number(listing.areaSqm),
    floor: listing.floor,
    rentPerMonth: listing.rentPerMonth,
    utilitiesPerMonth: listing.utilitiesPerMonth,
    availableFrom: listing.availableFrom,
    photos: listing.imageUrls || [],
    requiresCreditCheck: listing.requiresCreditCheck,
    createdAt: new Date(listing.createdAt),
    matchScore: listing.matchScore,
    matchHighlights: listing.matchHighlights,
  }
}

function buildApiUrl(sp: URLSearchParams | Readonly<URLSearchParams>): string {
  const p = new URLSearchParams(sp.toString())
  p.delete('mode')
  const q = p.toString()
  return q ? `/api/rental-listings?${q}` : '/api/rental-listings'
}

export function WohnungenListingsFeed({ activeCount }: Props) {
  const sp = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<ApiResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const url = useMemo(() => buildApiUrl(sp), [sp])

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    async function run() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(url, { signal: controller.signal, credentials: 'same-origin' })
        const json = (await res.json()) as ApiResponse | { message?: string }
        if (!res.ok) {
          throw new Error((json as { message?: string }).message || 'Fehler beim Laden')
        }
        if (!cancelled) setData(json as ApiResponse)
      } catch (e: unknown) {
        if (cancelled || controller.signal.aborted) return
        setError(e instanceof Error ? e.message : 'Fehler beim Laden')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [url])

  const listings = (data?.listings ?? []).map(toCardData)
  const meta: ApiMeta = data?.meta ?? {
    mode: 'all',
    isLoggedIn: false,
    needsPreferences: false,
    totalMatched: 0,
    rolloutEnabled: true,
    rolloutReason: 'enabled',
  }

  const globalEmpty = !isLoading && listings.length === 0 && activeCount === 0
  const filteredEmpty = !isLoading && listings.length === 0 && activeCount > 0

  return (
    <section className="pt-2 sm:pt-4" id="wohnungen-ergebnisse">
      <h1 className="text-[28px] font-extrabold leading-tight text-[#0d2b1f] sm:text-[32px]">Mietwohnungen in der Schweiz</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-[17px]">
        Alle aktiven Inserate durchsuchen — mit Suche, Budget, Fläche, Zimmerzahl, Einzugsdatum und Sortierung. Für
        deine gespeicherten Kriterien und Score nutze{' '}
        <Link href="/meine-matches" className="font-semibold text-teal-700 underline-offset-2 hover:underline">
          Meine Matches
        </Link>
        .
      </p>

      {isLoading ? (
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[330px] animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
          ))}
        </div>
      ) : error ? (
        <div className="mt-10 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          {error}
        </div>
      ) : globalEmpty ? (
        <div className="mt-16">
          <WohnenEmptyState
            icon={Building2}
            title="Noch keine Wohnungen inseriert"
            description="Sobald Inserate live sind, erscheinen sie hier."
            actionHref="/matching/properties/new"
            actionLabel="Erste Wohnung inserieren"
          />
        </div>
      ) : (
        <>
          <p className="mt-8 text-sm font-medium text-slate-700">
            {filteredEmpty ? (
              <>Keine Wohnungen gefunden — Filter anpassen oder später nochmal schauen.</>
            ) : (
              <>
                {listings.length} Wohnung{listings.length === 1 ? '' : 'en'} gefunden
              </>
            )}
          </p>

          {filteredEmpty ? (
            <div className="mt-10">
              <WohnenEmptyState
                icon={Search}
                title="Keine Wohnungen gefunden"
                description="Passe die Filter an oder setze sie zurück."
                actionHref="/wohnungen"
                actionLabel="Filter zurücksetzen"
              />
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {listings.map(row => (
                <RentalListingCard key={row.id} listing={row} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
