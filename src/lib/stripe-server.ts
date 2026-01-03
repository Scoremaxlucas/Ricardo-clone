import Stripe from 'stripe'

// Lazy initialization to avoid build-time errors when STRIPE_SECRET_KEY is not set
let stripeInstance: Stripe | null = null

function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    })
  }
  return stripeInstance
}

// Export stripe as a getter that initializes on first access
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const instance = getStripe()
    const value = instance[prop as keyof Stripe]
    if (typeof value === 'function') {
      return value.bind(instance)
    }
    return value
  },
})

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''

// Helper to get Stripe API version
export const STRIPE_API_VERSION = '2023-10-16' as const
