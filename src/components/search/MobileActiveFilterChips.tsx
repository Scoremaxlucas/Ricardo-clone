'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

interface ActiveFilter {
  key: string
  label: string
  paramKey: string
}

export function MobileActiveFilterChips() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()

  // Collect active filters
  const activeFilters = useMemo(() => {
    const filters: ActiveFilter[] = []

    // Price
    const minPrice = searchParams?.get('minPrice')
    const maxPrice = searchParams?.get('maxPrice')
    if (minPrice || maxPrice) {
      const min = minPrice ? `CHF ${parseInt(minPrice).toLocaleString('de-CH')}` : '0'
      const max = maxPrice ? `CHF ${parseInt(maxPrice).toLocaleString('de-CH')}` : '∞'
      filters.push({
        key: 'price',
        label: `${min} - ${max}`,
        paramKey: minPrice ? 'minPrice' : 'maxPrice',
      })
    }

    // Condition
    const condition = searchParams?.get('condition')
    if (condition) {
      const conditionLabels: Record<string, string> = {
        neu: t.search.conditionNew,
        'wie-neu': t.search.conditionLikeNew,
        'sehr-gut': t.search.conditionVeryGood,
        gut: t.search.conditionGood,
        gebraucht: t.search.conditionUsed,
      }
      filters.push({
        key: 'condition',
        label: conditionLabels[condition] || condition,
        paramKey: 'condition',
      })
    }

    // Brand
    const brand = searchParams?.get('brand')
    if (brand) {
      filters.push({
        key: 'brand',
        label: brand,
        paramKey: 'brand',
      })
    }

    // Offer type
    const isAuction = searchParams?.get('isAuction')
    if (isAuction) {
      filters.push({
        key: 'isAuction',
        label: isAuction === 'true' ? t.search.auction : t.search.buyNow,
        paramKey: 'isAuction',
      })
    }

    // Location
    const postalCode = searchParams?.get('postalCode')
    if (postalCode) {
      filters.push({
        key: 'postalCode',
        label: `PLZ: ${postalCode}`,
        paramKey: 'postalCode',
      })
    }

    return filters
  }, [searchParams, t])

  // Remove a filter
  const removeFilter = (paramKey: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '')

    // Special handling for price - remove both min and max
    if (paramKey === 'minPrice' || paramKey === 'maxPrice') {
      params.delete('minPrice')
      params.delete('maxPrice')
    } else {
      params.delete(paramKey)
    }

    router.replace(`/search?${params.toString()}`)
  }

  // Clear all filters
  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams?.toString() || '')

    // Keep only search query and category
    const q = params.get('q')
    const category = params.get('category')
    const subcategory = params.get('subcategory')
    const sortBy = params.get('sortBy')

    const newParams = new URLSearchParams()
    if (q) newParams.set('q', q)
    if (category) newParams.set('category', category)
    if (subcategory) newParams.set('subcategory', subcategory)
    if (sortBy) newParams.set('sortBy', sortBy)

    router.replace(`/search?${newParams.toString()}`)
  }

  if (activeFilters.length === 0) {
    return null
  }

  return (
    <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 md:hidden">
      <div className="flex flex-wrap items-center gap-2">
        {activeFilters.map(filter => (
          <div
            key={filter.key}
            className="flex items-center gap-1.5 rounded-full bg-primary-100 py-1.5 pl-3 pr-2 text-sm font-medium text-primary-800"
          >
            <span className="max-w-[120px] truncate">{filter.label}</span>
            <button
              type="button"
              onClick={() => removeFilter(filter.paramKey)}
              className="flex h-5 w-5 items-center justify-center rounded-full transition-colors hover:bg-primary-200"
              aria-label={`Filter "${filter.label}" entfernen`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {activeFilters.length > 1 && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-sm font-medium text-gray-600 underline hover:text-gray-800"
          >
            Alle entfernen
          </button>
        )}
      </div>
    </div>
  )
}
