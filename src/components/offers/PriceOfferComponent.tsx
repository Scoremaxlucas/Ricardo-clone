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
      <div className="space-y-4">
        {/* Preis-Box für Verkäufer - Wie Ricardo */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Ihr Verkaufspreis
          </div>
          <div className="text-2xl font-bold text-gray-900">
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
      <div className="space-y-4">
        {/* Sofortkauf-Option für nicht angemeldete - Wie Ricardo */}
        <div className="rounded-lg border border-primary-200 bg-gradient-to-br from-primary-50/50 to-white p-4">
          <div className="mb-1 flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wide text-primary-600">
              Sofortkauf
            </div>
            <Zap className="h-4 w-4 text-primary-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            CHF {new Intl.NumberFormat('de-CH').format(price)}
          </div>
          {paymentProtectionEnabled && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-primary-600">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-primary-300 text-[10px] font-bold">H</span>
              <span>Helvenda Schutz verfügbar</span>
            </div>
          )}
        </div>

        <button
          onClick={() => router.push(`/login?callbackUrl=/watches/${watchId}`)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-4 text-base font-semibold uppercase tracking-wide text-white shadow-md transition-all hover:bg-primary-700 active:bg-primary-800 sm:py-3 sm:text-sm"
        >
          <ShoppingCart className="h-5 w-5 sm:h-4 sm:w-4" />
          ANMELDEN & KAUFEN
        </button>

        {/* Preisvorschlag - Login erforderlich */}
        <button
          onClick={() => router.push(`/login?callbackUrl=/watches/${watchId}`)}
          className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all hover:bg-gray-100 active:bg-gray-200"
        >
          <div className="flex items-center gap-2 text-gray-500">
            <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-gray-300 text-xs font-bold sm:h-5 sm:w-5">H</span>
            <span className="text-sm font-medium">Preisvorschlag machen</span>
          </div>
          <span className="text-xs text-gray-400">Anmeldung erforderlich</span>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* PRIMARY: Sofortkauf-Option - Wie Ricardo: Weiss mit grüner Border, schwarzer Preis */}
      <div className="rounded-lg border border-primary-200 bg-gradient-to-br from-primary-50/50 to-white p-4">
        <div className="mb-1 flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide text-primary-600">
            Sofortkauf
          </div>
          <Zap className="h-4 w-4 text-primary-500" />
        </div>
        <div className="text-2xl font-bold text-gray-900">
          CHF {new Intl.NumberFormat('de-CH').format(price)}
        </div>
        {paymentProtectionEnabled && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-primary-600">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-primary-300 text-[10px] font-bold">H</span>
            <span>Helvenda Schutz verfügbar</span>
          </div>
        )}
      </div>

      {/* Jetzt kaufen Button - Mobile-optimiert mit grösseren Touch-Targets */}
      <button
        onClick={handleBuyNow}
        disabled={isSeller || !(session?.user as { id?: string })?.id}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-4 text-base font-semibold uppercase tracking-wide text-white shadow-md transition-all hover:from-primary-600 hover:to-primary-700 hover:shadow-lg active:from-primary-700 active:to-primary-800 disabled:cursor-not-allowed disabled:opacity-50 sm:py-3 sm:text-sm"
      >
        <ShoppingCart className="h-5 w-5 sm:h-4 sm:w-4" />
        SOFORT KAUFEN
      </button>

      {/* Favoriten Button Platzhalter - wird in ProductPageClient gerendert */}

      {/* SECONDARY: Preisvorschlag machen - Mobile-optimiert */}
      <button
        type="button"
        onClick={() => setShowPriceOfferForm(!showPriceOfferForm)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all hover:bg-gray-100 active:bg-gray-200 sm:p-3"
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-primary-300 text-xs font-bold text-primary-600 sm:h-5 sm:w-5">H</span>
          <div className="min-w-0 text-left">
            <span className="block text-sm font-semibold text-gray-900">Preisvorschlag</span>
            <span className="block text-xs text-gray-500 sm:hidden">
              ab CHF {minimumPrice.toFixed(0)}
            </span>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <span className="hidden text-xs text-gray-500 sm:block">
            Min. CHF {minimumPrice.toFixed(0)} (60%)
          </span>
          {showPriceOfferForm ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Collapsible Form - Mobile-optimiert */}
      {showPriceOfferForm && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 sm:p-4">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {/* Preisvorschlag Input - Grössere Touch-Targets */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600 sm:text-sm">
                Ihr Preisvorschlag
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4">
                  <span className="text-sm font-medium text-gray-500 sm:text-base">CHF</span>
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={offerAmount}
                  onChange={e => setOfferAmount(e.target.value)}
                  placeholder={`z.B. ${minimumPrice.toFixed(0)}`}
                  className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-12 pr-4 text-base font-medium text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 sm:py-2.5 sm:pl-14 sm:text-sm"
                  disabled={loading}
                  required
                  autoComplete="off"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Mindestens CHF {minimumPrice.toFixed(2)} (60% vom Preis)
              </p>
            </div>

            {/* Nachricht Input - Grössere Touch-Targets */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600 sm:text-sm">
                Nachricht <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="z.B. Wäre das möglich?"
                rows={2}
                className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 sm:py-2 sm:text-sm"
                disabled={loading}
              />
            </div>

            {/* Submit Button - Grössere Touch-Targets */}
            <button
              type="submit"
              disabled={loading || !offerAmount}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-primary-700 active:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50 sm:py-2.5 sm:text-sm"
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent sm:h-4 sm:w-4"></div>
                  Wird gesendet...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 sm:h-4 sm:w-4" />
                  Preisvorschlag senden
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
