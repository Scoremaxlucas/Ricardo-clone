'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { MessageSquare, Send, Zap, ShoppingCart, Tag, Info, AlertCircle } from 'lucide-react'
import { VerificationModal } from '@/components/verification/VerificationModal'

interface PriceOfferComponentProps {
  watchId: string
  price: number
  sellerId: string
  buyNowPrice?: number | null
  shippingMethod?: string | null
}

export function PriceOfferComponent({ watchId, price, sellerId, buyNowPrice, shippingMethod }: PriceOfferComponentProps) {
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

  useEffect(() => {
    if (session?.user?.id === sellerId) {
      setIsSeller(true)
    }
  }, [session, sellerId])

  // Lade Verifizierungsstatus
  useEffect(() => {
    const loadVerificationStatus = async () => {
      if (session?.user?.id) {
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
    if (!session?.user?.id) {
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
          shippingMethod: shippingMethod || null,
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
    
    if (!session?.user?.id) {
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
      toast.error(`Ihr Preisvorschlag muss mindestens 60% des Verkaufspreises betragen (mindestens CHF ${minimumPrice.toFixed(2)}).`)
      return
    }

    // Client-seitige Validierung: Muss niedriger als Verkaufspreis sein
    if (amountFloat >= price) {
      toast.error(`Ihr Preisvorschlag muss niedriger als der Verkaufspreis (CHF ${price.toFixed(2)}) sein.`)
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

      toast.success('Preisvorschlag erfolgreich erstellt! Der Verkäufer hat 48 Stunden Zeit, darauf zu antworten.')
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
      <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Tag className="h-5 w-5 text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Preisvorschläge</h3>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-gray-600 text-sm flex items-center gap-2">
            <Info className="h-4 w-4 text-gray-400" />
            Als Verkäufer können Sie keine Preisvorschläge machen.
          </p>
        </div>
      </div>
    )
  }

  if (!session?.user?.id) {
    return (
      <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Tag className="h-5 w-5 text-primary-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Preisvorschlag machen</h3>
        </div>
        
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 mb-1">
                Anmeldung erforderlich
              </p>
              <p className="text-sm text-yellow-700">
                Bitte melden Sie sich an, um einen Preisvorschlag zu machen.
              </p>
            </div>
          </div>
        </div>

        {/* Sofortkauf-Option auch für nicht angemeldete Benutzer */}
        <div className="pt-6 border-t-2 border-gray-200">
          <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Sofortkauf
            </div>
            <div className="text-3xl font-bold text-primary-600">
              CHF {new Intl.NumberFormat('de-CH').format(price)}
            </div>
          </div>
          <button
            disabled
            className="w-full px-6 py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-sm"
          >
            <ShoppingCart className="h-5 w-5" />
            Jetzt kaufen
          </button>
          <p className="mt-3 text-xs text-gray-500 text-center">
            Bitte melden Sie sich an, um zu kaufen
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary-100 rounded-lg">
          <Tag className="h-5 w-5 text-primary-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Preisvorschlag machen</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Mindestens CHF {minimumPrice.toFixed(2)} (60% des Verkaufspreises)
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Preisvorschlag Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Ihr Preisvorschlag (CHF)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-gray-500 font-medium">CHF</span>
            </div>
            <input
              type="text"
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              placeholder={`z.B. ${minimumPrice.toFixed(2)}`}
              className="w-full pl-16 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 font-medium text-lg transition-all"
              disabled={loading}
              required
            />
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <Info className="h-3 w-3" />
            <span>Gültigkeitsbereich: CHF {minimumPrice.toFixed(2)} - CHF {maximumPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Nachricht Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nachricht an den Verkäufer <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Teilen Sie dem Verkäufer mit, warum Sie diesen Preis vorschlagen..."
            rows={4}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 resize-y transition-all"
            disabled={loading}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !offerAmount}
          className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg transition-all"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
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
      <div className="mt-5 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-800">
            <p className="font-semibold mb-1">Wichtige Informationen:</p>
            <ul className="list-disc list-inside space-y-0.5 text-blue-700">
              <li>Der Preisvorschlag ist 48 Stunden gültig</li>
              <li>Sie können maximal 3 aktive Preisvorschläge pro Artikel haben</li>
              <li>Der Verkäufer wird per E-Mail benachrichtigt</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Sofortkauf-Option */}
      <div className="mt-6 pt-6 border-t-2 border-gray-200">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-5 mb-4 border-2 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-green-700 uppercase tracking-wide">
              Sofortkauf verfügbar
            </div>
            <Zap className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-700 mb-1">
            CHF {new Intl.NumberFormat('de-CH').format(price)}
          </div>
          <p className="text-xs text-green-600">
            Artikel sofort kaufen ohne Verhandlung
          </p>
        </div>
        <button
          onClick={handleBuyNow}
          disabled={buyNowLoading || isSeller || !session?.user?.id}
          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg transition-all"
        >
          {buyNowLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
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
