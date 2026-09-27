import { describe, expect, it } from 'vitest'
import { isPayrexxSessionId, payrexxSignature, readPayrexxWebhook } from '@/lib/sic/payrexx'

describe('Payrexx', () => {
  it('erkennt nur eigene Session-IDs', () => {
    expect(isPayrexxSessionId('payrexx_abc12345')).toBe(true)
    expect(isPayrexxSessionId('cs_test_123')).toBe(false)
    expect(isPayrexxSessionId('free_abc')).toBe(false)
  })

  it('signiert den Body stabil', () => {
    expect(payrexxSignature('amount=7900&currency=CHF', 'secret')).toMatch(/^[A-Za-z0-9+/=]+$/)
    expect(payrexxSignature('amount=7900&currency=CHF', 'secret')).toBe(
      payrexxSignature('amount=7900&currency=CHF', 'secret')
    )
  })

  it('liest eine bestätigte Transaktion', () => {
    expect(
      readPayrexxWebhook({
        transaction: {
          status: 'confirmed',
          invoice: { referenceId: 'payrexx_abc12345', paymentRequestId: 42 },
        },
      })
    ).toEqual({ referenceId: 'payrexx_abc12345', gatewayId: 42, status: 'confirmed' })
  })
})