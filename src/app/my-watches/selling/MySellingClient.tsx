'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Package,
  CheckCircle,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  X,
} from 'lucide-react'
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
  isActive?: boolean
}

type FilterType = 'all' | 'active' | 'inactive'

interface MySellingClientProps {
  initialItems: Item[]
  initialStats: {
    total: number
    active: number
    inactive: number
  }
}

export function MySellingClient({ initialItems, initialStats }: MySellingClientProps) {
  const { t } = useLanguage()
  const [items, setItems] = useState<Item[]>(initialItems)
  const [stats, setStats] = useState(initialStats)
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingDetails, setLoadingDetails] = useState(false)

  // OPTIMIERT: Lade Details (Purchases/Bids) nach dem initialen Render im Hintergrund
  // Verwende requestIdleCallback für maximale Performance (lädt nur wenn Browser idle ist)
  useEffect(() => {
    if (initialItems.length === 0 || loadingDetails) return

    const loadDetails = () => {
      setLoadingDetails(true)
      // Lade Details im Hintergrund ohne UI zu blockieren
      fetch(`/api/articles/mine?activeOnly=false`)
        .then(res => res.json())
        .then(data => {
          if (data.watches && Array.isArray(data.watches)) {
            setItems(data.watches)
            // Update stats
            const activeCount = data.watches.filter((item: Item) => {
              if (item.isActive !== undefined) return item.isActive
              if (item.isSold) return false
              if (item.isAuction && item.auctionEnd) {
                const auctionEndDate = new Date(item.auctionEnd)
                const now = new Date()
                if (auctionEndDate <= now) return false
              }
              return true
            }).length
            setStats({
              total: data.watches.length,
              active: activeCount,
              inactive: data.watches.length - activeCount,
            })
          }
        })
        .catch(() => {
          // Ignoriere Fehler - initialItems sind bereits geladen
        })
        .finally(() => {
          setLoadingDetails(false)
        })
    }

    // OPTIMIERT: Warte bis Browser idle ist für maximale Performance
    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadDetails, { timeout: 2000 })
    } else {
      // Fallback für Browser ohne requestIdleCallback
      setTimeout(loadDetails, 100)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Nur einmal beim Mount

  const isItemActive = (item: Item): boolean => {
    if (item.isActive !== undefined) {
      return item.isActive
    }
    if (item.isSold) return false
    if (item.isAuction && item.auctionEnd) {
      const auctionEndDate = new Date(item.auctionEnd)
      const now = new Date()
      if (auctionEndDate <= now) {
        return false
      }
    }
    return true
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm(t.actions.deleteConfirm)) {
      return
    }

    try {
      const res = await fetch(`/api/watches/${itemId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        window.location.reload() // Reload to get fresh data
      } else {
        const data = await res.json()
        alert(`${t.actions.error}: ${data.message}`)
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      alert(t.actions.deleteError)
    }
  }

  const filteredItems = items.filter(item => {
    const isActive = isItemActive(item)
    if (filter === 'active' && !isActive) return false
    if (filter === 'inactive' && isActive) return false

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      if (item.articleNumber && item.articleNumber.toString().includes(query)) {
        return true
      }
      const titleMatch = item.title.toLowerCase().includes(query)
      const brandMatch = item.brand?.toLowerCase().includes(query)
      const modelMatch = item.model?.toLowerCase().includes(query)
      return titleMatch || brandMatch || modelMatch
    }

    return true
  })

  return (
    <>
      {/* Statistik-Karten */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-gray-600">{t.myWatches.total}</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="rounded-lg bg-gray-100 p-3">
              <Package className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-gray-600">{t.myWatches.active}</p>
              <p className="text-3xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="rounded-lg bg-green-100 p-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div
          className={`rounded-lg border-2 bg-white p-6 shadow-md ${
            filter === 'inactive' ? 'border-red-500' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className={`mb-1 text-sm ${
                  filter === 'inactive' ? 'font-semibold text-red-600' : 'text-gray-600'
                }`}
              >
                {t.myWatches.inactive}
              </p>
              <p
                className={`text-3xl font-bold ${
                  filter === 'inactive' ? 'text-red-600' : 'text-red-500'
                }`}
              >
                {stats.inactive}
              </p>
            </div>
            <div
              className={`rounded-lg p-3 ${filter === 'inactive' ? 'bg-red-100' : 'bg-red-50'}`}
            >
              <X
                className={`h-6 w-6 ${filter === 'inactive' ? 'text-red-600' : 'text-red-500'}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Suchleiste und Filter */}
      <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t.myWatches.searchPlaceholder}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-md px-4 py-2 font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t.myWatches.all}
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`rounded-md px-4 py-2 font-medium transition-colors ${
                filter === 'active'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t.myWatches.active}
            </button>
            <button
              onClick={() => setFilter('inactive')}
              className={`rounded-md px-4 py-2 font-medium transition-colors ${
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
        <div className="rounded-lg bg-white p-12 text-center shadow-md">
          <Package className="mx-auto mb-4 h-16 w-16 text-gray-400" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900">{t.myWatches.noItems}</h3>
          <p className="mb-6 text-gray-600">
            {searchQuery ? t.search.tryDifferent : t.myWatches.noItemsDesc}
          </p>
          {!searchQuery && (
            <Link
              href="/sell"
              className="inline-flex items-center rounded-md bg-primary-600 px-6 py-3 text-white transition-colors hover:bg-primary-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t.myWatches.offerFirstItem}
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map(item => {
            const isActive = isItemActive(item)
            const images = item.images || []
            const mainImage = images.length > 0 ? images[0] : null
            const articleUrl = getArticleUrl(item)

            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md transition-shadow hover:shadow-lg"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="h-48 flex-shrink-0 md:h-auto md:w-48">
                    {mainImage ? (
                      <Link href={articleUrl}>
                        <img
                          src={mainImage}
                          alt={item.title}
                          className="h-full w-full cursor-pointer object-cover transition-opacity hover:opacity-90"
                        />
                      </Link>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-500">
                        {t.home.noImage}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 p-6">
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${
                              isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {isActive ? t.myWatches.active : t.myWatches.inactive}
                          </span>
                          {item.articleNumber && (
                            <span className="font-mono text-xs text-gray-500">
                              #{item.articleNumber}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(item.createdAt).toLocaleDateString('de-CH')}
                          </span>
                        </div>

                        <Link href={articleUrl}>
                          <h3 className="mb-1 cursor-pointer text-lg font-semibold text-gray-900 transition-colors hover:text-primary-600">
                            {item.title}
                          </h3>
                        </Link>

                        <p className="mb-2 text-sm text-gray-600">
                          {item.brand} {item.model}
                        </p>

                        <p className="text-lg font-bold text-gray-900">
                          CHF {item.finalPrice.toFixed(2)}
                        </p>

                        {item.isAuction && item.highestBid && (
                          <p className="mt-1 text-xs text-gray-500">
                            {item.bidCount}{' '}
                            {item.bidCount === 1 ? t.product.bid_singular : t.product.bids}
                          </p>
                        )}
                      </div>

                      <div className="ml-4 flex gap-2">
                        <Link
                          href={articleUrl}
                          className="rounded-full bg-green-100 p-2 text-green-700 transition-colors hover:bg-green-200"
                          title={t.myWatches.view}
                        >
                          <Eye className="h-5 w-5" />
                        </Link>
                        <Link
                          href={`/my-watches/edit/${item.id}`}
                          className="rounded-full bg-blue-100 p-2 text-blue-700 transition-colors hover:bg-blue-200"
                          title={t.myWatches.edit}
                        >
                          <Edit className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded-full bg-red-100 p-2 text-red-700 transition-colors hover:bg-red-200"
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
    </>
  )
}

