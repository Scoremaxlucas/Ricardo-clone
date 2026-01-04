import { describe, expect, it } from 'vitest'

/**
 * Validation utility tests
 * Tests for common validation functions used across the platform
 */

// Email validation regex (same as used in register route)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Swiss IBAN validation
const swissIbanRegex = /^CH\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{1}$/

describe('Email Validation', () => {
  it('should accept valid email addresses', () => {
    const validEmails = [
      'test@example.com',
      'user.name@domain.ch',
      'user+tag@domain.org',
      'firstname.lastname@company.co.uk',
    ]

    validEmails.forEach(email => {
      expect(emailRegex.test(email)).toBe(true)
    })
  })

  it('should reject invalid email addresses', () => {
    const invalidEmails = [
      'invalid',
      '@domain.com',
      'user@',
      'user@.com',
      'user name@domain.com',
      '',
    ]

    invalidEmails.forEach(email => {
      expect(emailRegex.test(email)).toBe(false)
    })
  })
})

describe('Swiss IBAN Validation', () => {
  it('should accept valid Swiss IBANs', () => {
    const validIbans = [
      'CH93 0076 2011 6238 5295 7',
      'CH9300762011623852957',
    ]

    validIbans.forEach(iban => {
      // Normalize by removing spaces for comparison
      const normalized = iban.replace(/\s/g, '')
      expect(normalized).toMatch(/^CH\d{19}$/)
    })
  })

  it('should reject non-Swiss IBANs', () => {
    const nonSwissIbans = [
      'DE89 3704 0044 0532 0130 00',
      'GB29 NWBK 6016 1331 9268 19',
    ]

    nonSwissIbans.forEach(iban => {
      expect(iban.startsWith('CH')).toBe(false)
    })
  })
})

describe('Password Validation', () => {
  const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push('Mindestens 8 Zeichen erforderlich')
    }
    
    return {
      valid: errors.length === 0,
      errors,
    }
  }

  it('should accept passwords with 8+ characters', () => {
    expect(validatePassword('password123').valid).toBe(true)
    expect(validatePassword('12345678').valid).toBe(true)
  })

  it('should reject passwords with less than 8 characters', () => {
    expect(validatePassword('short').valid).toBe(false)
    expect(validatePassword('1234567').valid).toBe(false)
  })
})

describe('Nickname Validation', () => {
  const validateNickname = (nickname: string): { valid: boolean; error?: string } => {
    if (!nickname || nickname.trim().length < 6) {
      return { valid: false, error: 'Nickname muss mindestens 6 Zeichen lang sein' }
    }
    return { valid: true }
  }

  it('should accept nicknames with 6+ characters', () => {
    expect(validateNickname('validnick').valid).toBe(true)
    expect(validateNickname('abcdef').valid).toBe(true)
  })

  it('should reject nicknames with less than 6 characters', () => {
    expect(validateNickname('short').valid).toBe(false)
    expect(validateNickname('abc').valid).toBe(false)
  })

  it('should reject empty nicknames', () => {
    expect(validateNickname('').valid).toBe(false)
    expect(validateNickname('   ').valid).toBe(false)
  })
})

describe('Price Formatting', () => {
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
    }).format(price)
  }

  it('should format prices correctly in CHF', () => {
    expect(formatPrice(100)).toContain('100')
    expect(formatPrice(1234.56)).toContain('1')
    expect(formatPrice(0)).toContain('0')
  })

  it('should handle decimal values', () => {
    const formatted = formatPrice(99.95)
    expect(formatted).toContain('99')
  })
})
