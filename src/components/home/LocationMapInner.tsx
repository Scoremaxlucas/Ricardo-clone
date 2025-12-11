'use client'

import L from 'leaflet'
import Link from 'next/link'
import { useEffect } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'

// Fix für Leaflet-Icons in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

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

interface LocationMapInnerProps {
  watches: NearbyWatch[]
  center: { lat: number; lon: number } | null
}

// Komponente zum Anpassen der Karte an Marker
function MapBounds({ watches }: { watches: NearbyWatch[] }) {
  const map = useMap()

  useEffect(() => {
    if (watches.length === 0 || !L) return

    const bounds = L.latLngBounds(watches.map(w => [w.coordinates.lat, w.coordinates.lon]))
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 })
  }, [watches, map])

  return null
}

export default function LocationMapInner({ watches, center }: LocationMapInnerProps) {
  // Standard-Zentrum: Schweiz (Bern)
  const defaultCenter: [number, number] = [46.9481, 7.4474]
  const defaultZoom = 8

  return (
    <MapContainer
      center={center ? [center.lat, center.lon] : defaultCenter}
      zoom={center ? 11 : defaultZoom}
      className="h-full w-full"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapBounds watches={watches} />
      {watches.map(watch => (
        <Marker key={watch.id} position={[watch.coordinates.lat, watch.coordinates.lon]}>
          <Popup>
            <div className="max-w-[200px]">
              <Link
                href={`/products/${watch.id}`}
                className="font-semibold text-primary-600 hover:text-primary-700"
              >
                {watch.title}
              </Link>
              <p className="mt-1 text-sm text-gray-600">
                {watch.brand && watch.model
                  ? `${watch.brand} ${watch.model}`
                  : watch.brand || watch.model || ''}
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                CHF {watch.price.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-gray-500">{watch.distance} km entfernt</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

