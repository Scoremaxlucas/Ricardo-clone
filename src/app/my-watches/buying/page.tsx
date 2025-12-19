'use client'

import { DashboardTile } from '@/components/dashboard/DashboardTile'
import { QuickOverviewChip, QuickOverviewChips } from '@/components/dashboard/QuickOverviewChips'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { useLanguage } from '@/contexts/LanguageContext'
import { Gavel, Package, Search, ShoppingBag, Star, Tag } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

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
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    bidding: 0,
    offers: 0,
    purchased: 0,
    reviews: 0,
    favorites: 0,
    searches: 0,
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

      // Höre auf Events für Badge-Updates
      const handleOffersViewed = () => loadStats()
      const handlePurchasesViewed = () => loadStats()

      window.addEventListener('offers-viewed', handleOffersViewed)
      window.addEventListener('purchases-viewed', handlePurchasesViewed)

      return () => {
        window.removeEventListener('offers-viewed', handleOffersViewed)
        window.removeEventListener('purchases-viewed', handlePurchasesViewed)
      }
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

      // Lade Preisvorschläge - zähle nur ungelesene
      try {
        const offersRes = await fetch('/api/offers?type=sent')
        if (offersRes.ok) {
          const offersData = await offersRes.json()
          const allOffers = offersData.offers || []

          // Lade gelesene Preisvorschläge aus localStorage
          const readOffers = JSON.parse(localStorage.getItem('readOffers') || '[]')
          const unreadOffers = allOffers.filter((offer: any) => !readOffers.includes(offer.id))

          setStats(prev => ({ ...prev, offers: unreadOffers.length }))
        }
      } catch (error) {
        console.error('Error loading offers:', error)
      }

      // Lade gekaufte Artikel - zähle nur ungelesene
      try {
        const purchasesRes = await fetch('/api/purchases/my-purchases')
        if (purchasesRes.ok) {
          const purchasesData = await purchasesRes.json()
          const allPurchases = purchasesData.purchases || []

          // Lade gelesene Purchases aus localStorage
          const readPurchases = JSON.parse(localStorage.getItem('readPurchases') || '[]')
          const unreadPurchases = allPurchases.filter(
            (purchase: any) => !readPurchases.includes(purchase.id)
          )

          setStats(prev => ({ ...prev, purchased: unreadPurchases.length }))
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
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
            <p className="text-gray-600">{t.myBuying.loading}</p>
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
            <p className="text-gray-600">{t.myBuying.redirecting}</p>
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
            <p className="text-gray-600">{t.myBuying.pleaseLogin}</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const menuItems = [
    {
      title: t.myBuying.activeBids,
      description: t.myBuying.activeBidsDesc,
      icon: Gavel,
      href: '/my-watches/buying/bidding',
      color: 'bg-purple-100 text-purple-600',
      count: stats.bidding,
    },
    {
      title: t.myBuying.priceOffers,
      description: t.myBuying.priceOffersDesc,
      icon: Tag,
      href: '/my-watches/buying/offers',
      color: 'bg-blue-100 text-blue-600',
      count: stats.offers,
    },
    {
      title: t.myBuying.purchased,
      description: t.myBuying.purchasedDesc,
      icon: ShoppingBag,
      href: '/my-watches/buying/purchased',
      color: 'bg-green-100 text-green-600',
      count: stats.purchased,
    },
    {
      title: t.myBuying.reviews,
      description: t.myBuying.reviewsDesc,
      icon: Star,
      href: '/my-watches/buying/reviews',
      color: 'bg-pink-100 text-pink-600',
      count: stats.reviews,
    },
    {
      title: t.myBuying.watchlist,
      description: t.myBuying.watchlistDesc,
      icon: Package,
      href: '/favorites',
      color: 'bg-yellow-100 text-yellow-600',
      count: stats.favorites,
    },
    {
      title: t.myBuying.searchSubscriptions,
      description: t.myBuying.searchSubscriptionsDesc,
      icon: Search,
      href: '/my-watches/buying/search-subscriptions',
      color: 'bg-indigo-100 text-indigo-600',
      count: stats.searches,
    },
  ]

  // Quick overview chips data
  const hasQuickOverview =
    stats.bidding > 0 ||
    stats.offers > 0 ||
    stats.purchased > 0 ||
    stats.favorites > 0 ||
    stats.searches > 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-4 text-sm text-gray-600">
          <Link href="/" className="text-primary-600 hover:text-primary-700">
            {t.myBuying.homepage}
          </Link>
          <span className="mx-2">›</span>
          <span>{t.myBuying.title}</span>
        </div>

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-100 p-2">
              <Package className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t.myBuying.title}</h1>
              <p className="mt-1 text-sm text-gray-600">{t.myBuying.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Quick Overview Chips */}
        {hasQuickOverview && (
          <QuickOverviewChips>
            {stats.bidding > 0 && <QuickOverviewChip label="Aktive Gebote" value={stats.bidding} />}
            {stats.offers > 0 && (
              <QuickOverviewChip label="Preisvorschläge" value={stats.offers} highlight={true} />
            )}
            {stats.purchased > 0 && (
              <QuickOverviewChip label="Gekaufte Artikel" value={stats.purchased} />
            )}
            {stats.favorites > 0 && <QuickOverviewChip label="Favoriten" value={stats.favorites} />}
            {stats.searches > 0 && (
              <QuickOverviewChip label="Suchaufträge" value={stats.searches} />
            )}
          </QuickOverviewChips>
        )}

        {/* Dashboard Tiles - Responsive grid */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {menuItems.map(item => (
            <DashboardTile
              key={item.href}
              title={item.title}
              description={item.description}
              icon={item.icon}
              href={item.href}
              count={item.count}
              color={item.color}
            />
          ))}
        </div>
      </div>
      <Footer />
    </div>
  )
}
