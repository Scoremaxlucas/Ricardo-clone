'use client'

import { useState, useEffect } from 'react'
import { X, Shield, Loader2, CreditCard } from 'lucide-react'

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
  stripeConnectedAccountId?: string | null
  stripeOnboardingComplete?: boolean
}

interface SellerInfoModalProps {
  sellerId: string
  watchTitle: string
  purchaseId?: string
  isPaid?: boolean
  isOpen: boolean
  onClose: () => void
  onMarkPaid?: () => void
  // NEW: Payment protection props
  paymentProtectionEnabled?: boolean
  onPayViaStripe?: () => void
  isProcessingStripePayment?: boolean
}

export function SellerInfoModal({
  sellerId,
  watchTitle,
  purchaseId,
  isPaid,
  isOpen,
  onClose,
  onMarkPaid,
  paymentProtectionEnabled,
  onPayViaStripe,
  isProcessingStripePayment,
}: SellerInfoModalProps) {
  const [sellerInfo, setSellerInfo] = useState<SellerInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [isMarkingPaid, setIsMarkingPaid] = useState(false)

  const handleMarkPaid = async () => {
    if (!purchaseId || !onMarkPaid) return

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">Verkäuferinformationen</h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
            aria-label="Schliessen"
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
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
            </div>
          ) : sellerInfo ? (
            <div className="space-y-6">
              {/* Name */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-700">Name</h3>
                <div className="space-y-2 rounded-lg bg-gray-50 p-4">
                  {sellerInfo.firstName && (
                    <div>
                      <span className="text-xs text-gray-500">Vorname:</span>
                      <div className="font-medium text-gray-900">{sellerInfo.firstName}</div>
                    </div>
                  )}
                  {sellerInfo.lastName && (
                    <div>
                      <span className="text-xs text-gray-500">Nachname:</span>
                      <div className="font-medium text-gray-900">{sellerInfo.lastName}</div>
                    </div>
                  )}
                  {!sellerInfo.firstName && !sellerInfo.lastName && sellerInfo.name && (
                    <div>
                      <span className="text-xs text-gray-500">Name:</span>
                      <div className="font-medium text-gray-900">{sellerInfo.name}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Kontakt */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-700">Kontakt</h3>
                <div className="space-y-2 rounded-lg bg-gray-50 p-4">
                  {sellerInfo.email && (
                    <div>
                      <span className="text-xs text-gray-500">E-Mail:</span>
                      <div className="font-medium text-gray-900">{sellerInfo.email}</div>
                    </div>
                  )}
                  {sellerInfo.phone && (
                    <div>
                      <span className="text-xs text-gray-500">Telefonnummer:</span>
                      <div className="font-medium text-gray-900">{sellerInfo.phone}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Adresse */}
              {(sellerInfo.street ||
                sellerInfo.streetNumber ||
                sellerInfo.postalCode ||
                sellerInfo.city) && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-700">Adresse</h3>
                  <div className="space-y-2 rounded-lg bg-gray-50 p-4">
                    {(sellerInfo.street || sellerInfo.streetNumber) && (
                      <div>
                        <span className="text-xs text-gray-500">Strasse:</span>
                        <div className="font-medium text-gray-900">
                          {sellerInfo.street || ''} {sellerInfo.streetNumber || ''}
                        </div>
                      </div>
                    )}
                    {(sellerInfo.postalCode || sellerInfo.city) && (
                      <div>
                        <span className="text-xs text-gray-500">PLZ & Ortschaft:</span>
                        <div className="font-medium text-gray-900">
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

              {paymentMethods.length === 0 && !paymentProtectionEnabled && (
                <div className="text-sm italic text-gray-500">
                  Keine Zahlungsmethoden hinterlegt
                </div>
              )}

              {/* Helvenda Zahlungsschutz - Stripe Payment Option */}
              {paymentProtectionEnabled &&
                sellerInfo?.stripeConnectedAccountId &&
                sellerInfo?.stripeOnboardingComplete &&
                onPayViaStripe && (
                  <div className="mt-6 rounded-lg border-2 border-green-200 bg-green-50 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-green-800">Helvenda Zahlungsschutz</h3>
                    </div>
                    <p className="mb-4 text-sm text-green-700">
                      Bei diesem Artikel ist der Helvenda Zahlungsschutz aktiviert. Bezahlen Sie
                      sicher über unsere Plattform - Ihr Geld wird erst nach Erhalt und Prüfung der
                      Ware an den Verkäufer freigegeben.
                    </p>
                    <button
                      onClick={() => {
                        onPayViaStripe()
                        onClose()
                      }}
                      disabled={isProcessingStripePayment}
                      className="flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-3 font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                    >
                      {isProcessingStripePayment ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Wird vorbereitet...
                        </>
                      ) : (
                        <>
                          <Shield className="h-5 w-5" />
                          Sicher bezahlen
                        </>
                      )}
                    </button>
                  </div>
                )}

              {/* Info wenn Zahlungsschutz aktiviert aber Verkäufer nicht onboarded */}
              {paymentProtectionEnabled &&
                (!sellerInfo?.stripeConnectedAccountId ||
                  !sellerInfo?.stripeOnboardingComplete) && (
                  <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-yellow-600" />
                      <h3 className="font-semibold text-yellow-800">Zahlungsschutz ausstehend</h3>
                    </div>
                    <p className="text-sm text-yellow-700">
                      Der Verkäufer hat den Helvenda Zahlungsschutz für diesen Artikel aktiviert,
                      aber die Auszahlungseinrichtung noch nicht abgeschlossen. Bitte nutzen Sie
                      vorerst die oben angezeigten Zahlungsmethoden oder kontaktieren Sie den
                      Verkäufer.
                    </p>
                  </div>
                )}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              Fehler beim Laden der Verkäuferinformationen
            </div>
          )}
        </div>

        <div className="sticky bottom-0 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-md bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300"
          >
            Schliessen
          </button>
        </div>
      </div>
    </div>
  )
}
