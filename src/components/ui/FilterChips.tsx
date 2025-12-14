'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

interface ActiveFilter {
  key: string
  label: string
  value: string
}

function FilterChipsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()

  // Sammle alle aktiven Filter aus URL-Parametern
  const activeFilters: ActiveFilter[] = []

  // Location Filter
  const location = searchParams?.get('location')
  if (location) {
    activeFilters.push({
      key: 'location',
      label: `${t.quickFilters.inMyArea}: ${location} km`,
      value: location,
    })
  }

  // Time Filter
  const ending = searchParams?.get('ending')
  if (ending) {
    const hours = parseInt(ending)
    const timeLabels: Record<number, string> = {
      1: t.quickFilters.in1Hour,
      3: t.quickFilters.in3Hours,
      6: t.quickFilters.in6Hours,
      12: t.quickFilters.in12Hours,
      24: t.quickFilters.in24Hours,
    }
    activeFilters.push({
      key: 'ending',
      label: `${t.quickFilters.endingSoon}: ${timeLabels[hours] || `${hours}h`}`,
      value: ending,
    })
  }

  // Price Filter
  const maxPrice = searchParams?.get('maxPrice')
  if (maxPrice) {
    activeFilters.push({
      key: 'maxPrice',
      label: `${t.quickFilters.priceUnder}: CHF ${parseInt(maxPrice).toLocaleString('de-CH')}`,
      value: maxPrice,
    })
  }

  // Sort Filter
  const sort = searchParams?.get('sort')
  if (sort === 'newest') {
    activeFilters.push({
      key: 'sort',
      label: t.quickFilters.newlyListed,
      value: sort,
    })
  }

  // Entferne einen Filter
  const removeFilter = (keyToRemove: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.delete(keyToRemove)

    // Behalte Query-Parameter (q, category, etc.)
    const newUrl = `/search?${params.toString()}`
    router.push(newUrl)
  }

  // Entferne alle Filter
  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    // Behalte nur wichtige Parameter (q, category, subcategory)
    const query = params.get('q')
    const category = params.get('category')
    const subcategory = params.get('subcategory')

    const newParams = new URLSearchParams()
    if (query) newParams.set('q', query)
    if (category) newParams.set('category', category)
    if (subcategory) newParams.set('subcategory', subcategory)

    router.push(`/search?${newParams.toString()}`)
  }

  if (activeFilters.length === 0) {
    return null
  }

  return (
    <div className="border-b border-gray-200 bg-white py-3">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-2 px-4 sm:px-6 lg:px-8">
        <span className="text-sm font-medium text-gray-700">Aktive Filter:</span>
        {activeFilters.map(filter => (
          <div
            key={filter.key}
            className="group flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1.5 text-sm font-medium text-orange-800 transition-colors hover:bg-orange-200"
          >
            <span>{filter.label}</span>
            <button
              onClick={() => removeFilter(filter.key)}
              className="rounded-full p-0.5 transition-colors hover:bg-orange-300"
              aria-label={`Filter ${filter.label} entfernen`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {activeFilters.length > 0 && (
          <button
            onClick={clearAllFilters}
            className="ml-auto rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:border-primary-500 hover:bg-gray-50 hover:text-primary-600"
          >
            Alle zurücksetzen
          </button>
        )}
      </div>
    </div>
  )
}

export function FilterChips() {
  return (
    <Suspense fallback={null}>
      <FilterChipsContent />
    </Suspense>
  )
}
