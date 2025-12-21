/**
 * Generate SCOR (Creditor Reference) for Swiss QR-Bill
 * Format: RF + 2-digit check digits + reference (max 21 chars)
 * Total max 25 characters
 */

/**
 * Calculate ISO 11649 check digits for SCOR reference
 */
function calculateSCORChecksum(reference: string): string {
  // Remove all non-alphanumeric characters and convert to uppercase
  const cleanRef = reference.replace(/[^0-9A-Z]/g, '').toUpperCase()

  // Convert to numeric string (A=10, B=11, ..., Z=35)
  let numericString = ''
  for (let i = 0; i < cleanRef.length; i++) {
    const char = cleanRef[i]
    if (char >= '0' && char <= '9') {
      numericString += char
    } else if (char >= 'A' && char <= 'Z') {
      numericString += (char.charCodeAt(0) - 55).toString()
    }
  }

  // Calculate modulo 97
  let remainder = 0
  for (let i = 0; i < numericString.length; i++) {
    remainder = (remainder * 10 + parseInt(numericString[i])) % 97
  }

  // Check digits are (98 - remainder) % 97
  const checkDigits = String((98 - remainder) % 97).padStart(2, '0')

  return checkDigits
}

/**
 * Generate SCOR reference from purchase ID
 * Format: RF + 2-digit checksum + reference (max 21 chars for reference part)
 */
export function generateSCORReference(purchaseId: string): string {
  // Use purchase ID as base reference (remove hyphens, uppercase)
  const baseRef = purchaseId.replace(/[^0-9A-Za-z]/g, '').toUpperCase()

  // Limit to 21 characters (RF + 2 check digits = 4 chars, total max 25)
  const refPart = baseRef.substring(0, 21)

  // Calculate check digits
  const checkDigits = calculateSCORChecksum(refPart)

  // Combine: RF + check digits + reference
  const scorRef = `RF${checkDigits}${refPart}`

  // Ensure exactly 25 characters (pad with spaces if needed)
  return scorRef.padEnd(25, ' ').substring(0, 25)
}

/**
 * Generate NON reference (no reference)
 * Returns empty string padded to 25 characters
 */
export function generateNONReference(): string {
  return ''.padEnd(25, ' ')
}

/**
 * Determine reference type based on IBAN
 * If QR-IBAN (positions 5-6 are 30 or 31), can use QRR (numeric)
 * Otherwise, use SCOR (RF...) or NON
 */
export function getReferenceType(iban: string): 'SCOR' | 'NON' {
  const cleanIban = iban.replace(/\s/g, '').toUpperCase()

  // Check if QR-IBAN (positions 5-6 are 30 or 31)
  // For now, we'll use SCOR for all IBANs (more compatible)
  // NON can be used if no reference tracking is needed
  return 'SCOR'
}
