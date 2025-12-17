'use client'

import { getCategoryConfig } from '@/data/categories'
import {
  Edit2,
  Image as ImageIcon,
  FileText,
  Tag,
  Truck,
  Shield,
  Sparkles,
  CheckCircle,
  Clock
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface BoosterOption {
  id: string
  name: string
  description: string
  price: number
  badge: string
  badgeColor: string
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
}

const CONDITION_LABELS: Record<string, string> = {
  'new': 'Neu',
  'like-new': 'Wie neu',
  'very-good': 'Sehr gut',
  'good': 'Gut',
  'acceptable': 'Akzeptabel',
  'defective': 'Defekt',
}

const SHIPPING_LABELS: Record<string, string> = {
  'pickup': 'Abholung',
  'b-post': 'B-Post (CHF 8.50)',
  'a-post': 'A-Post (CHF 12.50)',
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
}: StepReviewPublishProps) {
  const [boosters, setBoosters] = useState<BoosterOption[]>([])

  // Load boosters
  useEffect(() => {
    const loadBoosters = async () => {
      try {
        const response = await fetch('/api/boosters')
        if (response.ok) {
          const data = await response.json()
          setBoosters(data.boosters || [])
        }
      } catch (error) {
        console.error('Error loading boosters:', error)
      }
    }
    loadBoosters()
  }, [])

  const categoryConfig = selectedCategory ? getCategoryConfig(selectedCategory) : null
  const titleImage = formData.images[titleImageIndex] || formData.images[0]

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Überprüfen & Veröffentlichen</h2>
        <p className="text-gray-600">
          Überprüfen Sie Ihre Angaben und wählen Sie optional einen Booster
        </p>
      </div>

      {/* Summary card */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Header with image */}
        <div className="flex gap-6 border-b border-gray-100 p-6">
          {titleImage && (
            <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-xl">
              <img
                src={titleImage}
                alt={formData.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-1 right-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                {formData.images.length} Bilder
              </div>
            </div>
          )}
          <div className="flex-1">
            <h3 className="mb-2 text-xl font-bold text-gray-900">{formData.title || 'Kein Titel'}</h3>
            {categoryConfig && (
              <div className="mb-2 flex items-center gap-2">
                <categoryConfig.icon className="h-4 w-4 text-primary-600" />
                <span className="text-sm text-gray-600">{categoryConfig.name}</span>
                {selectedSubcategory && (
                  <>
                    <span className="text-gray-400">›</span>
                    <span className="text-sm text-gray-600">{selectedSubcategory}</span>
                  </>
                )}
              </div>
            )}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary-600">
                CHF {parseFloat(formData.price || '0').toLocaleString('de-CH')}
              </span>
              {formData.isAuction && (
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                  Auktion
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Summary sections */}
        <div className="divide-y divide-gray-100">
          {/* Images */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <ImageIcon className="h-5 w-5 text-gray-400" />
              <div>
                <span className="font-medium text-gray-700">Bilder</span>
                <p className="text-sm text-gray-500">{formData.images.length} Bilder hochgeladen</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onGoToStep(1)}
              className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              <Edit2 className="h-4 w-4" />
              Bearbeiten
            </button>
          </div>

          {/* Details */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-gray-400" />
              <div>
                <span className="font-medium text-gray-700">Details</span>
                <p className="text-sm text-gray-500">
                  Zustand: {CONDITION_LABELS[formData.condition] || formData.condition || 'Nicht angegeben'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onGoToStep(2)}
              className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              <Edit2 className="h-4 w-4" />
              Bearbeiten
            </button>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Tag className="h-5 w-5 text-gray-400" />
              <div>
                <span className="font-medium text-gray-700">Preis</span>
                <p className="text-sm text-gray-500">
                  {formData.isAuction
                    ? `Startpreis: CHF ${parseFloat(formData.price || '0').toLocaleString('de-CH')} • ${formData.auctionDuration} Tage`
                    : `Festpreis: CHF ${parseFloat(formData.price || '0').toLocaleString('de-CH')}`
                  }
                  {formData.buyNowPrice && ` • Sofortkauf: CHF ${parseFloat(formData.buyNowPrice).toLocaleString('de-CH')}`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onGoToStep(3)}
              className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              <Edit2 className="h-4 w-4" />
              Bearbeiten
            </button>
          </div>

          {/* Shipping */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-gray-400" />
              <div>
                <span className="font-medium text-gray-700">Versand</span>
                <p className="text-sm text-gray-500">
                  {formData.shippingMethods.length > 0
                    ? formData.shippingMethods.map(m => SHIPPING_LABELS[m] || m).join(', ')
                    : 'Keine Versandart gewählt'
                  }
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onGoToStep(4)}
              className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              <Edit2 className="h-4 w-4" />
              Bearbeiten
            </button>
          </div>

          {/* Payment protection */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Shield className={`h-5 w-5 ${paymentProtectionEnabled ? 'text-green-500' : 'text-gray-400'}`} />
              <div>
                <span className="font-medium text-gray-700">Zahlungsschutz</span>
                <p className="text-sm text-gray-500">
                  {paymentProtectionEnabled ? 'Aktiviert' : 'Nicht aktiviert'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onGoToStep(4)}
              className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              <Edit2 className="h-4 w-4" />
              Bearbeiten
            </button>
          </div>
        </div>
      </div>

      {/* Booster selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Booster-Option</h3>
          <span className="text-sm text-gray-500">(Optional)</span>
        </div>
        <p className="text-sm text-gray-600">
          Wählen Sie, wie Ihr Angebot hervorgehoben werden soll
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* No booster option */}
          <button
            type="button"
            onClick={() => onBoosterChange('none')}
            className={`relative flex flex-col rounded-xl border-2 p-4 text-left transition-all ${
              selectedBooster === 'none'
                ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="mb-2 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              STANDARD
            </div>
            <h4 className="font-semibold text-gray-900">Kein Booster</h4>
            <p className="mt-1 text-sm text-gray-500">Das Angebot wird nicht besonders hervorgehoben</p>
            <div className="mt-auto pt-3">
              <span className="text-lg font-bold text-gray-900">CHF 0.00</span>
            </div>
            {selectedBooster === 'none' && (
              <div className="absolute right-3 top-3">
                <CheckCircle className="h-5 w-5 text-primary-600" />
              </div>
            )}
          </button>

          {/* Dynamic boosters */}
          {boosters.map((booster) => (
            <button
              key={booster.id}
              type="button"
              onClick={() => onBoosterChange(booster.id)}
              className={`relative flex flex-col rounded-xl border-2 p-4 text-left transition-all ${
                selectedBooster === booster.id
                  ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div
                className="mb-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: booster.badgeColor + '20',
                  color: booster.badgeColor
                }}
              >
                {booster.badge}
              </div>
              <h4 className="font-semibold text-gray-900">{booster.name}</h4>
              <p className="mt-1 line-clamp-2 text-sm text-gray-500">{booster.description}</p>
              <div className="mt-auto pt-3">
                <span className="text-lg font-bold" style={{ color: booster.badgeColor }}>
                  CHF {booster.price.toFixed(2)}
                </span>
              </div>
              {selectedBooster === booster.id && (
                <div className="absolute right-3 top-3">
                  <CheckCircle className="h-5 w-5 text-primary-600" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Final validation message */}
      <div className="rounded-xl bg-green-50 p-6 text-center">
        <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-500" />
        <h3 className="mb-2 text-lg font-semibold text-green-800">Bereit zur Veröffentlichung</h3>
        <p className="text-sm text-green-700">
          Klicken Sie auf "Artikel veröffentlichen", um Ihren Artikel zu listen.
        </p>
      </div>
    </div>
  )
}

