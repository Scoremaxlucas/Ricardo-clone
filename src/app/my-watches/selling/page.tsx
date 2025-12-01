'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, FileText, TrendingUp, CheckCircle, Wallet, Plus, Tag, Search, Eye, Edit, Trash2, X } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { getArticleUrl } from '@/lib/article-url'
import { useLanguage } from '@/contexts/LanguageContext'

interface Item {
  id: string
  articleNumber: number | null
  title: string
  brand: string
  model: string
  price: number
  images: string[]
  createdAt: string
  isSold: boolean
  isAuction: boolean
  auctionEnd: string | null
  highestBid: {
    amount: number
    createdAt: string
  } | null
  bidCount: number
  finalPrice: number
  isActive?: boolean // Wird von API zurückgegeben
}

type FilterType = 'all' | 'active' | 'inactive'

export default function MySellingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Item[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  })

  // Berechne ob ein Artikel aktiv ist
  // WICHTIG: Verwende isActive von API wenn vorhanden, sonst berechne es selbst
  // RICARDO-STYLE: Artikel ist aktiv wenn:
  // 1. Nicht verkauft (keine nicht-stornierten Purchases) - isSold = false bedeutet alle Purchases sind storniert
  // 2. UND (keine Auktion ODER Auktion noch nicht abgelaufen)
  const isItemActive = (item: Item): boolean => {
    // Wenn API bereits isActive berechnet hat, verwende das
    if (item.isActive !== undefined) {
      return item.isActive
    }
    
    // Fallback: Berechne selbst (sollte nicht nötig sein, aber sicherheitshalber)
    // Wenn verkauft (nicht-stornierte Purchases vorhanden), dann inaktiv
    if (item.isSold) return false
    
    // Wenn Auktion abgelaufen, dann inaktiv
    if (item.isAuction && item.auctionEnd) {
      const auctionEndDate = new Date(item.auctionEnd)
      const now = new Date()
      if (auctionEndDate <= now) {
        return false
      }
    }
    
    return true
  }

  const loadItems = async () => {
    try {
      setLoading(true)
      
      // Prüfe und verarbeite abgelaufene Auktionen automatisch
      try {
        await fetch('/api/auctions/check-expired', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      } catch (error) {
        console.error('Error checking expired auctions:', error)
      }
      
      // Lade ALLE Artikel (nicht nur aktive)
      const res = await fetch(`/api/watches/mine?t=${Date.now()}`)
      const data = await res.json()
      const itemsList = Array.isArray(data.watches) ? data.watches : []
      setItems(itemsList)
      
      // Berechne Statistiken
      const activeCount = itemsList.filter((w: Item) => isItemActive(w)).length
      const inactiveCount = itemsList.length - activeCount
      
      setStats({
        total: itemsList.length,
        active: activeCount,
        inactive: inactiveCount
      })
    } catch (error) {
      console.error('Error loading items:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'loading') {
      return
    }

    if (status === 'unauthenticated' || !session) {
      router.push('/login?callbackUrl=/my-watches/selling')
      return
    }

    loadItems()
  }, [session, status, router])

  // Filtere Artikel basierend auf Filter und Suche
  const filteredItems = items.filter((item) => {
    // Filter nach Status
    const isActive = isItemActive(item)
    if (filter === 'active' && !isActive) return false
    if (filter === 'inactive' && isActive) return false
    
    // Filter nach Suche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      
      // Suche nach Artikelnummer
      if (item.articleNumber && item.articleNumber.toString().includes(query)) {
        return true
      }
      
      // Suche nach Titel, Marke, Modell
      const titleMatch = item.title.toLowerCase().includes(query)
      const brandMatch = item.brand?.toLowerCase().includes(query)
      const modelMatch = item.model?.toLowerCase().includes(query)
      
      return titleMatch || brandMatch || modelMatch
    }
    
    return true
  })

  const handleDelete = async (itemId: string) => {
    if (!confirm(t.actions.deleteConfirm)) {
      return
    }

    try {
      const res = await fetch(`/api/watches/${itemId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        loadItems()
      } else {
        const data = await res.json()
        alert(`${t.actions.error}: ${data.message}`)
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      alert(t.actions.deleteError)
    }
  }

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

  if (!session || status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">Weiterleitung zur Anmeldung...</p>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="text-sm text-gray-600 mb-4">
            <Link href="/my-watches" className="text-primary-600 hover:text-primary-700">
              Meine Uhren
            </Link>
            <span className="mx-2">›</span>
            <span>Mein Verkaufen</span>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Package className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{t.header.mySelling}</h1>
                <p className="text-gray-600 mt-1">{t.myWatches.manageListings}</p>
              </div>
            </div>
            <Link
              href="/sell"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t.myWatches.offerItem}
            </Link>
          </div>

          {/* Statistik-Karten */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t.myWatches.total}</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Package className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t.myWatches.active}</p>
                  <p className="text-3xl font-bold text-green-600">{stats.active}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className={`bg-white rounded-lg shadow-md p-6 border-2 ${
              filter === 'inactive' 
                ? 'border-red-500' 
                : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm mb-1 ${
                    filter === 'inactive' 
                      ? 'text-red-600 font-semibold' 
                      : 'text-gray-600'
                  }`}>{t.myWatches.inactive}</p>
                  <p className={`text-3xl font-bold ${
                    filter === 'inactive' 
                      ? 'text-red-600' 
                      : 'text-red-500'
                  }`}>{stats.inactive}</p>
                </div>
                <div className={`p-3 rounded-lg ${
                  filter === 'inactive' 
                    ? 'bg-red-100' 
                    : 'bg-red-50'
                }`}>
                  <X className={`h-6 w-6 ${
                    filter === 'inactive' 
                      ? 'text-red-600' 
                      : 'text-red-500'
                  }`} />
                </div>
              </div>
            </div>
          </div>

          {/* Suchleiste und Filter */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Suchleiste */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t.myWatches.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              {/* Filter-Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t.myWatches.all}
                </button>
                <button
                  onClick={() => setFilter('active')}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    filter === 'active'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t.myWatches.active}
                </button>
                <button
                  onClick={() => setFilter('inactive')}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    filter === 'inactive'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t.myWatches.inactive}
                </button>
              </div>
            </div>
          </div>

          {/* Artikel-Liste */}
          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t.myWatches.noItems}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? t.search.tryDifferent
                  : t.myWatches.noItemsDesc}
              </p>
              {!searchQuery && (
                <Link
                  href="/sell"
                  className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t.myWatches.offerFirstItem}
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => {
                const isActive = isItemActive(item)
                const images = item.images || []
                const mainImage = images.length > 0 ? images[0] : null
                const articleUrl = getArticleUrl(item)
                
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Bild */}
                      <div className="md:w-48 h-48 md:h-auto flex-shrink-0">
                        {mainImage ? (
                          <Link href={articleUrl}>
                            <img
                              src={mainImage}
                              alt={item.title}
                              className="w-full h-full object-cover hover:opacity-90 transition-opacity cursor-pointer"
                            />
                          </Link>
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                            {t.home.noImage}
                          </div>
                        )}
                      </div>
                      
                      {/* Inhalt */}
                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                isActive
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {isActive ? t.myWatches.active : t.myWatches.inactive}
                              </span>
                              {item.articleNumber && (
                                <span className="text-xs text-gray-500 font-mono">
                                  #{item.articleNumber}
                                </span>
                              )}
                              <span className="text-xs text-gray-500">
                                {new Date(item.createdAt).toLocaleDateString('de-CH')}
                              </span>
                            </div>
                            
                            <Link href={articleUrl}>
                              <h3 className="text-lg font-semibold text-gray-900 mb-1 hover:text-primary-600 transition-colors cursor-pointer">
                                {item.title}
                              </h3>
                            </Link>
                            
                            <p className="text-sm text-gray-600 mb-2">
                              {item.brand} {item.model}
                            </p>
                            
                            <p className="text-lg font-bold text-gray-900">
                              CHF {item.finalPrice.toFixed(2)}
                            </p>
                            
                            {item.isAuction && item.highestBid && (
                              <p className="text-xs text-gray-500 mt-1">
                                {item.bidCount} {item.bidCount === 1 ? t.product.bid_singular : t.product.bids}
                              </p>
                            )}
                          </div>
                          
                          {/* Aktionen */}
                          <div className="flex gap-2 ml-4">
                            <Link
                              href={articleUrl}
                              className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                              title={t.myWatches.view}
                            >
                              <Eye className="h-5 w-5" />
                            </Link>
                            <Link
                              href={`/my-watches/edit/${item.id}`}
                              className="p-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                              title={t.myWatches.edit}
                            >
                              <Edit className="h-5 w-5" />
                            </Link>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
                              title={t.myWatches.delete}
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
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
