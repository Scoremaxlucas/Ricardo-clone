'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, Gavel, Tag, CheckCircle, Wallet, Heart, AlertCircle, Loader2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

interface FavoriteWatch {
  id: string
  title: string
  brand: string
  model: string
  price: number
  images: string[]
  createdAt: string
}

export default function MyBuyingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [favorites, setFavorites] = useState<FavoriteWatch[]>([])
  const [loadingFavorites, setLoadingFavorites] = useState(true)
  const [bidsCount, setBidsCount] = useState(0)
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const [verificationInProgress, setVerificationInProgress] = useState(false)

  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center">Lädt...</div>
  }

  useEffect(() => {
    const loadFavorites = async () => {
      if (!session?.user) return
      try {
        const res = await fetch('/api/favorites')
        if (res.ok) {
          const data = await res.json()
          setFavorites((data.favorites || []).map((f: any) => f.watch))
        }
      } catch (error) {
        console.error('Error loading favorites:', error)
      } finally {
        setLoadingFavorites(false)
      }
    }

    const loadBidsCount = async () => {
      if (!session?.user) return
      try {
        const res = await fetch('/api/bids/my-bids')
        if (res.ok) {
          const data = await res.json()
          // Zähle nur aktive Gebote (Auktion noch läuft)
          const activeBids = (data.bids || []).filter((bid: any) => 
            bid.watch.auctionActive
          )
          setBidsCount(activeBids.length)
        }
      } catch (error) {
        console.error('Error loading bids count:', error)
      }
    }

    const loadVerificationStatus = async () => {
      if (!session?.user) return
      try {
        const res = await fetch('/api/verification/get')
        if (res.ok) {
          const data = await res.json()
          setIsVerified(data.verified || false)
          // Prüfe ob Verifizierung in Bearbeitung ist
          if (!data.verified && data.user && (
            data.user.street || data.user.dateOfBirth || data.user.paymentMethods
          )) {
            setVerificationInProgress(true)
          }
        }
      } catch (error) {
        console.error('Error loading verification status:', error)
      }
    }

    if (session?.user) {
      loadFavorites()
      loadBidsCount()
      loadVerificationStatus()
    }
  }, [session?.user])

  const removeFavorite = async (watchId: string) => {
    try {
      const res = await fetch(`/api/favorites/${watchId}`, { method: 'DELETE' })
      if (res.ok) {
        setFavorites(prev => prev.filter(w => w.id !== watchId))
      }
    } catch (error) {
      console.error('Error removing favorite:', error)
    }
  }

  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center">Lädt...</div>
  }

  if (!session) {
    router.push('/login')
    return null
  }

  const menuItems = [
    {
      title: 'Am Bieten',
      description: 'Ihre laufenden Gebote',
      icon: Gavel,
      href: '/my-watches/buying/bidding',
      color: 'bg-blue-100 text-blue-600',
      count: bidsCount
    },
    {
      title: 'Preisvorschläge',
      description: 'Ihre gemachten Angebote',
      icon: Tag,
      href: '/my-watches/buying/offers',
      color: 'bg-purple-100 text-purple-600',
      count: 0
    },
    {
      title: 'Gekauft',
      description: 'Ihre gekauften Uhren',
      icon: CheckCircle,
      href: '/my-watches/buying/purchased',
      color: 'bg-green-100 text-green-600',
      count: 0 // TODO: Anzahl der Purchases laden
    },
    {
      title: 'Gebühren',
      description: 'Übersicht der fälligen Gebühren',
      icon: Wallet,
      href: '/my-watches/buying/fees',
      color: 'bg-yellow-100 text-yellow-600',
      count: 0
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Zurück zur Hauptseite
          </Link>
        </div>

        <div className="flex items-center mb-8">
          <Package className="h-8 w-8 mr-3 text-primary-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Mein Kaufen
            </h1>
            <p className="text-gray-600 mt-1">
              Verwalten Sie Ihre Käufe und Gebote
            </p>
          </div>
        </div>

        {/* Verifizierungs-Button */}
        {(isVerified === false || isVerified === null) && (
          <div className="mb-6">
            {verificationInProgress ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <Loader2 className="h-5 w-5 text-yellow-600 mr-2 animate-spin" />
                  <div>
                    <p className="text-yellow-800 font-medium">
                      Validierung in Bearbeitung
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Ihre Verifizierung wird derzeit bearbeitet.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                href="/verification"
                className="inline-flex items-center px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium transition-colors"
              >
                <AlertCircle className="h-5 w-5 mr-2" />
                Validierungsprozess starten
              </Link>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`inline-flex p-3 rounded-lg ${item.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  {item.count > 0 && (
                    <span className="bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {item.count}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {item.description}
                </p>
              </Link>
            )
          })}
        </div>

        {/* Favoriten-Sektion */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center mb-4">
            <Heart className="h-6 w-6 mr-2 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              Meine Favoriten
            </h2>
          </div>
          {loadingFavorites ? (
            <div className="text-center py-8 text-gray-500">Lädt Favoriten...</div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Noch keine Favoriten vorhanden. Durchstöbern Sie die <Link href="/" className="text-primary-600 hover:underline">Angebote</Link> und markieren Sie Uhren als Favorit.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((watch) => (
                <div key={watch.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  {watch.images && watch.images.length > 0 ? (
                    <img src={watch.images[0]} alt={watch.title} className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">Kein Bild</div>
                  )}
                  <div className="p-4">
                    <div className="text-sm text-primary-600">{watch.brand}</div>
                    <div className="font-semibold text-gray-900 line-clamp-2">{watch.title}</div>
                    <div className="text-gray-700 mt-1 font-semibold">CHF {new Intl.NumberFormat('de-CH').format(watch.price)}</div>
                    <div className="mt-4 flex gap-2">
                      <Link href={`/products/${watch.id}`} className="flex-1 px-3 py-2 bg-primary-600 text-white rounded text-center text-sm hover:bg-primary-700">
                        Ansehen
                      </Link>
                      <button
                        onClick={() => removeFavorite(watch.id)}
                        className="px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                        title="Aus Favoriten entfernen"
                      >
                        <Heart className="h-4 w-4 fill-current" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Schnellzugriff
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/"
              className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary-300 hover:bg-gray-50 transition-colors"
            >
              <Package className="h-5 w-5 mr-3 text-primary-600" />
              <span className="font-medium text-gray-900">Uhren durchstöbern</span>
            </Link>
            <Link
              href="/auctions"
              className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary-300 hover:bg-gray-50 transition-colors"
            >
              <Gavel className="h-5 w-5 mr-3 text-primary-600" />
              <span className="font-medium text-gray-900">Auktionen ansehen</span>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
