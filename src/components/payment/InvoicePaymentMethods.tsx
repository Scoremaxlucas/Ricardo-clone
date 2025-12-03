'use client'

import { useState, useEffect } from 'react'
import {
  CreditCard,
  Building2,
  Smartphone,
  Copy,
  CheckCircle,
  QrCode,
  Loader2,
  AlertCircle,
  Wallet,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { InvoicePaymentForm } from './InvoicePaymentForm'
import { TwintPaymentForm } from './TwintPaymentForm'
import { PayPalPaymentForm } from './PayPalPaymentForm'
import { loadStripe } from '@stripe/stripe-js'

// Stripe nur initialisieren, wenn der Key vorhanden ist
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = stripeKey && stripeKey.trim() !== '' ? loadStripe(stripeKey) : null

interface InvoicePaymentInfo {
  invoiceNumber: string
  amount: number
  currency: string
  reference: string
  iban: string
  bic: string
  accountHolder: string
  qrCodeDataUrl?: string
  qrCodeString?: string
  twintPhone?: string | null
  twintQRCodeDataUrl?: string | null
  twintDeepLink?: string | null
  paymentInstructions: string
}

interface InvoicePaymentMethodsProps {
  invoiceId: string
  invoiceNumber: string
  amount: number
  onPaymentSuccess?: () => void
}

type PaymentMethod = 'bank' | 'card_or_twint' | 'paypal'

export function InvoicePaymentMethods({
  invoiceId,
  invoiceNumber,
  amount,
  onPaymentSuccess,
}: InvoicePaymentMethodsProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [paymentInfo, setPaymentInfo] = useState<InvoicePaymentInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [showQR, setShowQR] = useState(false)

  useEffect(() => {
    const loadPaymentInfo = async () => {
      try {
        const res = await fetch(`/api/invoices/${invoiceId}/payment-info`)
        if (res.ok) {
          const data = await res.json()
          setPaymentInfo(data.paymentInfo)
        }
      } catch (error) {
        console.error('Error loading payment info:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPaymentInfo()
  }, [invoiceId])

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      toast.success(`${label} kopiert!`)
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      toast.error('Fehler beim Kopieren')
    }
  }

  const formatIban = (iban: string) => {
    return iban.replace(/(.{4})/g, '$1 ').trim()
  }

  if (loading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Lade Zahlungsmethoden...</span>
        </div>
      </div>
    )
  }

  if (!paymentInfo) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
          <div className="text-sm text-yellow-800">Fehler beim Laden der Zahlungsinformationen</div>
        </div>
      </div>
    )
  }

  // Prüfe ob es eine Credit Note ist (keine IBAN = Credit Note)
  const isCreditNote = !paymentInfo.iban || paymentInfo.invoiceNumber.startsWith('KORR-')

  // Bei Credit Notes: Zeige Hinweis statt Zahlungsmethoden
  if (isCreditNote) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="rounded-lg border border-green-200 bg-green-50 p-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-green-600" />
            <div className="flex-1">
              <h3 className="mb-2 text-lg font-semibold text-green-900">
                Korrektur-Abrechnung / Gutschrift
              </h3>
              <p className="mb-3 text-sm text-green-800">
                Diese Korrektur-Abrechnung stellt eine Gutschrift dar. Es ist keine Zahlung
                erforderlich.
              </p>
              <div className="rounded-lg border border-green-200 bg-white p-4">
                <div className="whitespace-pre-line text-sm text-gray-700">
                  {paymentInfo.paymentInstructions ||
                    `Korrektur-Abrechnung ${paymentInfo.invoiceNumber}\n\nDer Betrag wird automatisch gutgeschrieben oder mit einer offenen Rechnung verrechnet.`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Zahlungsmethoden-Auswahl */}
      {!selectedMethod && (
        <div className="rounded-lg bg-white p-4 shadow-md sm:p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Zahlungsmethode wählen</h3>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Kreditkarte / TWINT - kombiniert - Prominent auf Mobile */}
            <button
              onClick={() => setSelectedMethod('card_or_twint')}
              className="order-1 rounded-lg border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-green-50 p-5 text-left transition-all hover:border-purple-500 hover:shadow-md sm:p-6"
            >
              <div className="mb-3 flex items-center gap-2">
                <CreditCard className="h-8 w-8 text-purple-600 sm:h-10 sm:w-10" />
                <Smartphone className="h-7 w-7 text-green-600 sm:h-8 sm:w-8" />
              </div>
              <h4 className="mb-1 text-base font-bold text-gray-900 sm:text-lg">
                Kreditkarte / TWINT
              </h4>
              <p className="text-sm font-medium text-green-700 sm:text-base">Sofortige Zahlung</p>
              <div className="mt-2 flex items-center gap-1 text-xs text-green-600 sm:text-sm">
                <Smartphone className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>TWINT verfügbar</span>
              </div>
            </button>

            {/* Banküberweisung */}
            <button
              onClick={() => setSelectedMethod('bank')}
              className="order-2 rounded-lg border-2 border-gray-200 p-5 text-left transition-all hover:border-blue-500 hover:bg-blue-50 sm:p-6"
            >
              <Building2 className="mb-3 h-8 w-8 text-blue-600 sm:h-10 sm:w-10" />
              <h4 className="mb-1 text-base font-semibold text-gray-900 sm:text-lg">Banküberweisung</h4>
              <p className="text-sm text-gray-600 sm:text-base">Mit QR-Code oder manuell</p>
            </button>

            {/* PayPal */}
            {process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && (
              <button
                onClick={() => setSelectedMethod('paypal')}
                className="order-3 rounded-lg border-2 border-gray-200 p-5 text-left transition-all hover:border-blue-500 hover:bg-blue-50 sm:p-6"
              >
                <Wallet className="mb-3 h-8 w-8 text-blue-600 sm:h-10 sm:w-10" />
                <h4 className="mb-1 text-base font-semibold text-gray-900 sm:text-lg">PayPal</h4>
                <p className="text-sm text-gray-600 sm:text-base">Schnell und sicher</p>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Banküberweisung */}
      {selectedMethod === 'bank' && (
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Building2 className="h-5 w-5 text-blue-600" />
              Banküberweisung
            </h3>
            <button
              onClick={() => setSelectedMethod(null)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Zurück
            </button>
          </div>

          <div className="space-y-4">
            {/* Betrag */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="mb-1 text-sm text-gray-600">Zu zahlender Betrag</div>
              <div className="text-2xl font-bold text-blue-700">
                {paymentInfo.currency} {paymentInfo.amount.toFixed(2)}
              </div>
            </div>

            {/* Bankverbindung */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Empfänger</label>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-gray-900">{paymentInfo.accountHolder}</span>
                  <button
                    onClick={() => copyToClipboard(paymentInfo.accountHolder, 'Empfänger')}
                    className="rounded p-1 hover:bg-gray-100"
                  >
                    {copied === 'Empfänger' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">IBAN</label>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-gray-900">{formatIban(paymentInfo.iban)}</span>
                  <button
                    onClick={() => copyToClipboard(paymentInfo.iban.replace(/\s/g, ''), 'IBAN')}
                    className="rounded p-1 hover:bg-gray-100"
                  >
                    {copied === 'IBAN' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">BIC</label>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-gray-900">{paymentInfo.bic}</span>
                  <button
                    onClick={() => copyToClipboard(paymentInfo.bic, 'BIC')}
                    className="rounded p-1 hover:bg-gray-100"
                  >
                    {copied === 'BIC' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Referenz</label>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-gray-900">{paymentInfo.reference}</span>
                  <button
                    onClick={() => copyToClipboard(paymentInfo.reference, 'Referenz')}
                    className="rounded p-1 hover:bg-gray-100"
                  >
                    {copied === 'Referenz' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Bitte verwenden Sie diese Referenz bei der Überweisung
                </p>
              </div>
            </div>

            {/* QR-Code */}
            {paymentInfo.qrCodeDataUrl && (
              <div>
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  <QrCode className="h-4 w-4" />
                  {showQR ? 'QR-Code ausblenden' : 'QR-Code anzeigen'}
                </button>
                {showQR && (
                  <div className="flex justify-center rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <img
                      src={paymentInfo.qrCodeDataUrl}
                      alt="QR-Code für Zahlung"
                      className="h-48 w-48"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Zahlungsanweisung */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="whitespace-pre-line text-sm text-gray-700">
                {paymentInfo.paymentInstructions}
              </div>
            </div>

            {/* Hinweis */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                <div className="text-sm text-blue-800">
                  <strong>Wichtig:</strong> Bitte überweisen Sie den Betrag bis zum
                  Fälligkeitsdatum. Verwenden Sie die Referenz bei der Überweisung, damit die
                  Zahlung zugeordnet werden kann.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kreditkarte / TWINT - kombiniert */}
      {selectedMethod === 'card_or_twint' && (
        <div className="rounded-lg bg-white p-4 shadow-md sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex flex-col gap-1 text-base font-semibold text-gray-900 sm:flex-row sm:items-center sm:gap-2 sm:text-lg">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-600 sm:h-6 sm:w-6" />
                <span className="hidden text-gray-400 sm:inline">/</span>
                <Smartphone className="h-5 w-5 text-green-600 sm:h-6 sm:w-6" />
              </div>
              <span className="sm:ml-0">Kreditkarte / TWINT</span>
            </h3>
            <button
              onClick={() => setSelectedMethod(null)}
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Zurück
            </button>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* Betrag */}
            <div className="rounded-lg border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-green-50 p-4">
              <div className="mb-1 text-sm font-medium text-gray-600">Zu zahlender Betrag</div>
              <div className="text-2xl font-bold text-purple-700 sm:text-3xl">
                {paymentInfo.currency} {paymentInfo.amount.toFixed(2)}
              </div>
            </div>

            {/* Kreditkarte / TWINT - Einheitliches Formular */}
            <div className="border-t border-gray-200 pt-4 sm:pt-6">
              <h4 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900 sm:text-lg">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                  <span className="text-gray-400">/</span>
                  <Smartphone className="h-5 w-5 text-green-600" />
                </div>
                <span>Kreditkarte / TWINT</span>
              </h4>
              <InvoicePaymentForm
                invoiceId={invoiceId}
                invoiceNumber={invoiceNumber}
                amount={amount}
                onSuccess={onPaymentSuccess}
              />
            </div>
          </div>
        </div>
      )}

      {/* PayPal */}
      {selectedMethod === 'paypal' && process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && (
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Wallet className="h-5 w-5 text-blue-600" />
              PayPal-Zahlung
            </h3>
            <button
              onClick={() => setSelectedMethod(null)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Zurück
            </button>
          </div>

          <div className="space-y-4">
            {/* Betrag */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="mb-1 text-sm text-gray-600">Zu zahlender Betrag</div>
              <div className="text-2xl font-bold text-blue-700">
                {paymentInfo.currency} {paymentInfo.amount.toFixed(2)}
              </div>
            </div>

            {/* PayPal Button */}
            <PayPalPaymentForm
              invoiceId={invoiceId}
              invoiceNumber={invoiceNumber}
              amount={paymentInfo.amount}
              onSuccess={onPaymentSuccess}
            />
          </div>
        </div>
      )}
    </div>
  )
}
