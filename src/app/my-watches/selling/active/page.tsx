'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { ProductCard } from '@/components/ui/ProductCard'
import { ArrowLeft, Clock, Edit, Eye, TrendingUp } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

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

      // Prüfe und verarbeite abgelaufene Auktionen automatisch
      try {
        await fetch('/api/auctions/check-expired', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      } catch (error) {
        console.error('Error checking expired auctions:', error)
        // Fehler ignorieren, da dies nicht kritisch ist
      }

      // Verwende activeOnly=true Parameter, um nur nicht-verkaufte Artikel zu erhalten
      const res = await fetch(`/api/watches/mine?activeOnly=true&t=${Date.now()}`)
      const data = await res.json()
      const watchesList = Array.isArray(data.watches) ? data.watches : []
      // API filtert bereits nach nicht-verkauften Artikeln, aber zusätzlicher Filter als Sicherheit
      const activeWatches = watchesList.filter((w: WatchItem) => !w.isSold)
      setWatches(activeWatches)
    } catch (error) {
      console.error('Error loading watches:', error)
    } finally {
      setLoading(false)
    }
  }

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

    loadWatches()
  }, [session, status, router])

  // Wenn nicht authentifiziert, zeige Loading (Redirect wird in useEffect behandelt)
  if (status === 'unauthenticated' || !session) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Weiterleitung zur Anmeldung...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <div className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/my-watches"
            className="mb-6 inline-flex items-center text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zu Mein Verkaufen
          </Link>

          <div className="mb-8 flex items-center">
            <TrendingUp className="mr-3 h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Am Verkaufen</h1>
              <p className="mt-1 text-gray-600">Ihre aktiven Verkaufsanzeigen</p>
            </div>
          </div>

          {loading ? (
            <div className="rounded-lg bg-white p-8 shadow-md">
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">Lädt...</h3>
                <p className="mb-6 text-gray-600">
                  Ihre aktiven Verkaufsanzeigen werden geladen...
                </p>
              </div>
            </div>
          ) : watches.length === 0 ? (
            <div className="rounded-lg bg-white p-8 shadow-md">
              <div className="py-12 text-center">
                <Clock className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                <h3 className="mb-2 text-lg font-semibold text-gray-900">Keine aktiven Verkäufe</h3>
                <p className="mb-6 text-gray-600">
                  Sie haben momentan keine aktiven Verkaufsanzeigen.
                </p>
                <Link
                  href="/sell"
                  className="inline-flex items-center rounded-md bg-primary-600 px-6 py-3 text-white transition-colors hover:bg-primary-700"
                >
                  Jetzt verkaufen
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {watches.map(watch => {
                const images = watch.images || []
                const isAuction =
                  watch.isAuction ||
                  watch.purchaseType === 'auction' ||
                  watch.purchaseType === 'both'
                const auctionEndDate = watch.auctionEnd ? new Date(watch.auctionEnd) : null
                const isExpired = auctionEndDate ? auctionEndDate <= new Date() : false

                return (
                  <div key={watch.id} className="group relative flex h-full flex-col">
                    <ProductCard
                      id={watch.id}
                      title={watch.title}
                      brand={watch.brand}
                      price={watch.highestBid?.amount || watch.price}
                      images={images}
                      buyNowPrice={watch.buyNowPrice || undefined}
                      isAuction={isAuction && !isExpired}
                      auctionEnd={watch.auctionEnd || undefined}
                      city={(watch as any).city}
                      postalCode={(watch as any).postalCode}
                      condition={(watch as any).condition}
                      boosters={[]}
                      bids={watch.bidCount > 0 ? Array(watch.bidCount).fill(null) : []}
                    />
                    {/* Action Buttons - Overlay beim Hover */}
                    <div className="absolute inset-0 z-20 flex items-center justify-center gap-2 rounded-lg bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <Link
                        href={`/products/${watch.id}`}
                        className="rounded-full bg-white p-2 text-gray-700 transition-colors hover:bg-gray-100"
                        title="Ansehen"
                        onClick={e => e.stopPropagation()}
                      >
                        <Eye className="h-5 w-5" />
                      </Link>
                      <Link
                        href={`/my-watches/edit/${watch.id}`}
                        className="rounded-full bg-blue-100 p-2 text-blue-700 transition-colors hover:bg-blue-200"
                        title="Bearbeiten"
                        onClick={e => e.stopPropagation()}
                      >
                        <Edit className="h-5 w-5" />
                      </Link>
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
