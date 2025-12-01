'use client'

import { useEffect, useRef } from 'react'
import { MapPin } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface PickupMapProps {
  city: string
  postalCode: string
}

export function PickupMap({ city, postalCode }: PickupMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const { t } = useLanguage()

  // Erstelle Suchstring für OpenStreetMap
  const searchQuery = postalCode && city
    ? `${postalCode} ${city}, Schweiz`
    : city
      ? `${city}, Schweiz`
      : 'Schweiz'

  const displayLocation = postalCode && city
    ? `${postalCode} ${city}`
    : postalCode || city || 'Schweiz'

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary-600" />
        <h3 className="text-lg font-bold text-gray-900">{t.product.directions}</h3>
      </div>

      {/* Interaktive Karte (OpenStreetMap Embed) */}
      <div
        ref={mapRef}
        className="relative mb-4 h-64 w-full overflow-hidden rounded-lg border border-gray-300 bg-gray-100"
      >
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={`https://www.openstreetmap.org/export/embed.html?bbox=8.2889%2C47.0443%2C8.3189%2C47.0643&layer=mapnik&zoom=14&q=${encodeURIComponent(searchQuery)}`}
          style={{ border: 0 }}
          title={`Karte von ${displayLocation}`}
          allowFullScreen
        />
        {/* Overlay mit Standort-Info */}
        <div className="absolute bottom-2 left-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-red-500" />
            <div>
              <div className="text-sm font-bold text-gray-900">
                {displayLocation}
              </div>
              <div className="text-xs text-gray-600">{t.product.pickupLocation}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Adress-Info */}
      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
          <div>
            <div className="text-sm text-gray-600">{t.product.postalCodeCity}</div>
            <div className="font-semibold text-gray-900">
              {displayLocation}
            </div>
          </div>
          <a
            href={`https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            {t.product.openInGoogleMaps} →
          </a>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
          <div className="text-sm text-blue-800">
            <strong>{t.product.note}:</strong> {t.product.addressNote}
          </div>
        </div>
      </div>
    </div>
  )
}
