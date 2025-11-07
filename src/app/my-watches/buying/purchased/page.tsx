'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Clock, ShoppingBag, User } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { SellerInfoModal } from '@/components/seller/SellerInfoModal'
import { getShippingLabels, getShippingCost } from '@/lib/shipping'

interface Purchase {
  id: string
  purchasedAt: string
  shippingMethod: string | null
  paid: boolean
  watch: {
    id: string
    title: string
    brand: string
    model: string
    images: string[]
    seller: {
      id: string
      name: string | null
      email: string | null
    }
    price: number
    finalPrice: number
    purchaseType: 'auction' | 'buy-now'
  }
}

export default function MyPurchasedPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [showSellerInfo, setShowSellerInfo] = useState(false)

  const handleMarkPaid = () => {
    // Refresh purchases data
    if (session?.user) {
      fetch(`/api/purchases/my-purchases?t=${Date.now()}`)
        .then(res => res.json())
        .then(data => {
          setPurchases(data.purchases || [])
        })
        .catch(error => console.error('Error loading purchases:', error))
    }
  }

  useEffect(() => {
    const loadPurchases = async () => {
      if (!session?.user) {
        console.log('[purchased-page] Keine Session')
        return
      }
      try {
        console.log('[purchased-page] Lade Purchases für User:', session.user.id, session.user.email)
        const res = await fetch(`/api/purchases/my-purchases?t=${Date.now()}`)
        if (res.ok) {
          const data = await res.json()
          console.log('[purchased-page] Purchases geladen:', data.purchases?.length || 0, 'Purchases')
          if (data.purchases && data.purchases.length > 0) {
            console.log('[purchased-page] Purchase Details:', data.purchases.map((p: any) => ({
              id: p.id,
              watchTitle: p.watch.title,
              finalPrice: p.watch.finalPrice
            })))
          }
          setPurchases(data.purchases || [])
        } else {
          const errorData = await res.json().catch(() => ({}))
          console.error('[purchased-page] Fehler beim Laden:', res.status, res.statusText, errorData)
        }
      } catch (error) {
        console.error('[purchased-page] Error loading purchases:', error)
      } finally {
        setLoading(false)
      }
    }
    if (session?.user) {
      loadPurchases()
      
      // Rufe check-expired auf, um abgelaufene Auktionen zu verarbeiten
      const checkExpired = async () => {
        try {
          await fetch('/api/auctions/check-expired', { method: 'POST' })
          // Nach dem Check die Purchases neu laden
          setTimeout(loadPurchases, 1000)
        } catch (error) {
          console.error('[purchased-page] Fehler beim Prüfen abgelaufener Auktionen:', error)
        }
      }
      
      // Sofort prüfen beim Laden der Seite
      checkExpired()
      
      // Polling alle 5 Sekunden für Updates (häufiger für bessere Reaktionszeit)
      const interval = setInterval(() => {
        loadPurchases()
        checkExpired() // Auch beim Polling prüfen
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [session?.user])

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

  if (!session) {
    router.push('/login')
    return null
  }

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
          <CheckCircle className="h-8 w-8 mr-3 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Gekauft
            </h1>
            <p className="text-gray-600 mt-1">
              Ihre erfolgreich erworbenen Uhren
            </p>
          </div>
        </div>

        {purchases.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <ShoppingBag className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Noch keine Käufe</h3>
            <p className="text-gray-600 mb-6">
              Sie haben noch keine Uhren gekauft. Durchstöbern Sie die Angebote oder bieten Sie bei Auktionen mit!
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Angebote durchstöbern
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {purchases.map((purchase) => (
              <div key={purchase.id} className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-green-500">
                {purchase.watch.images && purchase.watch.images.length > 0 ? (
                  <img src={purchase.watch.images[0]} alt={purchase.watch.title} className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">Kein Bild</div>
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-semibold">
                      {purchase.watch.purchaseType === 'auction' ? 'Ersteigert' : 'Sofortkauf'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(purchase.purchasedAt).toLocaleDateString('de-CH')}
                    </div>
                  </div>
                  <div className="text-sm text-primary-600">{purchase.watch.brand} {purchase.watch.model}</div>
                  <div className="font-semibold text-gray-900 line-clamp-2 mb-3">{purchase.watch.title}</div>
                  
                  {purchase.shippingMethod && (() => {
                    let shippingMethods: string[] = []
                    try {
                      shippingMethods = JSON.parse(purchase.shippingMethod)
                    } catch {
                      shippingMethods = []
                    }
                    const shippingCost = getShippingCost(shippingMethods)
                    const total = purchase.watch.finalPrice + shippingCost

                    return (
                      <>
                        <div className="border-t border-gray-200 pt-3 mb-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600">Kaufpreis</span>
                            <span className="text-sm font-semibold text-gray-900">
                              CHF {new Intl.NumberFormat('de-CH').format(purchase.watch.finalPrice)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600">Versand</span>
                            <span className="text-sm font-semibold text-gray-900">
                              CHF {shippingCost.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                            <span className="text-base font-semibold text-gray-900">Total</span>
                            <span className="text-xl font-bold text-green-700">
                              CHF {new Intl.NumberFormat('de-CH').format(total)}
                            </span>
                          </div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-3">
                          <div className="text-xs text-blue-700 font-semibold mb-1">Lieferart</div>
                          <div className="text-sm text-blue-900">
                            {getShippingLabels(shippingMethods).join(', ')}
                          </div>
                        </div>
                      </>
                    )
                  })()}

                  {!purchase.shippingMethod && (
                    <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
                      <div className="text-xs text-green-700 mb-1">Kaufpreis</div>
                      <div className="text-xl font-bold text-green-700">
                        CHF {new Intl.NumberFormat('de-CH').format(purchase.watch.finalPrice)}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-600 mb-3">
                    Verkäufer: {purchase.watch.seller.name || purchase.watch.seller.email}
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setSelectedPurchase(purchase)
                        setShowSellerInfo(true)
                      }}
                      className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded text-center text-sm hover:bg-gray-200 flex items-center justify-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      Angebot bezahlten
                    </button>
                    <Link
                      href={`/products/${purchase.watch.id}`}
                      className="block w-full px-4 py-2 bg-primary-600 text-white rounded text-center text-sm hover:bg-primary-700"
                    >
                      Angebot ansehen
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
      
      {/* Verkäuferinformationen Modal */}
      {selectedPurchase && (
        <SellerInfoModal
          sellerId={selectedPurchase.watch.seller.id}
          watchTitle={selectedPurchase.watch.title}
          purchaseId={selectedPurchase.id}
          isPaid={selectedPurchase.paid}
          isOpen={showSellerInfo}
          onClose={() => {
            setShowSellerInfo(false)
            setSelectedPurchase(null)
          }}
          onMarkPaid={handleMarkPaid}
        />
      )}
    </div>
  )
}
