'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

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

// Separate Komponente für die Map - wird nur gerendert wenn Module geladen sind
function LeafletMap({
  watches,
  center,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  L,
}: {
  watches: NearbyWatch[]
  center: { lat: number; lon: number } | null
  MapContainer: any
  Marker: any
  Popup: any
  TileLayer: any
  useMap: any
  L: any
}) {
  // Komponente zum Anpassen der Karte an Marker
  function MapBounds({ watches }: { watches: NearbyWatch[] }) {
    const map = useMap()

    useEffect(() => {
      if (watches.length === 0 || !L) return

      const bounds = L.latLngBounds(watches.map(w => [w.coordinates.lat, w.coordinates.lon]))
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 })
    }, [watches, map, L])

    return null
  }

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

export default function LocationMapInner({ watches, center }: LocationMapInnerProps) {
  const [MapComponents, setMapComponents] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Dynamisch Leaflet-Module nur im Browser laden
    if (typeof window === 'undefined') {
      setIsLoading(false)
      return
    }

    const loadMap = async () => {
      try {
        // Dynamisch CSS laden (nur client-side)
        if (typeof document !== 'undefined') {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
          link.integrity = 'sha256-p4NxAoJBh7IN4omJ5s0/l4hvYy8pqReJzQ57sBXv1Mw='
          link.crossOrigin = ''
          document.head.appendChild(link)
        }

        const [L, reactLeaflet] = await Promise.all([
          import('leaflet'),
          import('react-leaflet'),
        ])

        const LModule = L.default || L
        const { MapContainer, Marker, Popup, TileLayer, useMap } = reactLeaflet

        // Fix für Leaflet-Icons in Next.js
        if (LModule.Icon && LModule.Icon.Default) {
          delete (LModule.Icon.Default.prototype as any)._getIconUrl
          LModule.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          })
        }

        setMapComponents({
          MapContainer,
          Marker,
          Popup,
          TileLayer,
          useMap,
          L: LModule,
        })
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading Leaflet:', error)
        setIsLoading(false)
      }
    }

    loadMap()
  }, [])

  if (isLoading || !MapComponents) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <LeafletMap
      watches={watches}
      center={center}
      {...MapComponents}
    />
  )
}
