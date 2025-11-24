'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { CreditCard, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

// Stripe immer initialisieren - wenn kein Key vorhanden ist, wird ein Fehler beim Payment Intent angezeigt
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
const stripePromise = stripeKey.trim() !== '' 
  ? loadStripe(stripeKey)
  : Promise.resolve(null)

interface InvoicePaymentFormProps {
  invoiceId: string
  invoiceNumber: string
  amount: number
  onSuccess?: () => void
}

function CheckoutForm({ invoiceId, invoiceNumber, amount, onSuccess }: InvoicePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Lade Payment Intent beim Mount
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const res = await fetch(`/api/invoices/${invoiceId}/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (res.ok) {
          const data = await res.json()
          setClientSecret(data.clientSecret)
        } else {
          const errorData = await res.json()
          const errorMessage = errorData.message || 'Fehler beim Erstellen des Payment Intents'
          setError(errorMessage)
          toast.error(errorMessage)
        }
      } catch (err) {
        const errorMessage = 'Fehler beim Laden der Zahlungsinformationen'
        setError(errorMessage)
        toast.error(errorMessage)
      }
    }

    createPaymentIntent()
  }, [invoiceId])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements || !clientSecret) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { error: submitError } = await elements.submit()
      if (submitError) {
        setError(submitError.message || 'Fehler bei der Zahlung')
        setIsLoading(false)
        return
      }

      // Bestätige Zahlung
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/my-watches/selling/fees?invoice=${invoiceId}&payment=success`
        }
      })

      if (confirmError) {
        setError(confirmError.message || 'Zahlung fehlgeschlagen')
        toast.error('Zahlung fehlgeschlagen: ' + confirmError.message)
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast.success('Zahlung erfolgreich!')
        
        // Update Rechnung lokal
        if (onSuccess) {
          onSuccess()
        }
        
        // Redirect nach kurzer Verzögerung
        setTimeout(() => {
          router.push(`/my-watches/selling/fees?invoice=${invoiceId}&payment=success`)
        }, 2000)
      }
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten')
      toast.error('Fehler bei der Zahlung')
    } finally {
      setIsLoading(false)
    }
  }

  if (!clientSecret) {
    if (error) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <strong>Hinweis:</strong> {error}
              <br />
              <br />
              Bitte verwenden Sie eine andere Zahlungsmethode (Banküberweisung, TWINT oder PayPal) oder kontaktieren Sie den Support.
            </div>
          </div>
        </div>
      )
    }
    
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Lade Zahlungsformular...</span>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <strong>Fehler:</strong> {error}
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4">
        <PaymentElement />
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <div>
          <p className="text-sm text-gray-600">Gesamtbetrag</p>
          <p className="text-2xl font-bold text-gray-900">
            CHF {amount.toFixed(2)}
          </p>
        </div>
        <button
          type="submit"
          disabled={!stripe || isLoading}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Wird verarbeitet...
            </>
          ) : (
            <>
              <CreditCard className="h-5 w-5" />
              Jetzt bezahlen
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        Ihre Zahlung wird sicher über Stripe verarbeitet. Ihre Kreditkartendaten werden nicht auf unseren Servern gespeichert.
      </p>
    </form>
  )
}

export function InvoicePaymentForm({ invoiceId, invoiceNumber, amount, onSuccess }: InvoicePaymentFormProps) {
  // Stripe wird immer geladen - wenn kein Key vorhanden ist, wird ein Fehler beim Payment Intent angezeigt
  return (
    <Elements
      stripe={stripePromise}
      options={{
        appearance: {
          theme: 'stripe',
        },
      }}
    >
      <CheckoutForm
        invoiceId={invoiceId}
        invoiceNumber={invoiceNumber}
        amount={amount}
        onSuccess={onSuccess}
      />
    </Elements>
  )
}
