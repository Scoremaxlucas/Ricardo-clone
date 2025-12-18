'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { InvoicePaymentMethods } from './InvoicePaymentMethods'

interface InvoicePaymentModalProps {
  invoiceId: string
  invoiceNumber: string
  amount: number
  isOpen: boolean
  onClose: () => void
  onPaymentSuccess?: () => void
}

export function InvoicePaymentModal({
  invoiceId,
  invoiceNumber,
  amount,
  isOpen,
  onClose,
  onPaymentSuccess,
}: InvoicePaymentModalProps) {
  if (!isOpen) return null

  const handlePaymentSuccess = () => {
    onPaymentSuccess?.()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
      <div className="flex max-h-[95vh] w-full max-w-3xl flex-col overflow-y-auto rounded-lg bg-white shadow-xl sm:max-h-[90vh]">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex-1 min-w-0 pr-2">
            <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Zahlungsmethode wählen</h2>
            <p className="mt-1 text-xs text-gray-600 sm:text-sm">
              <span className="hidden sm:inline">Rechnung </span>
              <span className="font-mono">{invoiceNumber}</span>
              <span className="hidden sm:inline"> • </span>
              <span className="sm:hidden"> • </span>
              CHF {amount.toFixed(2)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 transition-colors hover:text-gray-600"
            aria-label="Schließen"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <InvoicePaymentMethods
            invoiceId={invoiceId}
            invoiceNumber={invoiceNumber}
            amount={amount}
            onPaymentSuccess={handlePaymentSuccess}
          />
        </div>
      </div>
    </div>
  )
}
