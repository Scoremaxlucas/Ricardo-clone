'use client'

import { X, ShoppingCart, AlertCircle } from 'lucide-react'

interface BuyNowConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  buyNowPrice: number
  shippingCost: number
  isLoading?: boolean
}

export function BuyNowConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  buyNowPrice,
  shippingCost,
  isLoading = false
}: BuyNowConfirmationModalProps) {
  if (!isOpen) return null

  const totalPrice = buyNowPrice + shippingCost
  const hasShipping = shippingCost > 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-lg p-2">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">
              Sofortkauf bestätigen
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning Icon */}
          <div className="flex justify-center mb-4">
            <div className="bg-yellow-50 rounded-full p-3">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          {/* Message */}
          <div className="text-center mb-6">
            <p className="text-gray-700 text-lg mb-4">
              Möchten Sie dieses Produkt für
            </p>
            
            {/* Price Breakdown */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Produktpreis:</span>
                <span className="font-semibold text-gray-900">
                  CHF {new Intl.NumberFormat('de-CH').format(buyNowPrice)}
                </span>
              </div>
              {hasShipping && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Versandkosten:</span>
                  <span className="font-semibold text-gray-900">
                    CHF {new Intl.NumberFormat('de-CH').format(shippingCost)}
                  </span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total:</span>
                  <span className="text-xl font-bold text-primary-600">
                    CHF {new Intl.NumberFormat('de-CH').format(totalPrice)}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-gray-600 text-sm">
              sofort kaufen?
            </p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
            <p className="text-yellow-800 text-sm font-medium text-center">
              ⚠️ Der Kauf ist verbindlich.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Abbrechen
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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


