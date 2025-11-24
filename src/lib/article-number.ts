import { prisma } from './prisma'

/**
 * Generiert eine eindeutige Artikelnummer für einen neuen Artikel
 * Format: 8-stellige Nummer (z.B. 12345678)
 * Startet bei 10000000 und erhöht sich automatisch
 */
export async function generateArticleNumber(): Promise<number> {
  try {
    // Finde die höchste vorhandene Artikelnummer
    const watchWithHighestNumber = await prisma.watch.findFirst({
      where: {
        articleNumber: {
          not: null
        }
      },
      orderBy: {
        articleNumber: 'desc'
      },
      select: {
        articleNumber: true
      }
    })

    // Wenn keine Artikelnummer existiert, starte bei 10000000
    if (!watchWithHighestNumber?.articleNumber) {
      return 10000000
    }

    // Erhöhe um 1
    const nextNumber = watchWithHighestNumber.articleNumber + 1

    // Stelle sicher, dass die Nummer 8-stellig bleibt (max. 99999999)
    if (nextNumber > 99999999) {
      throw new Error('Maximale Artikelnummer erreicht')
    }

    return nextNumber
  } catch (error) {
    console.error('Error generating article number:', error)
    // Fallback: Verwende Timestamp-basierte Nummer
    const timestamp = Date.now()
    // Nimm die letzten 8 Ziffern
    return parseInt(timestamp.toString().slice(-8))
  }
}






