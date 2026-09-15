/**
 * Erkennt den echten Dateityp anhand der Byte-Signatur (Magic Number), damit
 * ein Angreifer keinen `.pdf.exe` mit `Content-Type: application/pdf` durch die
 * MIME-Prüfung schmuggeln kann.
 *
 * Nur die Formate, die SIC-Nachweise erlauben: PDF, JPEG, PNG, WEBP.
 * Alles andere → `null` → Upload wird abgewiesen.
 */

export type SicDetectedMime = 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp'

/** Prüft, ob `bytes` an Position `offset` die Sequenz `sig` enthält. */
function matches(bytes: Uint8Array, sig: readonly number[], offset = 0): boolean {
  if (bytes.length < offset + sig.length) return false
  for (let i = 0; i < sig.length; i += 1) {
    if (bytes[offset + i] !== sig[i]) return false
  }
  return true
}

/**
 * Liest die Magic Number aus den ersten ~16 Bytes und gibt den echten MIME-Typ
 * zurück — oder `null`, wenn keiner der erlaubten Typen erkannt wird.
 *
 * Wichtig: die Signatur muss innerhalb der ersten Bytes auftauchen. Manche
 * Tools packen PDF-Header nicht bei Offset 0 (BOM, Whitespace) — deshalb
 * scannen wir bei PDF die ersten 8 Bytes.
 */
export function detectSicUploadMime(bytes: Uint8Array): SicDetectedMime | null {
  // PDF: %PDF-  (25 50 44 46 2D). Toleriert 0–7 Bytes BOM/Whitespace davor.
  const pdfSig = [0x25, 0x50, 0x44, 0x46, 0x2d]
  for (let off = 0; off <= 8 && off + pdfSig.length <= bytes.length; off += 1) {
    if (matches(bytes, pdfSig, off)) return 'application/pdf'
  }

  // JPEG: FF D8 FF (SOI + Marker). Fast alle JPEG-Varianten teilen diesen Start.
  if (matches(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg'

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (matches(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png'

  // WEBP: RIFF....WEBP  → 'RIFF' bei 0, 'WEBP' bei 8
  if (matches(bytes, [0x52, 0x49, 0x46, 0x46]) && matches(bytes, [0x57, 0x45, 0x42, 0x50], 8)) {
    return 'image/webp'
  }

  return null
}
