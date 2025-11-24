import { loadStripe, Stripe } from '@stripe/stripe-js'

// Stripe nur initialisieren, wenn der Key vorhanden ist
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

const stripePromise: Promise<Stripe | null> = stripeKey && stripeKey.trim() !== ''
  ? loadStripe(stripeKey)
  : Promise.resolve(null)

export default stripePromise

