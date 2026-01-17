'use client'

import { useState } from 'react'
import { X, CheckCircle, Mail, Phone, MapPin, CreditCard, User, Copy, Check, ShoppingBag } from 'lucide-react'
import { toast } from 'react-hot-toast'

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
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    toast.success('Kopiert!')
    setTimeout(() => setCopiedField(null), 2000)
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

  const buyerFullName = buyer.firstName && buyer.lastName
    ? `${buyer.firstName} ${buyer.lastName}`
    : buyer.name || 'Käufer'

  const buyerFullAddress = buyer.street || buyer.city
    ? `${buyer.street || ''} ${buyer.streetNumber || ''}, ${buyer.postalCode || ''} ${buyer.city || ''}`.trim()
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-gray-100 bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Käuferinformationen</h2>
              <p className="mt-1 text-sm text-white/80">{watchTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full bg-white/20 p-2 text-white transition-colors hover:bg-white/30"
              aria-label="Schliessen"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Success Banner */}
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 p-4 ring-1 ring-amber-200/50">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-500">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-amber-800">Käuferdaten verfügbar</p>
              <p className="text-sm text-amber-600">
                Als Verkäufer haben Sie Zugriff auf die vollständigen Käuferdaten für den Versand.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Name Card */}
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Name</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">{buyerFullName}</span>
                <button
                  onClick={() => copyToClipboard(buyerFullName, 'name')}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                  title="Kopieren"
                >
                  {copiedField === 'name' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Contact Cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Email */}
              {buyer.email && (
                <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">E-Mail</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <a
                      href={`mailto:${buyer.email}`}
                      className="truncate font-medium text-primary-600 hover:text-primary-700 hover:underline"
                    >
                      {buyer.email}
                    </a>
                    <button
                      onClick={() => copyToClipboard(buyer.email!, 'email')}
                      className="flex-shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                      title="Kopieren"
                    >
                      {copiedField === 'email' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Phone */}
              {buyer.phone && (
                <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Telefon</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <a
                      href={`tel:${buyer.phone}`}
                      className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
                    >
                      {buyer.phone}
                    </a>
                    <button
                      onClick={() => copyToClipboard(buyer.phone!, 'phone')}
                      className="flex-shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                      title="Kopieren"
                    >
                      {copiedField === 'phone' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Address Card */}
            {buyerFullAddress && (
              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Lieferadresse</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {(buyer.street || buyer.streetNumber) && (
                      <p className="font-medium text-gray-900">
                        {buyer.street} {buyer.streetNumber}
                      </p>
                    )}
                    {(buyer.postalCode || buyer.city) && (
                      <p className="text-gray-600">
                        {buyer.postalCode} {buyer.city}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => copyToClipboard(buyerFullAddress, 'address')}
                    className="flex-shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                    title="Kopieren"
                  >
                    {copiedField === 'address' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Payment Methods Card */}
            {paymentMethods.length > 0 && (
              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Zahlungsmethoden des Käufers
                  </span>
                </div>
                <div className="space-y-3">
                  {paymentMethods.map((method, index) => (
                    <div
                      key={index}
                      className="rounded-lg bg-white p-3 ring-1 ring-gray-200"
                    >
                      {method.type === 'twint' && (
                        <div>
                          <div className="mb-1 flex items-center gap-2">
                            <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">TWINT</span>
                          </div>
                          {method.phone && (
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-sm text-gray-600">{method.phone}</span>
                              <button
                                onClick={() => copyToClipboard(method.phone, `twint-${index}`)}
                                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                              >
                                {copiedField === `twint-${index}` ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      {method.type === 'bank' && (
                        <div>
                          <div className="mb-2 flex items-center gap-2">
                            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">Bank</span>
                          </div>
                          {method.iban && (
                            <div className="flex items-center justify-between rounded bg-gray-50 p-2">
                              <span className="font-mono text-sm text-gray-700">{method.iban}</span>
                              <button
                                onClick={() => copyToClipboard(method.iban, `iban-${index}`)}
                                className="ml-2 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                              >
                                {copiedField === `iban-${index}` ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                              </button>
                            </div>
                          )}
                          {(method.accountHolderFirstName || method.accountHolderLastName) && (
                            <p className="mt-2 text-sm text-gray-600">
                              Kontoinhaber: {method.accountHolderFirstName} {method.accountHolderLastName}
                            </p>
                          )}
                          {method.bank && (
                            <p className="text-sm text-gray-500">{method.bank}</p>
                          )}
                        </div>
                      )}
                      {method.type === 'creditcard' && (
                        <div>
                          <div className="mb-1 flex items-center gap-2">
                            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">Kreditkarte</span>
                          </div>
                          {method.cardNumber && (
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-sm text-gray-600">{method.cardNumber}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Status */}
            {isPaid && (
              <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 p-4 ring-1 ring-emerald-200/50">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-800">Zahlung bestätigt</p>
                  <p className="text-sm text-emerald-600">
                    Die Zahlung für diesen Artikel wurde als erhalten markiert.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-gray-200 px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-300"
          >
            Schliessen
          </button>
        </div>
      </div>
    </div>
  )
}
