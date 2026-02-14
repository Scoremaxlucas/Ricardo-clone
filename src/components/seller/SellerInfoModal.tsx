'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { X, Shield, Loader2, CheckCircle, Mail, Phone, MapPin, CreditCard, User, Copy, Check } from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

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
  const { t } = useLanguage()
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
        alert(t.modals.sellerInfo.errorMarkingPaid + ': ' + (errorData.message || 'Unbekannter Fehler'))
      }
    } catch (error) {
      console.error('Error marking as paid:', error)
        alert(t.modals.sellerInfo.errorMarkingPaid)
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

  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    toast.success(t.modals.copied)
    setTimeout(() => setCopiedField(null), 2000)
  }

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

  const sellerFullName = sellerInfo?.firstName && sellerInfo?.lastName
    ? `${sellerInfo.firstName} ${sellerInfo.lastName}`
    : sellerInfo?.name || t.modals.sellerInfo.seller

  const sellerFullAddress = sellerInfo?.street || sellerInfo?.city
    ? `${sellerInfo.street || ''} ${sellerInfo.streetNumber || ''}, ${sellerInfo.postalCode || ''} ${sellerInfo.city || ''}`.trim()
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-gray-100 bg-gradient-to-r from-primary-600 to-teal-500 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">{t.modals.sellerInfo.title}</h2>
              <p className="mt-1 text-sm text-white/80">{watchTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full bg-white/20 p-2 text-white transition-colors hover:bg-white/30"
              aria-label={t.modals.close}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Success Banner */}
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 p-4 ring-1 ring-emerald-200/50">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-emerald-800">{t.modals.sellerInfo.contactDataUnlocked}</p>
              <p className="text-sm text-emerald-600">
                {t.modals.sellerInfo.contactDataUnlockedDesc}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : sellerInfo ? (
            <div className="space-y-4">
              {/* Name Card */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t.modals.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">{sellerFullName}</span>
                  <button
                    onClick={() => copyToClipboard(sellerFullName, 'name')}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                    title={t.modals.copy}
                  >
                    {copiedField === 'name' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Contact Cards */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Email */}
                {sellerInfo.email && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t.modals.email}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <a
                        href={`mailto:${sellerInfo.email}`}
                        className="truncate font-medium text-primary-600 hover:text-primary-700 hover:underline"
                      >
                        {sellerInfo.email}
                      </a>
                      <button
                        onClick={() => copyToClipboard(sellerInfo.email!, 'email')}
                        className="flex-shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                        title={t.modals.copy}
                      >
                        {copiedField === 'email' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Phone */}
                {sellerInfo.phone && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t.modals.phone}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <a
                        href={`tel:${sellerInfo.phone}`}
                        className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
                      >
                        {sellerInfo.phone}
                      </a>
                      <button
                        onClick={() => copyToClipboard(sellerInfo.phone!, 'phone')}
                        className="flex-shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                        title={t.modals.copy}
                      >
                        {copiedField === 'phone' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Address Card */}
              {sellerFullAddress && (
                <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t.modals.address}</span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {(sellerInfo.street || sellerInfo.streetNumber) && (
                        <p className="font-medium text-gray-900">
                          {sellerInfo.street} {sellerInfo.streetNumber}
                        </p>
                      )}
                      {(sellerInfo.postalCode || sellerInfo.city) && (
                        <p className="text-gray-600">
                          {sellerInfo.postalCode} {sellerInfo.city}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => copyToClipboard(sellerFullAddress, 'address')}
                      className="flex-shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                      title={t.modals.copy}
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
                      {t.modals.sellerInfo.paymentMethods}
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
                              <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">{t.modals.twint}</span>
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
                              <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">{t.modals.bank}</span>
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
                                {t.modals.accountHolder}: {method.accountHolderFirstName} {method.accountHolderLastName}
                              </p>
                            )}
                            {method.bank && (
                              <p className="text-sm text-gray-500">{method.bank}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Helvenda Zahlungsschutz - Stripe Payment Option */}
              {paymentProtectionEnabled && onPayViaStripe && (
                <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500">
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-emerald-800">{t.modals.sellerInfo.paymentProtection}</h3>
                  </div>
                  <p className="mb-4 text-sm text-emerald-700">
                    {t.modals.sellerInfo.paymentProtectionDesc}
                  </p>
                  <button
                    onClick={() => {
                      onPayViaStripe()
                      onClose()
                    }}
                    disabled={isProcessingStripePayment}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-50"
                  >
                    {isProcessingStripePayment ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {t.modals.sellerInfo.preparing}
                      </>
                    ) : (
                      <>
                        <Shield className="h-5 w-5" />
                        {t.modals.sellerInfo.paySecurely}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              {t.modals.sellerInfo.errorLoading}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-gray-200 px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-300"
          >
            {t.modals.close}
          </button>
        </div>
      </div>
    </div>
  )
}
