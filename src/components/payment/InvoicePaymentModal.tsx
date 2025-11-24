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
  onPaymentSuccess
}: InvoicePaymentModalProps) {
  if (!isOpen) return null

  const handlePaymentSuccess = () => {
    onPaymentSuccess?.()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Zahlungsmethode wählen</h2>
            <p className="text-sm text-gray-600 mt-1">
              Rechnung {invoiceNumber} • CHF {amount.toFixed(2)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Schließen"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
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

