'use client'

import { ProfileCompletionGate } from '@/components/account/ProfileCompletionGate'
import { EditPolicy } from '@/lib/edit-policy'
import { formatCHF } from '@/lib/product-utils'
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Info,
  Lock,
  MapPin,
  Package,
  Shield,
  Truck,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface StepShippingPaymentProps {
  formData: {
    shippingMethods: string[]
  }
  paymentProtectionEnabled: boolean
  onShippingMethodChange: (method: string, checked: boolean) => void
  onPaymentProtectionChange: (enabled: boolean) => void
  hasInteracted?: boolean // Track if user has interacted with this step
  showValidation?: boolean // Show validation errors
  policy?: EditPolicy
  mode?: 'create' | 'edit'
}

const SHIPPING_OPTIONS = [
  {
    id: 'pickup',
    label: 'Abholung',
    description: 'Käufer holt den Artikel persönlich ab',
    priceValue: 0,
    icon: MapPin,
  },
  {
    id: 'b-post',
    label: 'Paket B-Post',
    description: 'Zustellung innerhalb von 2-3 Werktagen',
    priceValue: 8.5,
    icon: Package,
    weight: 'bis 2 kg',
  },
  {
    id: 'a-post',
    label: 'Paket A-Post',
    description: 'Zustellung am nächsten Werktag',
    priceValue: 12.5,
    icon: Truck,
    weight: 'bis 2 kg',
  },
]

