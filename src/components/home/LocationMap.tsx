'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { MapPin, Search, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState } from 'react'

interface NearbyWatch {
  id: string
  title: string
  brand: string | null
  model: string | null
  price: number
  images: string[]
  postalCode: string | null
  city: string | null
  distance: number
  coordinates: { lat: number; lon: number }
  isAuction: boolean
  auctionEnd: Date | null
  seller: {
    id: string
    name: string | null
    city: string | null
  }
}

interface LocationMapProps {
  className?: string
}

// Dynamisches Laden der Leaflet-Map (nur client-side)
const DynamicMap = dynamic(() => import('./LocationMapInner'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
    </div>
  ),
})

export function LocationMap({ className }: LocationMapProps) {
  const { t } = useLanguage()
  const [postalCode, setPostalCode] = useState('')
  const [radius, setRadius] = useState(10)
  const [watches, setWatches] = useState<NearbyWatch[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [center, setCenter] = useState<{ lat: number; lon: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const searchNearby = async () => {
    if (!postalCode || postalCode.length !== 4) {
      setError('Bitte geben Sie eine 4-stellige Postleitzahl ein.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/watches/nearby?postalCode=${postalCode}&radius=${radius}&limit=20`
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Fehler beim Laden der Produkte')
      }

      const data = await response.json()
      setWatches(data.watches || [])
      setCenter(data.center?.coordinates || null)
    } catch (err: any) {
      console.error('Error fetching nearby watches:', err)
      setError(err.message || 'Fehler beim Laden der Produkte')
      setWatches([])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      searchNearby()
    }
  }

  const clearSearch = () => {
    setPostalCode('')
    setWatches([])
    setCenter(null)
    setError(null)
    inputRef.current?.focus()
  }

  return (
    <section className={`bg-white py-16 ${className || ''}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Produkte in Ihrer Nähe</h2>
          <p className="mt-4 text-lg text-gray-600">Finden Sie Produkte in Ihrer Umgebung</p>
        </div>

        {/* Suchfeld */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
          <div className="relative max-w-md flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MapPin className="h-5 w-5 text-gray-400" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={postalCode}
              onChange={e => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                setPostalCode(value)
                setError(null)
              }}
              onKeyPress={handleKeyPress}
              placeholder="Postleitzahl (z.B. 8000)"
              className="block w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-10 text-base placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm"
            />
            {postalCode && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                aria-label="Suche zurücksetzen"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="radius-select" className="text-sm text-gray-700">
              Radius:
            </label>
            <select
              id="radius-select"
              value={radius}
              onChange={e => setRadius(Number(e.target.value))}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="5">5 km</option>
              <option value="10">10 km</option>
              <option value="20">20 km</option>
              <option value="50">50 km</option>
            </select>
          </div>

          <button
            onClick={searchNearby}
            disabled={loading || !postalCode || postalCode.length !== 4}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>Suchen...</span>
              </>
            ) : (
              <>
                <Search className="h-5 w-5" />
                <span>Suchen</span>
              </>
            )}
          </button>
        </div>

        {/* Fehlermeldung */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-center text-red-800">{error}</div>
        )}

        {/* Karte und Produktliste */}
        {watches.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Karte */}
            <div className="h-[500px] w-full overflow-hidden rounded-lg border border-gray-200 shadow-lg">
              <DynamicMap watches={watches} center={center} />
            </div>

            {/* Produktliste */}
            <div className="max-h-[500px] space-y-4 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {watches.length} Produkt{watches.length !== 1 ? 'e' : ''} gefunden
              </h3>
              {watches.map(watch => (
                <Link
                  key={watch.id}
                  href={`/products/${watch.id}`}
                  className="block rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex gap-4">
                    {/* Bild */}
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                      {watch.images && watch.images.length > 0 ? (
                        <Image
                          src={watch.images[0]}
                          alt={watch.title}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-400">
                          <MapPin className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate font-semibold text-gray-900">{watch.title}</h4>
                      {(watch.brand || watch.model) && (
                        <p className="truncate text-sm text-gray-600">
                          {watch.brand && watch.model
                            ? `${watch.brand} ${watch.model}`
                            : watch.brand || watch.model}
                        </p>
                      )}
                      <div className="mt-1 flex items-center justify-between">
                        <span className="font-semibold text-primary-600">
                          CHF {watch.price.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-500">{watch.distance} km</span>
                      </div>
                      {watch.city && <p className="mt-1 text-xs text-gray-500">{watch.city}</p>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Leerer Zustand */}
        {!loading && watches.length === 0 && postalCode && !error && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
            <MapPin className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Keine Produkte gefunden</h3>
            <p className="mt-2 text-gray-600">
              Versuchen Sie einen größeren Radius oder eine andere Postleitzahl.
            </p>
          </div>
        )}

        {/* Initialer Zustand */}
        {!postalCode && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
            <MapPin className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              Geben Sie eine Postleitzahl ein
            </h3>
            <p className="mt-2 text-gray-600">Finden Sie Produkte in Ihrer Umgebung</p>
          </div>
        )}
      </div>
    </section>
  )
}

