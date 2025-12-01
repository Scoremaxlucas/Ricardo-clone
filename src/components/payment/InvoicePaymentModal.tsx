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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-y-auto rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Zahlungsmethode wählen</h2>
            <p className="mt-1 text-sm text-gray-600">
              Rechnung {invoiceNumber} • CHF {amount.toFixed(2)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
            aria-label="Schließen"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
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
