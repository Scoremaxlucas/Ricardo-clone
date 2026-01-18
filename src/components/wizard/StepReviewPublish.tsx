'use client'

import { getCategoryConfig } from '@/data/categories'
import { EditPolicy } from '@/lib/edit-policy'
import { formatCHF } from '@/lib/product-utils'
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Crown,
  Edit2,
  FileText,
  Image as ImageIcon,
  Rocket,
  Shield,
  Sparkles,
  Tag,
  Truck,
  Zap,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface BoosterOption {
  id: string
  name: string
  description: string
  price: number
  badge: string
  badgeColor: string
  short?: string // Kurze Summary für Card
  detailsTitle?: string // Titel für Detail-Panel
  bullets?: string[] // Bulletpoints für Detail-Panel
  fineprint?: string // Optional: kleine Zusatzinfo
}

interface StepReviewPublishProps {
  formData: {
    title: string
    description: string
    condition: string
    price: string
    buyNowPrice: string
    isAuction: boolean
    auctionDuration: string
    shippingMethods: string[]
    images: string[]
  }
  selectedCategory: string
  selectedSubcategory: string
  selectedBooster: string
  paymentProtectionEnabled: boolean
  titleImageIndex: number
  onGoToStep: (step: number) => void
  onBoosterChange: (boosterId: string) => void
  isSubmitting: boolean
  policy?: EditPolicy
  mode?: 'create' | 'edit'
}

const CONDITION_LABELS: Record<string, string> = {
  new: 'Neu',
  'like-new': 'Wie neu',
  'very-good': 'Sehr gut',
  good: 'Gut',
  acceptable: 'Akzeptabel',
  defective: 'Defekt',
}

const SHIPPING_LABELS: Record<string, string> = {
  pickup: 'Abholung',
  'b-post': 'B-Post (CHF 8.50)',
  'a-post': 'A-Post (CHF 12.50)',
}

// Booster-Datenstruktur mit short/details/bullets (Watch-out.ch Style: Boost/Turbo-Boost/Super-Boost)
const BOOSTER_DETAILS: Record<
  string,
  { 
    short: string
    detailsTitle: string
    bullets: string[]
    fineprint?: string
    icon: 'zap' | 'rocket' | 'crown'
    gradient: string
    iconBg: string
    iconColor: string
    cardBg: string
    borderColor: string
  }
> = {
  boost: {
    short: 'Verbesserte Sichtbarkeit für Ihr Angebot. Bessere Platzierung in Suchergebnissen und mehr Aufmerksamkeit.',
    detailsTitle: 'Booster',
    bullets: [
      'Verbesserte Sichtbarkeit',
      'Bessere Platzierung',
      'Mehr Aufmerksamkeit',
      'Erhöhte Klickrate',
      'Standard-Boost-Funktionen',
    ],
    fineprint: 'pro Laufzeit',
    icon: 'zap',
    gradient: 'from-blue-500 to-cyan-400',
    iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-400',
    iconColor: 'text-white',
    cardBg: 'bg-white',
    borderColor: 'border-blue-200 hover:border-blue-400',
  },
  'turbo-boost': {
    short: 'Sehr prominente Platzierung. Erhöhte Sichtbarkeit in Listen und bessere Positionierung.',
    detailsTitle: 'Turbo-Boost',
    bullets: [
      'Sehr prominente Platzierung',
      'Erhöhte Sichtbarkeit in Listen',
      'Bessere Positionierung in Suchergebnissen',
      'Mehr Aufmerksamkeit für Ihr Angebot',
    ],
    fineprint: 'pro Laufzeit',
    icon: 'rocket',
    gradient: 'from-violet-500 to-purple-400',
    iconBg: 'bg-gradient-to-br from-violet-500 to-purple-400',
    iconColor: 'text-white',
    cardBg: 'bg-violet-50/50',
    borderColor: 'border-violet-200 hover:border-violet-400',
  },
  'super-boost': {
    short: 'Höchste Sichtbarkeit! Hervorgehobene Platzierung in Suchergebnissen, Top-Position in Kategorien, Priorität bei Empfehlungen und erhöhte Sichtbarkeit auf der Startseite.',
    detailsTitle: 'Super-Boost',
    bullets: [
      'Hervorgehobene Platzierung in Suchergebnissen',
      'Top-Position in Kategorie-Übersichten',
      'Längere Laufzeit des Boosters',
      'Priorität bei Empfehlungen',
      'Erhöhte Sichtbarkeit auf der Startseite',
    ],
    fineprint: 'pro Laufzeit',
    icon: 'crown',
    gradient: 'from-amber-400 to-orange-400',
    iconBg: 'bg-gradient-to-br from-amber-400 to-orange-400',
    iconColor: 'text-white',
    cardBg: 'bg-amber-50/50',
    borderColor: 'border-amber-200 hover:border-amber-400',
  },
}

