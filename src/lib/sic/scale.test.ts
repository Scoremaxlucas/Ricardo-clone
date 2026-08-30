import { describe, expect, it } from 'vitest'
import {
  adminQueueCursorWhere,
  clampAdminQueueLimit,
  decodeAdminQueueCursor,
  encodeAdminQueueCursor,
  moduleStatusesForQueueFilter,
  parseSicAdminQueueFilter,
  parseSicAdminSearchQuery,
  sicAdminSearchLooksLikePaymentId,
} from '@/lib/sic/admin-queue'
import { cronBudgetState, isFullStripeRefund } from '@/lib/sic/refund-gate'

describe('isFullStripeRefund', () => {
  it('full refund', () => {
    expect(isFullStripeRefund(5000, 5000)).toBe(true)
    expect(isFullStripeRefund(5000, 6000)).toBe(true)
  })
  it('partial refund skipped', () => {
    expect(isFullStripeRefund(5000, 2500)).toBe(false)
    expect(isFullStripeRefund(5000, 0)).toBe(false)
  })
  it('invalid amounts', () => {
    expect(isFullStripeRefund(0, 0)).toBe(false)
    expect(isFullStripeRefund(-1, -1)).toBe(false)
  })
})

describe('cronBudgetState', () => {
  it('within budget', () => {
    const s = cronBudgetState({
      startedAtMs: Date.now(),
      budgetMs: 50_000,
      lastBatchSize: 150,
      batchSize: 150,
    })
    expect(s.withinBudget).toBe(true)
    expect(s.truncatedHint).toBe(false)
  })
  it('truncated hint when over budget and full batch', () => {
    const s = cronBudgetState({
      startedAtMs: Date.now() - 60_000,
      budgetMs: 50_000,
      lastBatchSize: 150,
      batchSize: 150,
    })
    expect(s.withinBudget).toBe(false)
    expect(s.truncatedHint).toBe(true)
  })
})

describe('admin queue helpers', () => {
  it('parses filter default IN_REVIEW', () => {
    expect(parseSicAdminQueueFilter(null)).toBe('IN_REVIEW')
    expect(parseSicAdminQueueFilter('PENDING_DOCS')).toBe('PENDING_DOCS')
    expect(parseSicAdminQueueFilter('all')).toBe('all')
    expect(parseSicAdminQueueFilter('nope')).toBe('IN_REVIEW')
  })
  it('statuses for filter', () => {
    expect(moduleStatusesForQueueFilter('IN_REVIEW')).toEqual(['IN_REVIEW'])
    expect(moduleStatusesForQueueFilter('all')).toEqual(['IN_REVIEW', 'PENDING_DOCS'])
  })
  it('clamps limit', () => {
    expect(clampAdminQueueLimit(null)).toBe(50)
    expect(clampAdminQueueLimit('200')).toBe(100)
    expect(clampAdminQueueLimit('10')).toBe(10)
  })
  it('encodes/decodes cursor', () => {
    const at = new Date('2026-08-01T12:00:00.000Z')
    const enc = encodeAdminQueueCursor(at, 'cuid123')
    expect(decodeAdminQueueCursor(enc)).toEqual({ updatedAt: at, id: 'cuid123' })
    expect(decodeAdminQueueCursor('bad')).toBeNull()
  })
  it('cursor where shape', () => {
    const at = new Date('2026-08-01T12:00:00.000Z')
    const w = adminQueueCursorWhere({ updatedAt: at, id: 'abc' })
    expect(w.OR).toHaveLength(2)
  })
})

describe('admin search query', () => {
  it('rejects empty and short input', () => {
    expect(parseSicAdminSearchQuery(null)).toBeNull()
    expect(parseSicAdminSearchQuery('  ab  ')).toBeNull()
  })
  it('trims and caps length', () => {
    expect(parseSicAdminSearchQuery('  max@sic.ch  ')).toBe('max@sic.ch')
    expect(parseSicAdminSearchQuery('x'.repeat(200))?.length).toBe(120)
  })
  it('recognises Stripe and cuid payment ids', () => {
    expect(sicAdminSearchLooksLikePaymentId('cs_test_abc123')).toBe(true)
    expect(sicAdminSearchLooksLikePaymentId('pi_3AbcDef')).toBe(true)
    expect(sicAdminSearchLooksLikePaymentId('clxyz01234567890123456789')).toBe(true)
    expect(sicAdminSearchLooksLikePaymentId('max@sic.ch')).toBe(false)
    expect(sicAdminSearchLooksLikePaymentId('SIC-2026-ABCDEFGH')).toBe(false)
  })
})
