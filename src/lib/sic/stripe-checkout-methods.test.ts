import {
  sicCheckoutMethodsWithout,
  stripeRejectedPaymentMethod,
} from '@/lib/sic/stripe-checkout-methods'
import { describe, expect, it } from 'vitest'

describe('stripeRejectedPaymentMethod', () => {
  it('reads the rejected type from Stripe’s invalid-method message', () => {
    expect(
      stripeRejectedPaymentMethod({
        param: 'payment_method_types',
        message:
          'The payment method type provided: twint is invalid. Please ensure the provided type is activated in your dashboard',
      })
    ).toBe('twint')
    expect(
      stripeRejectedPaymentMethod({
        param: 'payment_method_types',
        message: 'The payment method type provided: link is invalid.',
      })
    ).toBe('link')
  })

  it('ignores unrelated Stripe errors', () => {
    expect(stripeRejectedPaymentMethod({ param: 'success_url', message: 'Not a valid URL' })).toBeNull()
    expect(stripeRejectedPaymentMethod(null)).toBeNull()
  })
})

describe('sicCheckoutMethodsWithout', () => {
  it('drops the rejected method but never drops card', () => {
    expect(sicCheckoutMethodsWithout(['card', 'link'], 'link')).toEqual(['card'])
    expect(sicCheckoutMethodsWithout(['card', 'link'], 'card')).toEqual(['card'])
    expect(sicCheckoutMethodsWithout(['card'], 'twint')).toEqual(['card'])
  })
})
