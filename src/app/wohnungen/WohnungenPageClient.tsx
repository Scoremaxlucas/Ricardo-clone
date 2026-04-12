'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { SWISS_CANTONS } from '@/lib/swiss-cantons'
import { Loader2, MapPin, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

type RentalCard = {
  id: string
  title: string
  zip: string
  city: string
  canton: string
  rooms: number
  areaSqm: number
  rentPerMonth: number
  utilitiesPerMonth: number | null
  availableFrom: string
  requiresCreditCheck: boolean
  imageUrls: string[]
}

export function WohnungenPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [listings, setListings] = useState<RentalCard[]>([])

  const canton = searchParams.get('canton') || ''
  const minRooms = searchParams.get('minRooms') || ''
  const maxRent = searchParams.get('maxRent') || ''
  const availableFrom = searchParams.get('availableFrom') || ''

  const fetchListings = useCallback(async () => {
    setLoading(true)
    try {
      const sp = new URLSearchParams()
      if (canton) sp.set('canton', canton)
      if (minRooms) sp.set('minRooms', minRooms)
      if (maxRent) sp.set('maxRent', maxRent)
      if (availableFrom) sp.set('availableFrom', availableFrom)
      const res = await fetch(`/api/rental-listings?${sp.toString()}`)
      const data = await res.json()
      setListings(data.listings || [])
    } catch {
      setListings([])
    } finally {
      setLoading(false)
    }
  }, [canton, minRooms, maxRent, availableFrom])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  const applyFilters = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const sp = new URLSearchParams()
    const ct = (fd.get('canton') as string)?.trim()
    const minR = (fd.get('minRooms') as string)?.trim()
    const maxM = (fd.get('maxRent') as string)?.trim()
    const av = (fd.get('availableFrom') as string)?.trim()
    if (ct) sp.set('canton', ct)
    if (minR) sp.set('minRooms', minR)
    if (maxM) sp.set('maxRent', maxM)
    if (av) sp.set('availableFrom', av)
    router.push(sp.toString() ? `/wohnungen?${sp.toString()}` : '/wohnungen')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Mietwohnungen</h1>
        <p className="mb-6 text-sm text-gray-600">Aktive Inserate auf Helvenda — nach Region und Budget filtern.</p>

        <form
          onSubmit={applyFilters}
          className="mb-8 grid gap-3 rounded-xl border border-teal-100 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5"
        >
          <select
            name="canton"
            defaultValue={canton}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Kanton (alle)</option>
            {SWISS_CANTONS.map(c => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
          <input
            name="minRooms"
            type="number"
            step={0.5}
            min={0.5}
            defaultValue={minRooms}
            placeholder="Zimmer min."
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            name="maxRent"
            type="number"
            min={0}
            defaultValue={maxRent}
            placeholder="Max. Miete CHF / Monat"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            name="availableFrom"
            type="date"
            defaultValue={availableFrom}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Filtern
          </button>
        </form>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
          </div>
        ) : listings.length === 0 ? (
          <p className="py-12 text-center text-gray-600">Keine Inserate gefunden.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map(l => (
              <Link
                key={l.id}
                href={`/wohnungen/${l.id}`}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:border-teal-200 hover:shadow-md"
              >
                <div className="relative aspect-[4/3] bg-gray-100">
                  {l.imageUrls[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.imageUrls[0]} alt="" className="h-full w-full object-cover" />
                  ) : null}
                  {l.requiresCreditCheck && (
                    <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-teal-700/95 px-2 py-0.5 text-[11px] font-medium text-white">
                      <ShieldCheck className="h-3 w-3" />
                      Betreibungsregister
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h2 className="font-semibold text-gray-900 line-clamp-2">{l.title}</h2>
                  <p className="mt-1 flex items-center gap-1 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {l.zip} {l.city} · {l.rooms} Zi. · {l.areaSqm} m²
                  </p>
                  <p className="mt-2 text-lg font-bold text-primary-700">
                    CHF {l.rentPerMonth.toLocaleString('de-CH')} / Monat
                    {l.utilitiesPerMonth != null ? (
                      <span className="text-sm font-normal text-gray-500">
                        {' '}
                        + NK CHF {l.utilitiesPerMonth.toLocaleString('de-CH')}
                      </span>
                    ) : (
                      <span className="text-sm font-normal text-gray-500"> · NK optional</span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Verfügbar ab {new Date(l.availableFrom).toLocaleDateString('de-CH')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
