import { describe, expect, it } from 'vitest'
import {
  sicReviewSlaLabel,
  sicReviewSlaOverdue,
  sicReviewSlaState,
  zurichWeekdaysAfterReceipt,
  zurichYmd,
} from '@/lib/sic/review-sla'

/** Montag 3. Aug 2026, 10:00 Zürich (CEST = UTC+2). */
const MON = new Date('2026-08-03T08:00:00.000Z')
const TUE = new Date('2026-08-04T08:00:00.000Z')
const WED = new Date('2026-08-05T08:00:00.000Z')
const FRI = new Date('2026-08-07T08:00:00.000Z')
const SAT = new Date('2026-08-08T08:00:00.000Z')
const NEXT_MON = new Date('2026-08-10T08:00:00.000Z')
const NEXT_TUE = new Date('2026-08-11T08:00:00.000Z')

describe('zurichYmd', () => {
  it('uses Europe/Zurich civil date', () => {
    expect(zurichYmd(MON)).toBe('2026-08-03')
  })
})

describe('zurichWeekdaysAfterReceipt', () => {
  it('same day is zero', () => {
    expect(zurichWeekdaysAfterReceipt(MON, MON)).toBe(0)
  })
  it('next weekday is one', () => {
    expect(zurichWeekdaysAfterReceipt(MON, TUE)).toBe(1)
  })
  it('skips the weekend from Friday to Monday', () => {
    expect(zurichWeekdaysAfterReceipt(FRI, SAT)).toBe(0)
    expect(zurichWeekdaysAfterReceipt(FRI, NEXT_MON)).toBe(1)
    expect(zurichWeekdaysAfterReceipt(FRI, NEXT_TUE)).toBe(2)
  })
})

describe('sicReviewSlaState', () => {
  it('on track the day of receipt', () => {
    expect(sicReviewSlaState(MON, MON)).toBe('on_track')
    expect(sicReviewSlaOverdue(MON, MON)).toBe(false)
    expect(sicReviewSlaLabel(MON, MON)).toBe('SLA: 1 Werktag')
  })
  it('due on the next weekday', () => {
    expect(sicReviewSlaState(MON, TUE)).toBe('due_today')
    expect(sicReviewSlaLabel(MON, TUE)).toBe('SLA: fällig heute')
  })
  it('overdue after that weekday', () => {
    expect(sicReviewSlaState(MON, WED)).toBe('overdue')
    expect(sicReviewSlaOverdue(MON, WED)).toBe(true)
    expect(sicReviewSlaLabel(MON, WED)).toBe('SLA überschritten · 2 Werktage')
  })
  it('Friday receipt is due Monday, overdue Tuesday', () => {
    expect(sicReviewSlaState(FRI, SAT)).toBe('on_track')
    expect(sicReviewSlaState(FRI, NEXT_MON)).toBe('due_today')
    expect(sicReviewSlaState(FRI, NEXT_TUE)).toBe('overdue')
  })
})
