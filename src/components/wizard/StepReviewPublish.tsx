'use client'

import { getCategoryDisplayName } from '@/lib/product-utils'
import { formatCHF } from '@/lib/product-utils'
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
import { useEffect, useState, useRef } from 'react'

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

// Booster-Datenstruktur mit short/details/bullets
const BOOSTER_DETAILS: Record<string, { short: string; detailsTitle: string; bullets: string[]; fineprint?: string }> = {
  'boost': {
    short: 'Fett hervorgehoben in Listen',
    detailsTitle: 'Boost – Details',
    bullets: [
      'Das Angebot wird in einer Liste von ähnlichen Modellen fett hervorgehoben',
      'Bessere Sichtbarkeit bei Suchergebnissen',
      'Erhöht die Aufmerksamkeit potenzieller Käufer',
      'Geeignet für Standard-Angebote'
    ],
  },
  'turbo-boost': {
    short: 'Hervorhebung + Hauptseite',
    detailsTitle: 'Turbo-Boost – Details',
    bullets: [
      'Das Angebot wird nicht nur hervorgehoben, sondern erscheint teilweise auf der Hauptseite als "Turbo-Boost-Angebot"',
      'Zusätzliche Sichtbarkeit auf der Startseite',
      'Erhöht die Reichweite deutlich',
      'Ideal für schnellverkaufende Artikel'
    ],
  },
  'super-boost': {
    short: 'Hervorhebung + Hauptseite + Top-Position',
    detailsTitle: 'Super-Boost – Details',
    bullets: [
      'Das Angebot wird hervorgehoben und erscheint teilweise auf der Hauptseite',
      'Wird immer zuoberst in der Liste angezeigt',
      'Maximale Sichtbarkeit und Reichweite',
      'Perfekt für Premium-Artikel oder schnelle Verkäufe'
    ],
  },
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
  const stepHeadingRef = useState<HTMLHeadingElement | null>(null)

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
  const selectedBoosterData = selectedBooster === 'none'
    ? null
    : boosters.find(b => b.id === selectedBooster)

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 ref={(el) => { if (el) (window as any).stepHeadingRef = el }} tabIndex={-1} className="mb-2 text-2xl font-bold text-gray-900">Überprüfen & Veröffentlichen</h2>
        <p className="text-gray-600">
          Überprüfen Sie Ihre Angaben und wählen Sie optional einen Booster
        </p>
      </div>

      {/* Summary card - Improved spacing */}
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
          <div className="flex-1 min-w-0">
            <h3 className="mb-2 text-xl font-bold text-gray-900">{formData.title || 'Kein Titel'}</h3>
            {categoryConfig && (
              <div className="mb-3 flex items-center gap-2">
                <categoryConfig.icon className="h-4 w-4 flex-shrink-0 text-primary-600" />
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
                {formatCHF(parseFloat(formData.price || '0'))}
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
              <ImageIcon className="h-5 w-5 flex-shrink-0 text-gray-400" />
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
              <FileText className="h-5 w-5 flex-shrink-0 text-gray-400" />
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
              <Tag className="h-5 w-5 flex-shrink-0 text-gray-400" />
              <div>
                <span className="font-medium text-gray-700">Preis</span>
                <p className="text-sm text-gray-500">
                  {formData.isAuction
                    ? `Startpreis: ${formatCHF(parseFloat(formData.price || '0'))} • ${formData.auctionDuration} Tage`
                    : `Festpreis: ${formatCHF(parseFloat(formData.price || '0'))}`
                  }
                  {formData.buyNowPrice && ` • Sofortkauf: ${formatCHF(parseFloat(formData.buyNowPrice))}`}
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
              <Truck className="h-5 w-5 flex-shrink-0 text-gray-400" />
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
              <Shield className={`h-5 w-5 flex-shrink-0 ${paymentProtectionEnabled ? 'text-green-500' : 'text-gray-400'}`} />
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

      {/* Booster selection - PROMINENT, direkt nach Summary */}
      <div className="rounded-2xl border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
            <Sparkles className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Ihr Angebot hervorheben?</h3>
            <p className="text-sm text-gray-600">Optional - Wählen Sie einen Booster für mehr Sichtbarkeit</p>
          </div>
        </div>

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
              <p className="mt-1 text-sm text-gray-500">{booster.short || booster.description}</p>
              <div className="mt-auto pt-3">
                <span className="text-lg font-bold" style={{ color: booster.badgeColor }}>
                  {formatCHF(booster.price)}
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

        {/* Detail Panel - Only show when booster is selected */}
        {selectedBoosterData && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50/50 p-6">
            <h4 className="mb-4 text-lg font-semibold text-gray-900">
              {selectedBoosterData.detailsTitle || `${selectedBoosterData.name} – Details`}
            </h4>
            <ul className="space-y-2.5">
              {selectedBoosterData.bullets?.map((bullet, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-500" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            {selectedBoosterData.fineprint && (
              <p className="mt-4 text-xs text-gray-500">{selectedBoosterData.fineprint}</p>
            )}
          </div>
        )}
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
