import { describe, expect, it } from 'vitest'

/**
 * Auction logic tests
 * Tests for bid validation and auction timing
 */

interface Bid {
  amount: number
  userId: string
  timestamp: Date
}

interface Auction {
  startPrice: number
  currentPrice: number
  buyNowPrice?: number
  auctionEnd: Date
  bids: Bid[]
  sellerId: string
}

// Minimum bid increment (Ricardo-style: 5% or minimum 1 CHF)
const calculateMinimumBid = (currentPrice: number): number => {
  const percentIncrement = currentPrice * 0.05
  const minimumIncrement = Math.max(percentIncrement, 1)
  return Math.ceil((currentPrice + minimumIncrement) * 100) / 100
}

// Check if bid is valid
const isValidBid = (
  auction: Auction,
  bidAmount: number,
  bidderId: string
): { valid: boolean; error?: string } => {
  // Cannot bid on own auction
  if (auction.sellerId === bidderId) {
    return { valid: false, error: 'Sie können nicht auf Ihren eigenen Artikel bieten' }
  }

  // Check if auction has ended
  if (new Date() > auction.auctionEnd) {
    return { valid: false, error: 'Diese Auktion ist bereits beendet' }
  }

  // Check minimum bid
  const minimumBid = calculateMinimumBid(auction.currentPrice)
  if (bidAmount < minimumBid) {
    return { valid: false, error: `Mindestgebot ist CHF ${minimumBid.toFixed(2)}` }
  }

  return { valid: true }
}

describe('Minimum Bid Calculation', () => {
  it('should calculate 5% increment for higher prices', () => {
    expect(calculateMinimumBid(100)).toBe(105) // 100 + 5% = 105
    expect(calculateMinimumBid(200)).toBe(210) // 200 + 5% = 210
  })

  it('should use minimum 1 CHF increment for low prices', () => {
    expect(calculateMinimumBid(10)).toBe(11) // 5% would be 0.50, so use 1 CHF
    expect(calculateMinimumBid(5)).toBe(6) // 5% would be 0.25, so use 1 CHF
  })

  it('should round up to 2 decimal places', () => {
    const result = calculateMinimumBid(33.33)
    expect(result).toBe(35) // 33.33 + 1.6665 = 34.9965, ceil to 35
  })
})

describe('Bid Validation', () => {
  const createMockAuction = (overrides: Partial<Auction> = {}): Auction => ({
    startPrice: 100,
    currentPrice: 100,
    auctionEnd: new Date(Date.now() + 86400000), // 24 hours from now
    bids: [],
    sellerId: 'seller123',
    ...overrides,
  })

  it('should reject bids from the seller', () => {
    const auction = createMockAuction()
    const result = isValidBid(auction, 150, 'seller123')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('eigenen Artikel')
  })

  it('should reject bids below minimum', () => {
    const auction = createMockAuction({ currentPrice: 100 })
    const result = isValidBid(auction, 101, 'bidder123') // Min is 105
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Mindestgebot')
  })

  it('should accept valid bids', () => {
    const auction = createMockAuction({ currentPrice: 100 })
    const result = isValidBid(auction, 110, 'bidder123')
    expect(result.valid).toBe(true)
  })

  it('should reject bids on ended auctions', () => {
    const auction = createMockAuction({
      auctionEnd: new Date(Date.now() - 1000), // Ended 1 second ago
    })
    const result = isValidBid(auction, 150, 'bidder123')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('beendet')
  })
})

describe('Auction Timing', () => {
  const isAuctionActive = (auctionEnd: Date): boolean => {
    return new Date() < auctionEnd
  }

  const getTimeRemaining = (auctionEnd: Date): { hours: number; minutes: number; seconds: number } => {
    const diff = auctionEnd.getTime() - Date.now()
    if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0 }

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return { hours, minutes, seconds }
  }

  it('should correctly identify active auctions', () => {
    const futureEnd = new Date(Date.now() + 3600000) // 1 hour from now
    expect(isAuctionActive(futureEnd)).toBe(true)
  })

  it('should correctly identify ended auctions', () => {
    const pastEnd = new Date(Date.now() - 1000) // 1 second ago
    expect(isAuctionActive(pastEnd)).toBe(false)
  })

  it('should calculate remaining time correctly', () => {
    const oneHourFromNow = new Date(Date.now() + 3600000)
    const remaining = getTimeRemaining(oneHourFromNow)
    // 1 hour = 60 minutes, but due to timing it might be 59 minutes and some seconds
    expect(remaining.hours).toBeGreaterThanOrEqual(0)
    expect(remaining.hours).toBeLessThanOrEqual(1)
    expect(remaining.minutes).toBeGreaterThanOrEqual(0)
  })

  it('should return zeros for ended auctions', () => {
    const pastEnd = new Date(Date.now() - 1000)
    const remaining = getTimeRemaining(pastEnd)
    expect(remaining.hours).toBe(0)
    expect(remaining.minutes).toBe(0)
    expect(remaining.seconds).toBe(0)
  })
})

describe('Buy Now Logic', () => {
  const canBuyNow = (auction: Auction): boolean => {
    // Buy now is available if:
    // 1. Buy now price is set
    // 2. No bids have been placed yet OR current price is below buy now
    // 3. Auction hasn't ended
    if (!auction.buyNowPrice) return false
    if (new Date() > auction.auctionEnd) return false
    if (auction.bids.length > 0 && auction.currentPrice >= auction.buyNowPrice) return false
    return true
  }

  it('should allow buy now when no bids placed', () => {
    const auction: Auction = {
      startPrice: 100,
      currentPrice: 100,
      buyNowPrice: 200,
      auctionEnd: new Date(Date.now() + 86400000),
      bids: [],
      sellerId: 'seller123',
    }
    expect(canBuyNow(auction)).toBe(true)
  })

  it('should not allow buy now when no buy now price set', () => {
    const auction: Auction = {
      startPrice: 100,
      currentPrice: 100,
      auctionEnd: new Date(Date.now() + 86400000),
      bids: [],
      sellerId: 'seller123',
    }
    expect(canBuyNow(auction)).toBe(false)
  })

  it('should not allow buy now when current price exceeds buy now price', () => {
    const auction: Auction = {
      startPrice: 100,
      currentPrice: 250,
      buyNowPrice: 200,
      auctionEnd: new Date(Date.now() + 86400000),
      bids: [{ amount: 250, userId: 'bidder1', timestamp: new Date() }],
      sellerId: 'seller123',
    }
    expect(canBuyNow(auction)).toBe(false)
  })
})
