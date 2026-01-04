/**
 * Tests for Address Helper Library
 */

import { describe, expect, it } from 'vitest'
import {
  isAddressComplete,
  validateSwissPostalCode,
  getMissingAddressFields,
  getAddressFromUserFields,
  getDeliveryAddressFromUserFields,
  formatAddressLine,
  formatAddressMultiline,
  type Address,
} from '@/lib/address'

describe('Address Validation', () => {
  describe('isAddressComplete', () => {
    it('should return true for complete address', () => {
      const address: Partial<Address> = {
        street: 'Bahnhofstrasse',
        streetNumber: '10',
        postalCode: '8001',
        city: 'Zürich',
      }
      expect(isAddressComplete(address)).toBe(true)
    })

    it('should return false for null address', () => {
      expect(isAddressComplete(null)).toBe(false)
    })

    it('should return false for undefined address', () => {
      expect(isAddressComplete(undefined)).toBe(false)
    })

    it('should return false if street is missing', () => {
      const address: Partial<Address> = {
        streetNumber: '10',
        postalCode: '8001',
        city: 'Zürich',
      }
      expect(isAddressComplete(address)).toBe(false)
    })

    it('should return false if city is missing', () => {
      const address: Partial<Address> = {
        street: 'Bahnhofstrasse',
        streetNumber: '10',
        postalCode: '8001',
      }
      expect(isAddressComplete(address)).toBe(false)
    })

    it('should return false for empty strings', () => {
      const address: Partial<Address> = {
        street: '',
        streetNumber: '10',
        postalCode: '8001',
        city: 'Zürich',
      }
      expect(isAddressComplete(address)).toBe(false)
    })

    it('should return false for whitespace-only strings', () => {
      const address: Partial<Address> = {
        street: '   ',
        streetNumber: '10',
        postalCode: '8001',
        city: 'Zürich',
      }
      expect(isAddressComplete(address)).toBe(false)
    })
  })

  describe('validateSwissPostalCode', () => {
    it('should return true for valid 4-digit postal code', () => {
      expect(validateSwissPostalCode('8001')).toBe(true)
      expect(validateSwissPostalCode('1000')).toBe(true)
      expect(validateSwissPostalCode('9999')).toBe(true)
    })

    it('should return true for postal code with whitespace', () => {
      expect(validateSwissPostalCode(' 8001 ')).toBe(true)
    })

    it('should return false for 3-digit postal code', () => {
      expect(validateSwissPostalCode('800')).toBe(false)
    })

    it('should return false for 5-digit postal code', () => {
      expect(validateSwissPostalCode('80010')).toBe(false)
    })

    it('should return false for non-numeric postal code', () => {
      expect(validateSwissPostalCode('800A')).toBe(false)
    })

    it('should return false for null', () => {
      expect(validateSwissPostalCode(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(validateSwissPostalCode(undefined)).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(validateSwissPostalCode('')).toBe(false)
    })
  })

  describe('getMissingAddressFields', () => {
    it('should return empty array for complete address', () => {
      const address: Partial<Address> = {
        street: 'Bahnhofstrasse',
        streetNumber: '10',
        postalCode: '8001',
        city: 'Zürich',
      }
      expect(getMissingAddressFields(address)).toEqual([])
    })

    it('should return all fields for null address', () => {
      const missing = getMissingAddressFields(null)
      expect(missing).toContain('Strasse')
      expect(missing).toContain('Hausnummer')
      expect(missing).toContain('Postleitzahl')
      expect(missing).toContain('Ort')
    })

    it('should return missing street', () => {
      const address: Partial<Address> = {
        streetNumber: '10',
        postalCode: '8001',
        city: 'Zürich',
      }
      const missing = getMissingAddressFields(address)
      expect(missing).toContain('Strasse')
      expect(missing).not.toContain('Hausnummer')
    })

    it('should return multiple missing fields', () => {
      const address: Partial<Address> = {
        street: 'Bahnhofstrasse',
        city: 'Zürich',
      }
      const missing = getMissingAddressFields(address)
      expect(missing).toContain('Hausnummer')
      expect(missing).toContain('Postleitzahl')
      expect(missing).not.toContain('Strasse')
      expect(missing).not.toContain('Ort')
    })
  })
})

describe('Legacy Field Migration', () => {
  describe('getAddressFromUserFields', () => {
    it('should convert legacy user fields to Address', () => {
      const user = {
        street: 'Bahnhofstrasse',
        streetNumber: '10',
        postalCode: '8001',
        city: 'Zürich',
        country: 'Schweiz',
        addresszusatz: 'c/o Müller',
        kanton: 'ZH',
      }
      const address = getAddressFromUserFields(user)

      expect(address).not.toBeNull()
      expect(address?.street).toBe('Bahnhofstrasse')
      expect(address?.streetNumber).toBe('10')
      expect(address?.postalCode).toBe('8001')
      expect(address?.city).toBe('Zürich')
      expect(address?.country).toBe('Schweiz')
      expect(address?.addresszusatz).toBe('c/o Müller')
      expect(address?.kanton).toBe('ZH')
    })

    it('should return null if no street and city', () => {
      const user = {}
      expect(getAddressFromUserFields(user)).toBeNull()
    })

    it('should handle null values', () => {
      const user = {
        street: null,
        city: 'Zürich',
      }
      const address = getAddressFromUserFields(user)
      expect(address).not.toBeNull()
      expect(address?.street).toBe('')
    })

    it('should default country to Schweiz', () => {
      const user = {
        street: 'Test',
        city: 'Zürich',
      }
      const address = getAddressFromUserFields(user)
      expect(address?.country).toBe('Schweiz')
    })
  })

  describe('getDeliveryAddressFromUserFields', () => {
    it('should convert delivery fields to Address', () => {
      const user = {
        deliveryStreet: 'Lieferstrasse',
        deliveryStreetNumber: '5',
        deliveryPostalCode: '3000',
        deliveryCity: 'Bern',
        deliveryCountry: 'Schweiz',
      }
      const address = getDeliveryAddressFromUserFields(user)

      expect(address).not.toBeNull()
      expect(address?.street).toBe('Lieferstrasse')
      expect(address?.streetNumber).toBe('5')
      expect(address?.city).toBe('Bern')
    })

    it('should return null if no delivery address', () => {
      const user = {}
      expect(getDeliveryAddressFromUserFields(user)).toBeNull()
    })
  })
})

describe('Address Formatting', () => {
  describe('formatAddressLine', () => {
    it('should format complete address as single line', () => {
      const address: Address = {
        street: 'Bahnhofstrasse',
        streetNumber: '10',
        postalCode: '8001',
        city: 'Zürich',
        country: 'Schweiz',
      }
      expect(formatAddressLine(address)).toBe('Bahnhofstrasse 10, 8001 Zürich')
    })

    it('should handle missing street number', () => {
      const address: Address = {
        street: 'Bahnhofstrasse',
        streetNumber: '',
        postalCode: '8001',
        city: 'Zürich',
        country: 'Schweiz',
      }
      expect(formatAddressLine(address)).toBe('Bahnhofstrasse, 8001 Zürich')
    })

    it('should return empty string for null address', () => {
      expect(formatAddressLine(null)).toBe('')
    })
  })

  describe('formatAddressMultiline', () => {
    it('should format address as multiple lines', () => {
      const address: Address = {
        street: 'Bahnhofstrasse',
        streetNumber: '10',
        postalCode: '8001',
        city: 'Zürich',
        country: 'Schweiz',
      }
      const lines = formatAddressMultiline(address)

      expect(lines).toHaveLength(2)
      expect(lines[0]).toBe('Bahnhofstrasse 10')
      expect(lines[1]).toBe('8001 Zürich')
    })

    it('should include addresszusatz if present', () => {
      const address: Address = {
        street: 'Bahnhofstrasse',
        streetNumber: '10',
        postalCode: '8001',
        city: 'Zürich',
        country: 'Schweiz',
        addresszusatz: 'c/o Müller',
      }
      const lines = formatAddressMultiline(address)

      expect(lines).toHaveLength(3)
      expect(lines[0]).toBe('c/o Müller')
    })

    it('should include country if not Schweiz', () => {
      const address: Address = {
        street: 'Hauptstrasse',
        streetNumber: '1',
        postalCode: '12345',
        city: 'München',
        country: 'Deutschland',
      }
      const lines = formatAddressMultiline(address)

      expect(lines).toContain('Deutschland')
    })

    it('should not include country if Schweiz', () => {
      const address: Address = {
        street: 'Bahnhofstrasse',
        streetNumber: '10',
        postalCode: '8001',
        city: 'Zürich',
        country: 'Schweiz',
      }
      const lines = formatAddressMultiline(address)

      expect(lines).not.toContain('Schweiz')
    })

    it('should return empty array for null address', () => {
      expect(formatAddressMultiline(null)).toEqual([])
    })
  })
})
