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

  // Für eine echte Implementation würde man hier Google Maps oder Leaflet.js verwenden
  // Da wir keine API-Keys haben, zeigen wir eine statische Karte mit Standort-Info

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-5 w-5 text-primary-600" />
        <h3 className="text-lg font-bold text-gray-900">{t.product.directions}</h3>
      </div>

      {/* Interaktive Karte (OpenStreetMap Embed) */}
      <div 
        ref={mapRef}
        className="w-full h-64 bg-gray-100 rounded-lg mb-4 border border-gray-300 relative overflow-hidden"
      >
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={`https://www.openstreetmap.org/export/embed.html?bbox=8.2889%2C47.0443%2C8.3189%2C47.0643&layer=mapnik&marker=47.0543%2C8.3039&zoom=14`}
          style={{ border: 0 }}
          title={`Karte von ${postalCode} ${city}`}
        />
        {/* Overlay mit Standort-Info */}
        <div className="absolute bottom-2 left-2 bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-red-500" />
          <div>
            <div className="font-bold text-gray-900 text-sm">{postalCode} {city}</div>
            <div className="text-xs text-gray-600">{t.product.pickupLocation}</div>
          </div>
          </div>
        </div>
      </div>

      {/* Adress-Info */}
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <div className="text-sm text-gray-600">{t.product.postalCodeCity}</div>
            <div className="font-semibold text-gray-900">{postalCode} {city}</div>
          </div>
          <a
            href={`https://www.google.com/maps/search/${encodeURIComponent(postalCode + ' ' + city)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            {t.product.openInGoogleMaps} →
          </a>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <strong>{t.product.note}:</strong> {t.product.addressNote}
          </div>
        </div>
      </div>
    </div>
  )
}

