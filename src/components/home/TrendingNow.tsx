'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TrendingUp, Flame, ArrowRight } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { getCategoryConfig } from '@/data/categories'

interface TrendingCategory {
  category: string
  name: string
  count: number
  growth: number
  color: string
  topProduct?: {
    id: string
    title: string
    price: number
    image: string
  }
}

export function TrendingNow() {
  const { t } = useLanguage()
  const [trending, setTrending] = useState<TrendingCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/watches/trending')
        if (response.ok) {
          const data = await response.json()
          setTrending(data.categories || [])
        }
      } catch (error) {
        console.error('Error fetching trending:', error)
        // Fallback zu statischen Daten
        setTrending([
          {
            category: 'auto-motorrad',
            name: 'Auto & Motorrad',
            count: 45,
            growth: 23,
            color: 'bg-blue-500',
          },
          {
            category: 'computer-netzwerk',
            name: 'Computer & Netzwerk',
            count: 89,
            growth: 18,
            color: 'bg-purple-500',
          },
          { category: 'sport', name: 'Sport', count: 67, growth: 15, color: 'bg-green-500' },
          {
            category: 'uhren-schmuck',
            name: 'Uhren & Schmuck',
            count: 34,
            growth: 12,
            color: 'bg-yellow-500',
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchTrending()
  }, [])

  if (loading) {
    return null
  }

  if (trending.length === 0) {
    return null
  }

  return (
    <section className="border-b border-gray-200 bg-white py-6">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary-600 p-1.5 shadow-md">
              <Flame className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t.home.trendingNow}</h2>
              <p className="text-xs text-gray-600">{t.home.whatsTrending}</p>
            </div>
          </div>
        </div>

        {/* Trending Categories */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:gap-3 lg:grid-cols-6">
          {trending.slice(0, 4).map(item => (
            <Link
              key={item.category}
              href={`/search?category=${item.category}`}
              className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-3 transition-all duration-200 hover:shadow-md"
            >
              {/* Background Accent */}
              <div className="absolute right-0 top-0 h-16 w-16 rounded-full bg-primary-100 opacity-20 blur-xl" />

              <div className="relative z-10">
                <div className="mb-2 flex items-center justify-between">
                  {(() => {
                    const config = getCategoryConfig(item.category)
                    const IconComponent = config.icon
                    return (
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg shadow-md"
                        style={{ backgroundColor: '#0f766e' }}
                      >
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                    )
                  })()}
                  <div className="flex items-center gap-0.5 text-orange-600">
                    <TrendingUp className="h-3 w-3" />
                    <span className="text-[10px] font-bold">+{item.growth}%</span>
                  </div>
                </div>

                <h3 className="mb-0.5 line-clamp-1 text-sm font-semibold text-gray-900 transition-colors group-hover:text-primary-600">
                  {item.name}
                </h3>
                <p className="text-xs text-gray-600">{item.count} Artikel</p>
              </div>

              {/* Hover Arrow */}
              <div className="absolute bottom-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                <ArrowRight className="h-3 w-3 text-primary-600" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
