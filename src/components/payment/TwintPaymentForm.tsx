'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Smartphone, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = stripeKey && stripeKey.trim() !== '' ? loadStripe(stripeKey) : null

interface TwintPaymentFormProps {
  invoiceId: string
  invoiceNumber: string
  amount: number
  onSuccess?: () => void
}

function TwintCheckoutForm({
  invoiceId,
  invoiceNumber,
  amount,
  onSuccess,
  clientSecret,
}: TwintPaymentFormProps & { clientSecret: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

      // Bestätige TWINT-Zahlung
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/my-watches/selling/fees?invoice=${invoiceId}&payment=success`,
        },
      })

      if (confirmError) {
        setError(confirmError.message || 'TWINT-Zahlung fehlgeschlagen')
        toast.error('TWINT-Zahlung fehlgeschlagen: ' + confirmError.message)
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast.success(
          'TWINT-Zahlung erfolgreich! Die Rechnung wurde automatisch als bezahlt markiert.'
        )

        if (onSuccess) {
          onSuccess()
        }

        setTimeout(() => {
          router.push(`/my-watches/selling/fees?invoice=${invoiceId}&payment=success`)
        }, 2000)
      }
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten')
      toast.error('Fehler bei der TWINT-Zahlung')
    } finally {
      setIsLoading(false)
    }
  }

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
        <span className="ml-2 text-gray-600">Lade TWINT-Zahlungsformular...</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
            <div className="text-sm text-red-800">
              <strong>Fehler:</strong> {error}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg bg-gray-50 p-4">
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <div>
          <p className="text-sm text-gray-600">Gesamtbetrag</p>
          <p className="text-2xl font-bold text-gray-900">CHF {amount.toFixed(2)}</p>
        </div>
        <button
          type="submit"
          disabled={!stripe || isLoading}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Wird verarbeitet...
            </>
          ) : (
            <>
              <Smartphone className="h-5 w-5" />
              Mit TWINT bezahlen
            </>
          )}
        </button>
      </div>

      <div className="rounded-lg border border-green-200 bg-green-50 p-3">
        <div className="flex items-start gap-2">
          <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
          <div className="text-sm text-green-800">
            <strong>Automatische Bestätigung:</strong> Die Zahlung wird automatisch bestätigt,
            sobald sie in der TWINT-App abgeschlossen wurde. Sie müssen nichts weiter tun.
          </div>
        </div>
      </div>
    </form>
  )
}

export function TwintPaymentForm({
  invoiceId,
  invoiceNumber,
  amount,
  onSuccess,
}: TwintPaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!stripePromise) {
      setError('Stripe ist nicht konfiguriert')
      setLoading(false)
      return
    }

    let cancelled = false

    const fetchPaymentIntent = async () => {
      try {
        const res = await fetch(`/api/invoices/${invoiceId}/create-twint-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (cancelled) return

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          const errorMessage =
            errorData.message || 'Fehler beim Erstellen des TWINT Payment Intents'
          setError(errorMessage)
          setLoading(false)
          return
        }

        const data = await res.json()

        if (cancelled) return

        if (
          data.clientSecret &&
          typeof data.clientSecret === 'string' &&
          data.clientSecret.trim() !== ''
        ) {
          setClientSecret(data.clientSecret.trim())
          setLoading(false)
        } else {
          setError('Kein gültiges clientSecret erhalten')
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError('Fehler beim Laden der TWINT-Zahlungsinformationen')
          setLoading(false)
        }
      }
    }

    fetchPaymentIntent()

    return () => {
      cancelled = true
    }
  }, [invoiceId])

  if (!stripePromise) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
          <div className="text-sm text-yellow-800">
            <strong>Hinweis:</strong> Stripe ist nicht konfiguriert. Bitte verwenden Sie
            Banküberweisung.
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
        <span className="ml-2 text-gray-600">Lade TWINT-Zahlungsformular...</span>
      </div>
    )
  }

  if (error || !clientSecret) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
          <div className="text-sm text-yellow-800">
            <strong>Hinweis:</strong> {error || 'Fehler beim Laden der TWINT-Zahlungsinformationen'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: clientSecret,
        appearance: {
          theme: 'stripe',
        },
      }}
    >
      <TwintCheckoutForm
        invoiceId={invoiceId}
        invoiceNumber={invoiceNumber}
        amount={amount}
        onSuccess={onSuccess}
        clientSecret={clientSecret}
      />
    </Elements>
  )
}
