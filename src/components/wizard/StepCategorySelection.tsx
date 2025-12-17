'use client'

import { getCategoryConfig } from '@/data/categories'
import { Sparkles, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import dynamic from 'next/dynamic'

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
}

// Format confidence with Swiss locale (clamped 0-100)
function formatConfidence(confidence: number): string {
  const clamped = Math.min(100, Math.max(0, Math.round(confidence * 100)))
  return clamped.toLocaleString('de-CH') + ' %'
}

// Get confidence level label
function getConfidenceLevel(confidence: number): { label: string; color: string; bgColor: string } {
  const percent = Math.min(100, Math.max(0, confidence * 100))
  if (percent >= 85) {
    return { label: 'Hohe Konfidenz', color: 'text-green-700', bgColor: 'bg-green-100' }
  } else if (percent >= 60) {
    return { label: 'Mittlere Konfidenz', color: 'text-yellow-700', bgColor: 'bg-yellow-100' }
  } else {
    return { label: 'Niedrige Konfidenz', color: 'text-red-700', bgColor: 'bg-red-100' }
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
}: StepCategorySelectionProps) {
  const confidenceLevel = getConfidenceLevel(detectedConfidence)
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Kategorie wählen</h2>
        <p className="text-gray-600">
          Laden Sie ein Bild hoch und unsere KI erkennt automatisch die passende Kategorie
        </p>
      </div>

      {showAIDetection && !selectedCategory ? (
        <AIDetection
          onCategoryDetected={onCategoryDetected}
        />
      ) : selectedCategory ? (
        <div className="space-y-4">
          {/* Selected category display */}
          <div className="rounded-xl border-2 border-primary-200 bg-primary-50 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-600">Gewählte Kategorie:</span>
                {(() => {
                  const config = getCategoryConfig(selectedCategory)
                  const IconComponent = config.icon
                  return (
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{ backgroundColor: '#0f766e' }}
                      >
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-lg font-bold text-primary-700">
                        {config.name}
                      </span>
                    </div>
                  )
                })()}
              </div>
              <button
                type="button"
                onClick={onResetCategory}
                className="rounded-lg border border-primary-300 px-4 py-2 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-100"
              >
                Kategorie ändern
              </button>
            </div>

            {selectedSubcategory && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-gray-600">Unterkategorie:</span>
                <span className="rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700">
                  {selectedSubcategory}
                </span>
              </div>
            )}
          </div>

          {/* AI Detection info - Enhanced with trust indicators */}
          {detectedConfidence > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-6 w-6 flex-shrink-0 text-amber-600" />
                <div className="flex-1">
                  <div className="mb-3 flex items-center gap-2">
                    <p className="text-lg font-semibold text-gray-900">
                      Vorschlag der KI
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${confidenceLevel.bgColor} ${confidenceLevel.color}`}>
                      {confidenceLevel.label}
                    </span>
                  </div>
                  
                  {/* Warning banner */}
                  <div className="mb-4 flex items-start gap-2 rounded-lg bg-white/60 p-3 text-sm text-amber-800">
                    <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>
                      Die KI-Erkennung ist ein <strong>Vorschlag</strong>. Bitte überprüfen Sie, ob die Kategorie korrekt ist.
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-700">
                    {detectedProductName && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Erkannt: <span className="font-medium">{detectedProductName}</span></span>
                      </div>
                    )}
                    {selectedSubcategory && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Unterkategorie: <span className="font-medium">{selectedSubcategory}</span></span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Konfidenz: <span className={`font-medium ${confidenceLevel.color}`}>{formatConfidence(detectedConfidence)}</span></span>
                    </div>
                  </div>
                  
                  {/* AI image transferred note */}
                  {formData.images.length > 0 && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-green-700">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Das hochgeladene Bild wurde automatisch als Listing-Bild übernommen.</span>
                    </div>
                  )}
                </div>
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