export function StepShippingPayment({
  formData,
  paymentProtectionEnabled,
  onShippingMethodChange,
  onPaymentProtectionChange,
  hasInteracted = false,
  showValidation = false,
  policy,
  mode = 'create',
}: StepShippingPaymentProps) {
  const isShippingLocked = policy?.uiLocks.shipping || false
  const [showPaymentDetails, setShowPaymentDetails] = useState(false)
  const [profileGateOpen, setProfileGateOpen] = useState(false)
  const [profileGateMissingFields, setProfileGateMissingFields] = useState<any[]>([])
  const [payoutOnboardingStatus, setPayoutOnboardingStatus] = useState<
    'NOT_STARTED' | 'INCOMPLETE' | 'COMPLETE' | null
  >(null)
  const hasShippingError = showValidation && formData.shippingMethods.length === 0
  const onlyPickup =
    formData.shippingMethods.length === 1 && formData.shippingMethods[0] === 'pickup'
  const paymentProtectionApplies = !onlyPickup || formData.shippingMethods.length > 1

  // Check payout onboarding status when payment protection is enabled
  useEffect(() => {
    if (paymentProtectionEnabled) {
      fetch('/api/stripe/connect/ensure-account')
        .then(res => res.json())
        .then(data => {
          setPayoutOnboardingStatus(data.status || 'NOT_STARTED')
        })
        .catch(() => {
          setPayoutOnboardingStatus('NOT_STARTED')
        })
    }
  }, [paymentProtectionEnabled])

  const handlePaymentProtectionToggle = async (checked: boolean) => {
    if (checked) {
      // Check profile before enabling payment protection
      try {
        const res = await fetch('/api/profile/check-complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            context: 'PAYMENT_PROTECTION',
            options: {},
          }),
        })

        if (res.ok) {
          const data = await res.json()
          if (!data.isComplete) {
            setProfileGateMissingFields(data.missingFields)
            setProfileGateOpen(true)
            return // Don't enable payment protection
          }
        }
      } catch (error) {
        console.error('Error checking profile:', error)
        // Allow enabling if check fails (fail open)
      }
    }
    // Enable/disable payment protection
    onPaymentProtectionChange(checked)
  }

  return (
    <div className="space-y-4 md:space-y-8">
      <div className="text-center">
        <h2 className="mb-1 text-xl font-bold text-gray-900 md:mb-2 md:text-2xl">
          Versand & Zahlung
        </h2>
        <p className="text-sm text-gray-600 md:text-base">
          Legen Sie fest, welche Versandoptionen Sie anbieten möchten
        </p>
      </div>

      {/* Shipping methods - Explicit checkbox cards */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Angebotene Lieferarten <span className="text-red-500">*</span>
            </label>
            {isShippingLocked && mode === 'edit' && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Lock className="h-3 w-3" />
                <span>Gesperrt</span>
              </div>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {isShippingLocked && mode === 'edit'
              ? 'Versandoptionen können nicht mehr geändert werden.'
              : 'Hinweis: Versandkosten kommen zum Artikelpreis dazu. Wenn du mehrere Optionen anbietest, wählt der Käufer beim Kauf.'}
          </p>
        </div>

        <div
          className={`grid grid-cols-1 gap-4 sm:grid-cols-3 ${hasShippingError ? 'rounded-xl border-2 border-red-300 bg-red-50/30 p-4' : ''}`}
        >
          {SHIPPING_OPTIONS.map(option => {
            const isSelected = formData.shippingMethods.includes(option.id)
            const Icon = option.icon
            const priceDisplay =
              option.priceValue === 0 ? formatCHF(0) + ' (kostenlos)' : formatCHF(option.priceValue)

            return (
              <label
                key={option.id}
                className={`group relative flex flex-col rounded-xl border-2 p-5 transition-all ${
                  isShippingLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                } ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 shadow-md ring-2 ring-primary-200'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {/* Visible checkbox top-left */}
                <div className="absolute left-3 top-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={e =>
                      !isShippingLocked && onShippingMethodChange(option.id, e.target.checked)
                    }
                    disabled={isShippingLocked}
                    className={`h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-2 focus:ring-primary-500 ${
                      isShippingLocked ? 'cursor-not-allowed opacity-50' : ''
                    }`}
                  />
                </div>

                {/* Check indicator top-right (when selected) */}
                {isSelected && (
                  <div className="absolute right-3 top-3">
                    <CheckCircle className="h-5 w-5 text-primary-600" />
                  </div>
                )}

                {/* Icon */}
                <div
                  className={`mb-3 mt-8 flex h-12 w-12 items-center justify-center rounded-lg ${
                    isSelected ? 'bg-primary-100' : 'bg-gray-100 group-hover:bg-gray-200'
                  }`}
                >
                  <Icon
                    className={`h-6 w-6 ${isSelected ? 'text-primary-600' : 'text-gray-500'}`}
                  />
                </div>

                {/* Label */}
                <h3
                  className={`mb-1 font-semibold ${isSelected ? 'text-primary-700' : 'text-gray-900'}`}
                >
                  {option.label}
                </h3>

                {/* Weight info */}
                {option.weight && <p className="mb-2 text-xs text-gray-500">{option.weight}</p>}

                {/* Description */}
                <p className="mb-3 flex-1 text-sm text-gray-600">{option.description}</p>

                {/* Price */}
                <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3">
                  <span
                    className={`text-sm font-semibold ${option.priceValue === 0 ? 'text-green-600' : 'text-gray-900'}`}
                  >
                    {priceDisplay}
                  </span>
                </div>
              </label>
            )
          })}
        </div>

        {/* Inline error - only show after validation */}
        {hasShippingError && (
          <p className="text-sm text-red-600">Bitte wählen Sie mindestens eine Lieferart aus.</p>
        )}
      </div>

      {/* Helvenda Zahlungsschutz - Accordion design */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Helvenda Zahlungsschutz</h3>
        </div>

        <div
          className={`overflow-hidden rounded-xl border-2 transition-all ${
            paymentProtectionEnabled
              ? 'border-primary-500 bg-white shadow-lg ring-2 ring-primary-200'
              : 'border-gray-200 bg-white'
          }`}
        >
          {/* Header - Checkbox row */}
          <label className="flex cursor-pointer items-start gap-4 p-6">
            <input
              type="checkbox"
              checked={paymentProtectionEnabled}
              onChange={e => handlePaymentProtectionToggle(e.target.checked)}
              disabled={!paymentProtectionApplies}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-gray-900">
                  Zahlungsschutz aktivieren
                </span>
                {paymentProtectionEnabled && (
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    Aktiviert
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-600">
                Sichere Zahlungsabwicklung über Helvenda – für Käufer und Verkäufer.
              </p>
              {!paymentProtectionApplies && (
                <p className="mt-2 text-xs text-amber-600">
                  Zahlungsschutz ist nur bei Versand möglich. Bitte wählen Sie mindestens eine
                  Versandoption zusätzlich zur Abholung.
                </p>
              )}
            </div>
          </label>

          {/* Accordion toggle - "So funktioniert's" */}
          {paymentProtectionEnabled && (
            <div className="border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowPaymentDetails(!showPaymentDetails)}
                className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-gray-50"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <Info className="h-4 w-4 text-primary-500" />
                  So funktioniert's
                </span>
                {showPaymentDetails ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </button>

              {/* Accordion content */}
              {showPaymentDetails && (
                <div className="border-t border-gray-100 px-6 pb-6 pt-4">
                  {/* How it works - Bullet steps */}
                  <div className="mb-4 space-y-2.5">
                    <div className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                      <span>Käufer zahlt sicher über Helvenda</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                      <span>Geld wird treuhänderisch verwahrt</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                      <span>Auszahlung nach Empfangsbestätigung</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                      <span>Streitfall-Mediation durch Helvenda</span>
                    </div>
                  </div>

                  {/* Costs and timing */}
                  <div className="rounded-lg bg-gray-50 p-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <div className="text-xs font-medium text-gray-500">Gebühr</div>
                        <div className="mt-0.5 text-sm font-semibold text-gray-900">
                          3.9% + CHF 0.30
                        </div>
                        <div className="mt-1 text-xs text-gray-500">(vom Verkäufer)</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-500">Auszahlung</div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-700">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          <span>2-3 Werktage</span>
                        </div>
                      </div>
                      <div className="flex items-end">
                        <a
                          href="/help/payment-protection"
                          target="_blank"
                          className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
                        >
                          <span>Mehr erfahren</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Activation notice */}
                  <div className="mt-4 flex items-start gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-800">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                    <span>
                      <strong>Zahlungsschutz aktiviert.</strong> Nach Veröffentlichung kann diese
                      Option nicht mehr geändert werden.
                    </span>
                  </div>

                  {/* Payout onboarding hint - non-blocking */}
                  {payoutOnboardingStatus && payoutOnboardingStatus !== 'COMPLETE' && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                      <div>
                        <span>
                          Für Auszahlungen brauchst du einmalig Auszahlungsdaten.{' '}
                          <Link
                            href="/my-watches/account?setup_payout=1"
                            className="font-medium text-amber-700 underline hover:text-amber-800"
                          >
                            Jetzt einrichten
                          </Link>{' '}
                          oder später erledigen.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Profile Completion Gate */}
      <ProfileCompletionGate
        context="PAYMENT_PROTECTION"
        missingFields={profileGateMissingFields}
        isOpen={profileGateOpen}
        onClose={() => setProfileGateOpen(false)}
        blocking={true}
      />
    </div>
  )
}
