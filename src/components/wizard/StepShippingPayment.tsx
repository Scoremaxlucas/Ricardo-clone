'use client'

import { ProfileCompletionGate } from '@/components/account/ProfileCompletionGate'
import { useLanguage } from '@/contexts/LanguageContext'
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
  const { t } = useLanguage()
  const isShippingLocked = policy?.uiLocks.shipping || false

  const SHIPPING_OPTIONS = [
    {
      id: 'pickup',
      label: t.wizard.shippingPayment.pickup,
      description: t.wizard.shippingPayment.pickupDesc,
      priceValue: 0,
      icon: MapPin,
    },
    {
      id: 'b-post',
      label: t.wizard.shippingPayment.bPost,
      description: t.wizard.shippingPayment.bPostDesc,
      priceValue: 8.5,
      icon: Package,
      weight: t.wizard.shippingPayment.weightUpTo,
    },
    {
      id: 'a-post',
      label: t.wizard.shippingPayment.aPost,
      description: t.wizard.shippingPayment.aPostDesc,
      priceValue: 12.5,
      icon: Truck,
      weight: t.wizard.shippingPayment.weightUpTo,
    },
  ]
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
    <div className="space-y-3 sm:space-y-4 md:space-y-8">
      <div className="text-center">
        <h2 className="mb-1 text-xl font-bold text-gray-900 md:mb-2 md:text-2xl">
          {t.wizard.shippingPayment.title}
        </h2>
        <p className="hidden text-sm text-gray-600 sm:block md:text-base">
          {t.wizard.shippingPayment.subtitle}
        </p>
      </div>

      {/* Shipping methods - Explicit checkbox cards */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              {t.wizard.shippingPayment.offeredShipping} <span className="text-red-500">*</span>
            </label>
            {isShippingLocked && mode === 'edit' && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Lock className="h-3 w-3" />
                <span>{t.wizard.price.locked}</span>
              </div>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {isShippingLocked && mode === 'edit'
              ? t.wizard.shippingPayment.shippingLockedHint
              : t.wizard.shippingPayment.shippingHint}
          </p>
        </div>

        <div
          className={`grid grid-cols-1 gap-2 sm:gap-4 sm:grid-cols-3 ${hasShippingError ? 'rounded-xl border-2 border-red-300 bg-red-50/30 p-2 sm:p-4' : ''}`}
        >
          {SHIPPING_OPTIONS.map(option => {
            const isSelected = formData.shippingMethods.includes(option.id)
            const Icon = option.icon
            const priceDisplay =
              option.priceValue === 0 ? `${formatCHF(0)} (${t.wizard.shippingPayment.free})` : formatCHF(option.priceValue)

            return (
              <label
                key={option.id}
                className={`group relative flex items-center gap-3 rounded-xl border-2 p-3 transition-all sm:flex-col sm:items-stretch sm:p-5 ${
                  isShippingLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                } ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 shadow-md ring-2 ring-primary-200'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {/* Checkbox - inline on mobile, absolute on desktop */}
                <div className="flex-shrink-0 sm:absolute sm:left-3 sm:top-3">
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

                {/* Check indicator top-right (when selected) - desktop only */}
                {isSelected && (
                  <div className="absolute right-3 top-3 hidden sm:block">
                    <CheckCircle className="h-5 w-5 text-primary-600" />
                  </div>
                )}

                {/* Icon - smaller on mobile */}
                <div
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg sm:mb-3 sm:mt-8 sm:h-12 sm:w-12 ${
                    isSelected ? 'bg-primary-100' : 'bg-gray-100 group-hover:bg-gray-200'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 sm:h-6 sm:w-6 ${isSelected ? 'text-primary-600' : 'text-gray-500'}`}
                  />
                </div>

                {/* Text content - horizontal on mobile, vertical on desktop */}
                <div className="flex min-w-0 flex-1 items-center justify-between gap-2 sm:flex-col sm:items-stretch">
                  <div className="min-w-0">
                    {/* Label */}
                    <h3
                      className={`text-sm font-semibold sm:mb-1 sm:text-base ${isSelected ? 'text-primary-700' : 'text-gray-900'}`}
                    >
                      {option.label}
                    </h3>

                    {/* Description + Weight - single line on mobile */}
                    <p className="text-xs text-gray-500 sm:mb-2 sm:text-sm sm:text-gray-600">
                      {option.weight ? `${option.weight} · ` : ''}{option.description}
                    </p>
                  </div>

                  {/* Price - inline on mobile, bottom border on desktop */}
                  <div className="flex-shrink-0 sm:mt-auto sm:border-t sm:border-gray-100 sm:pt-3">
                    <span
                      className={`text-sm font-semibold whitespace-nowrap ${option.priceValue === 0 ? 'text-green-600' : 'text-gray-900'}`}
                    >
                      {priceDisplay}
                    </span>
                  </div>
                </div>

                {/* Check indicator - mobile only, right side */}
                {isSelected && (
                  <div className="flex-shrink-0 sm:hidden">
                    <CheckCircle className="h-5 w-5 text-primary-600" />
                  </div>
                )}
              </label>
            )
          })}
        </div>

        {/* Inline error - only show after validation */}
        {hasShippingError && (
          <p className="text-sm text-red-600">{t.wizard.shippingPayment.selectAtLeastOne}</p>
        )}
      </div>

      {/* Helvenda Zahlungsschutz - Accordion design */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">{t.wizard.shippingPayment.helvendaPayment}</h3>
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
                  {t.wizard.shippingPayment.enableProtection}
                </span>
                {paymentProtectionEnabled && (
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    {t.wizard.shippingPayment.enabled}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-600">
                {t.wizard.shippingPayment.protectionDesc}
              </p>
              {!paymentProtectionApplies && (
                <p className="mt-2 text-xs text-amber-600">
                  {t.wizard.shippingPayment.protectionShippingOnly}
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
                  {t.wizard.shippingPayment.howItWorks}
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
                      <span>{t.wizard.shippingPayment.step1}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                      <span>{t.wizard.shippingPayment.step2}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                      <span>{t.wizard.shippingPayment.step3}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                      <span>{t.wizard.shippingPayment.step4}</span>
                    </div>
                  </div>

                  {/* Costs and timing */}
                  <div className="rounded-lg bg-gray-50 p-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <div className="text-xs font-medium text-gray-500">{t.wizard.shippingPayment.fee}</div>
                        <div className="mt-0.5 text-sm font-semibold text-gray-900">
                          {t.wizard.shippingPayment.feeValue}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">{t.wizard.shippingPayment.feeFromSeller}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-500">{t.wizard.shippingPayment.payout}</div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-700">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          <span>{t.wizard.shippingPayment.payoutDays}</span>
                        </div>
                      </div>
                      <div className="flex items-end">
                        <a
                          href="/help/payment-protection"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
                        >
                          <span>{t.wizard.shippingPayment.learnMore}</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Activation notice */}
                  <div className="mt-4 flex items-start gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-800">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                    <span>{t.wizard.shippingPayment.protectionActivated}</span>
                  </div>

                  {/* Payout onboarding hint - non-blocking */}
                  {payoutOnboardingStatus && payoutOnboardingStatus !== 'COMPLETE' && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                      <div>
                        <span>
                          {t.wizard.shippingPayment.payoutSetupBefore}
                          <Link
                            href="/my-watches/account?setup_payout=1"
                            className="font-medium text-amber-700 underline hover:text-amber-800"
                          >
                            {t.wizard.shippingPayment.setupNow}
                          </Link>
                          {t.wizard.shippingPayment.payoutSetupAfter}
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
