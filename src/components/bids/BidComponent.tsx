'use client'

import { UserName } from '@/components/ui/UserName'
import { VerificationModal } from '@/components/verification/VerificationModal'
import { PaymentProtectionBadge } from '@/components/product/PaymentProtectionBadge'
import { useLanguage } from '@/contexts/LanguageContext'
import { getShippingCost, ShippingMethod, ShippingMethodArray } from '@/lib/shipping'
import { AlertCircle, CheckCircle, Clock, Gavel, Zap } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BuyNowConfirmationModal } from './BuyNowConfirmationModal'

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
  itemId: string
  startPrice: number
  buyNowPrice: number | null
  auctionEnd: Date | null
  sellerId: string
  shippingMethod?: ShippingMethodArray | ShippingMethod | string | null
  paymentProtectionEnabled?: boolean
}

export function BidComponent({
  itemId,
  startPrice,
  buyNowPrice,
  auctionEnd,
  sellerId,
  shippingMethod,
  paymentProtectionEnabled = false,
}: BidComponentProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
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
  const [itemStatus, setItemStatus] = useState<{
    isSold: boolean
    isExpired: boolean
    isActive: boolean
    purchase: any
  } | null>(null)
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const [verificationInProgress, setVerificationInProgress] = useState(false)
  // Konvertiere auctionEnd zu Date falls es ein String ist
  const normalizedAuctionEnd = auctionEnd
    ? auctionEnd instanceof Date
      ? auctionEnd
      : new Date(auctionEnd)
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

  const isSeller = (session?.user as { id?: string })?.id === sellerId
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

  const loadItemStatus = async () => {
    try {
      const res = await fetch(`/api/watches/${itemId}/status`)
      if (res.ok) {
        const data = await res.json()
        setItemStatus(data)

        // Aktualisiere currentAuctionEnd mit der neuesten Zeit aus der DB
        if (data.auctionEnd) {
          setCurrentAuctionEnd(new Date(data.auctionEnd))
        }
      }
    } catch (error) {
      console.error('Error loading item status:', error)
    }
  }

  const loadBids = async () => {
    try {
      const res = await fetch(`/api/bids?watchId=${itemId}`)
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

  useEffect(() => {
    loadBids()
    loadItemStatus()
    loadVerificationStatus()
    // Polling alle 5 Sekunden für neue Gebote und Status
    const interval = setInterval(() => {
      loadBids()
      loadItemStatus()
    }, 5000)

    // Prüfe regelmäßig auf abgelaufene Auktionen
    const checkExpiredInterval = setInterval(async () => {
      if (currentAuctionEnd && new Date(currentAuctionEnd) <= new Date()) {
        // Auktion ist abgelaufen - prüfe ob sie verarbeitet wurde
        try {
          await fetch('/api/auctions/check-expired', { method: 'POST' })
          loadItemStatus()
        } catch (error) {
          console.error('Error checking expired auctions:', error)
        }
      }
    }, 10000) // Alle 10 Sekunden prüfen

    return () => {
      clearInterval(interval)
      clearInterval(checkExpiredInterval)
    }
  }, [itemId, currentAuctionEnd])

  const minBid = highestBid ? highestBid + 1.0 : startPrice

  const handleBid = async () => {
    if (!session?.user) {
      const currentUrl =
        typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/'
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
      setError(t.product.enterAmount)
      return
    }

    const amount = parseFloat(bidAmount.replace(/[^\d.,]/g, '').replace(',', '.'))
    if (isNaN(amount) || amount <= 0) {
      setError(t.product.enterValidAmount)
      return
    }

    if (amount < minBid) {
      setError(`${t.product.bidMustBeAtLeast} CHF ${minBid.toFixed(2)} ${t.product.beAmount}`)
      return
    }

    // Prüfe, dass das Gebot nicht gleich dem aktuellen Höchstgebot ist
    if (highestBid && amount === highestBid) {
      setError(
        `${t.product.bidMustBeHigher} CHF ${highestBid.toFixed(2)}. ${t.product.nextBidMustBe} CHF ${minBid.toFixed(2)} ${t.product.beAmount}.`
      )
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
          watchId: itemId, // API verwendet noch watchId
          amount,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        if (data.auctionExtended) {
          setSuccess(t.product.bidSuccessExtended)
          // Lade sofort die aktualisierte auctionEnd-Zeit
          await loadItemStatus()
        } else {
          setSuccess(t.product.bidSuccess)
        }
        setBidAmount('')
        await loadBids()
        // Lade auch Artikel-Status neu (inkl. aktualisierter auctionEnd)
        await loadItemStatus()
        // Prüfe auch auf abgelaufene Auktionen
        await fetch('/api/auctions/check-expired', { method: 'POST' })
        setTimeout(() => setSuccess(''), 5000)
      } else {
        setError(data.message || t.product.bidError)
      }
    } catch (error) {
      console.error('Error submitting bid:', error)
      setError(t.product.errorOccurred)
    } finally {
      setLoading(false)
    }
  }

  const handleBuyNowClick = () => {
    if (!session?.user) {
      const currentUrl =
        typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/'
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

  const handleBuyNowConfirm = async (selectedShippingMethod: ShippingMethod | null) => {
    if (!buyNowPrice) return

    setShowBuyNowModal(false)
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/purchases/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          watchId: itemId,
          price: buyNowPrice,
          shippingMethod: selectedShippingMethod || null, // Nur die gewählte Methode, nicht das Array
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(t.product.buyNowSuccess)
        await loadBids()
        // Prüfe auch auf abgelaufene Auktionen (um Purchase zu erstellen)
        await fetch('/api/auctions/check-expired', { method: 'POST' })

        // Aktualisiere Benachrichtigungen sofort
        window.dispatchEvent(new CustomEvent('notifications-update'))

        // Weiterleitung zur Kaufübersicht
        setTimeout(() => {
          window.location.href = '/my-watches/buying/purchased'
        }, 1500)
      } else {
        setError(data.message || t.product.buyNowError)
      }
    } catch (error) {
      console.error('Error buying now:', error)
      setError(t.product.errorOccurred)
    } finally {
      setLoading(false)
    }
  }

  if (!session?.user) {
    const currentUrl =
      typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/'
    return (
      <div className="mt-8 rounded-lg bg-white p-6 shadow">
        <p className="text-center text-gray-600">
          {t.product.pleaseLogin}{' '}
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(currentUrl)}`}
            className="text-primary-600 hover:underline"
          >
            {t.product.toPlaceBids}
          </Link>{' '}
          {t.product.toBidOrBuy}
        </p>
      </div>
    )
  }

  if (isSeller) {
    return (
      <div className="mt-8 rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">{t.product.bids}</h2>
        {bids.length === 0 ? (
          <p className="text-gray-500">{t.product.noBidsYet}</p>
        ) : (
          <div className="space-y-2">
            {bids.map(bid => (
              <div
                key={bid.id}
                className="flex items-center justify-between rounded bg-gray-50 p-3"
              >
                <div className="flex flex-1 items-center gap-2">
                  <span className="font-semibold text-gray-900">
                    CHF {new Intl.NumberFormat('de-CH').format(bid.amount)}
                  </span>
                  <span className="text-sm text-gray-600">von</span>
                  {/* Profilbild */}
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100">
                    {bid.user.image ? (
                      <img
                        src={bid.user.image}
                        alt={bid.user.nickname || bid.user.name || ''}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-semibold text-primary-600">
                        {(bid.user.nickname || bid.user.name || bid.user.email || 'U')
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    )}
                  </div>
                  {/* Nickname mit Verifizierungs-Badge */}
                  <UserName
                    userId={bid.user.id}
                    userName={bid.user.nickname || bid.user.name || bid.user.email || 'Unbekannt'}
                    showBadges={true}
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

  // Prüfe ob Artikel verkauft wurde
  if (itemStatus?.isSold) {
    const isCurrentUserBuyer =
      (session?.user as { id?: string })?.id === itemStatus.purchase?.buyerId
    return (
      <div className="mt-8 rounded-lg bg-white p-6 shadow">
        <div className="text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">{t.product.sold}</h2>
          {isCurrentUserBuyer ? (
            <p className="mb-4 text-gray-600">{t.bid.congratulations}</p>
          ) : (
            <p className="mb-4 text-gray-600">{t.bid.alreadySold}</p>
          )}
          {highestBid && (
            <div className="mb-4 rounded border border-green-200 bg-green-50 p-3">
              <div className="mb-1 text-sm text-green-700">{t.bid.salePrice}</div>
              <div className="text-2xl font-bold text-green-700">
                CHF {new Intl.NumberFormat('de-CH').format(highestBid)}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!isAuctionActive && !buyNowPrice && !itemStatus?.isSold) {
    return (
      <div className="mt-8 rounded-lg bg-white p-6 shadow">
        <p className="text-center text-gray-600">{t.bid.auctionEnded}</p>
      </div>
    )
  }

  return (
    <div className="mt-8 rounded-lg bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-semibold text-gray-900">
        {highestBid ? t.bid.currentHighestBid : t.bid.startAuction}
      </h2>

      {/* Countdown */}
      {currentAuctionEnd && timeLeft && timeLeft.total > 0 && (
        <div className="mb-4 rounded-lg border border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <span className="text-sm font-semibold text-yellow-800">{t.bid.auctionEndsIn}:</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-700">
                {String(timeLeft.days).padStart(2, '0')}
              </div>
              <div className="text-xs text-yellow-600">Tag{timeLeft.days !== 1 ? 'e' : ''}</div>
            </div>
            <span className="font-bold text-yellow-600">:</span>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-700">
                {String(timeLeft.hours).padStart(2, '0')}
              </div>
              <div className="text-xs text-yellow-600">
                {timeLeft.hours !== 1 ? t.product.hours : t.product.hour}
              </div>
            </div>
            <span className="font-bold text-yellow-600">:</span>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-700">
                {String(timeLeft.minutes).padStart(2, '0')}
              </div>
              <div className="text-xs text-yellow-600">
                {timeLeft.minutes !== 1 ? t.product.minutes : t.product.minute}
              </div>
            </div>
            <span className="font-bold text-yellow-600">:</span>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-700">
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>
              <div className="text-xs text-yellow-600">
                {timeLeft.seconds !== 1 ? t.product.seconds : t.product.second}
              </div>
            </div>
          </div>
          {timeLeft.total < 3 * 60 * 1000 && (
            <div className="mt-2 text-xs font-medium text-red-600">
              ⚠️ {t.product.lastThreeMinutes}
            </div>
          )}
        </div>
      )}

      {currentAuctionEnd && timeLeft && timeLeft.total <= 0 && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm font-semibold text-red-700">{t.product.auctionEnded}</span>
          </div>
        </div>
      )}

      {highestBid && (
        <div className="mb-4 rounded bg-primary-50 p-3">
          <div className="text-2xl font-bold text-primary-700">
            CHF {new Intl.NumberFormat('de-CH').format(highestBid)}
          </div>
          <div className="mt-1 text-sm text-gray-600">
            {bids.length} {bids.length === 1 ? t.product.bid_singular : t.product.bids}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {!isSeller && (
        <div className="space-y-4">
          {/* Mitbieten */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {t.product.yourBid} ({t.product.minimum} CHF {minBid.toFixed(2)})
            </label>
            <div className="flex items-stretch gap-2">
              <input
                type="text"
                value={bidAmount}
                onChange={e => setBidAmount(e.target.value)}
                placeholder={`CHF ${minBid.toFixed(2)}`}
                className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                disabled={isSeller}
              />
              <button
                onClick={handleBid}
                disabled={loading || !isAuctionActive || isSeller}
                className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Gavel className="h-4 w-4" />
                <span className="text-sm font-medium">{t.product.bid}</span>
              </button>
            </div>
          </div>

          {/* Sofortkauf */}
          {buyNowPrice && (
            <div className="border-t pt-4">
              {/* Payment Protection Badge */}
              {paymentProtectionEnabled && (
                <div className="mb-3">
                  <PaymentProtectionBadge enabled={paymentProtectionEnabled} />
                </div>
              )}
              <button
                onClick={handleBuyNowClick}
                disabled={loading || !isAuctionActive || isSeller}
                className="flex w-full flex-col items-center gap-1 rounded-md bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  <span>
                    {t.product.buyNowFor} CHF {new Intl.NumberFormat('de-CH').format(buyNowPrice)}
                  </span>
                </div>
                {normalizedShippingMethods && normalizedShippingMethods.length > 0 && (
                  <div className="text-sm font-normal opacity-90">
                    {normalizedShippingMethods.length === 1 ? (
                      <>
                        {shippingCost > 0 ? (
                          <>
                            + CHF {new Intl.NumberFormat('de-CH').format(shippingCost)}{' '}
                            {t.product.shippingCost}
                            <span className="ml-2">
                              ({t.product.total}: CHF{' '}
                              {new Intl.NumberFormat('de-CH').format(buyNowPrice + shippingCost)})
                            </span>
                          </>
                        ) : (
                          <span className="text-white">+ Versandkosten wählbar</span>
                        )}
                      </>
                    ) : (
                      <span className="text-white">+ Versandmethode wählbar</span>
                    )}
                  </div>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {isSeller && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">{t.product.cannotBidOwnItem}</p>
        </div>
      )}

      {/* Gebote-Liste */}
      {bids.length > 0 && (
        <div className="mt-6 border-t pt-6">
          <h3 className="mb-3 text-sm font-medium text-gray-700">{t.product.bidsHistory}</h3>
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {bids.slice(0, 5).map(bid => (
              <div key={bid.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="font-semibold text-gray-900">
                    CHF {new Intl.NumberFormat('de-CH').format(bid.amount)}
                  </span>
                  <span className="text-gray-600">{t.product.by}</span>
                  {/* Profilbild */}
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100">
                    {bid.user.image ? (
                      <img
                        src={bid.user.image}
                        alt={bid.user.nickname || bid.user.name || ''}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-semibold text-primary-600">
                        {(bid.user.nickname || bid.user.name || bid.user.email || 'U')
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    )}
                  </div>
                  {/* Nickname mit Verifizierungs-Badge */}
                  <UserName
                    userId={bid.user.id}
                    userName={bid.user.nickname || bid.user.name || bid.user.email || 'Unbekannt'}
                    showBadges={true}
                    badgeSize="sm"
                    className="text-xs text-gray-900"
                  />
                </div>
                <span className="flex-shrink-0 text-xs text-gray-500">
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
          availableShippingMethods={normalizedShippingMethods}
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
