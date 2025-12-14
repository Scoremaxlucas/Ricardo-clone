'use client'

import { useState } from 'react'
import { MapPin, Clock, DollarSign, Sparkles, ChevronDown, Filter } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'

export function QuickAccessBar() {
  const { t } = useLanguage()
  const router = useRouter()
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [isExpandedFiltersOpen, setIsExpandedFiltersOpen] = useState(false)

  const handleLocationFilter = (radius: number) => {
    setActiveGroup(null)
    router.push(`/search?location=${radius}`)
  }

  const handleTimeFilter = (hours: number) => {
    setActiveGroup(null)
    router.push(`/search?ending=${hours}`)
  }

  const handlePriceFilter = (maxPrice: number) => {
    setActiveGroup(null)
    router.push(`/search?maxPrice=${maxPrice}`)
  }

  const handleNewFilter = () => {
    setActiveGroup(null)
    router.push(`/search?sort=newest`)
  }

  const toggleGroup = (group: string) => {
    setActiveGroup(activeGroup === group ? null : group)
  }

  return (
    <section className="border-b border-gray-200 bg-gray-50 py-3">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        {/* Ebene 1: Filter-Gruppen */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="mr-2 text-sm font-semibold text-gray-700">{t.quickFilters.title}</span>

          {/* Gruppe: Ort */}
          <div className="relative">
            <button
              onClick={() => toggleGroup('location')}
              className={`flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                activeGroup === 'location'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-primary-500 hover:bg-primary-50'
              }`}
            >
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">{t.quickFilters.inMyArea}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${activeGroup === 'location' ? 'rotate-180' : ''}`}
              />
            </button>

            {activeGroup === 'location' && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setActiveGroup(null)} />
                <div className="absolute left-0 top-full z-20 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-xl">
                  <div className="mb-3 text-sm font-semibold text-gray-900">
                    {t.quickFilters.chooseRadius}
                  </div>
                  <div className="space-y-2">
                    {[5, 10, 25, 50, 100].map(km => (
                      <button
                        key={km}
                        onClick={() => handleLocationFilter(km)}
                        className="w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-primary-50 hover:text-primary-600"
                      >
                        {km} km
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Gruppe: Zeit */}
          <div className="relative">
            <button
              onClick={() => toggleGroup('time')}
              className={`flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                activeGroup === 'time'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-primary-500 hover:bg-primary-50'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">{t.quickFilters.endingSoon}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${activeGroup === 'time' ? 'rotate-180' : ''}`}
              />
            </button>

            {activeGroup === 'time' && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setActiveGroup(null)} />
                <div className="absolute left-0 top-full z-20 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-xl">
                  <div className="mb-3 text-sm font-semibold text-gray-900">
                    {t.quickFilters.timeFrame}
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: t.quickFilters.in1Hour, hours: 1 },
                      { label: t.quickFilters.in3Hours, hours: 3 },
                      { label: t.quickFilters.in6Hours, hours: 6 },
                      { label: t.quickFilters.in12Hours, hours: 12 },
                      { label: t.quickFilters.in24Hours, hours: 24 },
                    ].map(option => (
                      <button
                        key={option.hours}
                        onClick={() => handleTimeFilter(option.hours)}
                        className="w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-primary-50 hover:text-primary-600"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Gruppe: Preis */}
          <div className="relative">
            <button
              onClick={() => toggleGroup('price')}
              className={`flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                activeGroup === 'price'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-primary-500 hover:bg-primary-50'
              }`}
            >
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">{t.quickFilters.priceUnder}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${activeGroup === 'price' ? 'rotate-180' : ''}`}
              />
            </button>

            {activeGroup === 'price' && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setActiveGroup(null)} />
                <div className="absolute left-0 top-full z-20 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-xl">
                  <div className="mb-3 text-sm font-semibold text-gray-900">
                    {t.quickFilters.maxPrice}
                  </div>
                  <div className="space-y-2">
                    {[50, 100, 250, 500, 1000, 2500].map(price => (
                      <button
                        key={price}
                        onClick={() => handlePriceFilter(price)}
                        className="w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-primary-50 hover:text-primary-600"
                      >
                        CHF {price.toLocaleString('de-CH')}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Gruppe: Status */}
          <button
            onClick={handleNewFilter}
            className="flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:border-primary-500 hover:bg-primary-50"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">{t.quickFilters.newlyListed}</span>
          </button>

          {/* Erweiterte Filter */}
          <button
            onClick={() => setIsExpandedFiltersOpen(!isExpandedFiltersOpen)}
            className={`ml-auto flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
              isExpandedFiltersOpen
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-300 bg-white text-gray-700 hover:border-primary-500 hover:bg-primary-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Erweiterte Filter</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isExpandedFiltersOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Erweiterte Filter (ausklappbar) */}
        {isExpandedFiltersOpen && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-sm font-semibold text-gray-900 mb-3">Erweiterte Filter</div>
            <div className="text-sm text-gray-600">
              Weitere Filteroptionen werden hier angezeigt (Kategorie, Zustand, Versandart, etc.)
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
