'use client'

import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { AlertCircle, CreditCard, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
const stripePromise = stripeKey.trim() !== '' ? loadStripe(stripeKey.trim()) : null

interface InvoicePaymentFormProps {
  invoiceId: string
  invoiceNumber: string
  amount: number
  onSuccess?: () => void
}

function CheckoutForm({
  invoiceId,
  invoiceNumber,
  amount,
  onSuccess,
  clientSecret,
}: InvoicePaymentFormProps & { clientSecret: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Deaktiviere Link nach dem Laden des Elements
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Link komplett verstecken durch CSS
      const hideLink = () => {
        // Verstecke Link-Button und Link-Authentifizierung
        const linkButtons = document.querySelectorAll(
          '[data-testid="link-button"], [data-testid="link-authentication-element"], [id*="link"], .LinkButton, [class*="Link"]'
        )
        linkButtons.forEach(el => {
          ;(el as HTMLElement).style.display = 'none'
        })

        // Verstecke auch Text der Link erwähnt
        const allElements = document.querySelectorAll('*')
        allElements.forEach(el => {
          const text = el.textContent || ''
          if ((text.includes('Link') && text.includes('schneller')) || text.includes('sicherer')) {
            const parent = el.closest('[class*="payment"], [class*="wallet"], [class*="element"]')
            if (parent) {
              ;(parent as HTMLElement).style.display = 'none'
            }
          }
        })
      }

      // Sofort ausführen
      hideLink()

      // Auch nach kurzer Verzögerung (wenn Stripe Element geladen ist)
      setTimeout(hideLink, 500)
      setTimeout(hideLink, 1000)
      setTimeout(hideLink, 2000)

      // Observer für dynamisch hinzugefügte Elemente
      const observer = new MutationObserver(hideLink)
      observer.observe(document.body, { childList: true, subtree: true })

      return () => observer.disconnect()
    }
  }, [elements])

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

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/my-watches/selling/fees?invoice=${invoiceId}&payment=success`,
        },
      })

      if (confirmError) {
        setError(confirmError.message || 'Zahlung fehlgeschlagen')
        toast.error('Zahlung fehlgeschlagen: ' + confirmError.message)
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast.success('Zahlung erfolgreich!')

        if (onSuccess) {
          onSuccess()
        }

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
        <PaymentElement />
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <div>
          <p className="text-sm text-gray-600">Gesamtbetrag</p>
          <p className="text-2xl font-bold text-gray-900">CHF {amount.toFixed(2)}</p>
        </div>
        <button
          type="submit"
          disabled={!stripe || isLoading}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
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

      <p className="text-center text-xs text-gray-500">
        Ihre Zahlung wird sicher über Stripe verarbeitet. Ihre Kreditkartendaten werden nicht auf
        unseren Servern gespeichert.
      </p>
    </form>
  )
}

export function InvoicePaymentForm({
  invoiceId,
  invoiceNumber,
  amount,
  onSuccess,
}: InvoicePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Prüfe Stripe Key
    if (!stripeKey || stripeKey.trim() === '') {
      setError(
        'Kreditkartenzahlung ist derzeit nicht verfügbar. Bitte verwenden Sie Banküberweisung.'
      )
      setLoading(false)
      return
    }

    if (!stripePromise) {
      setError(
        'Kreditkartenzahlung ist derzeit nicht verfügbar. Bitte verwenden Sie Banküberweisung.'
      )
      setLoading(false)
      return
    }

    let cancelled = false

    const fetchPaymentIntent = async () => {
      try {
        // Timeout-AbortController für den Fetch
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 Sekunden Timeout

        const res = await fetch(`/api/invoices/${invoiceId}/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (cancelled) return

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          console.error('Payment Intent Error:', errorData)

          // Benutzerfreundliche Fehlermeldung
          let errorMessage = 'Kreditkartenzahlung ist derzeit nicht verfügbar.'
          if (
            errorData.error === 'STRIPE_SECRET_KEY_MISSING' ||
            errorData.error === 'STRIPE_AUTH_ERROR'
          ) {
            errorMessage = 'Kreditkartenzahlung ist noch nicht eingerichtet.'
          } else if (errorData.message) {
            errorMessage = errorData.message
          }

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
          const secret = data.clientSecret.trim()
          setClientSecret(secret)
          setReady(true)
          setLoading(false)
        } else {
          setError('Kreditkartenzahlung ist derzeit nicht verfügbar.')
          setLoading(false)
        }
      } catch (err: any) {
        if (cancelled) return

        console.error('Payment Intent Fetch Error:', err)

        if (err.name === 'AbortError') {
          setError('Zeitüberschreitung beim Laden. Bitte verwenden Sie Banküberweisung.')
        } else {
          setError('Kreditkartenzahlung ist derzeit nicht verfügbar.')
        }
        setLoading(false)
      }
    }

    fetchPaymentIntent()

    return () => {
      cancelled = true
    }
  }, [invoiceId])

  // Memoize options to prevent re-renders
  const elementsOptions = useMemo(() => {
    if (!clientSecret || typeof clientSecret !== 'string' || clientSecret.trim() === '') {
      return null
    }

    // Prüfe ob Mobile (client-side only)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

    return {
      clientSecret: clientSecret.trim(),
      appearance: {
        theme: 'stripe' as const,
      },
      // Auf Mobile: Link deaktivieren (wird in Elements-Komponente verwendet)
      // paymentMethodTypes wird nicht verwendet wenn automatic_payment_methods aktiv ist
    }
  }, [clientSecret])

  // Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
        <span className="mt-3 text-sm text-gray-600">Lade Zahlungsformular...</span>
      </div>
    )
  }

  // Error State - zeige klare Fehlermeldung
  if (error || !ready) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
          <div className="text-sm text-yellow-800">
            <strong>Hinweis:</strong> {error || 'Kreditkartenzahlung ist derzeit nicht verfügbar.'}
            <br />
            <span className="text-yellow-700">Bitte verwenden Sie die Banküberweisung.</span>
          </div>
        </div>
      </div>
    )
  }

  // Prüfe ob alle erforderlichen Daten vorhanden sind
  if (!clientSecret || !stripePromise || !elementsOptions) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
          <div className="text-sm text-yellow-800">
            <strong>Hinweis:</strong> Kreditkartenzahlung ist derzeit nicht verfügbar.
            <br />
            <span className="text-yellow-700">Bitte verwenden Sie die Banküberweisung.</span>
          </div>
        </div>
      </div>
    )
  }

  // Stripe Elements rendern
  return (
    <Elements
      key={`elements-${clientSecret.substring(0, 20)}`}
      stripe={stripePromise}
      options={{
        clientSecret: clientSecret,
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
        clientSecret={clientSecret}
      />
    </Elements>
  )
}
