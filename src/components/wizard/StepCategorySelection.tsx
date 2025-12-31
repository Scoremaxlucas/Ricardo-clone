'use client'

import { getCategoryConfig } from '@/data/categories'
import { EditPolicy } from '@/lib/edit-policy'
import { getCategoryDisplayName, getSubcategoryDisplayName } from '@/lib/product-utils'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  Lock,
  Sparkles,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { useState } from 'react'

// Lazy load AIDetection to avoid bundling TensorFlow.js on every page
const AIDetection = dynamic(
  () => import('@/components/forms/AIDetection').then(mod => ({ default: mod.AIDetection })),
  {
    ssr: false,
    loading: () => <div className="p-4 text-center text-gray-500">Lade KI-Erkennung...</div>,
  }
)

interface StepCategorySelectionProps {
  selectedCategory: string
  selectedSubcategory: string
  detectedProductName: string
  detectedConfidence: number
  showAIDetection: boolean
  formData: {
    images: string[]
    title: string
    brand: string
    model: string
    condition: string
    year: string
  }
  titleImageIndex: number
  onCategoryDetected: (
    category: string,
    subcategory: string,
    productName: string,
    imageUrl: string | null,
    confidence: number
  ) => Promise<void>
  onCategoryChange: (category: string, subcategory: string) => void
  onResetCategory: () => void
  setShowAIDetection: (show: boolean) => void
  setFormData: React.Dispatch<React.SetStateAction<any>>
  setTitleImageIndex: React.Dispatch<React.SetStateAction<number>>
  policy?: EditPolicy // Optional policy for edit mode
  mode?: 'create' | 'edit' // Mode: create or edit
}

// Format confidence with Swiss locale (clamped 0-100)
function formatConfidence(confidence: number): string {
  if (!confidence || isNaN(confidence)) return 'N/A'
  const clamped = Math.min(100, Math.max(0, Math.round(confidence * 100)))
  return clamped.toLocaleString('de-CH') + ' %'
}

// Get confidence-based styling and copy
function getConfidenceStyle(confidence: number): {
  bgColor: string
  borderColor: string
  iconColor: string
  title: string
  note: string
} {
  const percent =
    confidence && !isNaN(confidence) ? Math.min(100, Math.max(0, confidence * 100)) : 0

  if (percent >= 90) {
    return {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      title: 'Kategorie automatisch erkannt',
      note: 'Wir haben die Kategorie vorausgewählt. Du kannst sie jederzeit ändern.',
    }
  } else if (percent >= 60) {
    return {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      title: 'KI-Vorschlag',
      note: 'Bitte kurz prüfen, ob die Kategorie stimmt.',
    }
  } else {
    return {
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      iconColor: 'text-amber-600',
      title: 'Unsicherer Vorschlag',
      note: 'Bitte wähle die Kategorie manuell aus.',
    }
  }
}

