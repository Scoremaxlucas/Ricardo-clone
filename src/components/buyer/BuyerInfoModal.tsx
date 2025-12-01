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

export function BuyerInfoModal({
  buyer,
  watchTitle,
  purchaseId,
  isPaid,
  isOpen,
  onClose,
  onMarkPaid,
}: BuyerInfoModalProps) {
  // WICHTIG: Verkäufer können keine Zahlungen als bezahlt markieren
  // Nur der Käufer kann bestätigen, dass er bezahlt hat
  // Die handleMarkPaid Funktion wurde entfernt, da sie ein Sicherheitsrisiko darstellt

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">Käuferinformationen</h2>
          <button onClick={onClose} className="text-gray-400 transition-colors hover:text-gray-600">
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
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Name</h3>
              <div className="space-y-2 rounded-lg bg-gray-50 p-4">
                {buyer.firstName && (
                  <div>
                    <span className="text-xs text-gray-500">Vorname:</span>
                    <div className="font-medium text-gray-900">{buyer.firstName}</div>
                  </div>
                )}
                {buyer.lastName && (
                  <div>
                    <span className="text-xs text-gray-500">Nachname:</span>
                    <div className="font-medium text-gray-900">{buyer.lastName}</div>
                  </div>
                )}
                {!buyer.firstName && !buyer.lastName && buyer.name && (
                  <div>
                    <span className="text-xs text-gray-500">Name:</span>
                    <div className="font-medium text-gray-900">{buyer.name}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Kontakt */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Kontakt</h3>
              <div className="space-y-2 rounded-lg bg-gray-50 p-4">
                {buyer.email && (
                  <div>
                    <span className="text-xs text-gray-500">E-Mail:</span>
                    <div className="font-medium text-gray-900">{buyer.email}</div>
                  </div>
                )}
                {buyer.phone && (
                  <div>
                    <span className="text-xs text-gray-500">Telefonnummer:</span>
                    <div className="font-medium text-gray-900">{buyer.phone}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Adresse */}
            {(buyer.street || buyer.streetNumber || buyer.postalCode || buyer.city) && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-700">Adresse</h3>
                <div className="space-y-2 rounded-lg bg-gray-50 p-4">
                  {(buyer.street || buyer.streetNumber) && (
                    <div>
                      <span className="text-xs text-gray-500">Strasse:</span>
                      <div className="font-medium text-gray-900">
                        {buyer.street || ''} {buyer.streetNumber || ''}
                      </div>
                    </div>
                  )}
                  {(buyer.postalCode || buyer.city) && (
                    <div>
                      <span className="text-xs text-gray-500">PLZ & Ortschaft:</span>
                      <div className="font-medium text-gray-900">
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
                <h3 className="mb-3 text-sm font-semibold text-gray-700">
                  Akzeptierte Zahlungsmethoden
                </h3>
                <div className="space-y-3 rounded-lg bg-gray-50 p-4">
                  {paymentMethods.map((method, index) => (
                    <div
                      key={index}
                      className="border-b border-gray-200 pb-3 last:border-0 last:pb-0"
                    >
                      {method.type === 'twint' && (
                        <div>
                          <div className="mb-1 font-medium text-gray-900">TWINT</div>
                          {method.phone && (
                            <div className="text-sm text-gray-600">Telefon: {method.phone}</div>
                          )}
                        </div>
                      )}
                      {method.type === 'bank' && (
                        <div>
                          <div className="mb-1 font-medium text-gray-900">Banküberweisung</div>
                          {method.iban && (
                            <div className="text-sm text-gray-600">IBAN: {method.iban}</div>
                          )}
                          {(method.accountHolderFirstName || method.accountHolderLastName) && (
                            <div className="text-sm text-gray-600">
                              Kontoinhaber: {method.accountHolderFirstName || ''}{' '}
                              {method.accountHolderLastName || ''}
                            </div>
                          )}
                          {method.bank && (
                            <div className="text-sm text-gray-600">Bank: {method.bank}</div>
                          )}
                        </div>
                      )}
                      {method.type === 'creditcard' && (
                        <div>
                          <div className="mb-1 font-medium text-gray-900">Kreditkarte</div>
                          {method.cardNumber && (
                            <div className="text-sm text-gray-600">
                              Kartennummer: {method.cardNumber}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {paymentMethods.length === 0 && (
              <div className="text-sm italic text-gray-500">Keine Zahlungsmethoden hinterlegt</div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="space-y-3">
            {/* Status-Anzeige wenn bereits bezahlt */}
            {isPaid && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
                <p className="text-sm font-semibold text-green-700">✓ Als bezahlt markiert</p>
              </div>
            )}
            {/* WICHTIG: Verkäufer können keine Zahlungen als bezahlt markieren - nur der Käufer kann das bestätigen */}
            {/* Der "Als bezahlt markieren" Button wurde entfernt, da dies ein Sicherheitsrisiko darstellt */}
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
