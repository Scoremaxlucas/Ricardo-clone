import { isSicAlertEvent } from '@/lib/sic/log'
import { describe, expect, it } from 'vitest'

describe('isSicAlertEvent', () => {
  it('meldet Fehlschläge, nicht Routine', () => {
    expect(isSicAlertEvent('sic.fulfillment.refund_failed')).toBe(true)
    expect(isSicAlertEvent('sic.admin.module_refund.provider_failed')).toBe(true)
    expect(isSicAlertEvent('sic.fulfillment.duplicate_refunded')).toBe(false)
    expect(isSicAlertEvent('sic.admin.review')).toBe(false)
  })
})
