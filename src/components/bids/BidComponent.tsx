'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Gavel, Zap, CheckCircle, AlertCircle, Loader2, Clock } from 'lucide-react'
import Link from 'next/link'
import { UserName } from '@/components/ui/UserName'
import { getShippingCost, ShippingMethod, ShippingMethodArray } from '@/lib/shipping'
import { BuyNowConfirmationModal } from './BuyNowConfirmationModal'
import { VerificationModal } from '@/components/verification/VerificationModal'

interface Bid {
  id: string
  amount: number
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string | null
    nickname: string | null
    image: string | null
  }
}

interface BidComponentProps {
  watchId: string
  startPrice: number
  buyNowPrice: number | null
  auctionEnd: Date | null
  sellerId: string
  shippingMethod?: ShippingMethodArray | ShippingMethod | string | null
}

export function BidComponent({ watchId, startPrice, buyNowPrice, auctionEnd, sellerId, shippingMethod }: BidComponentProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [bidAmount, setBidAmount] = useState('')
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [highestBid, setHighestBid] = useState<number | null>(null)

  // Normalisiere shippingMethod zu Array
  const normalizedShippingMethods: ShippingMethodArray = (() => {
    if (!shippingMethod) return null
    if (Array.isArray(shippingMethod)) return shippingMethod as ShippingMethod[]
    if (typeof shippingMethod === 'string') {
      try {
        return JSON.parse(shippingMethod) as ShippingMethod[]
      } catch {
        // Fallback: Einzelner String-Wert
        return [shippingMethod as ShippingMethod]
      }
    }
    return [shippingMethod as ShippingMethod]
  })()

  const shippingCost = getShippingCost(normalizedShippingMethods)
  const [watchStatus, setWatchStatus] = useState<{
    isSold: boolean
    isExpired: boolean
    isActive: boolean
    purchase: any
  } | null>(null)
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const [verificationInProgress, setVerificationInProgress] = useState(false)
  // Konvertiere auctionEnd zu Date falls es ein String ist
  const normalizedAuctionEnd = auctionEnd 
    ? (auctionEnd instanceof Date ? auctionEnd : new Date(auctionEnd))
    : null
  
  const [currentAuctionEnd, setCurrentAuctionEnd] = useState<Date | null>(normalizedAuctionEnd)
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
    total: number
  } | null>(null)
  const [showBuyNowModal, setShowBuyNowModal] = useState(false)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [verificationAction, setVerificationAction] = useState<'buy' | 'offer' | 'bid'>('buy')

  const isSeller = session?.user?.id === sellerId
  const isAuctionActive = currentAuctionEnd ? new Date(currentAuctionEnd) > new Date() : true

  // Aktualisiere currentAuctionEnd wenn Prop sich ändert
  useEffect(() => {
    if (auctionEnd) {
      try {
        const date = auctionEnd instanceof Date ? auctionEnd : new Date(auctionEnd)
        if (!isNaN(date.getTime())) {
          setCurrentAuctionEnd(date)
        } else {
          console.error('Invalid auctionEnd date:', auctionEnd)
          setCurrentAuctionEnd(null)
        }
      } catch (error) {
        console.error('Error parsing auctionEnd:', error)
        setCurrentAuctionEnd(null)
      }
    } else {
      setCurrentAuctionEnd(null)
    }
  }, [auctionEnd])

  // Countdown-Timer
  useEffect(() => {
    if (!currentAuctionEnd) {
      setTimeLeft(null)
      return
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const end = new Date(currentAuctionEnd).getTime()
      const difference = end - now

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 })
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds, total: difference })
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000) // Aktualisiere jede Sekunde

    return () => clearInterval(interval)
  }, [currentAuctionEnd])

  const loadWatchStatus = async () => {
    try {
      const res = await fetch(`/api/watches/${watchId}/status`)
      if (res.ok) {
        const data = await res.json()
        setWatchStatus(data)
        
        // Aktualisiere currentAuctionEnd mit der neuesten Zeit aus der DB
        if (data.auctionEnd) {
          setCurrentAuctionEnd(new Date(data.auctionEnd))
        }
      }
    } catch (error) {
      console.error('Error loading watch status:', error)
    }
  }

  const loadBids = async () => {
    try {
      const res = await fetch(`/api/bids?watchId=${watchId}`)
      if (res.ok) {
        const data = await res.json()
        setBids(data.bids || [])
        if (data.bids && data.bids.length > 0) {
          setHighestBid(data.bids[0].amount)
        } else {
          setHighestBid(null)
        }
      }
    } catch (error) {
      console.error('Error loading bids:', error)
    }
  }

  // Lade Verifizierungsstatus
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

  useEffect(() => {
    loadBids()
    loadWatchStatus()
    loadVerificationStatus()
    // Polling alle 5 Sekunden für neue Gebote und Status
    const interval = setInterval(() => {
      loadBids()
      loadWatchStatus()
    }, 5000)
    
    // Prüfe regelmäßig auf abgelaufene Auktionen
    const checkExpiredInterval = setInterval(async () => {
      if (currentAuctionEnd && new Date(currentAuctionEnd) <= new Date()) {
        // Auktion ist abgelaufen - prüfe ob sie verarbeitet wurde
        try {
          await fetch('/api/auctions/check-expired', { method: 'POST' })
          loadWatchStatus()
        } catch (error) {
          console.error('Error checking expired auctions:', error)
        }
      }
    }, 10000) // Alle 10 Sekunden prüfen
    
    return () => {
      clearInterval(interval)
      clearInterval(checkExpiredInterval)
    }
  }, [watchId, currentAuctionEnd])

  const minBid = highestBid ? highestBid + 1.00 : startPrice

  const handleBid = async () => {
    if (!session?.user) {
      const currentUrl = typeof window !== 'undefined' 
        ? window.location.pathname + window.location.search 
        : '/'
      window.location.href = `/login?callbackUrl=${encodeURIComponent(currentUrl)}`
      return
    }

    // Prüfe Verifizierung vor dem Bieten
    if (isVerified === false) {
      setVerificationAction('bid')
      setShowVerificationModal(true)
      return
    }

    if (!bidAmount.trim()) {
      setError('Bitte geben Sie einen Betrag ein')
      return
    }

    const amount = parseFloat(bidAmount.replace(/[^\d.,]/g, '').replace(',', '.'))
    if (isNaN(amount) || amount <= 0) {
      setError('Bitte geben Sie einen gültigen Betrag ein')
      return
    }

    if (amount < minBid) {
      setError(`Das Gebot muss mindestens CHF ${minBid.toFixed(2)} betragen`)
      return
    }

    // Prüfe, dass das Gebot nicht gleich dem aktuellen Höchstgebot ist
    if (highestBid && amount === highestBid) {
      setError(`Das Gebot muss höher sein als CHF ${highestBid.toFixed(2)}. Das nächste Gebot muss mindestens CHF ${minBid.toFixed(2)} betragen.`)
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          watchId,
          amount
        })
      })

      const data = await res.json()

      if (res.ok) {
        if (data.auctionExtended) {
          setSuccess('Gebot erfolgreich abgegeben! Die Auktion wurde um 3 Minuten verlängert.')
          // Lade sofort die aktualisierte auctionEnd-Zeit
          await loadWatchStatus()
        } else {
          setSuccess('Gebot erfolgreich abgegeben!')
        }
        setBidAmount('')
        await loadBids()
        // Lade auch Watch-Status neu (inkl. aktualisierter auctionEnd)
        await loadWatchStatus()
        // Prüfe auch auf abgelaufene Auktionen
        await fetch('/api/auctions/check-expired', { method: 'POST' })
        setTimeout(() => setSuccess(''), 5000)
      } else {
        setError(data.message || 'Fehler beim Abgeben des Gebots')
      }
    } catch (error) {
      console.error('Error submitting bid:', error)
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
    } finally {
      setLoading(false)
    }
  }

  const handleBuyNowClick = () => {
    if (!session?.user) {
      const currentUrl = typeof window !== 'undefined' 
        ? window.location.pathname + window.location.search 
        : '/'
      window.location.href = `/login?callbackUrl=${encodeURIComponent(currentUrl)}`
      return
    }
    
    // Prüfe Verifizierung vor dem Sofortkauf
    if (isVerified === false) {
      setVerificationAction('buy')
      setShowVerificationModal(true)
      return
    }
    
    if (!buyNowPrice) return
    setShowBuyNowModal(true)
  }

  const handleBuyNowConfirm = async () => {
    if (!buyNowPrice) return

    setShowBuyNowModal(false)
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          watchId,
          amount: buyNowPrice,
          isBuyNow: true
        })
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess('Sofortkauf erfolgreich! Das Angebot wurde beendet.')
        await loadBids()
        // Prüfe auch auf abgelaufene Auktionen (um Purchase zu erstellen)
        await fetch('/api/auctions/check-expired', { method: 'POST' })
        
        // Aktualisiere Benachrichtigungen sofort
        window.dispatchEvent(new CustomEvent('notifications-update'))
        
        setTimeout(() => setSuccess(''), 5000)
      } else {
        setError(data.message || 'Fehler beim Sofortkauf')
      }
    } catch (error) {
      console.error('Error buying now:', error)
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
    } finally {
      setLoading(false)
    }
  }

  if (!session?.user) {
    const currentUrl = typeof window !== 'undefined' 
      ? window.location.pathname + window.location.search 
      : '/'
    return (
      <div className="bg-white rounded-lg shadow p-6 mt-8">
        <p className="text-gray-600 text-center">
          Bitte <Link href={`/login?callbackUrl=${encodeURIComponent(currentUrl)}`} className="text-primary-600 hover:underline">melden Sie sich an</Link>, um zu bieten oder sofort zu kaufen.
        </p>
      </div>
    )
  }

  if (isSeller) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Gebote</h2>
        {bids.length === 0 ? (
          <p className="text-gray-500">Noch keine Gebote</p>
        ) : (
          <div className="space-y-2">
            {bids.map((bid) => (
              <div key={bid.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-semibold text-gray-900">
                    CHF {new Intl.NumberFormat('de-CH').format(bid.amount)}
                  </span>
                  <span className="text-sm text-gray-600">von</span>
                  {/* Profilbild */}
                  <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {bid.user.image ? (
                      <img src={bid.user.image} alt={bid.user.nickname || bid.user.name || ''} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-semibold text-primary-600">
                        {(bid.user.nickname || bid.user.name || bid.user.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {/* Nickname mit Verifizierungs-Badge */}
                  <UserName 
                    userId={bid.user.id} 
                    userName={bid.user.nickname || bid.user.name || bid.user.email || 'Unbekannt'} 
                    badgeSize="sm"
                    className="text-sm text-gray-900"
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(bid.createdAt).toLocaleString('de-CH')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Prüfe ob Angebot verkauft wurde
  if (watchStatus?.isSold) {
    const isCurrentUserBuyer = session?.user?.id === watchStatus.purchase?.buyerId
    return (
      <div className="bg-white rounded-lg shadow p-6 mt-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Angebot verkauft</h2>
          {isCurrentUserBuyer ? (
            <p className="text-gray-600 mb-4">
              Glückwunsch! Sie haben dieses Angebot erfolgreich erworben.
            </p>
          ) : (
            <p className="text-gray-600 mb-4">
              Dieses Angebot wurde bereits verkauft.
            </p>
          )}
          {highestBid && (
            <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
              <div className="text-sm text-green-700 mb-1">Verkaufspreis</div>
              <div className="text-2xl font-bold text-green-700">
                CHF {new Intl.NumberFormat('de-CH').format(highestBid)}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!isAuctionActive && !buyNowPrice && !watchStatus?.isSold) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mt-8">
        <p className="text-gray-600 text-center">Diese Auktion ist bereits beendet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {highestBid ? 'Aktuelles Höchstgebot' : 'Starten Sie die Auktion'}
      </h2>

      {/* Countdown */}
      {currentAuctionEnd && timeLeft && timeLeft.total > 0 && (
        <div className="mb-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <span className="text-sm font-semibold text-yellow-800">Auktion endet in:</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-700">{String(timeLeft.days).padStart(2, '0')}</div>
              <div className="text-xs text-yellow-600">Tag{timeLeft.days !== 1 ? 'e' : ''}</div>
            </div>
            <span className="text-yellow-600 font-bold">:</span>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-700">{String(timeLeft.hours).padStart(2, '0')}</div>
              <div className="text-xs text-yellow-600">Stunde{timeLeft.hours !== 1 ? 'n' : ''}</div>
            </div>
            <span className="text-yellow-600 font-bold">:</span>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-700">{String(timeLeft.minutes).padStart(2, '0')}</div>
              <div className="text-xs text-yellow-600">Minute{timeLeft.minutes !== 1 ? 'n' : ''}</div>
            </div>
            <span className="text-yellow-600 font-bold">:</span>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-700">{String(timeLeft.seconds).padStart(2, '0')}</div>
              <div className="text-xs text-yellow-600">Sekunde{timeLeft.seconds !== 1 ? 'n' : ''}</div>
            </div>
          </div>
          {timeLeft.total < 3 * 60 * 1000 && (
            <div className="mt-2 text-xs text-red-600 font-medium">
              ⚠️ Letzte 3 Minuten: Jedes neue Gebot verlängert die Auktion um 3 Minuten
            </div>
          )}
        </div>
      )}

      {currentAuctionEnd && timeLeft && timeLeft.total <= 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm font-semibold text-red-700">Diese Auktion ist beendet</span>
          </div>
        </div>
      )}

      {highestBid && (
        <div className="mb-4 p-3 bg-primary-50 rounded">
          <div className="text-2xl font-bold text-primary-700">
            CHF {new Intl.NumberFormat('de-CH').format(highestBid)}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {bids.length} {bids.length === 1 ? 'Gebot' : 'Gebote'}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">
          {success}
        </div>
      )}

      {!isSeller && (
        <div className="space-y-4">
          {/* Mitbieten */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ihr Gebot (mindestens CHF {minBid.toFixed(2)})
            </label>
            <div className="flex gap-2 items-stretch">
              <input
                type="text"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={`CHF ${minBid.toFixed(2)}`}
                className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                disabled={isSeller}
              />
              <button
                onClick={handleBid}
                disabled={loading || !isAuctionActive || isSeller}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0 whitespace-nowrap"
              >
                <Gavel className="h-4 w-4" />
                <span className="text-sm font-medium">Mitbieten</span>
              </button>
            </div>
          </div>

          {/* Sofortkauf */}
          {buyNowPrice && (
            <div className="border-t pt-4">
              <button
                onClick={handleBuyNowClick}
                disabled={loading || !isAuctionActive || isSeller}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-1 font-semibold"
              >
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  <span>Jetzt kaufen für CHF {new Intl.NumberFormat('de-CH').format(buyNowPrice)}</span>
                </div>
                {shippingCost > 0 && (
                  <div className="text-sm font-normal opacity-90">
                    + CHF {new Intl.NumberFormat('de-CH').format(shippingCost)} Versandkosten
                    <span className="ml-2">
                      (Total: CHF {new Intl.NumberFormat('de-CH').format(buyNowPrice + shippingCost)})
                    </span>
                  </div>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {isSeller && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            Als Verkäufer können Sie nicht bei Ihrem eigenen Angebot mitbieten.
          </p>
        </div>
      )}

      {/* Gebote-Liste */}
      {bids.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Gebotsverlauf</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {bids.slice(0, 5).map((bid) => (
              <div key={bid.id} className="flex justify-between items-center text-sm gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-semibold text-gray-900">
                    CHF {new Intl.NumberFormat('de-CH').format(bid.amount)}
                  </span>
                  <span className="text-gray-600">von</span>
                  {/* Profilbild */}
                  <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {bid.user.image ? (
                      <img src={bid.user.image} alt={bid.user.nickname || bid.user.name || ''} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-semibold text-primary-600">
                        {(bid.user.nickname || bid.user.name || bid.user.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {/* Nickname mit Verifizierungs-Badge */}
                  <UserName 
                    userId={bid.user.id} 
                    userName={bid.user.nickname || bid.user.name || bid.user.email || 'Unbekannt'} 
                    badgeSize="sm"
                    className="text-gray-900 text-xs"
                  />
                </div>
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {new Date(bid.createdAt).toLocaleString('de-CH')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Buy Now Confirmation Modal */}
      {buyNowPrice && (
        <BuyNowConfirmationModal
          isOpen={showBuyNowModal}
          onClose={() => setShowBuyNowModal(false)}
          onConfirm={handleBuyNowConfirm}
          buyNowPrice={buyNowPrice}
          shippingCost={shippingCost}
          isLoading={loading}
        />
      )}
      
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

