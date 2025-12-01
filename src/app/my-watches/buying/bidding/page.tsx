'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Gavel, Clock, TrendingUp, AlertCircle, Zap } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { BuyNowConfirmationModal } from '@/components/bids/BuyNowConfirmationModal'

interface BidWithWatch {
  id: string
  amount: number
  createdAt: string
  watch: {
    id: string
    title: string
    brand: string
    model: string
    price: number
    buyNowPrice: number | null
    images: string[]
    auctionEnd: Date | null
    seller: {
      id: string
      name: string | null
      email: string | null
    }
    highestBid: number
    isMyBidHighest: boolean
    auctionActive: boolean
  }
}

export default function MyBiddingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bids, setBids] = useState<BidWithWatch[]>([])
  const [loading, setLoading] = useState(true)
  const [processingBuyNow, setProcessingBuyNow] = useState<string | null>(null)
  const [buyNowError, setBuyNowError] = useState<string | null>(null)
  const [buyNowSuccess, setBuyNowSuccess] = useState<string | null>(null)
  const [showBuyNowModal, setShowBuyNowModal] = useState<{
    watchId: string
    buyNowPrice: number
  } | null>(null)

  const handleBuyNow = async (watchId: string, buyNowPrice: number) => {
    setShowBuyNowModal({ watchId, buyNowPrice })
  }

  const handleBuyNowConfirm = async () => {
    if (!showBuyNowModal) return

    const { watchId, buyNowPrice } = showBuyNowModal
    setShowBuyNowModal(null)
    setProcessingBuyNow(watchId)
    setBuyNowError(null)
    setBuyNowSuccess(null)

    try {
      const res = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          watchId,
          amount: buyNowPrice,
          isBuyNow: true,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setBuyNowSuccess('Sofortkauf erfolgreich! Das Angebot wurde beendet.')
        // Lade Gebote neu
        const loadRes = await fetch('/api/bids/my-bids')
        if (loadRes.ok) {
          const loadData = await loadRes.json()
          setBids(loadData.bids || [])
        }
        setTimeout(() => {
          setBuyNowSuccess(null)
          router.push('/my-watches/buying/purchased')
        }, 2000)
      } else {
        setBuyNowError(data.message || 'Fehler beim Sofortkauf')
      }
    } catch (error) {
      console.error('Error buying now:', error)
      setBuyNowError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
    } finally {
      setProcessingBuyNow(null)
    }
  }

  useEffect(() => {
    const loadBids = async () => {
      if (!session?.user) return
      try {
        const res = await fetch(`/api/bids/my-bids?t=${Date.now()}`)
        if (res.ok) {
          const data = await res.json()
          setBids(data.bids || [])
        }
      } catch (error) {
        console.error('Error loading bids:', error)
      } finally {
        setLoading(false)
      }
    }
    if (session?.user) {
      loadBids()
      // Polling alle 5 Sekunden für Updates
      const interval = setInterval(loadBids, 5000)

      // Auch aktualisieren wenn die Seite wieder sichtbar wird
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          loadBids()
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)

      return () => {
        clearInterval(interval)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [session?.user])

  useEffect(() => {
    // Warte bis Session geladen ist
    if (status === 'loading') {
      return
    }

    // Wenn nicht authentifiziert, leite um
    if (status === 'unauthenticated' || !session) {
      const currentPath = window.location.pathname
      router.push(`/login?callbackUrl=${encodeURIComponent(currentPath)}`)
      return
    }
  }, [status, session, router])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-gray-500">Lädt...</div>
        </div>
        <Footer />
      </div>
    )
  }

  // Wenn nicht authentifiziert, zeige Loading (Redirect wird in useEffect behandelt)
  if (status === 'unauthenticated' || !session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-gray-500">Weiterleitung zur Anmeldung...</div>
        </div>
        <Footer />
      </div>
    )
  }

  const activeBids = bids.filter(bid => bid.watch.auctionActive && bid.watch.isMyBidHighest)
  const outbidBids = bids.filter(bid => bid.watch.auctionActive && !bid.watch.isMyBidHighest)
  const endedBids = bids.filter(bid => !bid.watch.auctionActive)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-6">
          <Link
            href="/my-watches/buying"
            className="inline-flex items-center font-medium text-primary-600 hover:text-primary-700"
          >
            ← Zurück zu Mein Kaufen
          </Link>
        </div>

        <div className="mb-8 flex items-center">
          <Gavel className="mr-3 h-8 w-8 text-primary-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Am Bieten</h1>
            <p className="mt-1 text-gray-600">Ihre laufenden Gebote und Auktionen</p>
          </div>
        </div>

        {/* Erfolgs- und Fehlermeldungen */}
        {buyNowSuccess && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
            {buyNowSuccess}
          </div>
        )}
        {buyNowError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {buyNowError}
          </div>
        )}

        {/* Aktive Gebote (Höchstbietender) */}
        {activeBids.length > 0 && (
          <div className="mb-8">
            <div className="mb-4 flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Sie haben das Höchstgebot ({activeBids.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeBids.map(bid => (
                <div
                  key={bid.id}
                  className="overflow-hidden rounded-lg border-2 border-green-500 bg-white shadow-md"
                >
                  {bid.watch.images && bid.watch.images.length > 0 ? (
                    <img
                      src={bid.watch.images[0]}
                      alt={bid.watch.title}
                      className="h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center bg-gray-200 text-gray-500">
                      Kein Bild
                    </div>
                  )}
                  <div className="p-4">
                    <div className="text-sm text-primary-600">
                      {bid.watch.brand} {bid.watch.model}
                    </div>
                    <div className="mb-2 line-clamp-2 font-semibold text-gray-900">
                      {bid.watch.title}
                    </div>
                    <div className="mb-3 rounded border border-green-200 bg-green-50 p-2">
                      <div className="mb-1 text-xs text-green-700">Höchstes Gebot</div>
                      <div className="text-lg font-bold text-green-700">
                        CHF {new Intl.NumberFormat('de-CH').format(bid.watch.highestBid)}
                      </div>
                      <div className="mt-1 text-xs text-gray-600">
                        Ihr Gebot: CHF {new Intl.NumberFormat('de-CH').format(bid.amount)}
                      </div>
                    </div>
                    {bid.watch.auctionEnd && (
                      <div className="mb-3 flex items-center text-xs text-gray-500">
                        <Clock className="mr-1 h-3 w-3" />
                        Endet: {new Date(bid.watch.auctionEnd).toLocaleString('de-CH')}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Link
                        href={`/products/${bid.watch.id}`}
                        className="block w-full rounded bg-primary-600 px-4 py-2 text-center text-sm text-white hover:bg-primary-700"
                      >
                        Angebot ansehen
                      </Link>
                      {bid.watch.buyNowPrice && bid.watch.auctionActive && (
                        <button
                          onClick={() => handleBuyNow(bid.watch.id, bid.watch.buyNowPrice!)}
                          disabled={processingBuyNow === bid.watch.id}
                          className="flex w-full items-center justify-center gap-2 rounded bg-green-600 px-4 py-2 text-center text-sm text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Zap className="h-4 w-4" />
                          {processingBuyNow === bid.watch.id
                            ? 'Wird verarbeitet...'
                            : `Sofortkauf CHF ${new Intl.NumberFormat('de-CH').format(bid.watch.buyNowPrice)}`}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Überbotene Gebote */}
        {outbidBids.length > 0 && (
          <div className="mb-8">
            <div className="mb-4 flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-orange-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Sie wurden überboten ({outbidBids.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {outbidBids.map(bid => (
                <div
                  key={bid.id}
                  className="overflow-hidden rounded-lg border-2 border-orange-300 bg-white shadow-md"
                >
                  {bid.watch.images && bid.watch.images.length > 0 ? (
                    <img
                      src={bid.watch.images[0]}
                      alt={bid.watch.title}
                      className="h-48 w-full object-cover opacity-75"
                    />
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center bg-gray-200 text-gray-500">
                      Kein Bild
                    </div>
                  )}
                  <div className="p-4">
                    <div className="text-sm text-primary-600">
                      {bid.watch.brand} {bid.watch.model}
                    </div>
                    <div className="mb-2 line-clamp-2 font-semibold text-gray-900">
                      {bid.watch.title}
                    </div>
                    <div className="mb-3 rounded border-2 border-orange-400 bg-orange-50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="text-xs font-semibold uppercase text-orange-700">
                          Ihr Gebot
                        </div>
                        <div className="rounded-full bg-orange-600 px-2 py-1 text-xs font-semibold text-white">
                          ÜBERBOTEN
                        </div>
                      </div>
                      <div className="text-lg font-bold text-orange-700">
                        CHF {new Intl.NumberFormat('de-CH').format(bid.amount)}
                      </div>
                      <div className="mt-2 border-t border-orange-200 pt-2 text-xs text-orange-600">
                        <span className="font-semibold">Aktuelles Höchstgebot:</span> CHF{' '}
                        {new Intl.NumberFormat('de-CH').format(bid.watch.highestBid)}
                      </div>
                    </div>
                    {bid.watch.auctionEnd && (
                      <div className="mb-3 flex items-center text-xs text-gray-500">
                        <Clock className="mr-1 h-3 w-3" />
                        Endet: {new Date(bid.watch.auctionEnd).toLocaleString('de-CH')}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Link
                        href={`/products/${bid.watch.id}`}
                        className="block w-full rounded bg-primary-600 px-4 py-2 text-center text-sm text-white hover:bg-primary-700"
                      >
                        Erneut bieten
                      </Link>
                      {bid.watch.buyNowPrice && bid.watch.auctionActive && (
                        <button
                          onClick={() => handleBuyNow(bid.watch.id, bid.watch.buyNowPrice!)}
                          disabled={processingBuyNow === bid.watch.id}
                          className="flex w-full items-center justify-center gap-2 rounded bg-green-600 px-4 py-2 text-center text-sm text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Zap className="h-4 w-4" />
                          {processingBuyNow === bid.watch.id
                            ? 'Wird verarbeitet...'
                            : `Sofortkauf CHF ${new Intl.NumberFormat('de-CH').format(bid.watch.buyNowPrice)}`}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Beendete Auktionen */}
        {endedBids.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Beendete Auktionen ({endedBids.length})
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {endedBids.map(bid => (
                <div
                  key={bid.id}
                  className="overflow-hidden rounded-lg bg-white opacity-75 shadow-md"
                >
                  {bid.watch.images && bid.watch.images.length > 0 ? (
                    <img
                      src={bid.watch.images[0]}
                      alt={bid.watch.title}
                      className="h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center bg-gray-200 text-gray-500">
                      Kein Bild
                    </div>
                  )}
                  <div className="p-4">
                    <div className="text-sm text-primary-600">
                      {bid.watch.brand} {bid.watch.model}
                    </div>
                    <div className="mb-2 line-clamp-2 font-semibold text-gray-900">
                      {bid.watch.title}
                    </div>
                    <div className="mb-3 rounded border border-gray-200 bg-gray-50 p-2">
                      <div className="mb-1 text-xs text-gray-700">Ihr Gebot</div>
                      <div className="text-lg font-bold text-gray-700">
                        CHF {new Intl.NumberFormat('de-CH').format(bid.amount)}
                      </div>
                    </div>
                    <Link
                      href={`/products/${bid.watch.id}`}
                      className="block w-full rounded bg-gray-600 px-4 py-2 text-center text-sm text-white hover:bg-gray-700"
                    >
                      Angebot ansehen
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Keine Gebote */}
        {bids.length === 0 && (
          <div className="rounded-lg bg-white p-12 text-center shadow-md">
            <Gavel className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="mb-2 text-xl font-semibold text-gray-900">Noch keine Gebote</h3>
            <p className="mb-6 text-gray-600">
              Sie haben noch keine Gebote abgegeben. Durchstöbern Sie die Angebote und machen Sie
              Ihr erstes Gebot!
            </p>
            <Link
              href="/"
              className="inline-block rounded-md bg-primary-600 px-6 py-3 text-white hover:bg-primary-700"
            >
              Angebote durchstöbern
            </Link>
          </div>
        )}
      </div>
      <Footer />

      {/* Buy Now Confirmation Modal */}
      {showBuyNowModal && (
        <BuyNowConfirmationModal
          isOpen={!!showBuyNowModal}
          onClose={() => setShowBuyNowModal(null)}
          onConfirm={handleBuyNowConfirm}
          buyNowPrice={showBuyNowModal.buyNowPrice}
          shippingCost={0} // TODO: Get shipping cost from watch data if available
          isLoading={processingBuyNow === showBuyNowModal.watchId}
        />
      )}
    </div>
  )
}