// Helper to get icon component
const BoosterIcon = ({ type, className }: { type: 'zap' | 'rocket' | 'crown'; className?: string }) => {
  switch (type) {
    case 'zap':
      return <Zap className={className} />
    case 'rocket':
      return <Rocket className={className} />
    case 'crown':
      return <Crown className={className} />
    default:
      return <Zap className={className} />
  }
}

export function StepReviewPublish({
  formData,
  selectedCategory,
  selectedSubcategory,
  selectedBooster,
  paymentProtectionEnabled,
  titleImageIndex,
  onGoToStep,
  onBoosterChange,
  isSubmitting,
  policy,
  mode = 'create',
}: StepReviewPublishProps) {
  const [boosters, setBoosters] = useState<BoosterOption[]>([])
  const [expandedBooster, setExpandedBooster] = useState<string | null>(null)
  const stepHeadingRef = useRef<HTMLHeadingElement | null>(null)
  const isBoostersLocked = policy?.uiLocks.boosters || false

  // Load boosters
  useEffect(() => {
    const loadBoosters = async () => {
      try {
        const response = await fetch('/api/boosters')
        if (response.ok) {
          const data = await response.json()
          const boostersWithDetails = (data.boosters || []).map((booster: BoosterOption) => {
            const details = BOOSTER_DETAILS[booster.id] || {
              short: booster.description.substring(0, 60),
              detailsTitle: `${booster.name} – Details`,
              bullets: [booster.description],
            }
            return {
              ...booster,
              short: details.short,
              detailsTitle: details.detailsTitle,
              bullets: details.bullets,
              fineprint: details.fineprint,
            }
          })
          setBoosters(boostersWithDetails)
        }
      } catch (error) {
        console.error('Error loading boosters:', error)
      }
    }
    loadBoosters()
  }, [])

  const categoryConfig = selectedCategory ? getCategoryConfig(selectedCategory) : null
  const titleImage = formData.images[titleImageIndex] || formData.images[0]
  const selectedBoosterData =
    selectedBooster === 'none' ? null : boosters.find(b => b.id === selectedBooster)

  return (
    <div className="space-y-4 md:space-y-8">
      <div className="text-center">
        <h2
          ref={el => {
            if (el) (window as any).stepHeadingRef = el
          }}
          tabIndex={-1}
          className="mb-1 text-xl font-bold text-gray-900 md:mb-2 md:text-2xl"
        >
          Überprüfen & Veröffentlichen
        </h2>
        <p className="text-sm text-gray-600 md:text-base">
          Überprüfen Sie Ihre Angaben und wählen Sie optional einen Booster
        </p>
      </div>

      {/* Summary card - Improved spacing */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm sm:rounded-2xl">
        {/* Header with image */}
        <div className="flex gap-3 border-b border-gray-100 p-3 sm:gap-4 sm:p-4 md:gap-6 md:p-6">
          {titleImage && (
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg sm:h-24 sm:w-24 md:h-32 md:w-32 md:rounded-xl">
              <img src={titleImage} alt={formData.title} className="h-full w-full object-cover" />
              <div className="absolute bottom-0.5 right-0.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white sm:bottom-1 sm:right-1 sm:px-2 sm:text-xs">
                {formData.images.length} Bilder
              </div>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="mb-1 line-clamp-2 text-base font-bold text-gray-900 sm:mb-2 sm:text-lg md:text-xl">
              {formData.title || 'Kein Titel'}
            </h3>
            {categoryConfig && (
              <div className="mb-2 flex flex-wrap items-center gap-1 sm:mb-3 sm:gap-2">
                <categoryConfig.icon className="h-3.5 w-3.5 flex-shrink-0 text-primary-600 sm:h-4 sm:w-4" />
                <span className="text-xs text-gray-600 sm:text-sm">{categoryConfig.name}</span>
                {selectedSubcategory && (
                  <>
                    <span className="text-gray-400">›</span>
                    <span className="text-xs text-gray-600 sm:text-sm">{selectedSubcategory}</span>
                  </>
                )}
              </div>
            )}
            <div className="flex flex-wrap items-baseline gap-1 sm:gap-2">
              <span className="text-lg font-bold text-primary-600 sm:text-xl md:text-2xl">
                {formatCHF(parseFloat(formData.price || '0'))}
              </span>
              {formData.isAuction && (
                <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700 sm:px-2 sm:text-xs">
                  Auktion
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Summary sections */}
        <div className="divide-y divide-gray-100">
          {/* Images */}
          <div className="flex items-center justify-between p-2.5 sm:p-3 md:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <ImageIcon className="h-4 w-4 flex-shrink-0 text-gray-400 sm:h-5 sm:w-5" />
              <div>
                <span className="text-sm font-medium text-gray-700 sm:text-base">Bilder</span>
                <p className="text-xs text-gray-500 sm:text-sm">{formData.images.length} Bilder</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onGoToStep(1)}
              className="flex items-center gap-0.5 text-xs font-medium text-primary-600 hover:text-primary-700 sm:gap-1 sm:text-sm"
            >
              <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Bearbeiten</span>
            </button>
          </div>

          {/* Details */}
          <div className="flex items-center justify-between p-2.5 sm:p-3 md:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <FileText className="h-4 w-4 flex-shrink-0 text-gray-400 sm:h-5 sm:w-5" />
              <div>
                <span className="text-sm font-medium text-gray-700 sm:text-base">Details</span>
                <p className="text-xs text-gray-500 sm:text-sm">
                  {CONDITION_LABELS[formData.condition] || formData.condition || 'N/A'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onGoToStep(2)}
              className="flex items-center gap-0.5 text-xs font-medium text-primary-600 hover:text-primary-700 sm:gap-1 sm:text-sm"
            >
              <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Bearbeiten</span>
            </button>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between p-2.5 sm:p-3 md:p-4">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <Tag className="h-4 w-4 flex-shrink-0 text-gray-400 sm:h-5 sm:w-5" />
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium text-gray-700 sm:text-base">Preis</span>
                <p className="truncate text-xs text-gray-500 sm:text-sm">
                  {formData.isAuction
                    ? `${formatCHF(parseFloat(formData.price || '0'))} • ${formData.auctionDuration}d`
                    : formatCHF(parseFloat(formData.price || '0'))}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onGoToStep(3)}
              className="flex flex-shrink-0 items-center gap-0.5 text-xs font-medium text-primary-600 hover:text-primary-700 sm:gap-1 sm:text-sm"
            >
              <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Bearbeiten</span>
            </button>
          </div>

          {/* Shipping */}
          <div className="flex items-center justify-between p-2.5 sm:p-3 md:p-4">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <Truck className="h-4 w-4 flex-shrink-0 text-gray-400 sm:h-5 sm:w-5" />
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium text-gray-700 sm:text-base">Versand</span>
                <p className="truncate text-xs text-gray-500 sm:text-sm">
                  {formData.shippingMethods.length > 0
                    ? formData.shippingMethods.map(m => SHIPPING_LABELS[m] || m).join(', ')
                    : 'Keine'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onGoToStep(4)}
              className="flex flex-shrink-0 items-center gap-0.5 text-xs font-medium text-primary-600 hover:text-primary-700 sm:gap-1 sm:text-sm"
            >
              <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Bearbeiten</span>
            </button>
          </div>

          {/* Payment protection */}
          <div className="flex items-center justify-between p-2.5 sm:p-3 md:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Shield
                className={`h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5 ${paymentProtectionEnabled ? 'text-green-500' : 'text-gray-400'}`}
              />
              <div>
                <span className="text-sm font-medium text-gray-700 sm:text-base">Schutz</span>
                <p className="text-xs text-gray-500 sm:text-sm">
                  {paymentProtectionEnabled ? 'Aktiv' : 'Inaktiv'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onGoToStep(4)}
              className="flex items-center gap-0.5 text-xs font-medium text-primary-600 hover:text-primary-700 sm:gap-1 sm:text-sm"
            >
              <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Bearbeiten</span>
            </button>
          </div>
        </div>
      </div>

      {/* Booster selection - PROMINENT, direkt nach Summary */}
      <div className="rounded-xl border-2 border-primary-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-4 md:p-6">
        <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 sm:h-10 sm:w-10">
            <Sparkles className="h-4 w-4 text-primary-600 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 sm:text-lg md:text-xl">Ihr Angebot hervorheben?</h3>
            <p className="text-xs text-gray-600 sm:text-sm">
              Optional - Wählen Sie einen Booster für mehr Sichtbarkeit
            </p>
          </div>
        </div>

        {/* Watch-out.ch Style: 2x2 Grid with Icons and Colored Cards */}
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          {/* Row 1: Boost + Turbo-Boost */}
          {boosters.slice(0, 2).map(booster => {
            const details = BOOSTER_DETAILS[booster.id]
            const isSelected = selectedBooster === booster.id
            
            return (
              <button
                key={booster.id}
                type="button"
                onClick={() => {
                  if (!isBoostersLocked) {
                    onBoosterChange(booster.id)
                    if (booster.id !== selectedBooster) {
                      setExpandedBooster(booster.id)
                    }
                  }
                }}
                disabled={isBoostersLocked}
                className={`relative flex flex-col rounded-xl border-2 p-4 text-left transition-all sm:p-5 ${
                  isBoostersLocked
                    ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60'
                    : isSelected
                      ? 'border-primary-500 ring-2 ring-primary-200 ' + (details?.cardBg || 'bg-white')
                      : (details?.cardBg || 'bg-white') + ' ' + (details?.borderColor || 'border-gray-200')
                }`}
              >
                {/* Header with Icon */}
                <div className="mb-3 flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${details?.iconBg || 'bg-blue-500'} shadow-lg sm:h-12 sm:w-12`}>
                    {details && <BoosterIcon type={details.icon} className="h-5 w-5 text-white sm:h-6 sm:w-6" />}
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 sm:text-xl">{booster.name}</h4>
                </div>
                
                {/* Description */}
                <p className="mb-4 text-sm leading-relaxed text-gray-600">
                  {details?.short || booster.description}
                </p>
                
                {/* Bullet Points */}
                <ul className="mb-4 flex-1 space-y-1.5">
                  {details?.bullets?.slice(0, 4).map((bullet, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-500" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                
                {/* Price */}
                <div className="mt-auto border-t border-gray-100 pt-3">
                  <span className="text-xl font-bold sm:text-2xl" style={{ color: booster.badgeColor }}>
                    {formatCHF(booster.price)}
                  </span>
                  {details?.fineprint && (
                    <span className="ml-2 text-sm text-gray-500">{details.fineprint}</span>
                  )}
                </div>
                
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute right-3 top-3">
                    <CheckCircle className="h-6 w-6 text-primary-600" />
                  </div>
                )}
              </button>
            )
          })}
          
          {/* Row 2: Super-Boost (spans full width on mobile, half on desktop) + No Booster */}
          {boosters.slice(2).map(booster => {
            const details = BOOSTER_DETAILS[booster.id]
            const isSelected = selectedBooster === booster.id
            const isSuperBoost = booster.id === 'super-boost'
            
            return (
              <button
                key={booster.id}
                type="button"
                onClick={() => {
                  if (!isBoostersLocked) {
                    onBoosterChange(booster.id)
                    if (booster.id !== selectedBooster) {
                      setExpandedBooster(booster.id)
                    }
                  }
                }}
                disabled={isBoostersLocked}
                className={`relative flex flex-col rounded-xl border-2 p-4 text-left transition-all sm:p-5 ${
                  isSuperBoost ? 'col-span-full sm:col-span-1' : ''
                } ${
                  isBoostersLocked
                    ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60'
                    : isSelected
                      ? 'border-primary-500 ring-2 ring-primary-200 ' + (details?.cardBg || 'bg-white')
                      : (details?.cardBg || 'bg-white') + ' ' + (details?.borderColor || 'border-gray-200')
                }`}
              >
                {/* Header with Icon */}
                <div className="mb-3 flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${details?.iconBg || 'bg-amber-400'} shadow-lg sm:h-12 sm:w-12`}>
                    {details && <BoosterIcon type={details.icon} className="h-5 w-5 text-white sm:h-6 sm:w-6" />}
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 sm:text-xl">{booster.name}</h4>
                </div>
                
                {/* Description */}
                <p className="mb-4 text-sm leading-relaxed text-gray-600">
                  {details?.short || booster.description}
                </p>
                
                {/* Bullet Points */}
                <ul className="mb-4 flex-1 space-y-1.5">
                  {details?.bullets?.map((bullet, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-500" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                
                {/* Price */}
                <div className="mt-auto border-t border-gray-100 pt-3">
                  <span className="text-xl font-bold sm:text-2xl" style={{ color: booster.badgeColor }}>
                    {formatCHF(booster.price)}
                  </span>
                  {details?.fineprint && (
                    <span className="ml-2 text-sm text-gray-500">{details.fineprint}</span>
                  )}
                </div>
                
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute right-3 top-3">
                    <CheckCircle className="h-6 w-6 text-primary-600" />
                  </div>
                )}
              </button>
            )
          })}
          
          {/* No Booster option - compact */}
          <button
            type="button"
            onClick={() => !isBoostersLocked && onBoosterChange('none')}
            disabled={isBoostersLocked}
            className={`relative flex flex-col rounded-xl border-2 bg-white p-4 text-left transition-all sm:p-5 ${
              isBoostersLocked
                ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60'
                : selectedBooster === 'none'
                  ? 'border-primary-500 ring-2 ring-primary-200'
                  : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-200 sm:h-12 sm:w-12">
                <Sparkles className="h-5 w-5 text-gray-500 sm:h-6 sm:w-6" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 sm:text-xl">Kein Booster</h4>
            </div>
            
            <p className="mb-4 flex-1 text-sm leading-relaxed text-gray-600">
              Das Angebot wird ohne besondere Hervorhebung veröffentlicht.
            </p>
            
            <div className="mt-auto border-t border-gray-100 pt-3">
              <span className="text-xl font-bold text-gray-700 sm:text-2xl">CHF 0.–</span>
              <span className="ml-2 text-sm text-gray-500">kostenlos</span>
            </div>
            
            {selectedBooster === 'none' && (
              <div className="absolute right-3 top-3">
                <CheckCircle className="h-6 w-6 text-primary-600" />
              </div>
            )}
          </button>
        </div>

        {/* Info Banner for selected paid booster */}
        {selectedBooster !== 'none' && selectedBoosterData && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-primary-200 bg-primary-50/50 p-4">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${BOOSTER_DETAILS[selectedBooster]?.iconBg || 'bg-primary-500'}`}>
              {BOOSTER_DETAILS[selectedBooster] && (
                <BoosterIcon type={BOOSTER_DETAILS[selectedBooster].icon} className="h-4 w-4 text-white" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {selectedBoosterData.name} ausgewählt
              </p>
              <p className="text-xs text-gray-600">
                Die Booster-Gebühr von <strong>{formatCHF(selectedBoosterData.price)}</strong> wird bei Veröffentlichung fällig.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Final validation message */}
      <div className="rounded-lg bg-green-50 p-4 text-center sm:rounded-xl sm:p-5 md:p-6">
        <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-500 sm:mb-3 sm:h-10 sm:w-10 md:h-12 md:w-12" />
        <h3 className="mb-1 text-base font-semibold text-green-800 sm:mb-2 sm:text-lg">
          {mode === 'edit' ? 'Bereit zum Speichern' : 'Bereit zur Veröffentlichung'}
        </h3>
        <p className="text-xs text-green-700 sm:text-sm">
          {mode === 'edit'
            ? 'Klicken Sie auf "Änderungen speichern", um Ihre Bearbeitungen zu speichern.'
            : 'Klicken Sie auf "Artikel veröffentlichen", um Ihren Artikel zu listen.'}
        </p>
      </div>
    </div>
  )
}
