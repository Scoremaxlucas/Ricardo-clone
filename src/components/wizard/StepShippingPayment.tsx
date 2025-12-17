'use client'

import { Package, MapPin, Truck, Shield, Info } from 'lucide-react'

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
    description: 'Käufer holt Artikel persönlich ab',
    price: 'kostenlos',
    priceValue: 0,
    icon: MapPin,
  },
  {
    id: 'b-post',
    label: 'Versand als Paket B-Post, bis 2 KG',
    description: 'Standardversand mit der Post',
    price: 'CHF 8.50',
    priceValue: 8.5,
    icon: Package,
  },
  {
    id: 'a-post',
    label: 'Versand als Paket A-Post, bis 2 KG',
    description: 'Schneller Versand mit der Post',
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
          Wählen Sie die Versandoptionen und aktivieren Sie optional den Zahlungsschutz
        </p>
      </div>

      {/* Shipping methods */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Lieferart <span className="text-red-500">*</span>
        </label>
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
        
        <p className="text-sm text-gray-500">
          Die Versandkosten werden dem Käufer zusätzlich zum Kaufbetrag berechnet.
          Es wird der höchste Betrag der ausgewählten Lieferarten berechnet.
        </p>

        {formData.shippingMethods.length === 0 && (
          <p className="text-sm font-medium text-red-500">
            Bitte wählen Sie mindestens eine Lieferart aus.
          </p>
        )}
      </div>

      {/* Helvenda Zahlungsschutz */}
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
                    Aktiv
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-600">
                Das Geld wird sicher verwahrt, bis der Käufer den Erhalt bestätigt.
                Erst dann wird der Betrag an Sie ausgezahlt.
              </p>
            </div>
          </label>

          {/* Info box */}
          <div className="mt-4 flex items-start gap-3 rounded-lg bg-white p-4">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-500" />
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-700">So funktioniert der Zahlungsschutz:</p>
              <ul className="mt-2 space-y-1">
                <li>✓ Käufer zahlt sicher über Helvenda</li>
                <li>✓ Geld wird treuhänderisch verwahrt</li>
                <li>✓ Sie versenden den Artikel</li>
                <li>✓ Käufer bestätigt Erhalt</li>
                <li>✓ Geld wird an Sie ausgezahlt</li>
              </ul>
            </div>
          </div>

          {paymentProtectionEnabled && (
            <div className="mt-4 rounded-lg bg-green-100 p-3 text-sm text-green-800">
              <strong>Hinweis:</strong> Nach Veröffentlichung kann der Zahlungsschutz nicht mehr geändert werden.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

