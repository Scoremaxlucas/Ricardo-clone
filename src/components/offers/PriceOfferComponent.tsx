'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { MessageSquare, Send, Zap, ShoppingCart, Tag, Info, AlertCircle } from 'lucide-react'
import { VerificationModal } from '@/components/verification/VerificationModal'
import { ShippingMethodSelector } from '@/components/shipping/ShippingMethodSelector'
import {
  ShippingMethod,
  ShippingMethodArray,
  getShippingCostForMethod,
} from '@/lib/shipping'

interface PriceOfferComponentProps {
  watchId: string
  price: number
  sellerId: string
  buyNowPrice?: number | null
  shippingMethod?: string | null
}

export function PriceOfferComponent({
  watchId,
  price,
  sellerId,
  buyNowPrice,
  shippingMethod,
}: PriceOfferComponentProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [offerAmount, setOfferAmount] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [buyNowLoading, setBuyNowLoading] = useState(false)
  const [isSeller, setIsSeller] = useState(false)
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [verificationAction, setVerificationAction] = useState<'buy' | 'offer' | 'bid'>('offer')
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<ShippingMethod | null>(null)
  const [availableShippingMethods, setAvailableShippingMethods] = useState<ShippingMethod[]>([])

  useEffect(() => {
    if ((session?.user as { id?: string })?.id === sellerId) {
      setIsSeller(true)
    }
  }, [session, sellerId])

  // Parse verfügbare Liefermethoden
  useEffect(() => {
    if (shippingMethod) {
      try {
        const parsed =
          typeof shippingMethod === 'string' ? JSON.parse(shippingMethod) : shippingMethod
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAvailableShippingMethods(parsed)
          // Setze erste Methode als Standard nur wenn noch keine ausgewählt
          setSelectedShippingMethod(prev => prev || parsed[0])
        }
      } catch (e) {
        console.error('Error parsing shippingMethod:', e)
      }
    }
  }, [shippingMethod])

  // Lade Verifizierungsstatus
  useEffect(() => {
    const loadVerificationStatus = async () => {
      if ((session?.user as { id?: string })?.id) {
        try {
          const res = await fetch('/api/verification/get')
          if (res.ok) {
            const data = await res.json()
            const isApproved = data.verified === true && data.verificationStatus === 'approved'
            setIsVerified(isApproved)
          } else {
            setIsVerified(false)
          }
        } catch (error) {
          console.error('Error loading verification status:', error)
          setIsVerified(false)
        }
      } else {
        setIsVerified(null)
      }
    }
    loadVerificationStatus()
  }, [session])

  // Regel: Mindestens 60% des Verkaufspreises
  const minimumPrice = price * 0.6
  const maximumPrice = price - 0.01 // Muss niedriger als Verkaufspreis sein

  const handleBuyNow = async () => {
    if (!(session?.user as { id?: string })?.id) {
      toast.error('Bitte melden Sie sich an, um zu kaufen.')
      return
    }

    if (isSeller) {
      toast.error('Sie können Ihr eigenes Angebot nicht kaufen.')
      return
    }

    // Prüfe Verifizierung vor dem Sofortkauf
    if (isVerified === false) {
      setVerificationAction('buy')
      setShowVerificationModal(true)
      return
    }

    // Prüfe ob Liefermethode ausgewählt wurde (wenn Methoden verfügbar sind)
    if (availableShippingMethods.length > 0 && !selectedShippingMethod) {
      toast.error('Bitte wählen Sie eine Liefermethode aus.', {
        position: 'top-right',
        duration: 4000,
      })
      return
    }

    setBuyNowLoading(true)

    try {
      const response = await fetch('/api/purchases/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          watchId,
          price,
          shippingMethod: selectedShippingMethod || null, // Nur die gewählte Methode, nicht das Array
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Fehler beim Kauf')
      }

      toast.success('Kauf erfolgreich! Sie werden zur Kaufübersicht weitergeleitet.')

      // Aktualisiere Benachrichtigungen sofort
      window.dispatchEvent(new CustomEvent('notifications-update'))

      router.push('/my-watches/buying/purchased')
    } catch (error: any) {
      console.error('Error buying now:', error)
      toast.error(error.message || 'Fehler beim Kauf')
    } finally {
      setBuyNowLoading(false)
    }
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

    // Prüfe Verifizierung vor dem Preisvorschlag
    if (isVerified === false) {
      setVerificationAction('offer')
      setShowVerificationModal(true)
      return
    }

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
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-primary-100 p-2">
            <Tag className="h-5 w-5 text-primary-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Preisvorschlag machen</h3>
        </div>

        <div className="mb-6 rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4">
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

        {/* Sofortkauf-Option auch für nicht angemeldete Benutzer */}
        <div className="border-t-2 border-gray-200 pt-6">
          <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Sofortkauf
            </div>
            <div className="text-3xl font-bold text-primary-600">
              CHF {new Intl.NumberFormat('de-CH').format(price)}
            </div>
          </div>
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
      </div>
    )
  }

  return (
    <div className="rounded-lg border-2 border-gray-200 bg-white p-6 shadow-lg">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-primary-100 p-2">
          <Tag className="h-5 w-5 text-primary-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Preisvorschlag machen</h3>
          <p className="mt-0.5 text-sm text-gray-500">
            Mindestens CHF {minimumPrice.toFixed(2)} (60% des Verkaufspreises)
          </p>
        </div>
      </div>

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
              value={offerAmount}
              onChange={e => setOfferAmount(e.target.value)}
              placeholder={`z.B. ${minimumPrice.toFixed(2)}`}
              className="w-full rounded-lg border-2 border-gray-300 py-3 pl-16 pr-4 text-lg font-medium text-gray-900 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={loading}
              required
            />
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <Info className="h-3 w-3" />
            <span>
              Gültigkeitsbereich: CHF {minimumPrice.toFixed(2)} - CHF {maximumPrice.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Nachricht Input */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Nachricht an den Verkäufer <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Teilen Sie dem Verkäufer mit, warum Sie diesen Preis vorschlagen..."
            rows={4}
            className="w-full resize-y rounded-lg border-2 border-gray-300 px-4 py-3 text-gray-900 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={loading}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !offerAmount}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white shadow-md transition-all hover:bg-primary-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
      <div className="mt-5 rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
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

      {/* Sofortkauf-Option */}
      <div className="mt-6 border-t-2 border-gray-200 pt-6">
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

        {/* Liefermethoden-Auswahl */}
        {availableShippingMethods.length > 0 && (
          <div className="mb-4">
            <ShippingMethodSelector
              availableMethods={availableShippingMethods}
              selectedMethod={selectedShippingMethod}
              onMethodChange={setSelectedShippingMethod}
              showCosts={true}
            />
            {selectedShippingMethod && (
              <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Artikelpreis:</span>
                  <span className="font-semibold text-gray-900">
                    CHF {new Intl.NumberFormat('de-CH').format(price)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span className="text-gray-600">Versandkosten:</span>
                  <span className="font-semibold text-gray-900">
                    {getShippingCostForMethod(selectedShippingMethod) === 0
                      ? 'Kostenlos'
                      : `CHF ${getShippingCostForMethod(selectedShippingMethod).toFixed(2)}`}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2 text-base font-bold">
                  <span className="text-gray-900">Gesamtpreis:</span>
                  <span className="text-primary-600">
                    CHF{' '}
                    {new Intl.NumberFormat('de-CH').format(
                      price + getShippingCostForMethod(selectedShippingMethod)
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleBuyNow}
          disabled={buyNowLoading || isSeller || !(session?.user as { id?: string })?.id}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white shadow-md transition-all hover:bg-green-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {buyNowLoading ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              Wird verarbeitet...
            </>
          ) : (
            <>
              <ShoppingCart className="h-5 w-5" />
              Jetzt kaufen
            </>
          )}
        </button>
      </div>

      <VerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onVerify={() => {
          setShowVerificationModal(false)
          // Nach Verifizierung wird die Seite neu geladen und isVerified wird aktualisiert
        }}
        action={verificationAction}
      />
    </div>
  )
}