export function StepCategorySelection({
  selectedCategory,
  selectedSubcategory,
  detectedProductName,
  detectedConfidence,
  showAIDetection,
  formData,
  titleImageIndex,
  onCategoryDetected,
  onCategoryChange,
  onResetCategory,
  setShowAIDetection,
  setFormData,
  setTitleImageIndex,
  policy,
  mode = 'create',
}: StepCategorySelectionProps) {
  const [showAIDetails, setShowAIDetails] = useState(false)
  const confidenceStyle = getConfidenceStyle(detectedConfidence)
  const hasManualOverride = selectedCategory && (!detectedConfidence || detectedConfidence === 0)
  const aiImage = formData.images?.[0] || null
  const isLocked = policy?.uiLocks.category || false

  // Check if suggested subcategory is valid for selected category
  const isSubcategoryValid =
    selectedCategory && selectedSubcategory
      ? true // Simplified - could add validation logic here
      : true

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="text-center">
        <h2 className="mb-1 text-xl font-bold text-gray-900 md:mb-2 md:text-2xl">
          Kategorie wählen
        </h2>
        <p className="text-sm text-gray-600 md:text-base">
          {mode === 'edit' && isLocked
            ? 'Die Kategorie kann nach Veröffentlichung nicht mehr geändert werden.'
            : 'Laden Sie ein Bild hoch und unsere KI erkennt automatisch die passende Kategorie'}
        </p>
      </div>

      {/* Locked state banner */}
      {isLocked && mode === 'edit' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-600" />
            <p className="text-sm text-amber-800">
              Kategorie kann nach Veröffentlichung nicht mehr geändert werden.
            </p>
          </div>
        </div>
      )}

      {showAIDetection && !selectedCategory && !isLocked ? (
        <AIDetection
          onCategoryDetected={onCategoryDetected}
          imageUrl={formData.images?.[0] || null}
        />
      ) : selectedCategory ? (
        <div className="space-y-4">
          {/* Selected category display */}
          <div className="rounded-lg border-2 border-primary-200 bg-primary-50 p-3 sm:rounded-xl sm:p-4 md:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="text-xs font-medium text-gray-600 sm:text-sm">Gewählte Kategorie:</span>
                {(() => {
                  const config = getCategoryConfig(selectedCategory)
                  const IconComponent = config.icon
                  return (
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-md sm:h-8 sm:w-8 sm:rounded-lg"
                        style={{ backgroundColor: '#0f766e' }}
                      >
                        <IconComponent className="h-3.5 w-3.5 text-white sm:h-5 sm:w-5" />
                      </div>
                      <span className="text-sm font-bold text-primary-700 sm:text-base md:text-lg">
                        {getCategoryDisplayName(selectedCategory)}
                      </span>
                    </div>
                  )
                })()}
              </div>
              {!isLocked && (
                <button
                  type="button"
                  onClick={onResetCategory}
                  className="w-full rounded-md border border-primary-300 px-3 py-1.5 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-100 sm:w-auto sm:rounded-lg sm:px-4 sm:py-2 sm:text-sm"
                >
                  Kategorie ändern
                </button>
              )}
              {isLocked && (
                <div className="flex w-full items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-500 sm:w-auto sm:gap-2 sm:rounded-lg sm:px-4 sm:py-2 sm:text-sm">
                  <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Gesperrt</span>
                </div>
              )}
            </div>

            {selectedSubcategory && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:mt-3 sm:gap-2">
                <span className="text-xs text-gray-600 sm:text-sm">Unterkategorie:</span>
                <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 sm:px-3 sm:py-1 sm:text-sm">
                  {getSubcategoryDisplayName(selectedSubcategory)}
                </span>
              </div>
            )}
          </div>

          {/* AI Detection info - Compact with accordion */}
          {detectedConfidence > 0 && !hasManualOverride && (
            <div
              className={`rounded-xl border ${confidenceStyle.borderColor} ${confidenceStyle.bgColor} p-4`}
            >
              {/* Summary line */}
              <div className="flex items-center justify-between">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {/* Thumbnail */}
                  {aiImage && (
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                      <img
                        src={aiImage}
                        alt="Analysiertes Bild"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  {/* Summary text */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className={`h-4 w-4 flex-shrink-0 ${confidenceStyle.iconColor}`} />
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {confidenceStyle.title}
                      </p>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-gray-600">
                      {getCategoryDisplayName(selectedCategory)}
                      {selectedSubcategory &&
                        ` → ${getSubcategoryDisplayName(selectedSubcategory)}`}
                      {' · Konfidenz: '}
                      <span className="font-medium">{formatConfidence(detectedConfidence)}</span>
                    </p>
                  </div>
                </div>

                {/* Accordion toggle */}
                <button
                  type="button"
                  onClick={() => setShowAIDetails(!showAIDetails)}
                  className="ml-2 flex-shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-white/50 hover:text-gray-600"
                  aria-label={showAIDetails ? 'Details ausblenden' : 'Details anzeigen'}
                >
                  {showAIDetails ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Accordion details */}
              {showAIDetails && (
                <div className="mt-4 space-y-3 border-t border-gray-200 pt-4">
                  {/* Detected item name */}
                  {detectedProductName && (
                    <div className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                      <span>
                        Erkannt: <span className="font-medium">{detectedProductName}</span>
                      </span>
                    </div>
                  )}

                  {/* Subcategory suggestion */}
                  {selectedSubcategory && (
                    <div className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                      <span>
                        Unterkategorie:{' '}
                        <span className="font-medium">
                          {getSubcategoryDisplayName(selectedSubcategory)}
                        </span>
                      </span>
                    </div>
                  )}

                  {/* Confidence */}
                  <div className="flex items-start gap-2 text-sm text-gray-700">
                    <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                    <span>
                      Konfidenz:{' '}
                      <span className="font-medium">{formatConfidence(detectedConfidence)}</span>
                    </span>
                  </div>

                  {/* Subcategory validity warning */}
                  {selectedCategory && selectedSubcategory && !isSubcategoryValid && (
                    <div className="flex items-start gap-2 rounded-lg bg-amber-100 p-2 text-sm text-amber-800">
                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <span>Vorschlag passt nicht zur gewählten Kategorie</span>
                    </div>
                  )}

                  {/* Note */}
                  <div className="mt-3 rounded-lg bg-white/60 p-2 text-xs text-gray-600">
                    {confidenceStyle.note}
                  </div>

                  {/* Image transferred note */}
                  {formData.images.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-green-700">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>
                        Das hochgeladene Bild wurde automatisch als Listing-Bild übernommen.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Manual selection indicator */}
          {hasManualOverride && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-gray-500" />
                <span>Manuell ausgewählt</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <p className="text-gray-500">
            Bitte laden Sie ein Bild hoch, um die Kategorie automatisch zu erkennen.
          </p>
        </div>
      )}
    </div>
  )
}
