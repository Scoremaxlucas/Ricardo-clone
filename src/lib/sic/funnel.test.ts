import { describe, expect, it } from 'vitest'
import {
  aggregateSicFunnel,
  formatSicFunnelHours,
  parseSicFunnelDays,
} from '@/lib/sic/funnel'

const t = (iso: string) => new Date(iso)

describe('parseSicFunnelDays', () => {
  it('accepts 7/30/90 and defaults to 30', () => {
    expect(parseSicFunnelDays('7')).toBe(7)
    expect(parseSicFunnelDays('90')).toBe(90)
    expect(parseSicFunnelDays(null)).toBe(30)
    expect(parseSicFunnelDays('14')).toBe(30)
  })
})

describe('aggregateSicFunnel', () => {
  it('tracks drop-off of the paid cohort, not raw event volume', () => {
    const view = aggregateSicFunnel({
      days: 30,
      since: t('2026-08-01T00:00:00.000Z'),
      checkoutStarted: 10,
      checkoutPaid: 8,
      created: [
        { certificateId: 'a', createdAt: t('2026-08-02T00:00:00.000Z') },
        { certificateId: 'b', createdAt: t('2026-08-03T00:00:00.000Z') },
        { certificateId: 'c', createdAt: t('2026-08-04T00:00:00.000Z') },
      ],
      followUp: [
        { kind: 'FIRST_UPLOAD', certificateId: 'a', createdAt: t('2026-08-02T12:00:00.000Z') },
        { kind: 'FIRST_UPLOAD', certificateId: 'b', createdAt: t('2026-08-03T06:00:00.000Z') },
        { kind: 'MODULE_VERIFIED', certificateId: 'a', createdAt: t('2026-08-03T00:00:00.000Z') },
        { kind: 'MODULE_VERIFIED', certificateId: 'a', createdAt: t('2026-08-05T00:00:00.000Z') },
        { kind: 'PDF_DOWNLOADED', certificateId: 'a', createdAt: t('2026-08-03T01:00:00.000Z') },
        { kind: 'VERIFY_SCANNED', certificateId: 'a', createdAt: t('2026-08-06T00:00:00.000Z') },
        { kind: 'VERIFY_SCANNED', certificateId: 'a', createdAt: t('2026-08-07T00:00:00.000Z') },
        { kind: 'MODULE_REJECTED', certificateId: 'b', createdAt: t('2026-08-04T00:00:00.000Z') },
      ],
    })

    const byId = Object.fromEntries(view.steps.map(s => [s.id, s]))
    expect(byId.checkout.unique).toBe(10)
    expect(byId['paid-email'].unique).toBe(8)
    expect(byId['paid-email'].fromPreviousPct).toBe(80)
    expect(byId.paid.unique).toBe(3)
    expect(byId.upload.unique).toBe(2)
    expect(byId.verified.unique).toBe(1)
    expect(byId.pdf.unique).toBe(1)
    expect(byId.scan.unique).toBe(1)
    expect(byId.upload.fromPreviousPct).toBe(67)
    expect(view.extras.rejectedCertificates).toBe(1)
    expect(view.extras.landlordScans).toBe(2)
    expect(view.timing.medianHoursPaidToUpload).toBe(9)
  })

  it('ignores follow-up for certificates outside the paid cohort', () => {
    const view = aggregateSicFunnel({
      days: 7,
      since: t('2026-08-01T00:00:00.000Z'),
      checkoutStarted: 1,
      checkoutPaid: 1,
      created: [{ certificateId: 'in', createdAt: t('2026-08-01T00:00:00.000Z') }],
      followUp: [
        { kind: 'FIRST_UPLOAD', certificateId: 'out', createdAt: t('2026-08-02T00:00:00.000Z') },
      ],
    })
    expect(view.steps.find(s => s.id === 'upload')?.unique).toBe(0)
  })
})

describe('formatSicFunnelHours', () => {
  it('picks minutes, hours or days', () => {
    expect(formatSicFunnelHours(null)).toBe('—')
    expect(formatSicFunnelHours(0.5)).toBe('30 Min.')
    expect(formatSicFunnelHours(3)).toBe('3 Std.')
    expect(formatSicFunnelHours(72)).toBe('3 Tage')
  })
})
