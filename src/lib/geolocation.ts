/**
 * Geolocation Utility
 * Feature 3: Lokale Karte - Helper für Standort-basierte Funktionen
 */

/**
 * Konvertiert eine Schweizer Postleitzahl zu Koordinaten
 * Nutzt OpenStreetMap Nominatim API als Fallback
 */
export async function postalCodeToCoordinates(
  postalCode: string
): Promise<{ lat: number; lon: number } | null> {
  try {
    // Schweizer Postleitzahlen-Mapping (vereinfacht)
    // In Produktion sollte eine vollständige Datenbank verwendet werden
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${postalCode}&country=Switzerland&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'Helvenda Marketplace',
        },
      }
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    if (data.length === 0) {
      return null
    }

    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
    }
  } catch (error) {
    console.error('Error converting postal code to coordinates:', error)
    return null
  }
}

/**
 * Berechnet die Distanz zwischen zwei Koordinaten (Haversine-Formel)
 * Gibt Distanz in Kilometern zurück
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Erdradius in Kilometern
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return Math.round(distance * 10) / 10 // Auf 1 Dezimalstelle gerundet
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Validiert eine Schweizer Postleitzahl
 */
export function isValidSwissPostalCode(postalCode: string): boolean {
  // Schweizer Postleitzahlen sind 4-stellig (1000-9999)
  const postalCodeRegex = /^[1-9]\d{3}$/
  return postalCodeRegex.test(postalCode)
}

/**
 * Holt Koordinaten für mehrere Postleitzahlen (Batch)
 */
export async function batchPostalCodeToCoordinates(
  postalCodes: string[]
): Promise<Map<string, { lat: number; lon: number }>> {
  const coordinatesMap = new Map<string, { lat: number; lon: number }>()

  // Rate limiting: Max 1 Request pro Sekunde für Nominatim
  for (const postalCode of postalCodes) {
    const coords = await postalCodeToCoordinates(postalCode)
    if (coords) {
      coordinatesMap.set(postalCode, coords)
    }
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  return coordinatesMap
}
