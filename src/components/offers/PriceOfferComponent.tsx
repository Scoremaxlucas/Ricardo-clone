'use client'

import { PaymentProtectionBadge } from '@/components/product/PaymentProtectionBadge'
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Send,
  ShoppingCart,
  Tag,
  Zap,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

interface PriceOfferComponentProps {
  watchId: string
  price: number
  sellerId: string
  buyNowPrice?: number | null
  shippingMethod?: string | null
  paymentProtectionEnabled?: boolean
  watch?: {
    id: string
    price: number
    buyNowPrice?: number | null
  }
}

export function PriceOfferComponent({
  watchId,
  price,
  sellerId,
  buyNowPrice,
  shippingMethod,
  paymentProtectionEnabled = false,
  watch,
}: PriceOfferComponentProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [offerAmount, setOfferAmount] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSeller, setIsSeller] = useState(false)
  const [showPriceOfferForm, setShowPriceOfferForm] = useState(false)

  useEffect(() => {
    if ((session?.user as { id?: string })?.id === sellerId) {
      setIsSeller(true)
    }
  }, [session, sellerId])

  // Regel: Mindestens 60% des Verkaufspreises
  const minimumPrice = price * 0.6
  const maximumPrice = price - 0.01 // Muss niedriger als Verkaufspreis sein

  // RICARDO-STYLE: Redirect to checkout page instead of direct purchase
  const handleBuyNow = () => {
    if (!(session?.user as { id?: string })?.id) {
      toast.error('Bitte melden Sie sich an, um zu kaufen.')
      router.push(`/login?callbackUrl=/checkout?watchId=${watchId}`)
      return
    }

    if (isSeller) {
      toast.error('Sie können Ihr eigenes Angebot nicht kaufen.')
      return
    }

    // Weiterleitung zur Checkout-Seite (wie Ricardo - keine Käufer-Verifizierung nötig)
    router.push(`/checkout?watchId=${watchId}`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!(session?.user as { id?: string })?.id) {
      toast.error('Bitte melden Sie sich an, um einen Preisvorschlag zu machen.')
      return
    }

    if (isSeller) {
      toast.error('Sie können keinen Preisvorschlag für Ihr eigenes Angebot machen.')
      return
    }

    // Keine Käufer-Verifizierung nötig (wie Ricardo)
    const amountFloat = parseFloat(offerAmount.replace(/[^\d.,]/g, '').replace(',', '.'))

    if (isNaN(amountFloat) || amountFloat <= 0) {
      toast.error('Bitte geben Sie einen gültigen Betrag ein.')
      return
    }

    // Client-seitige Validierung: Mindestens 60%
    if (amountFloat < minimumPrice) {
      toast.error(
        `Ihr Preisvorschlag muss mindestens 60% des Verkaufspreises betragen (mindestens CHF ${minimumPrice.toFixed(2)}).`
      )
      return
    }

    // Client-seitige Validierung: Muss niedriger als Verkaufspreis sein
    if (amountFloat >= price) {
      toast.error(
        `Ihr Preisvorschlag muss niedriger als der Verkaufspreis (CHF ${price.toFixed(2)}) sein.`
      )
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          watchId,
          amount: amountFloat,
          message: message.trim() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Fehler beim Erstellen des Preisvorschlags')
      }

      toast.success(
        'Preisvorschlag erfolgreich erstellt! Der Verkäufer hat 48 Stunden Zeit, darauf zu antworten.'
      )
      setOfferAmount('')
      setMessage('')
      setShowPriceOfferForm(false) // Collapse form after successful submission
    } catch (error: any) {
      console.error('Error creating price offer:', error)
      toast.error(error.message || 'Fehler beim Erstellen des Preisvorschlags')
    } finally {
      setLoading(false)
    }
  }

  if (isSeller) {
    return (
      <div className="space-y-3">
        {/* Preis-Box für Verkäufer */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Ihr Verkaufspreis
          </div>
          <div className="text-2xl font-bold text-gray-700">
            CHF {new Intl.NumberFormat('de-CH').format(price)}
          </div>
        </div>
        <p className="text-center text-xs text-gray-400">
          Sie können Ihr eigenes Angebot nicht kaufen
        </p>
      </div>
    )
  }

  if (!(session?.user as { id?: string })?.id) {
    return (
      <div className="space-y-3">
        {/* Sofortkauf-Option für nicht angemeldete Benutzer - Kompakt */}
        <div className="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-3">
          <div className="mb-1 flex items-center justify-between">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-green-700">
              Sofortkauf
            </div>
            <Zap className="h-3.5 w-3.5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-700">
            CHF {new Intl.NumberFormat('de-CH').format(price)}
          </div>
          {paymentProtectionEnabled && (
            <div className="mt-1.5">
              <PaymentProtectionBadge enabled={paymentProtectionEnabled} compact={true} />
            </div>
          )}
        </div>

        <button
          disabled
          className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-500"
        >
          <ShoppingCart className="h-4 w-4" />
          SOFORT KAUFEN
        </button>
        <p className="text-center text-xs text-gray-500">
          Anmelden um zu kaufen
        </p>

        {/* Preisvorschlag - Kompakt */}
        <div className="rounded-lg border border-gray-200 bg-white p-2.5">
          <div className="flex items-center gap-2 text-gray-400">
            <Tag className="h-4 w-4" />
            <span className="text-sm">Preisvorschlag machen</span>
            <span className="ml-auto text-xs">Anmeldung erforderlich</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* PRIMARY: Sofortkauf-Option - Kompakt wie Ricardo */}
      <div className="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-3">
        <div className="mb-1 flex items-center justify-between">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-green-700">
            Sofortkauf
          </div>
          <Zap className="h-3.5 w-3.5 text-green-600" />
        </div>
        <div className="text-2xl font-bold text-green-700">
          CHF {new Intl.NumberFormat('de-CH').format(price)}
        </div>
        {paymentProtectionEnabled && (
          <div className="mt-1.5">
            <PaymentProtectionBadge enabled={paymentProtectionEnabled} compact={true} />
          </div>
        )}
      </div>

      {/* Jetzt kaufen Button - Kompakt */}
      <button
        onClick={handleBuyNow}
        disabled={isSeller || !(session?.user as { id?: string })?.id}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ShoppingCart className="h-4 w-4" />
        SOFORT KAUFEN
      </button>

      {/* SECONDARY: Preisvorschlag machen - Kompakt wie Ricardo */}
      <button
        type="button"
        onClick={() => setShowPriceOfferForm(!showPriceOfferForm)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white p-2.5 transition-all hover:border-gray-300"
      >
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-primary-600" />
          <div className="text-left">
            <span className="text-sm font-semibold text-gray-900">Preisvorschlag machen</span>
            <span className="ml-2 text-xs text-gray-500">
              Mindestens CHF {minimumPrice.toFixed(0)} (60%)
            </span>
          </div>
        </div>
        {showPriceOfferForm ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {/* Collapsible Form - Kompakt */}
      {showPriceOfferForm && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Preisvorschlag Input */}
            <div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-sm text-gray-500">CHF</span>
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={offerAmount}
                  onChange={e => setOfferAmount(e.target.value)}
                  placeholder={`z.B. ${minimumPrice.toFixed(0)}`}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-12 pr-3 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Nachricht Input - Kompakter */}
            <div>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Nachricht (optional)..."
                rows={2}
                className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                disabled={loading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !offerAmount}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Wird gesendet...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Vorschlag senden
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
