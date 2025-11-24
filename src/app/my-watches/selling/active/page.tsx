'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Clock, Edit, Eye, Gavel, Bell } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

interface WatchItem {
  id: string
  title: string
  brand: string
  model: string
  price: number
  buyNowPrice: number | null
  images: string[]
  createdAt: string
  isSold: boolean
  isAuction: boolean
  auctionEnd: string | null
  purchaseType: 'auction' | 'buyNow' | 'both'
  highestBid: {
    amount: number
    createdAt: string
  } | null
  bidCount: number
  finalPrice: number
}

export default function ActivePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [watches, setWatches] = useState<WatchItem[]>([])

  const loadWatches = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/watches/mine?t=${Date.now()}`)
      const data = await res.json()
      const watchesList = Array.isArray(data.watches) ? data.watches : []
      // Filtere nur aktive Verkäufe (nicht verkauft)
      const activeWatches = watchesList.filter((w: WatchItem) => !w.isSold)
      setWatches(activeWatches)
    } catch (error) {
      console.error('Error loading watches:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }
    loadWatches()
  }, [session, status, router])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Lädt...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/my-watches"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu Mein Verkaufen
          </Link>

          <div className="flex items-center mb-8">
            <TrendingUp className="h-8 w-8 mr-3 text-green-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Am Verkaufen
              </h1>
              <p className="text-gray-600 mt-1">
                Ihre aktiven Verkaufsanzeigen
              </p>
            </div>
          </div>

          {watches.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="text-center py-12">
                <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Keine aktiven Verkäufe
                </h3>
                <p className="text-gray-600 mb-6">
                  Sie haben momentan keine aktiven Verkaufsanzeigen.
                </p>
                <Link
                  href="/sell"
                  className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  Jetzt verkaufen
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {watches.map((watch) => {
                const images = watch.images || []
                const mainImage = images.length > 0 ? images[0] : null
                const isAuction = watch.isAuction || watch.purchaseType === 'auction' || watch.purchaseType === 'both'
                const auctionEndDate = watch.auctionEnd ? new Date(watch.auctionEnd) : null
                const isExpired = auctionEndDate ? auctionEndDate <= new Date() : false

                return (
                  <div key={watch.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:border-primary-300 transition-all">
                    {mainImage ? (
                      <Link href={`/products/${watch.id}`}>
                        <img
                          src={mainImage}
                          alt={watch.title}
                          className="w-full h-48 object-cover hover:opacity-90 transition-opacity cursor-pointer"
                        />
                      </Link>
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                        Kein Bild
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          isAuction && !isExpired
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {isAuction && !isExpired ? 'Auktion' : 'Sofortkauf'}
                        </div>
                        {isAuction && auctionEndDate && !isExpired && (
                          <div className="text-xs text-gray-500">
                            Endet: {auctionEndDate.toLocaleDateString('de-CH')}
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-primary-600 mb-1">{watch.brand} {watch.model}</div>
                      <Link href={`/products/${watch.id}`}>
                        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-3 hover:text-primary-600 transition-colors cursor-pointer">
                          {watch.title}
                        </h3>
                      </Link>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                          {watch.highestBid && watch.bidCount > 0 ? (
                            <>
                              <div className="flex items-center gap-2 mb-1">
                                <Gavel className="h-4 w-4 text-primary-600" />
                                <div className="text-lg font-bold text-primary-600">
                                  CHF {watch.highestBid.amount.toFixed(2)}
                                </div>
                                <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-semibold">
                                  {watch.bidCount} {watch.bidCount === 1 ? 'Gebot' : 'Gebote'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                Startpreis: CHF {watch.price.toFixed(2)}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="text-lg font-bold text-gray-900">
                                CHF {watch.price.toFixed(2)}
                              </div>
                              {isAuction && !isExpired && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  Noch keine Gebote
                                </div>
                              )}
                            </>
                          )}
                          {watch.buyNowPrice && watch.buyNowPrice !== watch.price && (
                            <div className="text-sm text-gray-500 mt-1">
                              Sofortkauf: CHF {watch.buyNowPrice.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/products/${watch.id}`}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-center text-sm flex items-center justify-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Anzeigen
                        </Link>
                        <Link
                          href={`/my-watches/edit/${watch.id}`}
                          className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-center text-sm flex items-center justify-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Bearbeiten
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
