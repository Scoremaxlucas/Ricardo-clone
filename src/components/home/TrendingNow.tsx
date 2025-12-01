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
          { category: 'auto-motorrad', name: 'Auto & Motorrad', count: 45, growth: 23, color: 'bg-blue-500' },
          { category: 'computer-netzwerk', name: 'Computer & Netzwerk', count: 89, growth: 18, color: 'bg-purple-500' },
          { category: 'sport', name: 'Sport', count: 67, growth: 15, color: 'bg-green-500' },
          { category: 'uhren-schmuck', name: 'Uhren & Schmuck', count: 34, growth: 12, color: 'bg-yellow-500' },
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
    <section className="py-6 bg-white border-b border-gray-200">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary-600 rounded-lg shadow-md">
              <Flame className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t.home.trendingNow}</h2>
              <p className="text-xs text-gray-600">{t.home.whatsTrending}</p>
            </div>
          </div>
        </div>

        {/* Trending Categories */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3">
          {trending.slice(0, 4).map((item) => (
            <Link
              key={item.category}
              href={`/search?category=${item.category}`}
              className="group relative bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              {/* Background Accent */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-primary-100 opacity-20 rounded-full blur-xl" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  {(() => {
                    const config = getCategoryConfig(item.category)
                    const IconComponent = config.icon
                    return (
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center shadow-md"
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
                
                <h3 className="font-semibold text-gray-900 text-sm mb-0.5 group-hover:text-primary-600 transition-colors line-clamp-1">
                  {item.name}
                </h3>
                <p className="text-xs text-gray-600">
                  {item.count} Artikel
                </p>
              </div>

              {/* Hover Arrow */}
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="h-3 w-3 text-primary-600" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
