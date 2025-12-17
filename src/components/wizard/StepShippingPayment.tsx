'use client'

import { Package, MapPin, Truck, Shield, Info, ExternalLink, CheckCircle, Clock, AlertTriangle, Sparkles } from 'lucide-react'

interface StepShippingPaymentProps {
  formData: {
    shippingMethods: string[]
  }
  paymentProtectionEnabled: boolean
  onShippingMethodChange: (method: string, checked: boolean) => void
  onPaymentProtectionChange: (enabled: boolean) => void
}

const SHIPPING_OPTIONS = [
  {
    id: 'pickup',
    label: 'Abholung',
    description: 'Käufer holt den Artikel persönlich ab',
    price: 'kostenlos',
    priceValue: 0,
    icon: MapPin,
  },
  {
    id: 'b-post',
    label: 'Paket B-Post',
    description: 'Zustellung innerhalb von 2-3 Werktagen',
    price: 'CHF 8.50',
    priceValue: 8.5,
    icon: Package,
    weight: 'bis 2 kg',
  },
  {
    id: 'a-post',
    label: 'Paket A-Post',
    description: 'Zustellung am nächsten Werktag',
    price: 'CHF 12.50',
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
}: StepShippingPaymentProps) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Versand & Zahlung</h2>
        <p className="text-gray-600">
          Legen Sie fest, welche Versandoptionen Sie anbieten möchten
        </p>
      </div>

      {/* Shipping methods - Card-based design */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Angebotene Lieferarten <span className="text-red-500">*</span>
          </label>
          <p className="mt-1 text-sm text-gray-500">
            Wählen Sie, welche Versandoptionen Sie dem Käufer anbieten. Der Käufer entscheidet beim Kauf, welche Option er nutzen möchte.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {SHIPPING_OPTIONS.map((option) => {
            const isSelected = formData.shippingMethods.includes(option.id)
            const Icon = option.icon

            return (
              <label
                key={option.id}
                className={`group relative flex cursor-pointer flex-col rounded-xl border-2 p-5 transition-all ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => onShippingMethodChange(option.id, e.target.checked)}
                  className="sr-only"
                />

                {isSelected && (
                  <div className="absolute right-3 top-3">
                    <CheckCircle className="h-5 w-5 text-primary-600" />
                  </div>
                )}

                <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-lg ${
                  isSelected ? 'bg-primary-100' : 'bg-gray-100 group-hover:bg-gray-200'
                }`}>
                  <Icon className={`h-6 w-6 ${isSelected ? 'text-primary-600' : 'text-gray-500'}`} />
                </div>

                <h3 className={`mb-1 font-semibold ${isSelected ? 'text-primary-700' : 'text-gray-900'}`}>
                  {option.label}
                </h3>

                {option.weight && (
                  <p className="mb-2 text-xs text-gray-500">{option.weight}</p>
                )}

                <p className="mb-3 flex-1 text-sm text-gray-600">
                  {option.description}
                </p>

                <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className={`text-sm font-semibold ${option.priceValue === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {option.price}
                  </span>
                </div>
              </label>
            )
          })}
        </div>

        {/* Info about shipping costs */}
        <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
          <span>
            Die Versandkosten werden dem Käufer <strong>zusätzlich</strong> zum Kaufpreis berechnet.
            Falls mehrere Optionen gewählt werden, entscheidet der Käufer.
          </span>
        </div>

        {formData.shippingMethods.length === 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4" />
            <span>Bitte wählen Sie mindestens eine Lieferart aus.</span>
          </div>
        )}
      </div>

      {/* Helvenda Zahlungsschutz - Cleaner card design */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Helvenda Zahlungsschutz</h3>
        </div>

        <div className={`overflow-hidden rounded-xl border-2 transition-all ${
          paymentProtectionEnabled
            ? 'border-primary-500 bg-white shadow-lg ring-2 ring-primary-200'
            : 'border-gray-200 bg-white'
        }`}>
          {/* Header */}
          <label className="flex cursor-pointer items-start gap-4 p-6">
            <input
              type="checkbox"
              checked={paymentProtectionEnabled}
              onChange={(e) => onPaymentProtectionChange(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-2 focus:ring-primary-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-gray-900">Zahlungsschutz aktivieren</span>
                {paymentProtectionEnabled && (
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    Aktiviert
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-600">
                Sichere Zahlungsabwicklung über Helvenda – für Käufer und Verkäufer.
              </p>
            </div>
          </label>

          {/* Content - only show when enabled or on hover */}
          <div className={`border-t border-gray-100 px-6 pb-6 transition-all ${
            paymentProtectionEnabled ? 'block' : 'hidden'
          }`}>
            {/* How it works */}
            <div className="mb-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-900">
                <Sparkles className="h-4 w-4 text-primary-500" />
                <span>So funktioniert der Zahlungsschutz:</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
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
            </div>

            {/* Costs and timing - cleaner layout */}
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <div className="text-xs font-medium text-gray-500">Gebühr</div>
                  <div className="mt-0.5 text-sm font-semibold text-gray-900">3.9% + CHF 0.30</div>
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
            {paymentProtectionEnabled && (
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-800">
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                <span>
                  <strong>Zahlungsschutz aktiviert.</strong> Nach Veröffentlichung kann diese Option nicht mehr geändert werden.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
