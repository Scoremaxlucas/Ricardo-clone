'use client'

import { useState } from 'react'
import { AlertCircle, Shield, X } from 'lucide-react'
import { PaymentInfoCard } from '@/components/payment/PaymentInfoCard'

interface PaymentModalProps {
  purchaseId: string
  watchTitle: string
  isPaid?: boolean
  isOpen: boolean
  onClose: () => void
  onMarkPaid?: () => void
  /** If protection was desired but seller lacks Stripe Connect */
  protectionUnavailable?: boolean
}

export function PaymentModal({
  purchaseId,
  watchTitle,
  isPaid,
  isOpen,
  onClose,
  onMarkPaid,
  protectionUnavailable = false,
}: PaymentModalProps) {
  const [isMarkingPaid, setIsMarkingPaid] = useState(false)

  const handleMarkPaid = async () => {
    if (!onMarkPaid) return

    setIsMarkingPaid(true)
    try {
      const response = await fetch(`/api/purchases/${purchaseId}/mark-paid`, {
        method: 'POST',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl my-4">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 py-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate pr-2">Zahlungsinformationen</h2>
          <button onClick={onClose} className="text-gray-400 transition-colors hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <div className="mb-4 text-sm text-gray-600">
            Für: <span className="font-semibold text-gray-900">{watchTitle}</span>
          </div>

          {/* Warning if protection was expected but unavailable */}
          {protectionUnavailable && (
            <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">Helvenda Schutz nicht verfügbar</p>
                  <p className="mt-1 text-sm text-yellow-700">
                    Der Verkäufer hat noch keinen Stripe Account eingerichtet. Die Zahlung erfolgt
                    daher per Banküberweisung ohne Käuferschutz. Bei Fragen kontaktieren Sie bitte
                    den Verkäufer.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Zahlungsinformationen */}
          <PaymentInfoCard purchaseId={purchaseId} showQRCode={true} />
        </div>

        <div className="sticky bottom-0 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="space-y-3">
            {isPaid ? (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
                <p className="text-sm font-semibold text-green-700">✓ Als bezahlt markiert</p>
              </div>
            ) : onMarkPaid ? (
              <button
                onClick={handleMarkPaid}
                disabled={isMarkingPaid}
                className="w-full rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isMarkingPaid ? 'Wird verarbeitet...' : 'Als bezahlt markieren'}
              </button>
            ) : null}
            <button
              onClick={onClose}
              className="w-full rounded-md bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300"
            >
              Schliessen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
