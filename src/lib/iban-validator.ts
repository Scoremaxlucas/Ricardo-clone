/**
 * IBAN validation utility
 * Supports Swiss IBANs (CH) and basic format validation
 */

/**
 * Validates IBAN format and checksum
 * Supports CH (Switzerland) IBANs
 */
export function validateIban(iban: string): { valid: boolean; error?: string } {
  if (!iban || typeof iban !== 'string') {
    return { valid: false, error: 'IBAN ist erforderlich' }
  }

  // Remove spaces and convert to uppercase
  const cleaned = iban.replace(/\s/g, '').toUpperCase()

  // Basic format check: CH IBANs are 21 characters
  if (cleaned.length !== 21) {
    return { valid: false, error: 'IBAN muss 21 Zeichen haben (CH-Format)' }
  }

  // Check country code
  if (!cleaned.startsWith('CH')) {
    return { valid: false, error: 'Nur Schweizer IBANs (CH) werden unterstützt' }
  }

  // IBAN checksum validation (mod 97)
  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4) // Move first 4 chars to end
  const numeric = rearranged.replace(/[A-Z]/g, char => {
    return (char.charCodeAt(0) - 55).toString()
  })

  // Calculate mod 97
  let remainder = ''
  for (let i = 0; i < numeric.length; i++) {
    remainder = (remainder + numeric[i]).slice(-9)
    if (remainder.length === 9) {
      remainder = (parseInt(remainder, 10) % 97).toString()
    }
  }
  const mod97 = parseInt(remainder, 10) % 97

  if (mod97 !== 1) {
    return { valid: false, error: 'IBAN-Prüfsumme ist ungültig' }
  }

  return { valid: true }
}

/**
 * Extracts last 4 digits from IBAN
 */
export function getIbanLast4(iban: string): string {
  const cleaned = iban.replace(/\s/g, '')
  return cleaned.slice(-4)
}

/**
 * Formats IBAN for display (with spaces)
 * CH12 3456 7890 1234 5678 9
 */
export function formatIban(iban: string): string {
  const cleaned = iban.replace(/\s/g, '').toUpperCase()
  if (cleaned.length !== 21) {
    return iban // Return as-is if invalid length
  }
  return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 6)} ${cleaned.slice(6, 10)} ${cleaned.slice(10, 14)} ${cleaned.slice(14, 18)} ${cleaned.slice(18, 21)}`
}
