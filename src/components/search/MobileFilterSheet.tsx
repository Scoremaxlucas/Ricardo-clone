'use client'

import { BottomSheet } from '@/components/ui/BottomSheet'
import { useLanguage } from '@/contexts/LanguageContext'
import { searchBrands } from '@/data/brands'
import { Check, ChevronRight, Search, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

interface MobileFilterSheetProps {
  isOpen: boolean
  onClose: () => void
  availableBrands: string[]
  brandCounts: Record<string, number>
  category?: string
}

type FilterSection = 'main' | 'price' | 'condition' | 'brand' | 'offerType' | 'location'

export function MobileFilterSheet({
  isOpen,
  onClose,
  availableBrands,
  brandCounts,
  category,
}: MobileFilterSheetProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()

  // Local state for filters (applied on "Anwenden" click)
  const [localMinPrice, setLocalMinPrice] = useState('')
  const [localMaxPrice, setLocalMaxPrice] = useState('')
  const [localCondition, setLocalCondition] = useState('')
  const [localBrand, setLocalBrand] = useState('')
  const [localIsAuction, setLocalIsAuction] = useState('')
  const [localPostalCode, setLocalPostalCode] = useState('')
  const [brandSearchQuery, setBrandSearchQuery] = useState('')
  const [currentSection, setCurrentSection] = useState<FilterSection>('main')

  // Initialize local state from URL params when sheet opens
  useEffect(() => {
    if (isOpen) {
      setLocalMinPrice(searchParams?.get('minPrice') || '')
      setLocalMaxPrice(searchParams?.get('maxPrice') || '')
      setLocalCondition(searchParams?.get('condition') || '')
      setLocalBrand(searchParams?.get('brand') || '')
      setLocalIsAuction(searchParams?.get('isAuction') || '')
      setLocalPostalCode(searchParams?.get('postalCode') || '')
      setCurrentSection('main')
      setBrandSearchQuery('')
    }
  }, [isOpen, searchParams])

  // Count active filters
  const activeFilterCount = [
    localMinPrice || localMaxPrice,
    localCondition,
    localBrand,
    localIsAuction,
    localPostalCode,
  ].filter(Boolean).length

  // Apply all filters
  const applyFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams?.toString() || '')

    // Price
    if (localMinPrice && localMinPrice !== '0.05') {
      params.set('minPrice', localMinPrice)
    } else {
      params.delete('minPrice')
    }
    if (localMaxPrice && localMaxPrice !== '1000000') {
      params.set('maxPrice', localMaxPrice)
    } else {
      params.delete('maxPrice')
    }

    // Condition
    if (localCondition) {
      params.set('condition', localCondition)
    } else {
      params.delete('condition')
    }

    // Brand
    if (localBrand) {
      params.set('brand', localBrand)
    } else {
      params.delete('brand')
    }

    // Offer type
    if (localIsAuction) {
      params.set('isAuction', localIsAuction)
    } else {
      params.delete('isAuction')
    }

    // Location
    if (localPostalCode) {
      params.set('postalCode', localPostalCode)
    } else {
      params.delete('postalCode')
    }

    router.replace(`/search?${params.toString()}`)
    onClose()
  }, [
    searchParams,
    router,
    onClose,
    localMinPrice,
    localMaxPrice,
    localCondition,
    localBrand,
    localIsAuction,
    localPostalCode,
  ])

  // Reset all filters
  const resetFilters = useCallback(() => {
    setLocalMinPrice('')
    setLocalMaxPrice('')
    setLocalCondition('')
    setLocalBrand('')
    setLocalIsAuction('')
    setLocalPostalCode('')
  }, [])

  // Condition options
  const conditionOptions = [
    { value: 'neu', label: t.search.conditionNew },
    { value: 'wie-neu', label: t.search.conditionLikeNew },
    { value: 'sehr-gut', label: t.search.conditionVeryGood },
    { value: 'gut', label: t.search.conditionGood },
    { value: 'gebraucht', label: t.search.conditionUsed },
  ]

  // Offer type options
  const offerTypeOptions = [
    { value: '', label: t.search.all },
    { value: 'true', label: t.search.auction },
    { value: 'false', label: t.search.buyNow },
  ]

  // Get filtered brands
  const filteredBrands = brandSearchQuery
    ? (() => {
        try {
          return searchBrands(brandSearchQuery, category || '')
        } catch {
          return availableBrands.filter(b =>
            b.toLowerCase().includes(brandSearchQuery.toLowerCase())
          )
        }
      })()
    : availableBrands

  // Get label for current value
  const getConditionLabel = () =>
    conditionOptions.find(o => o.value === localCondition)?.label || 'Alle'
  const getOfferTypeLabel = () =>
    offerTypeOptions.find(o => o.value === localIsAuction)?.label || 'Alle'
  const getPriceLabel = () => {
    if (localMinPrice || localMaxPrice) {
      const min = localMinPrice ? `CHF ${parseInt(localMinPrice).toLocaleString('de-CH')}` : '0'
      const max = localMaxPrice ? `CHF ${parseInt(localMaxPrice).toLocaleString('de-CH')}` : '∞'
      return `${min} - ${max}`
    }
    return 'Alle Preise'
  }

  // Render main menu
  const renderMainMenu = () => (
    <div className="space-y-1">
      {/* Price */}
      <button
        type="button"
        onClick={() => setCurrentSection('price')}
        className="flex w-full items-center justify-between rounded-lg px-4 py-4 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
      >
        <div>
          <div className="font-medium text-gray-900">{t.search.price}</div>
          <div className="text-sm text-gray-500">{getPriceLabel()}</div>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </button>

      {/* Condition */}
      <button
        type="button"
        onClick={() => setCurrentSection('condition')}
        className="flex w-full items-center justify-between rounded-lg px-4 py-4 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
      >
        <div>
          <div className="font-medium text-gray-900">{t.search.condition}</div>
          <div className="text-sm text-gray-500">{getConditionLabel()}</div>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </button>

      {/* Brand */}
      <button
        type="button"
        onClick={() => setCurrentSection('brand')}
        className="flex w-full items-center justify-between rounded-lg px-4 py-4 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
      >
        <div>
          <div className="font-medium text-gray-900">{t.search.brand}</div>
          <div className="text-sm text-gray-500">{localBrand || 'Alle Marken'}</div>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </button>

      {/* Offer Type */}
      <button
        type="button"
        onClick={() => setCurrentSection('offerType')}
        className="flex w-full items-center justify-between rounded-lg px-4 py-4 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
      >
        <div>
          <div className="font-medium text-gray-900">{t.search.offerType}</div>
          <div className="text-sm text-gray-500">{getOfferTypeLabel()}</div>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </button>

      {/* Location */}
      <button
        type="button"
        onClick={() => setCurrentSection('location')}
        className="flex w-full items-center justify-between rounded-lg px-4 py-4 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
      >
        <div>
          <div className="font-medium text-gray-900">{t.search.location}</div>
          <div className="text-sm text-gray-500">{localPostalCode || 'Alle Standorte'}</div>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </button>
    </div>
  )

  // Render price section
  const renderPriceSection = () => (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => setCurrentSection('main')}
        className="flex items-center gap-2 text-sm font-medium text-primary-600"
      >
        ← Zurück
      </button>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Mindestpreis (CHF)</label>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="1"
            value={localMinPrice}
            onChange={e => setLocalMinPrice(e.target.value)}
            className="h-12 w-full rounded-lg border border-gray-300 px-4 text-base focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
            placeholder="0"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Maximalpreis (CHF)</label>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="1"
            value={localMaxPrice}
            onChange={e => setLocalMaxPrice(e.target.value)}
            className="h-12 w-full rounded-lg border border-gray-300 px-4 text-base focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
            placeholder="Unbegrenzt"
          />
        </div>

        {/* Quick price buttons */}
        <div className="flex flex-wrap gap-2">
          {[50, 100, 500, 1000, 5000].map(price => (
            <button
              key={price}
              type="button"
              onClick={() => setLocalMaxPrice(price.toString())}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                localMaxPrice === price.toString()
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              bis CHF {price.toLocaleString('de-CH')}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  // Render condition section
  const renderConditionSection = () => (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setCurrentSection('main')}
        className="flex items-center gap-2 text-sm font-medium text-primary-600"
      >
        ← Zurück
      </button>

      <div className="space-y-1">
        {conditionOptions.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => setLocalCondition(option.value)}
            className="flex w-full items-center justify-between rounded-lg px-4 py-4 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
          >
            <span className="text-gray-900">{option.label}</span>
            {localCondition === option.value && <Check className="h-5 w-5 text-primary-600" />}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setLocalCondition('')}
          className="flex w-full items-center justify-between rounded-lg px-4 py-4 text-left text-gray-500 transition-colors hover:bg-gray-50 active:bg-gray-100"
        >
          <span>Alle Zustände</span>
          {!localCondition && <Check className="h-5 w-5 text-primary-600" />}
        </button>
      </div>
    </div>
  )

  // Render brand section
  const renderBrandSection = () => (
    <div className="flex h-full flex-col space-y-4">
      <button
        type="button"
        onClick={() => setCurrentSection('main')}
        className="flex items-center gap-2 text-sm font-medium text-primary-600"
      >
        ← Zurück
      </button>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={brandSearchQuery}
          onChange={e => setBrandSearchQuery(e.target.value)}
          placeholder={t.search.searchBrand}
          className="h-12 w-full rounded-lg border border-gray-300 pl-10 pr-10 text-base focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
        />
        {brandSearchQuery && (
          <button
            type="button"
            onClick={() => setBrandSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Suche löschen"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Brand list */}
      <div className="-mx-4 flex-1 overflow-y-auto">
        <button
          type="button"
          onClick={() => setLocalBrand('')}
          className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
        >
          <span className="text-gray-500">Alle Marken</span>
          {!localBrand && <Check className="h-5 w-5 text-primary-600" />}
        </button>
        {filteredBrands.slice(0, 100).map(b => {
          const count = brandCounts[b] || 0
          return (
            <button
              key={b}
              type="button"
              onClick={() => setLocalBrand(b)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-900">{b}</span>
                {count > 0 && <span className="text-sm text-gray-500">({count})</span>}
              </div>
              {localBrand === b && <Check className="h-5 w-5 text-primary-600" />}
            </button>
          )
        })}
      </div>
    </div>
  )

  // Render offer type section
  const renderOfferTypeSection = () => (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setCurrentSection('main')}
        className="flex items-center gap-2 text-sm font-medium text-primary-600"
      >
        ← Zurück
      </button>

      <div className="space-y-1">
        {offerTypeOptions.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => setLocalIsAuction(option.value)}
            className="flex w-full items-center justify-between rounded-lg px-4 py-4 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
          >
            <span className="text-gray-900">{option.label}</span>
            {localIsAuction === option.value && <Check className="h-5 w-5 text-primary-600" />}
          </button>
        ))}
      </div>
    </div>
  )

  // Render location section
  const renderLocationSection = () => (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setCurrentSection('main')}
        className="flex items-center gap-2 text-sm font-medium text-primary-600"
      >
        ← Zurück
      </button>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          {t.search.postalCode}
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={localPostalCode}
          onChange={e => setLocalPostalCode(e.target.value)}
          className="h-12 w-full rounded-lg border border-gray-300 px-4 text-base focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          placeholder="z.B. 8001"
          maxLength={10}
        />
      </div>
    </div>
  )

  // Render current section
  const renderContent = () => {
    switch (currentSection) {
      case 'price':
        return renderPriceSection()
      case 'condition':
        return renderConditionSection()
      case 'brand':
        return renderBrandSection()
      case 'offerType':
        return renderOfferTypeSection()
      case 'location':
        return renderLocationSection()
      default:
        return renderMainMenu()
    }
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={currentSection === 'main' ? t.search.filters : t.search.filters}
      footer={
        currentSection === 'main' ? (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={resetFilters}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100"
            >
              Zurücksetzen
            </button>
            <button
              type="button"
              onClick={applyFilters}
              className="flex-1 rounded-lg bg-primary-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700 active:bg-primary-800"
            >
              Filter anwenden {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCurrentSection('main')}
            className="w-full rounded-lg bg-primary-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700 active:bg-primary-800"
          >
            Fertig
          </button>
        )
      }
    >
      {renderContent()}
    </BottomSheet>
  )
}
