'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, MapPin, Navigation } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface PickupMapProps {
  city: string
  postalCode: string
}

// Schweizer PLZ zu ungefähren Koordinaten (Hauptorte) - erweitert
const swissPostalCodeCoords: Record<string, { lat: number; lng: number; name: string }> = {
  '1': { lat: 46.52, lng: 6.63, name: 'Genfersee-Region' },
  '2': { lat: 47.00, lng: 6.93, name: 'Neuchâtel-Region' },
  '3': { lat: 46.95, lng: 7.45, name: 'Bern-Region' },
  '4': { lat: 47.55, lng: 7.58, name: 'Basel-Region' },
  '5': { lat: 47.39, lng: 8.05, name: 'Aarau-Region' },
  '6': { lat: 47.05, lng: 8.30, name: 'Luzern-Region' },
  '7': { lat: 46.85, lng: 9.53, name: 'Graubünden' },
  '8': { lat: 47.37, lng: 8.54, name: 'Zürich-Region' },
  '9': { lat: 47.42, lng: 9.37, name: 'St. Gallen-Region' },
}

function getCoordinatesForPostalCode(postalCode: string): { lat: number; lng: number; name: string } {
  const defaultCoords = { lat: 46.8182, lng: 8.2275, name: 'Schweiz' }
  if (!postalCode) return defaultCoords
  const firstDigit = postalCode.charAt(0)
  return swissPostalCodeCoords[firstDigit] || defaultCoords
}

export function PickupMap({ city, postalCode }: PickupMapProps) {
  const { t } = useLanguage()
  const [mapError, setMapError] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)

  const displayLocation = postalCode && city
    ? `${postalCode} ${city}`
    : postalCode || city || 'Schweiz'

  const coords = getCoordinatesForPostalCode(postalCode)

  // Google Maps Link für Navigation
  const searchQuery = postalCode && city
    ? `${postalCode} ${city}, Schweiz`
    : city
      ? `${city}, Schweiz`
      : 'Schweiz'
  const googleMapsLink = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`
  
  // Google Maps Embed URL - wie Ricardo
  const googleMapsEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(searchQuery)}&output=embed`

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="relative w-full overflow-hidden" style={{ height: '280px' }}>
        {/* Google Maps Embed - wie Ricardo */}
        {!mapError ? (
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            src={googleMapsEmbedUrl}
            style={{ border: 0 }}
            title={`Karte von ${displayLocation}`}
            loading="lazy"
            onLoad={() => setMapLoaded(true)}
            onError={() => setMapError(true)}
            allow="geolocation"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          // Fallback: Statische Karte mit Link
          <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 p-6">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
              <MapPin className="h-8 w-8 text-primary-600" />
            </div>
            <p className="mb-1 text-lg font-semibold text-gray-900">{displayLocation}</p>
            <p className="mb-4 text-sm text-gray-500">{coords.name}</p>
            <a
              href={googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-primary-700"
            >
              <Navigation className="h-4 w-4" />
              Auf Google Maps öffnen
            </a>
          </div>
        )}

        {/* Loading Placeholder */}
        {!mapLoaded && !mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary-600"></div>
              <p className="text-sm text-gray-500">Karte wird geladen...</p>
            </div>
          </div>
        )}

        {/* WEGBESCHREIBUNG Button - Wie Ricardo oben-links auf der Karte */}
        {!mapError && (
          <a
            href={googleMapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute left-3 top-3 flex items-center gap-1.5 rounded bg-primary-600 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-lg transition-colors hover:bg-primary-700 md:text-sm"
          >
            {t.product.directions}
            <ExternalLink className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </a>
        )}
      </div>
    </div>
  )
}
