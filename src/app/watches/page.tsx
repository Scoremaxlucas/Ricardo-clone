'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

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

  useEffect(() => {
    fetchWatches()
  }, [])

  const fetchWatches = async () => {
    try {
      const res = await fetch('/api/watches')
      if (res.ok) {
        const response = await res.json()
        const data = response.watches || response
        setWatches(data)
      }
    } catch (error) {
      console.error('Error fetching watches:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Lädt...</div>
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
            {watches.map(watch => {
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
                  className={`overflow-hidden rounded-lg shadow-md transition-shadow hover:shadow-xl ${
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
                    <Image src={imageUrl} alt={watch.title} fill className="object-cover" />
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
          </div>
        )}
      </div>
    </div>
  )
}
