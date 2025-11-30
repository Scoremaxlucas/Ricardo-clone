/**
 * Swiss QR-Bill Referenznummer-Generierung
 * Für SCOR (Creditor Reference) Referenzen
 */

/**
 * Berechnet die Prüfsumme für eine SCOR-Referenz (Modulo 10 Recursive)
 * Die Referenz muss alphanumerisch sein und wird mit einer Prüfziffer versehen
 */
function calculateSCORChecksum(reference: string): number {
  // Entferne alle nicht-alphanumerischen Zeichen
  const cleanRef = reference.replace(/[^0-9A-Z]/g, '').toUpperCase()
  
  // Modulo 10 Recursive Algorithmus
  let sum = 0
  const weights = [1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1]
  
  // Konvertiere Zeichen zu Zahlen (A=10, B=11, ..., Z=35)
  const digits: number[] = []
  for (let i = 0; i < cleanRef.length; i++) {
    const char = cleanRef[i]
    if (char >= '0' && char <= '9') {
      digits.push(parseInt(char))
    } else if (char >= 'A' && char <= 'Z') {
      digits.push(char.charCodeAt(0) - 55) // A=10, B=11, etc.
    }
  }
  
  // Berechne gewichtete Summe
  for (let i = 0; i < digits.length; i++) {
    const weight = weights[i % weights.length]
    const product = digits[i] * weight
    sum += Math.floor(product / 10) + (product % 10)
  }
  
  // Prüfziffer ist (10 - (sum % 10)) % 10
  const checksum = (10 - (sum % 10)) % 10
  return checksum
}

/**
 * Formatiert eine Referenznummer für Swiss QR-Bill
 * Für SCOR-Referenzen: Die Referenz kann alphanumerisch sein, max 25 Zeichen
 * WICHTIG: Die Referenz wird NICHT mit einer Prüfziffer versehen, wenn sie bereits alphanumerisch ist
 * Die Prüfziffer wird nur benötigt, wenn die Bank es explizit verlangt
 */
export function formatQRReference(invoiceNumber: string): string {
  // Entferne alle nicht-alphanumerischen Zeichen
  let cleanRef = invoiceNumber.replace(/[^0-9A-Za-z]/g, '').toUpperCase()
  
  // Stelle sicher, dass Referenz nicht leer ist
  if (cleanRef.length === 0) {
    cleanRef = 'REF' + Date.now().toString().slice(-22)
  }
  
  // Kürze auf max 25 Zeichen (für SCOR)
  cleanRef = cleanRef.substring(0, 25)
  
  // Fülle rechts mit Leerzeichen auf (genau 25 Zeichen)
  const formattedRef = cleanRef.padEnd(25, ' ')
  
  return formattedRef
}

/**
 * Validiert eine SCOR-Referenz
 */
export function validateSCORReference(reference: string): { isValid: boolean; error?: string } {
  const trimmed = reference.trim()
  
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Referenz darf nicht leer sein' }
  }
  
  if (trimmed.length > 25) {
    return { isValid: false, error: 'Referenz darf maximal 25 Zeichen lang sein' }
  }
  
  // Prüfe ob nur alphanumerische Zeichen
  if (!/^[0-9A-Za-z]+$/.test(trimmed)) {
    return { isValid: false, error: 'Referenz darf nur alphanumerische Zeichen enthalten' }
  }
  
  return { isValid: true }
}

