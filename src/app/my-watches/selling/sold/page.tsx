'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Package, User } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { BuyerInfoModal } from '@/components/buyer/BuyerInfoModal'
import { getShippingLabels, getShippingCost } from '@/lib/shipping'

interface Sale {
  id: string
  soldAt: string
  shippingMethod: string | null
  paid: boolean
  paidAt: string | null
  watch: {
    id: string
    title: string
    brand: string
    model: string
    images: string[]
    price: number
    finalPrice: number
    purchaseType: 'auction' | 'buy-now'
  }
  buyer: {
    id: string
    name: string | null
    email: string | null
    firstName: string | null
    lastName: string | null
    street: string | null
    streetNumber: string | null
    postalCode: string | null
    city: string | null
    phone: string | null
    paymentMethods: string | null
  }
}

export default function SoldPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [showBuyerInfo, setShowBuyerInfo] = useState(false)

  const handleMarkPaid = () => {
    // Refresh sales data
    if (session?.user) {
      fetch(`/api/sales/my-sales?t=${Date.now()}`)
        .then(res => res.json())
        .then(data => {
          setSales(data.sales || [])
        })
        .catch(error => console.error('Error loading sales:', error))
    }
  }

  useEffect(() => {
    const loadSales = async () => {
      if (!session?.user) return
      try {
        const res = await fetch(`/api/sales/my-sales?t=${Date.now()}`)
        if (res.ok) {
          const data = await res.json()
          setSales(data.sales || [])
        }
      } catch (error) {
        console.error('Error loading sales:', error)
      } finally {
        setLoading(false)
      }
    }
    if (session?.user) {
      loadSales()
      // Polling alle 5 Sekunden für Updates
      const interval = setInterval(loadSales, 5000)
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
        <Link
          href="/my-watches/selling"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zu Mein Verkaufen
        </Link>

        <div className="flex items-center mb-8">
          <CheckCircle className="h-8 w-8 mr-3 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Verkauft
            </h1>
            <p className="text-gray-600 mt-1">
              Ihre erfolgreichen Verkäufe
            </p>
          </div>
        </div>

        {sales.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Noch nichts verkauft
              </h3>
              <p className="text-gray-600 mb-6">
                Sie haben noch keine Uhren verkauft.
              </p>
              <Link
                href="/sell"
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                Erste Uhr verkaufen
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sales.map((sale) => (
              <div key={sale.id} className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-green-500">
                {sale.watch.images && sale.watch.images.length > 0 ? (
                  <img src={sale.watch.images[0]} alt={sale.watch.title} className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">Kein Bild</div>
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-semibold">
                      {sale.watch.purchaseType === 'auction' ? 'Auktion' : 'Sofortkauf'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(sale.soldAt).toLocaleDateString('de-CH')}
                    </div>
                  </div>
                  <div className="text-sm text-primary-600">{sale.watch.brand} {sale.watch.model}</div>
                  <div className="font-semibold text-gray-900 line-clamp-2 mb-3">{sale.watch.title}</div>
                  
                  {sale.shippingMethod && (() => {
                    let shippingMethods: string[] = []
                    try {
                      shippingMethods = JSON.parse(sale.shippingMethod)
                    } catch {
                      shippingMethods = []
                    }
                    const shippingCost = getShippingCost(shippingMethods)
                    const total = sale.watch.finalPrice + shippingCost

                    return (
                      <>
                        <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
                          <div className="border-t border-green-300 pt-2">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs text-green-700">Verkaufspreis</span>
                              <span className="text-xs font-semibold text-green-700">
                                CHF {new Intl.NumberFormat('de-CH').format(sale.watch.finalPrice)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs text-green-700">Versand</span>
                              <span className="text-xs font-semibold text-green-700">
                                CHF {shippingCost.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-green-300">
                              <span className="text-sm font-semibold text-green-700">Total</span>
                              <span className="text-xl font-bold text-green-700">
                                CHF {new Intl.NumberFormat('de-CH').format(total)}
                              </span>
                            </div>
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

                  {!sale.shippingMethod && (
                    <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
                      <div className="text-xs text-green-700 mb-1">Verkaufspreis</div>
                      <div className="text-xl font-bold text-green-700">
                        CHF {new Intl.NumberFormat('de-CH').format(sale.watch.finalPrice)}
                      </div>
                    </div>
                  )}

                  {sale.paid && (
                    <div className="bg-green-50 border border-green-200 rounded p-2 mb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <div>
                          <div className="text-xs text-green-700 font-semibold">✓ Als bezahlt markiert</div>
                          {sale.paidAt && (
                            <div className="text-xs text-green-600 mt-0.5">
                              am {new Date(sale.paidAt).toLocaleDateString('de-CH')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-600 mb-3">
                    Käufer: {sale.buyer.name || sale.buyer.email || 'Unbekannt'}
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setSelectedSale(sale)
                        setShowBuyerInfo(true)
                      }}
                      className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded text-center text-sm hover:bg-gray-200 flex items-center justify-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      Käuferinformationen
                    </button>
                    <Link
                      href={`/products/${sale.watch.id}`}
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
      
      {/* Käuferinformationen Modal */}
      {selectedSale && (
        <BuyerInfoModal
          buyer={selectedSale.buyer}
          watchTitle={selectedSale.watch.title}
          purchaseId={selectedSale.id}
          isPaid={selectedSale.paid}
          isOpen={showBuyerInfo}
          onClose={() => {
            setShowBuyerInfo(false)
            setSelectedSale(null)
          }}
          onMarkPaid={handleMarkPaid}
        />
      )}
    </div>
  )
}
