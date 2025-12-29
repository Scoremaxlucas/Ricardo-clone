'use client'

import { BottomSheet } from '@/components/ui/BottomSheet'
import { useLanguage } from '@/contexts/LanguageContext'
import { Check } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface MobileSortSheetProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileSortSheet({ isOpen, onClose }: MobileSortSheetProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()

  const currentSort = searchParams?.get('sortBy') || 'relevance'

  const sortOptions = [
    { value: 'relevance', label: t.search.sortRelevance },
    { value: 'ending', label: t.search.sortEnding },
    { value: 'newest', label: t.search.sortNewest },
    { value: 'price-low', label: t.search.sortPriceLow },
    { value: 'price-high', label: t.search.sortPriceHigh },
    { value: 'bids', label: t.search.sortBids },
  ]

  const handleSortChange = useCallback(
    (newSort: string) => {
      const params = new URLSearchParams(searchParams?.toString() || '')
      params.set('sortBy', newSort)
      router.replace(`/search?${params.toString()}`)
      onClose()
    },
    [searchParams, router, onClose]
  )

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t.search.sortBy}>
      <div className="space-y-1">
        {sortOptions.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSortChange(option.value)}
            className="flex w-full items-center justify-between rounded-lg px-4 py-4 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
          >
            <span
              className={
                currentSort === option.value ? 'font-medium text-primary-600' : 'text-gray-900'
              }
            >
              {option.label}
            </span>
            {currentSort === option.value && <Check className="h-5 w-5 text-primary-600" />}
          </button>
        ))}
      </div>
    </BottomSheet>
  )
}
