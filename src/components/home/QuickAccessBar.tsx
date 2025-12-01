'use client'

import { useState } from 'react'
import { MapPin, Clock, DollarSign, Sparkles, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'

export function QuickAccessBar() {
  const { t } = useLanguage()
  const router = useRouter()
  const [isLocationOpen, setIsLocationOpen] = useState(false)
  const [isTimeOpen, setIsTimeOpen] = useState(false)
  const [isPriceOpen, setIsPriceOpen] = useState(false)
  const [isNewOpen, setIsNewOpen] = useState(false)

  const handleLocationFilter = (radius: number) => {
    setIsLocationOpen(false)
    router.push(`/search?location=${radius}`)
  }

  const handleTimeFilter = (hours: number) => {
    setIsTimeOpen(false)
    router.push(`/search?ending=${hours}`)
  }

  const handlePriceFilter = (maxPrice: number) => {
    setIsPriceOpen(false)
    router.push(`/search?maxPrice=${maxPrice}`)
  }

  const handleNewFilter = () => {
    setIsNewOpen(false)
    router.push(`/search?sort=newest`)
  }

  return (
    <section className="border-b border-gray-200 bg-gray-50 py-3">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="mr-2 text-sm font-semibold text-gray-700">{t.quickFilters.title}</span>

          {/* In meiner Nähe */}
          <div className="relative">
            <button
              onClick={() => {
                setIsLocationOpen(!isLocationOpen)
                setIsTimeOpen(false)
                setIsPriceOpen(false)
                setIsNewOpen(false)
              }}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:border-primary-500 hover:bg-primary-50"
            >
              <MapPin className="h-4 w-4" />
              {t.quickFilters.inMyArea}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isLocationOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isLocationOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsLocationOpen(false)} />
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

          {/* Endet bald */}
          <div className="relative">
            <button
              onClick={() => {
                setIsTimeOpen(!isTimeOpen)
                setIsLocationOpen(false)
                setIsPriceOpen(false)
                setIsNewOpen(false)
              }}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:border-primary-500 hover:bg-primary-50"
            >
              <Clock className="h-4 w-4" />
              {t.quickFilters.endingSoon}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isTimeOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isTimeOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsTimeOpen(false)} />
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

          {/* Preis unter */}
          <div className="relative">
            <button
              onClick={() => {
                setIsPriceOpen(!isPriceOpen)
                setIsLocationOpen(false)
                setIsTimeOpen(false)
                setIsNewOpen(false)
              }}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:border-primary-500 hover:bg-primary-50"
            >
              <DollarSign className="h-4 w-4" />
              {t.quickFilters.priceUnder}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isPriceOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isPriceOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsPriceOpen(false)} />
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

          {/* Neu eingestellt */}
          <button
            onClick={handleNewFilter}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:border-primary-500 hover:bg-primary-50"
          >
            <Sparkles className="h-4 w-4" />
            {t.quickFilters.newlyListed}
          </button>
        </div>
      </div>
    </section>
  )
}
