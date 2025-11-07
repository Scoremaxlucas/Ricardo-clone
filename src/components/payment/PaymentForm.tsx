'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/Button'
import { toast } from 'react-hot-toast'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentFormProps {
  amount: number
  onSuccess: (paymentIntent: any) => void
  onError: (error: string) => void
}

function CheckoutForm({ amount, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)

    try {
      // Create payment intent
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency: 'chf',
          metadata: {
            type: 'watch_purchase',
          },
        }),
      })

      const { clientSecret } = await response.json()

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
          },
        }
      )

      if (error) {
        onError(error.message || 'Payment failed')
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent)
        toast.success('Zahlung erfolgreich!')
      }
    } catch (error) {
      onError('Ein Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border border-gray-300 rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-lg font-medium">Gesamtbetrag:</span>
          <span className="text-xl font-bold text-primary-600">
            CHF {amount.toLocaleString()}
          </span>
        </div>
      </div>

      <Button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full"
        loading={isLoading}
      >
        {isLoading ? 'Wird verarbeitet...' : `CHF ${amount.toLocaleString()} bezahlen`}
      </Button>
    </form>
  )
}

export function PaymentForm({ amount, onSuccess, onError }: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm
        amount={amount}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  )
}

