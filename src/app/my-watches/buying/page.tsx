'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, Gavel, Tag, ShoppingBag, Star, Search, Settings } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

interface Bid {
  id: string
  amount: number
  createdAt: string
  watch: {
  id: string
  title: string
  brand: string
  model: string
    images: string[]
    auctionEnd: string | null
    price: number
  }
}

interface Purchase {
  id: string
  price?: number
  purchasedAt?: string
  createdAt?: string
  watch: {
    id: string
    title: string
    brand?: string
    model?: string
    images: string[]
    price: number
    finalPrice?: number
  }
}

export default function MyBuyingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    bidding: 0,
    offers: 0,
    purchased: 0,
    reviews: 0,
    favorites: 0,
    searches: 0
  })

  useEffect(() => {
    // Warte bis Session geladen ist
    if (status === 'loading') {
      return
    }

    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/my-watches/buying')
      return
    }

    if (status === 'authenticated' && session?.user) {
      loadStats()
    }
  }, [status, session, router])

  const loadStats = async () => {
    try {
      setLoading(true)
      
      // Lade Gebote
      try {
        const bidsRes = await fetch('/api/bids/my-bids')
        if (bidsRes.ok) {
          const bidsData = await bidsRes.json()
          const activeBids = (bidsData.bids || []).filter((bid: any) => {
            if (!bid.watch?.auctionEnd) return false
            return new Date(bid.watch.auctionEnd) > new Date()
          })
          setStats(prev => ({ ...prev, bidding: activeBids.length }))
        }
      } catch (error) {
        console.error('Error loading bids:', error)
      }

      // Lade Preisvorschläge
      try {
        const offersRes = await fetch('/api/offers?type=sent')
        if (offersRes.ok) {
          const offersData = await offersRes.json()
          setStats(prev => ({ ...prev, offers: (offersData.offers || []).length }))
        }
      } catch (error) {
        console.error('Error loading offers:', error)
      }

      // Lade gekaufte Artikel
      try {
        const purchasesRes = await fetch('/api/purchases/my-purchases')
        if (purchasesRes.ok) {
          const purchasesData = await purchasesRes.json()
          setStats(prev => ({ ...prev, purchased: (purchasesData.purchases || []).length }))
        }
      } catch (error) {
        console.error('Error loading purchases:', error)
      }

      // Lade Favoriten
      try {
        const favoritesRes = await fetch('/api/favorites')
        if (favoritesRes.ok) {
          const favoritesData = await favoritesRes.json()
          setStats(prev => ({ ...prev, favorites: (favoritesData.favorites || []).length }))
        }
      } catch (error) {
        console.error('Error loading favorites:', error)
      }

      // Lade Suchaufträge
      try {
        const subscriptionsRes = await fetch('/api/search-subscriptions')
        if (subscriptionsRes.ok) {
          const subscriptionsData = await subscriptionsRes.json()
          const activeSubscriptions = (subscriptionsData.subscriptions || []).filter(
            (sub: any) => sub.isActive
          )
          setStats(prev => ({ ...prev, searches: activeSubscriptions.length }))
        }
      } catch (error) {
        console.error('Error loading search subscriptions:', error)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Lädt...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    // Redirect wird bereits im useEffect behandelt
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-gray-600">Weiterleitung zur Anmeldung...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!session || status !== 'authenticated') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-gray-600">Bitte anmelden...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const menuItems = [
    {
      title: 'Am Bieten',
      description: 'Ihre aktiven Gebote',
      icon: Gavel,
      href: '/my-watches/buying/bidding',
      color: 'bg-purple-100 text-purple-600',
      count: stats.bidding
    },
    {
      title: 'Preisvorschläge',
      description: 'Ihre abgegebenen Preisvorschläge',
      icon: Tag,
      href: '/my-watches/buying/offers',
      color: 'bg-blue-100 text-blue-600',
      count: stats.offers
    },
    {
      title: 'Gekauft',
      description: 'Ihre gekauften Artikel',
      icon: ShoppingBag,
      href: '/my-watches/buying/purchased',
      color: 'bg-green-100 text-green-600',
      count: stats.purchased
    },
    {
      title: 'Bewertungen',
      description: 'Bewertungen für gekaufte Artikel',
      icon: Star,
      href: '/my-watches/buying/reviews',
      color: 'bg-pink-100 text-pink-600',
      count: stats.reviews
    },
    {
      title: 'Beobachten',
      description: 'Ihre beobachteten Artikel',
      icon: Package,
      href: '/favorites',
      color: 'bg-yellow-100 text-yellow-600',
      count: stats.favorites
    },
    {
      title: 'Suchaufträge',
      description: 'Gespeicherte Suchanfragen',
      icon: Search,
      href: '/my-watches/buying/search-subscriptions',
      color: 'bg-indigo-100 text-indigo-600',
      count: stats.searches
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-600 mb-4">
          <Link href="/" className="text-primary-600 hover:text-primary-700">
            Startseite
          </Link>
          <span className="mx-2">›</span>
          <span>Mein Kaufen</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Settings className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mein Kaufen</h1>
              <p className="text-gray-600 mt-1">Verwalten Sie Ihre Käufe und Gebote</p>
            </div>
          </div>
        </div>

        {/* Dashboard Karten */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-all cursor-pointer relative border border-gray-200 hover:border-primary-300"
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
      </div>
      <Footer />
    </div>
  )
}
