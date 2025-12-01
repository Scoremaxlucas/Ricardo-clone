'use client'

import { useState, useEffect } from 'react'
import { Package, Truck, MapPin } from 'lucide-react'
import { ShippingMethod, ShippingMethodArray, getShippingCostForMethod, getShippingLabels } from '@/lib/shipping'

interface ShippingMethodSelectorProps {
  availableMethods: ShippingMethodArray
  selectedMethod: ShippingMethod | null
  onMethodChange: (method: ShippingMethod | null) => void
  showCosts?: boolean
  className?: string
}

export function ShippingMethodSelector({
  availableMethods,
  selectedMethod,
  onMethodChange,
  showCosts = true,
  className = '',
}: ShippingMethodSelectorProps) {
  const [methods, setMethods] = useState<ShippingMethod[]>([])

  useEffect(() => {
    if (Array.isArray(availableMethods)) {
      setMethods(availableMethods)
      // Setze erste Methode als Standard, wenn noch keine ausgewählt
      if (!selectedMethod && availableMethods.length > 0) {
        onMethodChange(availableMethods[0])
      }
    } else {
      setMethods([])
    }
  }, [availableMethods, selectedMethod, onMethodChange])

  if (!methods || methods.length === 0) {
    return null
  }

  // Wenn nur eine Methode verfügbar ist, zeige sie ohne Auswahl
  if (methods.length === 1) {
    const method = methods[0]
    const cost = getShippingCostForMethod(method)
    return (
      <div className={`rounded-lg border border-gray-200 bg-gray-50 p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {method === 'pickup' && <MapPin className="h-5 w-5 text-gray-600" />}
            {method === 'b-post' && <Package className="h-5 w-5 text-gray-600" />}
            {method === 'a-post' && <Truck className="h-5 w-5 text-gray-600" />}
            <span className="text-sm font-medium text-gray-900">
              {method === 'pickup' && 'Abholung'}
              {method === 'b-post' && 'Versand als Paket B-Post'}
              {method === 'a-post' && 'Versand als Paket A-Post'}
            </span>
          </div>
          {showCosts && (
            <span className="text-sm font-semibold text-gray-700">
              {cost === 0 ? 'Kostenlos' : `CHF ${cost.toFixed(2)}`}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-semibold text-gray-700">Liefermethode wählen</label>
      {methods.map(method => {
        const cost = getShippingCostForMethod(method)
        const isSelected = selectedMethod === method

        return (
          <label
            key={method}
            className={`flex cursor-pointer items-center justify-between rounded-lg border-2 p-4 transition-all ${
              isSelected
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="shipping-method"
                value={method}
                checked={isSelected}
                onChange={() => onMethodChange(method)}
                className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div className="flex items-center gap-2">
                {method === 'pickup' && <MapPin className="h-5 w-5 text-gray-600" />}
                {method === 'b-post' && <Package className="h-5 w-5 text-gray-600" />}
                {method === 'a-post' && <Truck className="h-5 w-5 text-gray-600" />}
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {method === 'pickup' && 'Abholung'}
                    {method === 'b-post' && 'Versand als Paket B-Post, bis 2 KG'}
                    {method === 'a-post' && 'Versand als Paket A-Post, bis 2 KG'}
                  </div>
                  {method !== 'pickup' && (
                    <div className="text-xs text-gray-500">Schweizerische Post</div>
                  )}
                </div>
              </div>
            </div>
            {showCosts && (
              <div className="text-right">
                <div className={`text-sm font-semibold ${isSelected ? 'text-primary-700' : 'text-gray-700'}`}>
                  {cost === 0 ? 'Kostenlos' : `CHF ${cost.toFixed(2)}`}
                </div>
              </div>
            )}
          </label>
        )
      })}
    </div>
  )
}

