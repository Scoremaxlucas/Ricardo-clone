'use client'

import { ArticleSkeleton } from '@/components/ui/ArticleSkeleton'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Watch {
  id: string
  title: string
  brand: string
  model: string
  price: number
  buyNowPrice: number | null
  isAuction: boolean
  images: string
  createdAt: string
  seller: {
    id: string
    name: string
  }
  boosters?: string[]
}

export default function WatchesPage() {
  const [watches, setWatches] = useState<Watch[]>([])
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(12) // Progressive loading: zeige zuerst 12

  useEffect(() => {
    fetchWatches()
  }, [])

  const fetchWatches = async () => {
    try {
      // OPTIMIERT: Verwende fast API-Route für instant loading
      const res = await fetch('/api/articles/fast?limit=50')
      if (res.ok) {
        const response = await res.json()
        const data = response.watches || response
        setWatches(data)

        // OPTIMIERT: Progressive Loading - zeige zuerst 12 Artikel sofort
        if (data.length > 0) {
          setVisibleCount(12)
          // Lade restliche Artikel nach kurzer Verzögerung
          if (data.length > 12) {
            setTimeout(() => setVisibleCount(data.length), 150)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching watches:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && watches.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="mb-8 text-3xl font-bold text-gray-900">Alle Artikel</h1>
          <ArticleSkeleton count={12} variant="grid" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-4">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Alle Artikel</h1>

        {watches.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow-md">
            <p className="mb-4 text-gray-600">Noch keine Artikel verfügbar.</p>
            <Link
              href="/sell"
              className="inline-block rounded-md bg-primary-600 px-6 py-3 text-white hover:bg-primary-700"
            >
              Erste Uhr verkaufen
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {watches.slice(0, visibleCount).map((watch, index) => {
              const images = watch.images ? watch.images.split(',') : []
              const imageUrl = images[0] || '/placeholder-watch.jpg'
              const boosters = watch.boosters || []
              const hasBoost = boosters.includes('boost')
              const hasTurboBoost = boosters.includes('turbo-boost')
              const hasSuperBoost = boosters.includes('super-boost')

              return (
                <Link
                  key={watch.id}
                  href={`/products/${watch.id}`}
                  className={`animate-in fade-in slide-in-from-bottom-4 overflow-hidden rounded-lg shadow-md transition-all hover:shadow-xl ${
                    index < 12 ? '' : 'duration-300'
                  } ${
                    hasSuperBoost
                      ? 'border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50'
                      : hasTurboBoost
                        ? 'border-2 border-blue-400 bg-gradient-to-br from-blue-50 to-purple-50'
                        : hasBoost
                          ? 'border-2 border-primary-400 bg-white'
                          : 'bg-white'
                  }`}
                >
                  <div className="relative aspect-square w-full">
                    {imageUrl.includes('blob.vercel-storage.com') ||
                    imageUrl.startsWith('data:') ||
                    imageUrl.startsWith('blob:') ? (
                      <img
                        src={imageUrl}
                        alt={watch.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <Image src={imageUrl} alt={watch.title} fill className="object-cover" />
                    )}
                    {hasSuperBoost && (
                      <div className="absolute left-2 top-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-2 py-1 text-xs font-bold text-white shadow-lg">
                        ⭐
                      </div>
                    )}
                    {hasTurboBoost && !hasSuperBoost && (
                      <div className="absolute left-2 top-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-2 py-1 text-xs font-bold text-white shadow-lg">
                        🚀
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3
                      className={`mb-1 font-semibold text-gray-900 ${hasBoost || hasTurboBoost || hasSuperBoost ? 'font-bold' : ''}`}
                    >
                      {watch.title}
                    </h3>
                    <p
                      className={`mb-2 text-sm ${hasSuperBoost ? 'text-orange-700' : hasTurboBoost ? 'text-purple-700' : hasBoost ? 'text-primary-700' : 'text-gray-600'}`}
                    >
                      {watch.brand} {watch.model}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-primary-600">
                        CHF {watch.price.toFixed(2)}
                      </div>
                      {!hasSuperBoost && !hasTurboBoost && watch.isAuction && (
                        <span className="rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                          Auktion
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">Von {watch.seller.name}</p>
                  </div>
                </Link>
              )
            })}
            {loading && watches.length > visibleCount && (
              <ArticleSkeleton count={Math.min(4, watches.length - visibleCount)} variant="grid" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
