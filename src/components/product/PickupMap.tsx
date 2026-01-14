'use client'

import { useRef } from 'react'
import { ExternalLink } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface PickupMapProps {
  city: string
  postalCode: string
}

export function PickupMap({ city, postalCode }: PickupMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const { t } = useLanguage()

  // Erstelle Suchstring für Google Maps
  const searchQuery = postalCode && city
    ? `${postalCode} ${city}, Schweiz`
    : city
      ? `${city}, Schweiz`
      : 'Schweiz'

  const displayLocation = postalCode && city
    ? `${postalCode} ${city}`
    : postalCode || city || 'Schweiz'

  // Google Maps Embed URL (Static Map für bessere Performance)
  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(searchQuery)}&t=&z=13&ie=UTF8&iwloc=&output=embed`
  const googleMapsLink = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      {/* Karte wie Ricardo - Einfach mit Button oben */}
      <div
        ref={mapRef}
        className="relative h-48 w-full overflow-hidden bg-gray-100 md:h-64"
      >
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={googleMapsEmbedUrl}
          style={{ border: 0 }}
          title={`Karte von ${displayLocation}`}
          loading="lazy"
        />
        
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
