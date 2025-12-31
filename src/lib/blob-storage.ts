/**
 * Vercel Blob Storage Utility Functions
 *
 * Diese Funktionen handhaben das Uploaden von Bildern zu Vercel Blob Storage
 * statt Base64-Strings in der Datenbank zu speichern.
 *
 * Vorteile:
 * - Kleinere Datenbank-Größe
 * - Schnellere Page-Loads
 * - Bessere Skalierbarkeit
 * - CDN-Optimierung durch Vercel
 */

import { put, del, head } from '@vercel/blob'

/**
 * Upload ein Bild oder Dokument zu Vercel Blob Storage
 * @param fileData Base64-String oder File-Objekt (Bilder + PDFs unterstützt)
 * @param path Pfad im Blob Storage (z.B. 'watches/{watchId}/{timestamp}.jpg')
 * @returns Blob URL
 */
export async function uploadImageToBlob(
  fileData: string | File,
  path: string
): Promise<string> {
  try {
    let file: File

    // Wenn Base64-String, konvertiere zu File
    if (typeof fileData === 'string') {
      if (fileData.startsWith('http://') || fileData.startsWith('https://')) {
        // Bereits eine URL, keine Upload nötig
        return fileData
      }

      // Unterstütze sowohl Bilder als auch PDFs
      if (!fileData.startsWith('data:image/') && !fileData.startsWith('data:application/pdf')) {
        throw new Error('Invalid file data format - only images and PDFs supported')
      }

      // Extrahiere MIME-Type und Base64-Daten
      const matches = fileData.match(/^data:([\w/]+);base64,(.+)$/)
      if (!matches) {
        throw new Error('Invalid base64 format')
      }

      const mimeType = matches[1]
      const base64Data = matches[2]
      const buffer = Buffer.from(base64Data, 'base64')

      // Erstelle File-Objekt
      file = new File([buffer], path.split('/').pop() || 'file', {
        type: mimeType,
      })
    } else {
      file = fileData
    }

    // Upload zu Vercel Blob Storage
    const blob = await put(path, file, {
      access: 'public',
      addRandomSuffix: false, // Verhindere zufällige Suffixe für konsistente URLs
    })

    return blob.url
  } catch (error) {
    console.error(`[Blob Storage] Error uploading file to ${path}:`, error)
    throw error
  }
}

/**
 * Upload mehrere Bilder zu Vercel Blob Storage
 * @param images Array von Base64-Strings oder Files
 * @param basePath Basis-Pfad (z.B. 'watches/{watchId}')
 * @returns Array von Blob URLs
 */
export async function uploadImagesToBlob(
  images: (string | File)[],
  basePath: string
): Promise<string[]> {
  const uploadPromises = images.map(async (image, index) => {
    try {
      // Bestimme Dateiendung basierend auf Bildtyp
      let extension = 'jpg'
      if (typeof image === 'string') {
        if (image.startsWith('http://') || image.startsWith('https://')) {
          // Bereits eine URL, behalte sie
          return image
        }
        const mimeMatch = image.match(/^data:image\/(\w+);base64/)
        if (mimeMatch) {
          extension = mimeMatch[1] === 'png' ? 'png' : mimeMatch[1] === 'webp' ? 'webp' : 'jpg'
        }
      } else {
        const mimeType = image.type
        if (mimeType.includes('png')) extension = 'png'
        else if (mimeType.includes('webp')) extension = 'webp'
      }

      const path = `${basePath}/${Date.now()}-${index}.${extension}`
      return await uploadImageToBlob(image, path)
    } catch (error) {
      console.error(`[Blob Storage] Error uploading image ${index}:`, error)
      // Bei Fehler, behalte Original wenn es eine URL ist
      if (typeof image === 'string' && (image.startsWith('http://') || image.startsWith('https://'))) {
        return image
      }
      // Sonst, überspringe fehlerhafte Bilder
      return null
    }
  })

  const results = await Promise.all(uploadPromises)
  // Filtere null-Werte (fehlerhafte Uploads)
  return results.filter((url): url is string => url !== null)
}

/**
 * Lösche ein Bild aus Vercel Blob Storage
 * @param url Blob URL
 */
export async function deleteImageFromBlob(url: string): Promise<void> {
  try {
    // Prüfe ob es eine Vercel Blob URL ist
    if (url.includes('vercel-storage.com') || url.includes('public.blob.vercel-storage.com')) {
      await del(url)
    }
    // Andere URLs (z.B. externe CDNs) werden nicht gelöscht
  } catch (error) {
    console.error(`[Blob Storage] Error deleting image ${url}:`, error)
    // Fehler beim Löschen ist nicht kritisch, ignoriere es
  }
}

/**
 * Prüfe ob eine URL bereits eine Blob Storage URL ist
 */
export function isBlobUrl(url: string): boolean {
  return (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.includes('vercel-storage.com') ||
    url.includes('public.blob.vercel-storage.com')
  )
}

/**
 * Konvertiere Base64-String zu File-Objekt
 */
export function base64ToFile(base64: string, filename: string = 'image.jpg'): File {
  const matches = base64.match(/^data:image\/(\w+);base64,(.+)$/)
  if (!matches) {
    throw new Error('Invalid base64 image format')
  }

  const mimeType = matches[1]
  const base64Data = matches[2]
  const buffer = Buffer.from(base64Data, 'base64')

  return new File([buffer], filename, {
    type: `image/${mimeType}`,
  })
}











