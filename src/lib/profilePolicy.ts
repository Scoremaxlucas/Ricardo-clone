/**
 * Profile & Address Field Policy for Helvenda
 *
 * Defines when profile fields are required based on user actions:
 * - Selling: nickname required, address only if shipping/payment protection enabled
 * - Shipping: address required if shipping enabled
 * - Payment Protection: address required
 * - Invoices: name + address required
 */

export type PolicyContext =
  | 'SELL_PUBLISH'
  | 'SELL_ENABLE_SHIPPING'
  | 'PAYMENT_PROTECTION'
  | 'INVOICE_ACTION'
  | 'CHAT_ONLY'

export interface MissingField {
  field: string
  label: string // Human-readable label in German
  reason?: string // Why this field is required
}

export interface UserProfile {
  name?: string | null
  nickname?: string | null
  email?: string | null
  phone?: string | null
  street?: string | null
  streetNumber?: string | null
  postalCode?: string | null
  city?: string | null
  country?: string | null
  addresszusatz?: string | null
  kanton?: string | null
}

export interface PolicyOptions {
  hasShippingEnabled?: boolean
  hasPaymentProtection?: boolean
  isPickupOnly?: boolean
}

/**
 * Get missing profile fields for a given context
 */
export function getMissingProfileFields(
  user: UserProfile,
  context: PolicyContext,
  options: PolicyOptions = {}
): MissingField[] {
  const missing: MissingField[] = []

  // A) SELL_PUBLISH: Require nickname/displayName
  if (context === 'SELL_PUBLISH') {
    if (!user.nickname || !user.nickname.trim()) {
      missing.push({
        field: 'nickname',
        label: 'Anzeigename',
        reason: 'Erforderlich zum Verkaufen',
      })
    }
  }

  // B) SELL_ENABLE_SHIPPING: Require address if shipping enabled (not pickup-only)
  if (context === 'SELL_ENABLE_SHIPPING') {
    if (options.isPickupOnly) {
      // No address required for pickup-only
      return missing
    }

    if (options.hasShippingEnabled) {
      if (!user.street || !user.street.trim()) {
        missing.push({
          field: 'street',
          label: 'Strasse',
          reason: 'Erforderlich für Versand',
        })
      }
      if (!user.streetNumber || !user.streetNumber.trim()) {
        missing.push({
          field: 'streetNumber',
          label: 'Hausnummer',
          reason: 'Erforderlich für Versand',
        })
      }
      if (!user.postalCode || !user.postalCode.trim()) {
        missing.push({
          field: 'postalCode',
          label: 'Postleitzahl',
          reason: 'Erforderlich für Versand',
        })
      }
      if (!user.city || !user.city.trim()) {
        missing.push({
          field: 'city',
          label: 'Ort',
          reason: 'Erforderlich für Versand',
        })
      }
      // Land wird nicht mehr geprüft - alle Helvenda-Nutzer sind aus der Schweiz
    }
  }

  // C) PAYMENT_PROTECTION: Require address
  if (context === 'PAYMENT_PROTECTION') {
    if (!user.street || !user.street.trim()) {
      missing.push({
        field: 'street',
        label: 'Strasse',
        reason: 'Erforderlich für Zahlungsschutz',
      })
    }
    if (!user.streetNumber || !user.streetNumber.trim()) {
      missing.push({
        field: 'streetNumber',
        label: 'Hausnummer',
        reason: 'Erforderlich für Zahlungsschutz',
      })
    }
    if (!user.postalCode || !user.postalCode.trim()) {
      missing.push({
        field: 'postalCode',
        label: 'Postleitzahl',
        reason: 'Erforderlich für Zahlungsschutz',
      })
    }
    if (!user.city || !user.city.trim()) {
      missing.push({
        field: 'city',
        label: 'Ort',
        reason: 'Erforderlich für Zahlungsschutz',
      })
    }
    // Land wird nicht mehr geprüft - alle Helvenda-Nutzer sind aus der Schweiz
    // Phone is recommended but not required
  }

  // D) INVOICE_ACTION: Require name + address
  if (context === 'INVOICE_ACTION') {
    if (!user.name || !user.name.trim()) {
      missing.push({
        field: 'name',
        label: 'Name',
        reason: 'Erforderlich für Rechnungen',
      })
    }
    if (!user.street || !user.street.trim()) {
      missing.push({
        field: 'street',
        label: 'Strasse',
        reason: 'Erforderlich für Rechnungen',
      })
    }
    if (!user.streetNumber || !user.streetNumber.trim()) {
      missing.push({
        field: 'streetNumber',
        label: 'Hausnummer',
        reason: 'Erforderlich für Rechnungen',
      })
    }
    if (!user.postalCode || !user.postalCode.trim()) {
      missing.push({
        field: 'postalCode',
        label: 'Postleitzahl',
        reason: 'Erforderlich für Rechnungen',
      })
    }
    if (!user.city || !user.city.trim()) {
      missing.push({
        field: 'city',
        label: 'Ort',
        reason: 'Erforderlich für Rechnungen',
      })
    }
    // Land wird nicht mehr geprüft - alle Helvenda-Nutzer sind aus der Schweiz
  }

  // E) CHAT_ONLY: Require nickname (for display)
  if (context === 'CHAT_ONLY') {
    if (!user.nickname || !user.nickname.trim()) {
      missing.push({
        field: 'nickname',
        label: 'Anzeigename',
        reason: 'Erforderlich für Nachrichten',
      })
    }
  }

  return missing
}

/**
 * Check if profile is complete for a given context
 */
export function isProfileCompleteFor(
  user: UserProfile,
  context: PolicyContext,
  options: PolicyOptions = {}
): boolean {
  const missing = getMissingProfileFields(user, context, options)
  return missing.length === 0
}

/**
 * Validate Swiss postal code format
 */
export function validateSwissPostalCode(postalCode: string | null | undefined): boolean {
  if (!postalCode || !postalCode.trim()) return false
  return /^\d{4}$/.test(postalCode.trim())
}

/**
 * Validate Swiss house number format (allows: 6, 6a, 6-8, 6 A)
 */
export function validateSwissHouseNumber(houseNumber: string | null | undefined): boolean {
  if (!houseNumber || !houseNumber.trim()) return false
  // Allow: numbers, numbers with letters (6a), ranges (6-8), numbers with space and letter (6 A)
  return /^[0-9]+[a-zA-Z]?(-[0-9]+[a-zA-Z]?)?(\s+[a-zA-Z])?$/.test(houseNumber.trim())
}

/**
 * Normalize postal code to string (preserves leading zeros)
 */
export function normalizePostalCode(postalCode: string | number | null | undefined): string {
  if (!postalCode) return ''
  // Convert to string and pad to 4 digits if needed
  const str = String(postalCode).trim()
  if (/^\d+$/.test(str)) {
    return str.padStart(4, '0')
  }
  return str
}

/**
 * Get human-readable field group labels for missing fields
 */
export function groupMissingFields(missingFields: MissingField[]): string[] {
  const groups: string[] = []
  const addressFields = ['street', 'streetNumber', 'postalCode', 'city', 'country']
  const hasAddressFields = missingFields.some(f => addressFields.includes(f.field))

  if (hasAddressFields) {
    const addressLabels = missingFields
      .filter(f => addressFields.includes(f.field))
      .map(f => f.label)
    groups.push(`Adresse: ${addressLabels.join(', ')}`)
  }

  const otherFields = missingFields.filter(f => !addressFields.includes(f.field))
  otherFields.forEach(f => {
    groups.push(f.label)
  })

  return groups
}
