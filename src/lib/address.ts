/**
 * Address Helper Library
 *
 * Provides a clean interface for working with UserAddress entities.
 * Part of Phase 1 User model refactoring.
 *
 * Address Types:
 * - MAIN: Primary/home address (Wohnadresse)
 * - DELIVERY: Shipping address (Lieferadresse)
 * - BILLING: Invoice address (Rechnungsadresse) - rarely used
 */

import { prisma } from './prisma'

// ============================================
// Types
// ============================================

export type AddressType = 'MAIN' | 'DELIVERY' | 'BILLING'

export interface Address {
  id?: string
  userId?: string
  type?: AddressType
  street: string
  streetNumber: string
  postalCode: string
  city: string
  country: string
  addresszusatz?: string | null
  kanton?: string | null
  isDefault?: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface AddressInput {
  street: string
  streetNumber: string
  postalCode: string
  city: string
  country?: string
  addresszusatz?: string | null
  kanton?: string | null
}

// ============================================
// Read Operations
// ============================================

/**
 * Get all addresses for a user
 */
export async function getUserAddresses(userId: string): Promise<Address[]> {
  const addresses = await prisma.userAddress.findMany({
    where: { userId },
    orderBy: { type: 'asc' },
  })

  return addresses.map(addr => ({
    ...addr,
    type: addr.type as AddressType,
  }))
}

/**
 * Get a specific address by type
 */
export async function getUserAddress(
  userId: string,
  type: AddressType
): Promise<Address | null> {
  const address = await prisma.userAddress.findUnique({
    where: {
      userId_type: { userId, type },
    },
  })

  if (!address) return null

  return {
    ...address,
    type: address.type as AddressType,
  }
}

/**
 * Get main address for a user
 */
export async function getMainAddress(userId: string): Promise<Address | null> {
  return getUserAddress(userId, 'MAIN')
}

/**
 * Get delivery address for a user
 */
export async function getDeliveryAddress(userId: string): Promise<Address | null> {
  return getUserAddress(userId, 'DELIVERY')
}

/**
 * Get billing address for a user (falls back to main if not set)
 */
export async function getBillingAddress(userId: string): Promise<Address | null> {
  const billing = await getUserAddress(userId, 'BILLING')
  if (billing) return billing

  // Fallback to main address
  return getMainAddress(userId)
}

// ============================================
// Write Operations
// ============================================

/**
 * Create or update an address for a user
 */
export async function upsertUserAddress(
  userId: string,
  type: AddressType,
  input: AddressInput
): Promise<Address> {
  const data = {
    street: input.street.trim(),
    streetNumber: input.streetNumber.trim(),
    postalCode: input.postalCode.trim(),
    city: input.city.trim(),
    country: input.country?.trim() || 'Schweiz',
    addresszusatz: input.addresszusatz?.trim() || null,
    kanton: input.kanton?.trim() || null,
  }

  const address = await prisma.userAddress.upsert({
    where: {
      userId_type: { userId, type },
    },
    create: {
      userId,
      type,
      ...data,
    },
    update: data,
  })

  return {
    ...address,
    type: address.type as AddressType,
  }
}

/**
 * Delete an address
 */
export async function deleteUserAddress(
  userId: string,
  type: AddressType
): Promise<boolean> {
  try {
    await prisma.userAddress.delete({
      where: {
        userId_type: { userId, type },
      },
    })
    return true
  } catch {
    return false
  }
}

// ============================================
// Validation
// ============================================

/**
 * Check if an address is complete (all required fields filled)
 */
export function isAddressComplete(address: Partial<Address> | null | undefined): boolean {
  if (!address) return false

  return !!(
    address.street?.trim() &&
    address.streetNumber?.trim() &&
    address.postalCode?.trim() &&
    address.city?.trim()
  )
}

/**
 * Validate Swiss postal code format (4 digits)
 */
export function validateSwissPostalCode(postalCode: string | null | undefined): boolean {
  if (!postalCode) return false
  return /^\d{4}$/.test(postalCode.trim())
}

/**
 * Get missing address fields
 */
export function getMissingAddressFields(
  address: Partial<Address> | null | undefined
): string[] {
  const missing: string[] = []

  if (!address?.street?.trim()) missing.push('Strasse')
  if (!address?.streetNumber?.trim()) missing.push('Hausnummer')
  if (!address?.postalCode?.trim()) missing.push('Postleitzahl')
  if (!address?.city?.trim()) missing.push('Ort')

  return missing
}

// ============================================
// Migration Helpers (Temporary)
// ============================================

/**
 * Get address from legacy User fields
 * Used during migration period for backward compatibility
 */
export function getAddressFromUserFields(user: {
  street?: string | null
  streetNumber?: string | null
  postalCode?: string | null
  city?: string | null
  country?: string | null
  addresszusatz?: string | null
  kanton?: string | null
}): Address | null {
  if (!user.street && !user.city) return null

  return {
    street: user.street || '',
    streetNumber: user.streetNumber || '',
    postalCode: user.postalCode || '',
    city: user.city || '',
    country: user.country || 'Schweiz',
    addresszusatz: user.addresszusatz,
    kanton: user.kanton,
  }
}

/**
 * Get delivery address from legacy User fields
 */
export function getDeliveryAddressFromUserFields(user: {
  deliveryStreet?: string | null
  deliveryStreetNumber?: string | null
  deliveryPostalCode?: string | null
  deliveryCity?: string | null
  deliveryCountry?: string | null
}): Address | null {
  if (!user.deliveryStreet && !user.deliveryCity) return null

  return {
    street: user.deliveryStreet || '',
    streetNumber: user.deliveryStreetNumber || '',
    postalCode: user.deliveryPostalCode || '',
    city: user.deliveryCity || '',
    country: user.deliveryCountry || 'Schweiz',
    addresszusatz: null,
    kanton: null,
  }
}

/**
 * Get address with fallback to legacy fields
 * Checks new UserAddress first, then falls back to User fields
 */
export async function getAddressWithFallback(
  userId: string,
  type: AddressType,
  legacyUser?: {
    street?: string | null
    streetNumber?: string | null
    postalCode?: string | null
    city?: string | null
    country?: string | null
    addresszusatz?: string | null
    kanton?: string | null
    deliveryStreet?: string | null
    deliveryStreetNumber?: string | null
    deliveryPostalCode?: string | null
    deliveryCity?: string | null
    deliveryCountry?: string | null
  }
): Promise<Address | null> {
  // Try new UserAddress table first
  const newAddress = await getUserAddress(userId, type)
  if (newAddress) return newAddress

  // Fallback to legacy fields if provided
  if (legacyUser) {
    if (type === 'MAIN') {
      return getAddressFromUserFields(legacyUser)
    }
    if (type === 'DELIVERY') {
      return getDeliveryAddressFromUserFields(legacyUser)
    }
  }

  return null
}

// ============================================
// Formatting
// ============================================

/**
 * Format address as single line
 */
export function formatAddressLine(address: Address | null): string {
  if (!address) return ''

  const parts = [
    `${address.street} ${address.streetNumber}`.trim(),
    `${address.postalCode} ${address.city}`.trim(),
  ].filter(Boolean)

  return parts.join(', ')
}

/**
 * Format address as multiline string
 */
export function formatAddressMultiline(address: Address | null): string[] {
  if (!address) return []

  const lines: string[] = []

  if (address.addresszusatz) {
    lines.push(address.addresszusatz)
  }

  if (address.street || address.streetNumber) {
    lines.push(`${address.street} ${address.streetNumber}`.trim())
  }

  if (address.postalCode || address.city) {
    lines.push(`${address.postalCode} ${address.city}`.trim())
  }

  if (address.country && address.country !== 'Schweiz') {
    lines.push(address.country)
  }

  return lines
}
