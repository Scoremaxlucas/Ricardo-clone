'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Building2, Smartphone, Copy, CheckCircle, QrCode, Loader2, AlertCircle, Wallet } from 'lucide-react'
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

export function InvoicePaymentMethods({ invoiceId, invoiceNumber, amount, onPaymentSuccess }: InvoicePaymentMethodsProps) {
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
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Lade Zahlungsmethoden...</span>
              </div>
            </div>
          )
        }

        if (!paymentInfo) {
          return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  Fehler beim Laden der Zahlungsinformationen
                </div>
              </div>
            </div>
          )
        }

        // Prüfe ob es eine Credit Note ist (keine IBAN = Credit Note)
        const isCreditNote = !paymentInfo.iban || paymentInfo.invoiceNumber.startsWith('KORR-')

        // Bei Credit Notes: Zeige Hinweis statt Zahlungsmethoden
        if (isCreditNote) {
          return (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-green-900 mb-2">
                      Korrektur-Abrechnung / Gutschrift
                    </h3>
                    <p className="text-sm text-green-800 mb-3">
                      Diese Korrektur-Abrechnung stellt eine Gutschrift dar. Es ist keine Zahlung erforderlich.
                    </p>
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="text-sm text-gray-700 whitespace-pre-line">
                        {paymentInfo.paymentInstructions || `Korrektur-Abrechnung ${paymentInfo.invoiceNumber}\n\nDer Betrag wird automatisch gutgeschrieben oder mit einer offenen Rechnung verrechnet.`}
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
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Zahlungsmethode wählen
          </h3>
          <div className={`grid grid-cols-1 gap-4 ${
            // Berechne Anzahl der verfügbaren Zahlungsmethoden
            // Banküberweisung (1), Kreditkarte/TWINT kombiniert (1), PayPal (optional)
            (process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? 1 : 0) + 
            2 // Banküberweisung + Kreditkarte/TWINT sind immer verfügbar
          } > 2 ? 'md:grid-cols-2 lg:grid-cols-3' : 
            (process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) ? 'md:grid-cols-2' : 
            'md:grid-cols-1'
          }`}>
            {/* Banküberweisung */}
            <button
              onClick={() => setSelectedMethod('bank')}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
            >
              <Building2 className="h-8 w-8 text-blue-600 mb-3" />
              <h4 className="font-semibold text-gray-900 mb-1">Banküberweisung</h4>
              <p className="text-sm text-gray-600">
                Mit QR-Code oder manuell
              </p>
            </button>

            {/* Kreditkarte / TWINT - kombiniert */}
            <button
              onClick={() => setSelectedMethod('card_or_twint')}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
            >
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="h-8 w-8 text-purple-600" />
                <Smartphone className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Kreditkarte / TWINT</h4>
              <p className="text-sm text-gray-600">
                Sofortige Zahlung
              </p>
            </button>

            {/* PayPal */}
            {process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && (
              <button
                onClick={() => setSelectedMethod('paypal')}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
              >
                <Wallet className="h-8 w-8 text-blue-600 mb-3" />
                <h4 className="font-semibold text-gray-900 mb-1">PayPal</h4>
                <p className="text-sm text-gray-600">
                  Schnell und sicher
                </p>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Banküberweisung */}
      {selectedMethod === 'bank' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
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
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-gray-600 mb-1">Zu zahlender Betrag</div>
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
                    className="p-1 hover:bg-gray-100 rounded"
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
                    className="p-1 hover:bg-gray-100 rounded"
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
                    className="p-1 hover:bg-gray-100 rounded"
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
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {copied === 'Referenz' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Bitte verwenden Sie diese Referenz bei der Überweisung
                </p>
              </div>
            </div>

            {/* QR-Code */}
            {paymentInfo.qrCodeDataUrl && (
              <div>
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium mb-2"
                >
                  <QrCode className="h-4 w-4" />
                  {showQR ? 'QR-Code ausblenden' : 'QR-Code anzeigen'}
                </button>
                {showQR && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex justify-center">
                    <img
                      src={paymentInfo.qrCodeDataUrl}
                      alt="QR-Code für Zahlung"
                      className="w-48 h-48"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Zahlungsanweisung */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-700 whitespace-pre-line">
                {paymentInfo.paymentInstructions}
              </div>
            </div>

            {/* Hinweis */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <strong>Wichtig:</strong> Bitte überweisen Sie den Betrag bis zum Fälligkeitsdatum.
                  Verwenden Sie die Referenz bei der Überweisung, damit die Zahlung zugeordnet werden kann.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kreditkarte / TWINT - kombiniert */}
      {selectedMethod === 'card_or_twint' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
                <span className="text-gray-400">/</span>
                <Smartphone className="h-5 w-5 text-green-600" />
              </div>
              Kreditkarte / TWINT
            </h3>
            <button
              onClick={() => setSelectedMethod(null)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Zurück
            </button>
          </div>

          <div className="space-y-6">
            {/* Betrag */}
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-sm text-gray-600 mb-1">Zu zahlender Betrag</div>
              <div className="text-2xl font-bold text-purple-700">
                {paymentInfo.currency} {paymentInfo.amount.toFixed(2)}
              </div>
            </div>

            {/* Kreditkarte / TWINT - Einheitliches Formular */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                  <span className="text-gray-400">/</span>
                  <Smartphone className="h-5 w-5 text-green-600" />
                </div>
                Kreditkarte / TWINT
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
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
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
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-gray-600 mb-1">Zu zahlender Betrag</div>
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

