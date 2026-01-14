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
      <div className="rounded-lg border-2 border-gray-200 bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-gray-100 p-2">
            <Tag className="h-5 w-5 text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Preisvorschläge</h3>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="flex items-center gap-2 text-sm text-gray-600">
            <Info className="h-4 w-4 text-gray-400" />
            Als Verkäufer können Sie keine Preisvorschläge machen.
          </p>
        </div>
      </div>
    )
  }

  if (!(session?.user as { id?: string })?.id) {
    return (
      <div className="rounded-lg border-2 border-gray-200 bg-white p-6 shadow-lg">
        {/* Sofortkauf-Option für nicht angemeldete Benutzer */}
        <div className="mb-6">
          <div className="mb-4 rounded-lg border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wide text-green-700">
                Sofortkauf verfügbar
              </div>
              <Zap className="h-4 w-4 text-green-600" />
            </div>
            <div className="mb-1 text-3xl font-bold text-green-700">
              CHF {new Intl.NumberFormat('de-CH').format(price)}
            </div>
            <p className="text-xs text-green-600">Artikel sofort kaufen ohne Verhandlung</p>
          </div>

          {/* Payment Protection Badge */}
          {paymentProtectionEnabled && (
            <div className="mb-4">
              <PaymentProtectionBadge enabled={paymentProtectionEnabled} />
            </div>
          )}

          <button
            disabled
            className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-gray-300 px-6 py-3 font-semibold text-gray-500 shadow-sm"
          >
            <ShoppingCart className="h-5 w-5" />
            Jetzt kaufen
          </button>
          <p className="mt-3 text-center text-xs text-gray-500">
            Bitte melden Sie sich an, um zu kaufen
          </p>
        </div>

        {/* Preisvorschlag Info für nicht angemeldete */}
        <div className="border-t-2 border-gray-200 pt-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary-100 p-2">
              <Tag className="h-5 w-5 text-primary-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Preisvorschlag machen</h3>
          </div>

          <div className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
              <div>
                <p className="mb-1 text-sm font-medium text-yellow-800">Anmeldung erforderlich</p>
                <p className="text-sm text-yellow-700">
                  Bitte melden Sie sich an, um einen Preisvorschlag zu machen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border-2 border-gray-200 bg-white p-3 shadow-lg md:p-6">
      {/* PRIMARY: Sofortkauf-Option - PRIORITIZED */}
      <div className="mb-3 md:mb-6">
        <div className="mb-3 rounded-lg border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-3 md:mb-4 md:p-5">
          <div className="mb-1 flex items-center justify-between md:mb-2">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-green-700 md:text-xs">
              Sofortkauf verfügbar
            </div>
            <Zap className="h-3.5 w-3.5 text-green-600 md:h-4 md:w-4" />
          </div>
          <div className="mb-0.5 text-xl font-bold text-green-700 md:mb-1 md:text-3xl">
            CHF {new Intl.NumberFormat('de-CH').format(price)}
          </div>
          <p className="text-[10px] text-green-600 md:text-xs">Artikel sofort kaufen ohne Verhandlung</p>
        </div>

        {/* Payment Protection Badge */}
        {paymentProtectionEnabled && (
          <div className="mb-4">
            <PaymentProtectionBadge enabled={paymentProtectionEnabled} />
          </div>
        )}

        {/* Jetzt kaufen Button - Leitet zur Checkout-Seite weiter (wie Ricardo) */}
        <button
          onClick={handleBuyNow}
          disabled={isSeller || !(session?.user as { id?: string })?.id}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white shadow-md transition-all hover:bg-green-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ minHeight: '44px' }}
        >
          <ShoppingCart className="h-5 w-5" />
          Jetzt kaufen
        </button>
        <p className="mt-2 text-center text-xs text-gray-500">
          Versandoptionen werden im nächsten Schritt angezeigt
        </p>
      </div>

      {/* SECONDARY: Preisvorschlag machen - COLLAPSIBLE */}
      <div className="border-t-2 border-gray-200 pt-3 md:pt-6">
        <button
          type="button"
          onClick={() => setShowPriceOfferForm(!showPriceOfferForm)}
          className="flex w-full items-center justify-between rounded-lg border-2 border-gray-200 bg-gray-50 p-2.5 transition-all hover:border-primary-300 hover:bg-gray-100 md:p-4"
        >
          <div className="flex items-center gap-2 md:gap-3">
            <div className="rounded-lg bg-primary-100 p-1.5 md:p-2">
              <Tag className="h-4 w-4 text-primary-600 md:h-5 md:w-5" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-gray-900 md:text-lg">Preisvorschlag machen</h3>
              <p className="text-xs text-gray-500 md:text-sm">
                Mindestens CHF {minimumPrice.toFixed(2)} (60%)
              </p>
            </div>
          </div>
          {showPriceOfferForm ? (
            <ChevronUp className="h-4 w-4 text-gray-500 md:h-5 md:w-5" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500 md:h-5 md:w-5" />
          )}
        </button>

        {/* Collapsible Form */}
        {showPriceOfferForm && (
          <div className="mt-4 space-y-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Preisvorschlag Input */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Ihr Preisvorschlag (CHF)
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <span className="font-medium text-gray-500">CHF</span>
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={offerAmount}
                    onChange={e => setOfferAmount(e.target.value)}
                    placeholder={`z.B. ${minimumPrice.toFixed(2)}`}
                    className="w-full rounded-lg border-2 border-gray-300 bg-white py-3 pl-16 pr-4 text-lg font-medium text-gray-900 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={loading}
                    required
                    style={{ minHeight: '44px' }}
                  />
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <Info className="h-3 w-3" />
                  <span>
                    Gültigkeitsbereich: CHF {minimumPrice.toFixed(2)} - CHF{' '}
                    {maximumPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Nachricht Input */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Nachricht an den Verkäufer{' '}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Teilen Sie dem Verkäufer mit, warum Sie diesen Preis vorschlagen..."
                  rows={4}
                  className="w-full resize-y rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-gray-900 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={loading}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !offerAmount}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white shadow-md transition-all hover:bg-primary-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ minHeight: '44px' }}
              >
                {loading ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Wird gesendet...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Preisvorschlag senden
                  </>
                )}
              </button>
            </form>

            {/* Info Box */}
            <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                <div className="text-xs text-blue-800">
                  <p className="mb-1 font-semibold">Wichtige Informationen:</p>
                  <ul className="list-inside list-disc space-y-0.5 text-blue-700">
                    <li>Der Preisvorschlag ist 48 Stunden gültig</li>
                    <li>Sie können maximal 3 aktive Preisvorschläge pro Artikel haben</li>
                    <li>Der Verkäufer wird per E-Mail benachrichtigt</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
