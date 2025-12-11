/**
 * Geolocation Utility
 * Feature 3: Lokale Karte - Helper für Standort-basierte Funktionen
 */

import { prisma } from './prisma'

/**
 * Konvertiert eine Schweizer Postleitzahl zu Koordinaten
 * Nutzt zuerst Datenbank-Cache, dann OpenStreetMap Nominatim API
 */
export async function postalCodeToCoordinates(
  postalCode: string
): Promise<{ lat: number; lon: number } | null> {
  try {
    // Prüfe zuerst Cache
    const cached = await prisma.postalCodeCache.findUnique({
      where: { postalCode },
    })

    if (cached) {
      return {
        lat: cached.latitude,
        lon: cached.longitude,
      }
    }

    // Wenn nicht im Cache, hole von Nominatim API
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

    const coords = {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
    }

    // Speichere im Cache für zukünftige Anfragen
    try {
      await prisma.postalCodeCache.create({
        data: {
          postalCode,
          latitude: coords.lat,
          longitude: coords.lon,
          city: data[0].display_name?.split(',')[0] || null,
        },
      })
    } catch (error: any) {
      // Ignoriere Fehler wenn bereits existiert (Race Condition)
      if (!error.message?.includes('Unique constraint')) {
        console.error('Error caching postal code:', error)
      }
    }

    return coords
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
 * OPTIMIERT: Lädt zuerst alle aus Cache, dann fehlende parallel
 */
export async function batchPostalCodeToCoordinates(
  postalCodes: string[]
): Promise<Map<string, { lat: number; lon: number }>> {
  const coordinatesMap = new Map<string, { lat: number; lon: number }>()

  if (postalCodes.length === 0) {
    return coordinatesMap
  }

  // OPTIMIERT: Hole alle auf einmal aus Cache
  const cached = await prisma.postalCodeCache.findMany({
    where: {
      postalCode: {
        in: postalCodes,
      },
    },
  })

  // Füge gecachte Koordinaten hinzu
  cached.forEach(cache => {
    coordinatesMap.set(cache.postalCode, {
      lat: cache.latitude,
      lon: cache.longitude,
    })
  })

  // Finde fehlende Postleitzahlen
  const missing = postalCodes.filter(pc => !coordinatesMap.has(pc))

  if (missing.length === 0) {
    return coordinatesMap
  }

  // OPTIMIERT: Lade fehlende parallel mit Rate Limiting
  // Nominatim erlaubt max 1 Request pro Sekunde
  // Wir machen 2 Requests parallel, dann warten wir 1 Sekunde
  const batchSize = 2
  for (let i = 0; i < missing.length; i += batchSize) {
    const batch = missing.slice(i, i + batchSize)
    
    // Lade Batch parallel
    const promises = batch.map(postalCode => postalCodeToCoordinates(postalCode))
    const results = await Promise.all(promises)
    
    // Füge Ergebnisse hinzu
    batch.forEach((postalCode, index) => {
      const coords = results[index]
      if (coords) {
        coordinatesMap.set(postalCode, coords)
      }
    })

    // Rate limiting: Warte 1 Sekunde zwischen Batches (außer beim letzten Batch)
    if (i + batchSize < missing.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return coordinatesMap
}
