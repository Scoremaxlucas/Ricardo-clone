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
    <section className="py-3 bg-gray-50 border-b border-gray-200">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-gray-700 mr-2">{t.quickFilters.title}</span>
          
          {/* In meiner Nähe */}
          <div className="relative">
            <button
              onClick={() => {
                setIsLocationOpen(!isLocationOpen)
                setIsTimeOpen(false)
                setIsPriceOpen(false)
                setIsNewOpen(false)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-sm font-medium text-gray-700"
            >
              <MapPin className="h-4 w-4" />
              {t.quickFilters.inMyArea}
              <ChevronDown className={`h-4 w-4 transition-transform ${isLocationOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isLocationOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsLocationOpen(false)}
                />
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-20 p-4">
                  <div className="text-sm font-semibold text-gray-900 mb-3">{t.quickFilters.chooseRadius}</div>
                  <div className="space-y-2">
                    {[5, 10, 25, 50, 100].map((km) => (
                      <button
                        key={km}
                        onClick={() => handleLocationFilter(km)}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-primary-50 hover:text-primary-600 transition-colors text-sm"
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
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-sm font-medium text-gray-700"
            >
              <Clock className="h-4 w-4" />
              {t.quickFilters.endingSoon}
              <ChevronDown className={`h-4 w-4 transition-transform ${isTimeOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isTimeOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsTimeOpen(false)}
                />
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-20 p-4">
                  <div className="text-sm font-semibold text-gray-900 mb-3">{t.quickFilters.timeFrame}</div>
                  <div className="space-y-2">
                    {[
                      { label: t.quickFilters.in1Hour, hours: 1 },
                      { label: t.quickFilters.in3Hours, hours: 3 },
                      { label: t.quickFilters.in6Hours, hours: 6 },
                      { label: t.quickFilters.in12Hours, hours: 12 },
                      { label: t.quickFilters.in24Hours, hours: 24 },
                    ].map((option) => (
                      <button
                        key={option.hours}
                        onClick={() => handleTimeFilter(option.hours)}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-primary-50 hover:text-primary-600 transition-colors text-sm"
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
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-sm font-medium text-gray-700"
            >
              <DollarSign className="h-4 w-4" />
              {t.quickFilters.priceUnder}
              <ChevronDown className={`h-4 w-4 transition-transform ${isPriceOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isPriceOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsPriceOpen(false)}
                />
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-20 p-4">
                  <div className="text-sm font-semibold text-gray-900 mb-3">{t.quickFilters.maxPrice}</div>
                  <div className="space-y-2">
                    {[50, 100, 250, 500, 1000, 2500].map((price) => (
                      <button
                        key={price}
                        onClick={() => handlePriceFilter(price)}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-primary-50 hover:text-primary-600 transition-colors text-sm"
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
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-sm font-medium text-gray-700"
          >
            <Sparkles className="h-4 w-4" />
            {t.quickFilters.newlyListed}
          </button>
        </div>
      </div>
    </section>
  )
}
