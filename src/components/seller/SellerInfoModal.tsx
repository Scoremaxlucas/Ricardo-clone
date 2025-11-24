'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface SellerInfo {
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

interface SellerInfoModalProps {
  sellerId: string
  watchTitle: string
  purchaseId?: string
  isPaid?: boolean
  isOpen: boolean
  onClose: () => void
  onMarkPaid?: () => void
}

export function SellerInfoModal({ sellerId, watchTitle, purchaseId, isPaid, isOpen, onClose, onMarkPaid }: SellerInfoModalProps) {
  const [sellerInfo, setSellerInfo] = useState<SellerInfo | null>(null)
  const [loading, setLoading] = useState(false)
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

  useEffect(() => {
    if (isOpen && sellerId) {
      setLoading(true)
      fetch(`/api/user/seller-info?userId=${sellerId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setSellerInfo(data.seller)
          }
        })
        .catch(error => {
          console.error('Error loading seller info:', error)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [isOpen, sellerId])

  if (!isOpen) return null

  // Parse payment methods
  let paymentMethods: any[] = []
  if (sellerInfo?.paymentMethods) {
    try {
      paymentMethods = JSON.parse(sellerInfo.paymentMethods)
    } catch (e) {
      console.error('Error parsing payment methods:', e)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Verkäuferinformationen
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

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : sellerInfo ? (
            <div className="space-y-6">
              {/* Name */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Name</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {sellerInfo.firstName && (
                    <div>
                      <span className="text-xs text-gray-500">Vorname:</span>
                      <div className="text-gray-900 font-medium">{sellerInfo.firstName}</div>
                    </div>
                  )}
                  {sellerInfo.lastName && (
                    <div>
                      <span className="text-xs text-gray-500">Nachname:</span>
                      <div className="text-gray-900 font-medium">{sellerInfo.lastName}</div>
                    </div>
                  )}
                  {!sellerInfo.firstName && !sellerInfo.lastName && sellerInfo.name && (
                    <div>
                      <span className="text-xs text-gray-500">Name:</span>
                      <div className="text-gray-900 font-medium">{sellerInfo.name}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Kontakt */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Kontakt</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {sellerInfo.email && (
                    <div>
                      <span className="text-xs text-gray-500">E-Mail:</span>
                      <div className="text-gray-900 font-medium">{sellerInfo.email}</div>
                    </div>
                  )}
                  {sellerInfo.phone && (
                    <div>
                      <span className="text-xs text-gray-500">Telefonnummer:</span>
                      <div className="text-gray-900 font-medium">{sellerInfo.phone}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Adresse */}
              {(sellerInfo.street || sellerInfo.streetNumber || sellerInfo.postalCode || sellerInfo.city) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Adresse</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {(sellerInfo.street || sellerInfo.streetNumber) && (
                      <div>
                        <span className="text-xs text-gray-500">Strasse:</span>
                        <div className="text-gray-900 font-medium">
                          {sellerInfo.street || ''} {sellerInfo.streetNumber || ''}
                        </div>
                      </div>
                    )}
                    {(sellerInfo.postalCode || sellerInfo.city) && (
                      <div>
                        <span className="text-xs text-gray-500">PLZ & Ortschaft:</span>
                        <div className="text-gray-900 font-medium">
                          {sellerInfo.postalCode || ''} {sellerInfo.city || ''}
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
          ) : (
            <div className="text-center py-12 text-gray-500">
              Fehler beim Laden der Verkäuferinformationen
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Schliessen
          </button>
        </div>
      </div>
    </div>
  )
}



