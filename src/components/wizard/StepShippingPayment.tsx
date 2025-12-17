'use client'

import { Package, MapPin, Truck, Shield, Info, ExternalLink, CheckCircle, Clock, AlertTriangle } from 'lucide-react'

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
    label: 'Paket B-Post (bis 2 kg)',
    description: 'Zustellung innerhalb von 2-3 Werktagen',
    price: 'CHF 8.50',
    priceValue: 8.5,
    icon: Package,
  },
  {
    id: 'a-post',
    label: 'Paket A-Post (bis 2 kg)',
    description: 'Zustellung am nächsten Werktag',
    price: 'CHF 12.50',
    priceValue: 12.5,
    icon: Truck,
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

      {/* Shipping methods */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Angebotene Lieferarten <span className="text-red-500">*</span>
          </label>
          <p className="mt-1 text-sm text-gray-500">
            Wählen Sie, welche Versandoptionen Sie dem Käufer anbieten. Der Käufer entscheidet beim Kauf, welche Option er nutzen möchte.
          </p>
        </div>
        
        <div className="space-y-3">
          {SHIPPING_OPTIONS.map((option) => {
            const isSelected = formData.shippingMethods.includes(option.id)
            const Icon = option.icon

            return (
              <label
                key={option.id}
                className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-all ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => onShippingMethodChange(option.id, e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-primary-600"
                />
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  isSelected ? 'bg-primary-100' : 'bg-gray-100'
                }`}>
                  <Icon className={`h-5 w-5 ${isSelected ? 'text-primary-600' : 'text-gray-500'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{option.label}</span>
                    <span className={`font-semibold ${option.priceValue === 0 ? 'text-green-600' : 'text-gray-700'}`}>
                      {option.price}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{option.description}</p>
                </div>
              </label>
            )
          })}
        </div>

        {/* Info about shipping costs */}
        <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
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

      {/* Helvenda Zahlungsschutz - Enhanced with details */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Helvenda Zahlungsschutz</h3>
        </div>

        <div className={`rounded-xl border-2 p-6 transition-all ${
          paymentProtectionEnabled
            ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-green-50'
            : 'border-gray-200 bg-gray-50'
        }`}>
          <label className="flex cursor-pointer items-start gap-4">
            <input
              type="checkbox"
              checked={paymentProtectionEnabled}
              onChange={(e) => onPaymentProtectionChange(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-primary-600"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">Zahlungsschutz aktivieren</span>
                {paymentProtectionEnabled && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    Empfohlen
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-600">
                Sichere Zahlungsabwicklung über Helvenda – für Käufer und Verkäufer.
              </p>
            </div>
          </label>

          {/* Detailed info box */}
          <div className="mt-4 space-y-3 rounded-lg bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <Info className="h-4 w-4 text-primary-500" />
              <span>So funktioniert der Zahlungsschutz:</span>
            </div>
            
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                <span>Käufer zahlt sicher über Helvenda</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                <span>Geld wird treuhänderisch verwahrt</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                <span>Auszahlung nach Empfangsbestätigung</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                <span>Streitfall-Mediation durch Helvenda</span>
              </div>
            </div>
            
            {/* Costs and timing */}
            <div className="mt-3 grid grid-cols-1 gap-2 border-t border-gray-100 pt-3 sm:grid-cols-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">Gebühr:</span>
                <span className="text-sm font-semibold text-gray-900">3.9% + CHF 0.30</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">Auszahlung in 2-3 Tagen</span>
              </div>
              <a
                href="/help/payment-protection"
                target="_blank"
                className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                <span>Mehr erfahren</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {paymentProtectionEnabled && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-green-100 p-3 text-sm text-green-800">
              <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                <strong>Zahlungsschutz aktiviert.</strong> Nach Veröffentlichung kann diese Option nicht mehr geändert werden.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
