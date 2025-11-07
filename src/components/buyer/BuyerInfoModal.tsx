'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface BuyerInfo {
  id: string
  name: string | null
  email: string | null
  firstName: string | null
  lastName: string | null
  street: string | null
  streetNumber: string | null
  postalCode: string | null
  city: string | null
  phone: string | null
  paymentMethods: string | null
}

interface BuyerInfoModalProps {
  buyer: BuyerInfo
  watchTitle: string
  purchaseId?: string
  isPaid?: boolean
  isOpen: boolean
  onClose: () => void
  onMarkPaid?: () => void
}

export function BuyerInfoModal({ buyer, watchTitle, purchaseId, isPaid, isOpen, onClose, onMarkPaid }: BuyerInfoModalProps) {
  const [isMarkingPaid, setIsMarkingPaid] = useState(false)

  const handleMarkPaid = async () => {
    if (!purchaseId || !onMarkPaid) return
    
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

  // Parse payment methods
  let paymentMethods: any[] = []
  if (buyer.paymentMethods) {
    try {
      paymentMethods = JSON.parse(buyer.paymentMethods)
    } catch (e) {
      console.error('Error parsing payment methods:', e)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Käuferinformationen
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

          <div className="space-y-6">
            {/* Name */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Name</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {buyer.firstName && (
                  <div>
                    <span className="text-xs text-gray-500">Vorname:</span>
                    <div className="text-gray-900 font-medium">{buyer.firstName}</div>
                  </div>
                )}
                {buyer.lastName && (
                  <div>
                    <span className="text-xs text-gray-500">Nachname:</span>
                    <div className="text-gray-900 font-medium">{buyer.lastName}</div>
                  </div>
                )}
                {!buyer.firstName && !buyer.lastName && buyer.name && (
                  <div>
                    <span className="text-xs text-gray-500">Name:</span>
                    <div className="text-gray-900 font-medium">{buyer.name}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Kontakt */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Kontakt</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {buyer.email && (
                  <div>
                    <span className="text-xs text-gray-500">E-Mail:</span>
                    <div className="text-gray-900 font-medium">{buyer.email}</div>
                  </div>
                )}
                {buyer.phone && (
                  <div>
                    <span className="text-xs text-gray-500">Telefonnummer:</span>
                    <div className="text-gray-900 font-medium">{buyer.phone}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Adresse */}
            {(buyer.street || buyer.streetNumber || buyer.postalCode || buyer.city) && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Adresse</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {(buyer.street || buyer.streetNumber) && (
                    <div>
                      <span className="text-xs text-gray-500">Strasse:</span>
                      <div className="text-gray-900 font-medium">
                        {buyer.street || ''} {buyer.streetNumber || ''}
                      </div>
                    </div>
                  )}
                  {(buyer.postalCode || buyer.city) && (
                    <div>
                      <span className="text-xs text-gray-500">PLZ & Ortschaft:</span>
                      <div className="text-gray-900 font-medium">
                        {buyer.postalCode || ''} {buyer.city || ''}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Zahlungsmethoden */}
            {paymentMethods.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Akzeptierte Zahlungsmethoden</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {paymentMethods.map((method, index) => (
                    <div key={index} className="border-b border-gray-200 last:border-0 pb-3 last:pb-0">
                      {method.type === 'twint' && (
                        <div>
                          <div className="font-medium text-gray-900 mb-1">TWINT</div>
                          {method.phone && (
                            <div className="text-sm text-gray-600">Telefon: {method.phone}</div>
                          )}
                        </div>
                      )}
                      {method.type === 'bank' && (
                        <div>
                          <div className="font-medium text-gray-900 mb-1">Banküberweisung</div>
                          {method.iban && (
                            <div className="text-sm text-gray-600">IBAN: {method.iban}</div>
                          )}
                          {(method.accountHolderFirstName || method.accountHolderLastName) && (
                            <div className="text-sm text-gray-600">
                              Kontoinhaber: {method.accountHolderFirstName || ''} {method.accountHolderLastName || ''}
                            </div>
                          )}
                          {method.bank && (
                            <div className="text-sm text-gray-600">Bank: {method.bank}</div>
                          )}
                        </div>
                      )}
                      {method.type === 'creditcard' && (
                        <div>
                          <div className="font-medium text-gray-900 mb-1">Kreditkarte</div>
                          {method.cardNumber && (
                            <div className="text-sm text-gray-600">Kartennummer: {method.cardNumber}</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {paymentMethods.length === 0 && (
              <div className="text-sm text-gray-500 italic">
                Keine Zahlungsmethoden hinterlegt
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
          <div className="space-y-3">
            {isPaid ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <p className="text-sm font-semibold text-green-700">✓ Als bezahlt markiert</p>
              </div>
            ) : purchaseId && onMarkPaid ? (
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



