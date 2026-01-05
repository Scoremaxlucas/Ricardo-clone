/**
 * Unique QR Reference Generator
 * 
 * Generates unique QR-Bill references (SCOR format) that encode:
 * - User ID (for automatic payment matching)
 * - Invoice ID (for exact invoice matching)
 * - Check digit (for validation)
 * 
 * Format: RF[check][userPart][invoicePart][random]
 * Total length: 25 characters (QR-Bill SCOR standard)
 */

/**
 * Calculates the MOD-97 check digits for SCOR references
 * Based on ISO 11649 standard
 */
function calculateMod97CheckDigits(reference: string): string {
  // Move RF00 to end and convert letters to numbers
  const rearranged = reference + 'RF00'
  
  let numericString = ''
  for (const char of rearranged.toUpperCase()) {
    if (char >= '0' && char <= '9') {
      numericString += char
    } else if (char >= 'A' && char <= 'Z') {
      // A=10, B=11, ..., Z=35
      numericString += (char.charCodeAt(0) - 55).toString()
    }
  }

  // Calculate mod 97
  let remainder = 0
  for (const digit of numericString) {
    remainder = (remainder * 10 + parseInt(digit)) % 97
  }

  // Check digits = 98 - remainder, zero-padded to 2 digits
  const checkDigits = (98 - remainder).toString().padStart(2, '0')
  return checkDigits
}

/**
 * Encodes a number to base36 string with fixed length
 */
function encodeBase36(num: number, length: number): string {
  const base36 = num.toString(36).toUpperCase()
  return base36.padStart(length, '0').slice(-length)
}

/**
 * Decodes a base36 string back to number
 */
function decodeBase36(str: string): number {
  return parseInt(str, 36)
}

/**
 * Generates a unique QR reference for an invoice
 * 
 * Structure (25 chars total for SCOR):
 * - RF (2 chars): SCOR prefix
 * - Check digits (2 chars): MOD-97 check
 * - User ID encoded (6 chars): Base36 encoded user ID (max ~2.1 billion)
 * - Invoice ID encoded (6 chars): Base36 encoded invoice ID
 * - Timestamp part (5 chars): Base36 encoded timestamp mod
 * - Random part (4 chars): Random alphanumeric
 * 
 * @param userId - The user ID (seller)
 * @param invoiceId - The invoice ID in our system
 * @returns A 25-character SCOR reference starting with RF
 */
export function generateUniqueQRReference(userId: number, invoiceId: number): string {
  // Encode user ID (6 chars, supports up to 2,176,782,335)
  const userPart = encodeBase36(userId, 6)
  
  // Encode invoice ID (6 chars)
  const invoicePart = encodeBase36(invoiceId, 6)
  
  // Timestamp part for additional uniqueness (5 chars)
  const timestamp = Date.now() % Math.pow(36, 5)
  const timePart = encodeBase36(timestamp, 5)
  
  // Random part (4 chars)
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let randomPart = ''
  for (let i = 0; i < 4; i++) {
    randomPart += chars[Math.floor(Math.random() * chars.length)]
  }

  // Build reference body (21 chars after RF + check digits)
  const referenceBody = userPart + invoicePart + timePart + randomPart

  // Calculate check digits
  const checkDigits = calculateMod97CheckDigits(referenceBody)

  // Final reference: RF + check digits + body = 25 chars
  return `RF${checkDigits}${referenceBody}`
}

/**
 * Parses a QR reference to extract user ID and invoice ID
 * 
 * @param qrReference - The full QR reference string
 * @returns Object with userId, invoiceId, and isValid flag
 */
export function parseQRReference(qrReference: string): {
  userId: number | null
  invoiceId: number | null
  isValid: boolean
} {
  // Basic validation
  if (!qrReference || qrReference.length !== 25 || !qrReference.startsWith('RF')) {
    return { userId: null, invoiceId: null, isValid: false }
  }

  try {
    // Extract parts
    const checkDigits = qrReference.slice(2, 4)
    const referenceBody = qrReference.slice(4)
    
    // Validate check digits
    const calculatedCheck = calculateMod97CheckDigits(referenceBody)
    if (checkDigits !== calculatedCheck) {
      return { userId: null, invoiceId: null, isValid: false }
    }

    // Extract user ID (chars 4-9, 6 chars)
    const userPart = qrReference.slice(4, 10)
    const userId = decodeBase36(userPart)

    // Extract invoice ID (chars 10-15, 6 chars)
    const invoicePart = qrReference.slice(10, 16)
    const invoiceId = decodeBase36(invoicePart)

    return {
      userId,
      invoiceId,
      isValid: true
    }
  } catch {
    return { userId: null, invoiceId: null, isValid: false }
  }
}

/**
 * Validates a QR reference format and checksum
 */
export function validateQRReference(qrReference: string): boolean {
  const parsed = parseQRReference(qrReference)
  return parsed.isValid
}

/**
 * Formats a QR reference for display (adds spaces for readability)
 * Example: RF18 5N82 A20B 1YKQ 3ZP4 AB
 */
export function formatQRReferenceForDisplay(qrReference: string): string {
  if (!qrReference || qrReference.length !== 25) {
    return qrReference
  }
  
  // Format: RF## #### #### #### #### ###
  return [
    qrReference.slice(0, 4),
    qrReference.slice(4, 8),
    qrReference.slice(8, 12),
    qrReference.slice(12, 16),
    qrReference.slice(16, 20),
    qrReference.slice(20, 25)
  ].join(' ')
}
