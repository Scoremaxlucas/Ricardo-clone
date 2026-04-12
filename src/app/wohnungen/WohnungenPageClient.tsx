'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { SWISS_CANTONS } from '@/lib/swiss-cantons'
import { Loader2, MapPin } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

type RentalCard = {
  id: string
  title: string
  postalCode: string
  canton: string
  rooms: number
  livingAreaM2: number
  floor: string
  monthlyRentChf: number
  extraCostsChf: number
  availableFrom: string
  imageUrls: string[]
  seller: { nickname: string | null; name: string | null }
}

export function WohnungenPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [listings, setListings] = useState<RentalCard[]>([])

  const postalCode = searchParams.get('postalCode') || ''
  const canton = searchParams.get('canton') || ''
  const minRooms = searchParams.get('minRooms') || ''
  const maxRooms = searchParams.get('maxRooms') || ''
  const maxRent = searchParams.get('maxRent') || ''

  const fetchListings = useCallback(async () => {
    setLoading(true)
    try {
      const sp = new URLSearchParams()
      if (postalCode) sp.set('postalCode', postalCode)
      if (canton) sp.set('canton', canton)
      if (minRooms) sp.set('minRooms', minRooms)
      if (maxRooms) sp.set('maxRooms', maxRooms)
      if (maxRent) sp.set('maxRent', maxRent)
      const res = await fetch(`/api/rental-listings?${sp.toString()}`)
      const data = await res.json()
      setListings(data.listings || [])
    } catch {
      setListings([])
    } finally {
      setLoading(false)
    }
  }, [postalCode, canton, minRooms, maxRooms, maxRent])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  const applyFilters = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const sp = new URLSearchParams()
    const pc = (fd.get('postalCode') as string)?.trim()
    const ct = (fd.get('canton') as string)?.trim()
    const minR = (fd.get('minRooms') as string)?.trim()
    const maxR = (fd.get('maxRooms') as string)?.trim()
    const maxM = (fd.get('maxRent') as string)?.trim()
    if (pc) sp.set('postalCode', pc)
    if (ct) sp.set('canton', ct)
    if (minR) sp.set('minRooms', minR)
    if (maxR) sp.set('maxRooms', maxR)
    if (maxM) sp.set('maxRent', maxM)
    router.push(sp.toString() ? `/wohnungen?${sp.toString()}` : '/wohnungen')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Mietwohnungen</h1>
        <p className="mb-6 text-sm text-gray-600">Inserate von Helvenda-Nutzern — Filter nach Region und Budget.</p>

        <form
          onSubmit={applyFilters}
          className="mb-8 grid gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6"
        >
          <input
            name="postalCode"
            defaultValue={postalCode}
            placeholder="PLZ"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <select
            name="canton"
            defaultValue={canton}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Kanton (alle)</option>
            {SWISS_CANTONS.map(c => (
              <option key={c.code} value={c.code}>
                {c.code}
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
            name="maxRooms"
            type="number"
            step={0.5}
            min={0.5}
            defaultValue={maxRooms}
            placeholder="Zimmer max."
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            name="maxRent"
            type="number"
            min={0}
            defaultValue={maxRent}
            placeholder="Max. Miete CHF"
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
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="aspect-[4/3] bg-gray-100">
                  {l.imageUrls[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.imageUrls[0]} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="p-4">
                  <h2 className="font-semibold text-gray-900 line-clamp-2">{l.title}</h2>
                  <p className="mt-1 flex items-center gap-1 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {l.postalCode} {l.canton} · {l.rooms} Zi. · {l.livingAreaM2} m²
                  </p>
                  <p className="mt-2 text-lg font-bold text-primary-700">
                    CHF {Math.round(l.monthlyRentChf).toLocaleString('de-CH')}{' '}
                    <span className="text-sm font-normal text-gray-500">
                      + NK CHF {Math.round(l.extraCostsChf).toLocaleString('de-CH')}
                    </span>
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
