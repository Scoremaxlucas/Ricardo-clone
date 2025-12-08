/**
 * Bildkomprimierung für Uploads
 * Reduziert die Dateigröße um 413 Fehler zu vermeiden
 */

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  maxSizeMB?: number
}

/**
 * Komprimiert ein Bild und gibt es als Base64 String zurück
 */
export function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 1600, // Reduziert von 1920 für kleinere Dateien
      maxHeight = 1600, // Reduziert von 1920 für kleinere Dateien
      quality = 0.75, // Reduziert von 0.85 für bessere Komprimierung
      maxSizeMB = 1.5, // Reduziert von 2MB für sicherere Uploads
    } = options

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // Berechne neue Dimensionen
        let width = img.width
        let height = img.height

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = width * ratio
          height = height * ratio
        }

        // Erstelle Canvas
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        // Zeichne Bild auf Canvas
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas context nicht verfügbar'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Konvertiere zu Blob mit Komprimierung
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Blob-Konvertierung fehlgeschlagen'))
              return
            }

            // Prüfe Größe und komprimiere iterativ bis Zielgröße erreicht
            const checkAndCompress = (currentBlob: Blob, currentQuality: number, attempts: number = 0): void => {
              const sizeMB = currentBlob.size / (1024 * 1024)
              
              if (sizeMB <= maxSizeMB || attempts >= 5) {
                // Zielgröße erreicht oder maximale Versuche erreicht
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.onerror = reject
                reader.readAsDataURL(currentBlob)
                return
              }
              
              // Weitere Komprimierung bei Bedarf
              const newQuality = Math.max(0.2, currentQuality - 0.15)
              canvas.toBlob(
                (compressedBlob) => {
                  if (!compressedBlob) {
                    // Falls Komprimierung fehlschlägt, verwende aktuelles Blob
                    const reader = new FileReader()
                    reader.onload = () => resolve(reader.result as string)
                    reader.onerror = reject
                    reader.readAsDataURL(currentBlob)
                    return
                  }
                  checkAndCompress(compressedBlob, newQuality, attempts + 1)
                },
                'image/jpeg',
                newQuality
              )
            }
            
            checkAndCompress(blob, quality)
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'))
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Prüft ob ein Bild komprimiert werden muss
 */
export function needsCompression(file: File, maxSizeMB: number = 2): boolean {
  return file.size > maxSizeMB * 1024 * 1024
}

