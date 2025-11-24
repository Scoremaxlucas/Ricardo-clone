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

type PaymentMethod = 'bank' | 'twint' | 'creditcard' | 'paypal'

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
            // Kreditkarte ist immer verfügbar (1), Banküberweisung (1), TWINT (optional), PayPal (optional)
            (paymentInfo.twintPhone ? 1 : 0) + 
            (process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? 1 : 0) + 
            2 // Banküberweisung + Kreditkarte sind immer verfügbar
          } > 2 ? 'md:grid-cols-2 lg:grid-cols-4' : 
            (paymentInfo.twintPhone || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) ? 'md:grid-cols-2' : 
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

            {/* TWINT */}
            {paymentInfo.twintPhone && (
              <button
                onClick={() => setSelectedMethod('twint')}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left"
              >
                <Smartphone className="h-8 w-8 text-green-600 mb-3" />
                <h4 className="font-semibold text-gray-900 mb-1">TWINT</h4>
                <p className="text-sm text-gray-600">
                  Schnell und einfach
                </p>
              </button>
            )}

            {/* Kreditkarte - immer verfügbar */}
            <button
              onClick={() => setSelectedMethod('creditcard')}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
            >
              <CreditCard className="h-8 w-8 text-purple-600 mb-3" />
              <h4 className="font-semibold text-gray-900 mb-1">Kreditkarte</h4>
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

      {/* TWINT */}
      {selectedMethod === 'twint' && paymentInfo.twintPhone && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-green-600" />
              TWINT-Zahlung
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
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm text-gray-600 mb-1">Zu zahlender Betrag</div>
              <div className="text-2xl font-bold text-green-700">
                {paymentInfo.currency} {paymentInfo.amount.toFixed(2)}
              </div>
            </div>

            {/* TWINT Payment Form über Stripe (automatische Bestätigung) */}
            {stripePromise ? (
              <TwintPaymentForm
                invoiceId={invoiceId}
                invoiceNumber={invoiceNumber}
                amount={paymentInfo.amount}
                onSuccess={onPaymentSuccess}
              />
            ) : (
              <>
                {/* Fallback: QR-Code und Deep Link wenn Stripe nicht verfügbar */}
                {paymentInfo.twintDeepLink && (
                  <div>
                    <a
                      href={paymentInfo.twintDeepLink}
                      className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors text-lg"
                    >
                      <Smartphone className="h-6 w-6" />
                      Mit TWINT bezahlen
                    </a>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Öffnet die TWINT-App direkt mit dem korrekten Betrag
                    </p>
                  </div>
                )}

                {paymentInfo.twintQRCodeDataUrl && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2 text-center">
                      Oder scannen Sie den QR-Code mit Ihrer TWINT-App:
                    </div>
                    <div className="p-4 bg-white rounded-lg border-2 border-green-200 flex justify-center">
                      <img
                        src={paymentInfo.twintQRCodeDataUrl}
                        alt="TWINT QR-Code für Zahlung"
                        className="w-64 h-64"
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Scannen Sie diesen QR-Code mit der TWINT-App auf Ihrem Smartphone
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Kreditkarte */}
      {selectedMethod === 'creditcard' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-purple-600" />
              Kreditkartenzahlung
            </h3>
            <button
              onClick={() => setSelectedMethod(null)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Zurück
            </button>
          </div>

          <InvoicePaymentForm
            invoiceId={invoiceId}
            invoiceNumber={invoiceNumber}
            amount={amount}
            onSuccess={onPaymentSuccess}
          />
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

