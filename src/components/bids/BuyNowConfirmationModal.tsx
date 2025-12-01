'use client'

import { useState, useEffect } from 'react'
import { X, ShoppingCart, AlertCircle } from 'lucide-react'
import { ShippingMethodSelector } from '@/components/shipping/ShippingMethodSelector'
import { ShippingMethod, ShippingMethodArray, getShippingCostForMethod } from '@/lib/shipping'

interface BuyNowConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (selectedShippingMethod: ShippingMethod | null) => void
  buyNowPrice: number
  shippingCost: number
  availableShippingMethods?: ShippingMethodArray
  isLoading?: boolean
}

export function BuyNowConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  buyNowPrice,
  shippingCost,
  availableShippingMethods,
  isLoading = false,
}: BuyNowConfirmationModalProps) {
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<ShippingMethod | null>(null)
  const [currentShippingCost, setCurrentShippingCost] = useState(shippingCost)

  useEffect(() => {
    if (availableShippingMethods && Array.isArray(availableShippingMethods) && availableShippingMethods.length > 0) {
      // Setze erste Methode als Standard
      if (!selectedShippingMethod) {
        setSelectedShippingMethod(availableShippingMethods[0])
        setCurrentShippingCost(getShippingCostForMethod(availableShippingMethods[0]))
      }
    } else {
      setCurrentShippingCost(shippingCost)
    }
  }, [availableShippingMethods, shippingCost])

  useEffect(() => {
    if (selectedShippingMethod) {
      setCurrentShippingCost(getShippingCostForMethod(selectedShippingMethod))
    }
  }, [selectedShippingMethod])

  if (!isOpen) return null

  const totalPrice = buyNowPrice + currentShippingCost
  const hasShipping = currentShippingCost > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white/20 p-2">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Sofortkauf bestätigen</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-white/80 transition-colors hover:text-white disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning Icon */}
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-yellow-50 p-3">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          {/* Message */}
          <div className="mb-6 text-center">
            <p className="mb-4 text-lg text-gray-700">Möchten Sie dieses Produkt für</p>

            {/* Price Breakdown */}
            <div className="mb-4 space-y-2 rounded-lg bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Produktpreis:</span>
                <span className="font-semibold text-gray-900">
                  CHF {new Intl.NumberFormat('de-CH').format(buyNowPrice)}
                </span>
              </div>
              {/* Liefermethoden-Auswahl */}
              {availableShippingMethods && Array.isArray(availableShippingMethods) && availableShippingMethods.length > 1 && (
                <div className="mb-3 border-t border-gray-200 pt-3">
                  <ShippingMethodSelector
                    availableMethods={availableShippingMethods}
                    selectedMethod={selectedShippingMethod}
                    onMethodChange={(method) => {
                      setSelectedShippingMethod(method)
                      setCurrentShippingCost(getShippingCostForMethod(method))
                    }}
                    showCosts={true}
                  />
                </div>
              )}
              {hasShipping && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Versandkosten:</span>
                  <span className="font-semibold text-gray-900">
                    CHF {new Intl.NumberFormat('de-CH').format(currentShippingCost)}
                  </span>
                </div>
              )}
              <div className="mt-2 border-t border-gray-200 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">Total:</span>
                  <span className="text-xl font-bold text-primary-600">
                    CHF {new Intl.NumberFormat('de-CH').format(totalPrice)}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600">sofort kaufen?</p>
          </div>

          {/* Warning */}
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
            <p className="text-center text-sm font-medium text-yellow-800">
              ⚠️ Der Kauf ist verbindlich.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded-lg bg-gray-100 px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Abbrechen
            </button>
            <button
              onClick={() => onConfirm(selectedShippingMethod)}
              disabled={isLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-3 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg
                    className="h-5 w-5 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Wird verarbeitet...</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5" />
                  <span>Jetzt kaufen</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
