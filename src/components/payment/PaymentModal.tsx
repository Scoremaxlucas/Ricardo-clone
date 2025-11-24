'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { PaymentInfoCard } from '@/components/payment/PaymentInfoCard'

interface PaymentModalProps {
  purchaseId: string
  watchTitle: string
  isPaid?: boolean
  isOpen: boolean
  onClose: () => void
  onMarkPaid?: () => void
}

export function PaymentModal({ purchaseId, watchTitle, isPaid, isOpen, onClose, onMarkPaid }: PaymentModalProps) {
  const [isMarkingPaid, setIsMarkingPaid] = useState(false)

  const handleMarkPaid = async () => {
    if (!onMarkPaid) return
    
    setIsMarkingPaid(true)
    try {
      const response = await fetch(`/api/purchases/${purchaseId}/mark-paid`, {
        method: 'POST'
      })
      
      if (response.ok) {
        onMarkPaid()
        onClose()
      } else {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        alert('Fehler beim Markieren als bezahlt: ' + (errorData.message || 'Unbekannter Fehler'))
      }
    } catch (error) {
      console.error('Error marking as paid:', error)
      alert('Fehler beim Markieren als bezahlt')
    } finally {
      setIsMarkingPaid(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Zahlungsinformationen
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4 text-sm text-gray-600">
            Für: <span className="font-semibold text-gray-900">{watchTitle}</span>
          </div>

          {/* Zahlungsinformationen */}
          <PaymentInfoCard purchaseId={purchaseId} showQRCode={true} />
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
          <div className="space-y-3">
            {isPaid ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <p className="text-sm font-semibold text-green-700">✓ Als bezahlt markiert</p>
              </div>
            ) : onMarkPaid ? (
              <button
                onClick={handleMarkPaid}
                disabled={isMarkingPaid}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMarkingPaid ? 'Wird verarbeitet...' : 'Als bezahlt markieren'}
              </button>
            ) : null}
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Schliessen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}





