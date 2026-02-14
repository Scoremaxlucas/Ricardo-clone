'use client'

import { DashboardTile } from '@/components/dashboard/DashboardTile'
import { QuickOverviewChip, QuickOverviewChips } from '@/components/dashboard/QuickOverviewChips'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { useLanguage } from '@/contexts/LanguageContext'
import { ChevronRight, Gavel, Search, ShoppingBag, Star, Tag } from 'lucide-react'
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
    document.title = 'Mein Kaufen — Helvenda.ch'
  }, [])

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

      // Get userId for user-specific localStorage keys
      const currentUserId = (session?.user as { id?: string })?.id

      // Lade Preisvorschläge - zähle nur ungelesene
      try {
        const offersRes = await fetch('/api/offers?type=sent')
        if (offersRes.ok) {
          const offersData = await offersRes.json()
          const allOffers = offersData.offers || []

          // Lade gelesene Preisvorschläge aus localStorage (user-specific key)
          const readOffersKey = currentUserId ? `readOffers_${currentUserId}` : 'readOffers'
          const readOffers = JSON.parse(localStorage.getItem(readOffersKey) || '[]')
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

          // Lade gelesene Purchases aus localStorage (user-specific key)
          const readPurchasesKey = currentUserId ? `readPurchases_${currentUserId}` : 'readPurchases'
          const readPurchases = JSON.parse(localStorage.getItem(readPurchasesKey) || '[]')
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

  // Reihenfolge nach Wichtigkeit/Häufigkeit (Ricardo-Style)
  const menuItems = [
    {
      title: t.myBuying.purchased,
      description: t.myBuying.purchasedDesc,
      icon: ShoppingBag,
      href: '/my-watches/buying/purchased',
      color: 'text-emerald-600',
      gradient: 'from-emerald-500/10 to-teal-500/5',
      count: stats.purchased,
    },
    {
      title: t.myBuying.activeBids,
      description: t.myBuying.activeBidsDesc,
      icon: Gavel,
      href: '/my-watches/buying/bidding',
      color: 'text-violet-600',
      gradient: 'from-violet-500/10 to-purple-500/5',
      count: stats.bidding,
    },
    {
      title: t.myBuying.priceOffers,
      description: t.myBuying.priceOffersDesc,
      icon: Tag,
      href: '/my-watches/buying/offers',
      color: 'text-sky-600',
      gradient: 'from-sky-500/10 to-blue-500/5',
      count: stats.offers,
    },
    {
      title: t.myBuying.reviews,
      description: t.myBuying.reviewsDesc,
      icon: Star,
      href: '/my-watches/buying/reviews',
      color: 'text-amber-600',
      gradient: 'from-amber-500/10 to-orange-500/5',
      count: stats.reviews,
    },
    {
      title: t.myBuying.searchSubscriptions,
      description: t.myBuying.searchSubscriptionsDesc,
      icon: Search,
      href: '/my-watches/buying/search-subscriptions',
      color: 'text-primary-600',
      gradient: 'from-primary-500/10 to-teal-500/5',
      count: stats.searches,
    },
  ]

  // Quick overview chips data
  const hasQuickOverview =
    stats.bidding > 0 || stats.offers > 0 || stats.purchased > 0 || stats.searches > 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-br from-primary-600 via-primary-500 to-teal-500">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -left-4 -top-4 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -bottom-8 -right-8 h-96 w-96 rounded-full bg-teal-300/20 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-2xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center gap-2 text-sm text-white/70">
            <Link href="/" className="transition-colors hover:text-white">
              {t.myBuying.homepage}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-white">{t.myBuying.title}</span>
          </div>

          {/* Hero Content */}
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              {/* Icon with glow effect */}
              <div className="relative">
                <div className="absolute inset-0 animate-pulse rounded-2xl bg-white/20 blur-xl" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 shadow-lg backdrop-blur-sm ring-1 ring-white/30">
                  <ShoppingBag className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                  {t.myBuying.title}
                </h1>
                <p className="mt-2 text-base text-white/80">
                  {t.myBuying.subtitle}
                </p>
              </div>
            </div>

            {/* Stats Summary */}
            {(stats.purchased > 0 || stats.bidding > 0) && (
              <div className="flex gap-4">
                {stats.purchased > 0 && (
                  <div className="rounded-xl bg-white/10 px-5 py-3 backdrop-blur-sm ring-1 ring-white/20">
                    <div className="text-2xl font-bold text-white">{stats.purchased}</div>
                    <div className="text-xs text-white/70">Gekauft</div>
                  </div>
                )}
                {stats.bidding > 0 && (
                  <div className="rounded-xl bg-white/10 px-5 py-3 backdrop-blur-sm ring-1 ring-white/20">
                    <div className="text-2xl font-bold text-white">{stats.bidding}</div>
                    <div className="text-xs text-white/70">Gebote</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Quick Overview Chips - Reihenfolge wie Tiles */}
        {hasQuickOverview && (
          <QuickOverviewChips>
            {stats.purchased > 0 && (
              <QuickOverviewChip label="Gekaufte Artikel" value={stats.purchased} />
            )}
            {stats.bidding > 0 && <QuickOverviewChip label="Aktive Gebote" value={stats.bidding} />}
            {stats.offers > 0 && (
              <QuickOverviewChip label="Preisvorschläge" value={stats.offers} highlight={true} />
            )}
            {stats.searches > 0 && (
              <QuickOverviewChip label="Suchaufträge" value={stats.searches} />
            )}
          </QuickOverviewChips>
        )}

        {/* Dashboard Tiles - Responsive grid */}
        <div className="mb-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {menuItems.map(item => (
            <DashboardTile
              key={item.href}
              title={item.title}
              description={item.description}
              icon={item.icon}
              href={item.href}
              count={item.count}
              color={item.color}
              gradient={item.gradient}
            />
          ))}
        </div>
      </div>
      <Footer />
    </div>
  )
}
