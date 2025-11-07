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
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Alle Uhren
        </h1>

        {watches.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 mb-4">Noch keine Uhren verfügbar.</p>
            <Link
              href="/sell"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700"
            >
              Erste Uhr verkaufen
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {watches.map((watch) => {
              const images = watch.images ? watch.images.split(',') : []
              const imageUrl = images[0] || '/placeholder-watch.jpg'
              const boosters = watch.boosters || []
              const hasBoost = boosters.includes('boost')
              const hasTurboBoost = boosters.includes('turbo-boost')
              const hasSuperBoost = boosters.includes('super-boost')

              return (
                <Link
                  key={watch.id}
                  href={`/watches/${watch.id}`}
                  className={`rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow ${
                    hasSuperBoost 
                      ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-400' 
                      : hasTurboBoost
                      ? 'bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-400'
                      : hasBoost
                      ? 'bg-white border-2 border-primary-400'
                      : 'bg-white'
                  }`}
                >
                  <div className="relative aspect-square w-full">
                    <Image
                      src={imageUrl}
                      alt={watch.title}
                      fill
                      className="object-cover"
                    />
                    {hasSuperBoost && (
                      <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                        ⭐
                      </div>
                    )}
                    {hasTurboBoost && !hasSuperBoost && (
                      <div className="absolute top-2 left-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                        🚀
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className={`font-semibold text-gray-900 mb-1 ${hasBoost || hasTurboBoost || hasSuperBoost ? 'font-bold' : ''}`}>
                      {watch.title}
                    </h3>
                    <p className={`text-sm mb-2 ${hasSuperBoost ? 'text-orange-700' : hasTurboBoost ? 'text-purple-700' : hasBoost ? 'text-primary-700' : 'text-gray-600'}`}>
                      {watch.brand} {watch.model}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-primary-600">
                        CHF {watch.price.toFixed(2)}
                      </div>
                      {!hasSuperBoost && !hasTurboBoost && watch.isAuction && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          Auktion
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Von {watch.seller.name}</p>
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
