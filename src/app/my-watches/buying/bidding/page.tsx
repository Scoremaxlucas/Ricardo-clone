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
  const [showBuyNowModal, setShowBuyNowModal] = useState<{ watchId: string; buyNowPrice: number } | null>(null)

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
          isBuyNow: true
        })
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
        <div className="flex items-center justify-center min-h-screen">
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
        <div className="flex items-center justify-center min-h-screen">
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
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-6">
          <Link
            href="/my-watches/buying"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Zurück zu Mein Kaufen
          </Link>
        </div>

        <div className="flex items-center mb-8">
          <Gavel className="h-8 w-8 mr-3 text-primary-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Am Bieten
            </h1>
            <p className="text-gray-600 mt-1">
              Ihre laufenden Gebote und Auktionen
            </p>
          </div>
        </div>

        {/* Erfolgs- und Fehlermeldungen */}
        {buyNowSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {buyNowSuccess}
          </div>
        )}
        {buyNowError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {buyNowError}
          </div>
        )}

        {/* Aktive Gebote (Höchstbietender) */}
        {activeBids.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Sie haben das Höchstgebot ({activeBids.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeBids.map((bid) => (
                <div key={bid.id} className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-green-500">
                  {bid.watch.images && bid.watch.images.length > 0 ? (
                    <img src={bid.watch.images[0]} alt={bid.watch.title} className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">Kein Bild</div>
                  )}
                  <div className="p-4">
                    <div className="text-sm text-primary-600">{bid.watch.brand} {bid.watch.model}</div>
                    <div className="font-semibold text-gray-900 line-clamp-2 mb-2">{bid.watch.title}</div>
                    <div className="bg-green-50 border border-green-200 rounded p-2 mb-3">
                      <div className="text-xs text-green-700 mb-1">Höchstes Gebot</div>
                      <div className="text-lg font-bold text-green-700">CHF {new Intl.NumberFormat('de-CH').format(bid.watch.highestBid)}</div>
                      <div className="text-xs text-gray-600 mt-1">Ihr Gebot: CHF {new Intl.NumberFormat('de-CH').format(bid.amount)}</div>
                    </div>
                    {bid.watch.auctionEnd && (
                      <div className="flex items-center text-xs text-gray-500 mb-3">
                        <Clock className="h-3 w-3 mr-1" />
                        Endet: {new Date(bid.watch.auctionEnd).toLocaleString('de-CH')}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Link
                        href={`/products/${bid.watch.id}`}
                        className="block w-full px-4 py-2 bg-primary-600 text-white rounded text-center text-sm hover:bg-primary-700"
                      >
                        Angebot ansehen
                      </Link>
                      {bid.watch.buyNowPrice && bid.watch.auctionActive && (
                        <button
                          onClick={() => handleBuyNow(bid.watch.id, bid.watch.buyNowPrice!)}
                          disabled={processingBuyNow === bid.watch.id}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded text-center text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <Zap className="h-4 w-4" />
                          {processingBuyNow === bid.watch.id ? 'Wird verarbeitet...' : `Sofortkauf CHF ${new Intl.NumberFormat('de-CH').format(bid.watch.buyNowPrice)}`}
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
            <div className="flex items-center mb-4">
              <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Sie wurden überboten ({outbidBids.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {outbidBids.map((bid) => (
                <div key={bid.id} className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-orange-300">
                  {bid.watch.images && bid.watch.images.length > 0 ? (
                    <img src={bid.watch.images[0]} alt={bid.watch.title} className="w-full h-48 object-cover opacity-75" />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">Kein Bild</div>
                  )}
                  <div className="p-4">
                    <div className="text-sm text-primary-600">{bid.watch.brand} {bid.watch.model}</div>
                    <div className="font-semibold text-gray-900 line-clamp-2 mb-2">{bid.watch.title}</div>
                    <div className="bg-orange-50 border-2 border-orange-400 rounded p-3 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-semibold text-orange-700 uppercase">Ihr Gebot</div>
                        <div className="bg-orange-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                          ÜBERBOTEN
                        </div>
                      </div>
                      <div className="text-lg font-bold text-orange-700">CHF {new Intl.NumberFormat('de-CH').format(bid.amount)}</div>
                      <div className="text-xs text-orange-600 mt-2 pt-2 border-t border-orange-200">
                        <span className="font-semibold">Aktuelles Höchstgebot:</span> CHF {new Intl.NumberFormat('de-CH').format(bid.watch.highestBid)}
                      </div>
                    </div>
                    {bid.watch.auctionEnd && (
                      <div className="flex items-center text-xs text-gray-500 mb-3">
                        <Clock className="h-3 w-3 mr-1" />
                        Endet: {new Date(bid.watch.auctionEnd).toLocaleString('de-CH')}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Link
                        href={`/products/${bid.watch.id}`}
                        className="block w-full px-4 py-2 bg-primary-600 text-white rounded text-center text-sm hover:bg-primary-700"
                      >
                        Erneut bieten
                      </Link>
                      {bid.watch.buyNowPrice && bid.watch.auctionActive && (
                        <button
                          onClick={() => handleBuyNow(bid.watch.id, bid.watch.buyNowPrice!)}
                          disabled={processingBuyNow === bid.watch.id}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded text-center text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <Zap className="h-4 w-4" />
                          {processingBuyNow === bid.watch.id ? 'Wird verarbeitet...' : `Sofortkauf CHF ${new Intl.NumberFormat('de-CH').format(bid.watch.buyNowPrice)}`}
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
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Beendete Auktionen ({endedBids.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {endedBids.map((bid) => (
                <div key={bid.id} className="bg-white rounded-lg shadow-md overflow-hidden opacity-75">
                  {bid.watch.images && bid.watch.images.length > 0 ? (
                    <img src={bid.watch.images[0]} alt={bid.watch.title} className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">Kein Bild</div>
                  )}
                  <div className="p-4">
                    <div className="text-sm text-primary-600">{bid.watch.brand} {bid.watch.model}</div>
                    <div className="font-semibold text-gray-900 line-clamp-2 mb-2">{bid.watch.title}</div>
                    <div className="bg-gray-50 border border-gray-200 rounded p-2 mb-3">
                      <div className="text-xs text-gray-700 mb-1">Ihr Gebot</div>
                      <div className="text-lg font-bold text-gray-700">CHF {new Intl.NumberFormat('de-CH').format(bid.amount)}</div>
                    </div>
                    <Link
                      href={`/products/${bid.watch.id}`}
                      className="block w-full px-4 py-2 bg-gray-600 text-white rounded text-center text-sm hover:bg-gray-700"
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
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Gavel className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Noch keine Gebote</h3>
            <p className="text-gray-600 mb-6">
              Sie haben noch keine Gebote abgegeben. Durchstöbern Sie die Angebote und machen Sie Ihr erstes Gebot!
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700"
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
