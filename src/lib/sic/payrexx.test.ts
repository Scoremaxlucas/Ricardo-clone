import { describe, expect, it } from 'vitest'
import { isPayrexxSessionId, parsePayrexxWebhookBody, payrexxSignature, readPayrexxWebhook } from '@/lib/sic/payrexx'

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

describe('parsePayrexxWebhookBody', () => {
  it('liest Formular-Webhooks wie JSON', () => {
    const form =
      'transaction%5Bid%5D=7&transaction%5Bstatus%5D=confirmed&transaction%5Binvoice%5D%5BreferenceId%5D=payrexx_abc12345&transaction%5Binvoice%5D%5BpaymentRequestId%5D=42'
    const hook = readPayrexxWebhook(parsePayrexxWebhookBody(form, 'application/x-www-form-urlencoded'))
    expect(hook).toEqual({ referenceId: 'payrexx_abc12345', gatewayId: 42, status: 'confirmed' })
  })

  it('liest JSON und verwirft Unsinn', () => {
    const json = JSON.stringify({ transaction: { status: 'confirmed', invoice: { referenceId: 'payrexx_abc12345', paymentRequestId: 42 } } })
    expect(readPayrexxWebhook(parsePayrexxWebhookBody(json, 'application/json')).gatewayId).toBe(42)
    expect(parsePayrexxWebhookBody('', 'application/json')).toBeNull()
    expect(parsePayrexxWebhookBody('kaputt', 'application/json')).toBeNull()
  })
})
