'use client'

import { useRef, useEffect, useState } from 'react'
import { ExternalLink, MapPin } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface PickupMapProps {
  city: string
  postalCode: string
}

// Schweizer PLZ zu ungefähren Koordinaten (Hauptorte)
const swissPostalCodeCoords: Record<string, { lat: number; lng: number }> = {
  '1': { lat: 46.52, lng: 6.63 },   // Lausanne/Genf Region
  '2': { lat: 47.00, lng: 6.93 },   // Neuchâtel/La Chaux-de-Fonds
  '3': { lat: 46.95, lng: 7.45 },   // Bern Region
  '4': { lat: 47.55, lng: 7.58 },   // Basel Region
  '5': { lat: 47.39, lng: 8.05 },   // Aarau/Solothurn Region
  '6': { lat: 47.05, lng: 8.30 },   // Luzern/Zug Region
  '7': { lat: 46.85, lng: 9.53 },   // Chur/Graubünden Region
  '8': { lat: 47.37, lng: 8.54 },   // Zürich Region
  '9': { lat: 47.42, lng: 9.37 },   // St. Gallen Region
}

function getCoordinatesForPostalCode(postalCode: string): { lat: number; lng: number } {
  // Default: Schweiz Mitte
  const defaultCoords = { lat: 46.8182, lng: 8.2275 }
  
  if (!postalCode) return defaultCoords
  
  const firstDigit = postalCode.charAt(0)
  return swissPostalCodeCoords[firstDigit] || defaultCoords
}

export function PickupMap({ city, postalCode }: PickupMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const { t } = useLanguage()
  const [mapLoaded, setMapLoaded] = useState(false)

  const displayLocation = postalCode && city
    ? `${postalCode} ${city}`
    : postalCode || city || 'Schweiz'

  // Koordinaten basierend auf PLZ
  const coords = getCoordinatesForPostalCode(postalCode)
  
  // OpenStreetMap Embed URL - funktioniert ohne CSP-Probleme
  const openStreetMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - 0.05}%2C${coords.lat - 0.03}%2C${coords.lng + 0.05}%2C${coords.lat + 0.03}&layer=mapnik&marker=${coords.lat}%2C${coords.lng}`
  
  // Google Maps Link für Navigation
  const searchQuery = postalCode && city
    ? `${postalCode} ${city}, Schweiz`
    : city
      ? `${city}, Schweiz`
      : 'Schweiz'
  const googleMapsLink = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      {/* Karte wie Ricardo - Einfach mit Button oben */}
      <div
        ref={mapRef}
        className="relative h-48 w-full overflow-hidden bg-gray-100 md:h-64"
      >
        {/* OpenStreetMap Embed */}
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          src={openStreetMapUrl}
          style={{ border: 0 }}
          title={`Karte von ${displayLocation}`}
          loading="lazy"
          onLoad={() => setMapLoaded(true)}
        />
        
        {/* Loading Placeholder */}
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <MapPin className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Karte wird geladen...</p>
            </div>
          </div>
        )}
        
        {/* Standort-Badge oben rechts */}
        <div className="absolute right-3 top-3 rounded bg-white/90 px-2 py-1 text-xs font-medium text-gray-700 shadow">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-primary-600" />
            {displayLocation}
          </div>
        </div>
        
        {/* WEGBESCHREIBUNG Button - Wie Ricardo oben-links auf der Karte */}
        <a
          href={googleMapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute left-3 top-3 flex items-center gap-1.5 rounded bg-primary-600 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-lg transition-colors hover:bg-primary-700 md:text-sm"
        >
          {t.product.directions}
          <ExternalLink className="h-3.5 w-3.5 md:h-4 md:w-4" />
        </a>
      </div>
    </div>
  )
}
