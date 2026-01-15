'use client'

import { PaymentProtectionBadge } from '@/components/product/PaymentProtectionBadge'
import { UserName } from '@/components/ui/UserName'
import { useLanguage } from '@/contexts/LanguageContext'
import { useRealtimeBids } from '@/hooks/useRealtimeBids'
import { getShippingCost, ShippingMethod, ShippingMethodArray } from '@/lib/shipping'
import { isRealtimeAvailable } from '@/lib/supabase'
import { AlertCircle, CheckCircle, Clock, Gavel, Wifi, WifiOff, Zap } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

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

  // === REALTIME: Handle auction updates ===
  const handleAuctionUpdate = useCallback(
    (update: { newEndTime?: string; isSold?: boolean }) => {
      if (update.newEndTime) {
        setCurrentAuctionEnd(new Date(update.newEndTime))
      }
      if (update.isSold) {
        loadItemStatus()
      }
    },
    []
  )

  // === REALTIME: Use realtime hook for bids ===
  const {
    bids: realtimeBids,
    highestBid: realtimeHighestBid,
    isConnected: isRealtimeConnected,
    isUsingRealtime,
    refreshBids,
  } = useRealtimeBids({
    watchId: itemId,
    onNewBid: (bid) => {
      console.log('[BidComponent] New bid received via realtime:', bid)
      // The hook already updates the bids state
    },
    onAuctionUpdate: handleAuctionUpdate,
    fallbackPollingInterval: 5000, // Fallback to 5s polling if realtime not available
  })

  // Sync realtime bids to local state
  useEffect(() => {
    if (realtimeBids.length > 0) {
      setBids(realtimeBids as Bid[])
      if (realtimeHighestBid !== null) {
        setHighestBid(realtimeHighestBid)
      }
    }
  }, [realtimeBids, realtimeHighestBid])

  useEffect(() => {
    loadItemStatus()

    // Reduced polling for status (realtime handles bids)
    // Only poll status every 15s instead of 5s since realtime handles bids
    const statusInterval = setInterval(() => {
      loadItemStatus()
    }, isUsingRealtime ? 15000 : 5000)

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
      clearInterval(statusInterval)
      clearInterval(checkExpiredInterval)
    }
  }, [itemId, currentAuctionEnd, isUsingRealtime])

  const minBid = highestBid ? highestBid + 1.0 : startPrice

  const handleBid = async () => {
    if (!session?.user) {
      const currentUrl =
        typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/'
      window.location.href = `/login?callbackUrl=${encodeURIComponent(currentUrl)}`
      return
    }

    // Keine Käufer-Verifizierung nötig (wie Ricardo)
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

  // RICARDO-STYLE: Redirect to checkout page instead of direct purchase
  const handleBuyNowClick = () => {
    if (!session?.user) {
      const checkoutUrl = `/checkout?watchId=${itemId}`
      window.location.href = `/login?callbackUrl=${encodeURIComponent(checkoutUrl)}`
      return
    }

    // Keine Käufer-Verifizierung nötig (wie Ricardo)
    if (!buyNowPrice) return

    // Weiterleitung zur Checkout-Seite (wie Ricardo)
    router.push(`/checkout?watchId=${itemId}`)
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
                      <Image
                        src={bid.user.image}
                        alt={bid.user.nickname || bid.user.name || ''}
                        width={24}
                        height={24}
                        className="h-full w-full object-cover"
                        unoptimized
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

  // Determine if we should show sticky CTA on mobile
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="space-y-3">
      {/* Startgebot Box - Kompakt wie Ricardo */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          {highestBid ? t.bid.currentHighestBid : 'Startgebot'}
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {highestBid 
            ? `CHF ${new Intl.NumberFormat('de-CH').format(highestBid)}`
            : `CHF ${new Intl.NumberFormat('de-CH').format(startPrice)}`
          }
        </div>
        {highestBid && (
          <div className="text-xs text-gray-500">
            {bids.length} {bids.length === 1 ? t.product.bid_singular : t.product.bids}
          </div>
        )}
      </div>

      {/* Countdown - Kompakter */}
      {currentAuctionEnd && timeLeft && timeLeft.total > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2">
          <Clock className="h-4 w-4 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-800">
            {timeLeft.days > 0 && `${timeLeft.days}d `}
            {String(timeLeft.hours).padStart(2, '0')}:
            {String(timeLeft.minutes).padStart(2, '0')}:
            {String(timeLeft.seconds).padStart(2, '0')}
          </span>
          {timeLeft.total < 3 * 60 * 1000 && (
            <span className="text-xs font-medium text-red-600">⚠️ Bald zu Ende!</span>
          )}
        </div>
      )}

      {currentAuctionEnd && timeLeft && timeLeft.total <= 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-sm font-medium text-red-700">{t.product.auctionEnded}</span>
        </div>
      )}

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
          {success}
        </div>
      )}

      {!isSeller && (
        <div className="space-y-2">
          {/* Bieten Button - Kompakt wie Ricardo */}
          <div className="flex items-stretch gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={bidAmount}
              onChange={e => setBidAmount(e.target.value)}
              placeholder={`Min. CHF ${minBid.toFixed(0)}`}
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              disabled={isSeller}
            />
            <button
              onClick={handleBid}
              disabled={loading || !isAuctionActive || isSeller}
              className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Gavel className="h-4 w-4" />
              BIETEN
            </button>
          </div>

          {/* Sofortkauf - Kompakt wie Ricardo */}
          {buyNowPrice && (
            <>
              <div className="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-3">
                <div className="mb-0.5 flex items-center justify-between">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-green-700">
                    Sofort-Kaufpreis
                  </div>
                  <Zap className="h-3.5 w-3.5 text-green-600" />
                </div>
                <div className="text-xl font-bold text-green-700">
                  CHF {new Intl.NumberFormat('de-CH').format(buyNowPrice)}
                </div>
                {paymentProtectionEnabled && (
                  <div className="mt-1">
                    <PaymentProtectionBadge enabled={paymentProtectionEnabled} compact={true} />
                  </div>
                )}
              </div>
              <button
                onClick={handleBuyNowClick}
                disabled={loading || !isAuctionActive || isSeller}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                SOFORT KAUFEN
              </button>
            </>
          )}
        </div>
      )}

      {/* Mobile Sticky CTA - Entfernt, da jetzt inline kompakte Buttons */}

      {isSeller && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
          <p className="text-xs text-blue-700">{t.product.cannotBidOwnItem}</p>
        </div>
      )}

      {/* Gebote-Liste - Kompakt */}
      {bids.length > 0 && (
        <div className="border-t border-gray-100 pt-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{t.product.bidsHistory}</h3>
          <div className="max-h-32 space-y-1 overflow-y-auto">
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
                      <Image
                        src={bid.user.image}
                        alt={bid.user.nickname || bid.user.name || ''}
                        width={20}
                        height={20}
                        className="h-full w-full object-cover"
                        unoptimized
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
    </div>
  )
}
