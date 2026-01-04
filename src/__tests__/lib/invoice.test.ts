import { describe, expect, it } from 'vitest'

/**
 * Invoice calculation tests
 * Tests for invoice generation and fee calculation
 */

// Platform fee configuration (matches pricing config)
const PLATFORM_FEE_RATE = 0.09 // 9%
const VAT_RATE = 0.081 // 8.1% Swiss VAT
const MINIMUM_FEE = 0.5 // CHF 0.50

interface InvoiceCalculation {
  salePrice: number
  platformFee: number
  vatAmount: number
  total: number
}

const calculateInvoice = (salePrice: number): InvoiceCalculation => {
  // Calculate platform fee
  let platformFee = salePrice * PLATFORM_FEE_RATE
  
  // Apply minimum fee
  if (platformFee < MINIMUM_FEE) {
    platformFee = MINIMUM_FEE
  }

  // Calculate VAT on platform fee
  const vatAmount = platformFee * VAT_RATE

  // Total = platform fee + VAT
  const total = platformFee + vatAmount

  return {
    salePrice,
    platformFee: Math.round(platformFee * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  }
}

describe('Invoice Fee Calculation', () => {
  it('should calculate 9% platform fee correctly', () => {
    const invoice = calculateInvoice(100)
    expect(invoice.platformFee).toBe(9) // 9% of 100
  })

  it('should apply minimum fee for small sales', () => {
    const invoice = calculateInvoice(1) // 9% would be 0.09
    expect(invoice.platformFee).toBe(MINIMUM_FEE)
  })

  it('should calculate VAT correctly on platform fee', () => {
    const invoice = calculateInvoice(100)
    // 8.1% of 9 CHF = 0.729, rounded to 0.73
    expect(invoice.vatAmount).toBe(0.73)
  })

  it('should calculate total correctly', () => {
    const invoice = calculateInvoice(100)
    // 9 + 0.73 = 9.73
    expect(invoice.total).toBe(9.73)
  })
})

describe('Invoice Number Generation', () => {
  const generateInvoiceNumber = (year: number, month: number, sequence: number): string => {
    const paddedMonth = month.toString().padStart(2, '0')
    const paddedSequence = sequence.toString().padStart(5, '0')
    return `HEL-${year}${paddedMonth}-${paddedSequence}`
  }

  it('should generate correct invoice number format', () => {
    const invoiceNumber = generateInvoiceNumber(2025, 1, 1)
    expect(invoiceNumber).toBe('HEL-202501-00001')
  })

  it('should pad month and sequence correctly', () => {
    const invoiceNumber = generateInvoiceNumber(2025, 12, 99999)
    expect(invoiceNumber).toBe('HEL-202512-99999')
  })
})

describe('Due Date Calculation', () => {
  const calculateDueDate = (invoiceDate: Date, paymentTermDays: number = 30): Date => {
    const dueDate = new Date(invoiceDate)
    dueDate.setDate(dueDate.getDate() + paymentTermDays)
    return dueDate
  }

  it('should calculate 30 day payment term correctly', () => {
    const invoiceDate = new Date('2025-01-01')
    const dueDate = calculateDueDate(invoiceDate)
    expect(dueDate.toISOString().split('T')[0]).toBe('2025-01-31')
  })

  it('should handle month boundaries', () => {
    const invoiceDate = new Date('2025-01-15')
    const dueDate = calculateDueDate(invoiceDate)
    expect(dueDate.toISOString().split('T')[0]).toBe('2025-02-14')
  })
})

describe('Late Fee Calculation', () => {
  const LATE_FEE_AMOUNT = 10 // CHF 10 per reminder

  const calculateLateFee = (reminderCount: number): number => {
    // Late fee starts after first reminder
    if (reminderCount <= 1) return 0
    return (reminderCount - 1) * LATE_FEE_AMOUNT
  }

  it('should not apply late fee for first reminder', () => {
    expect(calculateLateFee(0)).toBe(0)
    expect(calculateLateFee(1)).toBe(0)
  })

  it('should apply late fee for subsequent reminders', () => {
    expect(calculateLateFee(2)).toBe(10)
    expect(calculateLateFee(3)).toBe(20)
  })
})
