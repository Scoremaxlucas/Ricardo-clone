'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Copy, CheckCircle, QrCode, AlertCircle, Loader2, Smartphone } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface PaymentInfo {
  iban: string
  bic: string
  accountHolder: string
  amount: number
  currency: string
  reference: string
  qrCodeDataUrl?: string
  qrCodeString?: string
  paymentInstructions: string
  twintPhone?: string | null
  twintQRCodeDataUrl?: string | null
  twintDeepLink?: string | null
  hasSellerBankDetails?: boolean
}

interface PaymentInfoCardProps {
  purchaseId: string
  showQRCode?: boolean
}

export function PaymentInfoCard({ purchaseId, showQRCode = true }: PaymentInfoCardProps) {
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [showQR, setShowQR] = useState(false)

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPaymentInfo = async () => {
      try {
        const res = await fetch(`/api/purchases/${purchaseId}/payment-info`)
        if (res.ok) {
          const data = await res.json()
          setPaymentInfo(data.paymentInfo)
          setError(null)
        } else {
          const errorData = await res.json()
          setError(errorData.message || 'Fehler beim Laden der Zahlungsinformationen')
        }
      } catch (error) {
        console.error('Error loading payment info:', error)
        setError('Fehler beim Laden der Zahlungsinformationen')
      } finally {
        setLoading(false)
      }
    }

    loadPaymentInfo()
  }, [purchaseId])

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
      <div className="bg-white rounded-lg shadow-md p-6 border-2 border-blue-200">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Lade Zahlungsinformationen...</span>
        </div>
      </div>
    )
  }

  if (!paymentInfo) {
    if (error) {
      return (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
          <div className="flex items-start gap-2 text-yellow-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <strong>Hinweis:</strong> {error}
              <br />
              <span className="text-xs mt-1 block">
                Bitte kontaktieren Sie den Verkäufer direkt, um die Zahlungsmodalitäten zu klären.
              </span>
            </div>
          </div>
        </div>
      )
    }
    return (
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
        <div className="flex items-center gap-2 text-yellow-800">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">Zahlungsinformationen werden vorbereitet...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-2 border-blue-200">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Zahlungsinformationen</h3>
      </div>

      {/* Betrag */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm text-gray-600 mb-1">Zu zahlender Betrag</div>
        <div className="text-2xl font-bold text-blue-700">
          {paymentInfo.currency} {paymentInfo.amount.toFixed(2)}
        </div>
      </div>

      {/* Bankverbindung */}
      <div className="space-y-3 mb-4">
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

      {/* TWINT-Zahlung */}
      {paymentInfo.twintPhone && (
        <div className="mb-4 p-4 bg-green-50 rounded-lg border-2 border-green-300">
          <div className="flex items-center gap-2 mb-3">
            <Smartphone className="h-5 w-5 text-green-700" />
            <span className="text-lg font-bold text-green-700">TWINT-Zahlung</span>
          </div>
          
          {/* TWINT Deep Link Button (für mobile Nutzer) */}
          {paymentInfo.twintDeepLink && (
            <div className="mb-4">
              <a
                href={paymentInfo.twintDeepLink}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                <Smartphone className="h-5 w-5" />
                Mit TWINT bezahlen
              </a>
              <p className="text-xs text-gray-600 text-center mt-2">
                Öffnet die TWINT-App direkt mit dem korrekten Betrag
              </p>
            </div>
          )}

          {/* TWINT QR-Code (für Desktop-Nutzer) */}
          {paymentInfo.twintQRCodeDataUrl && (
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2 text-center">
                Oder scannen Sie den QR-Code:
              </div>
              <div className="p-3 bg-white rounded-lg border border-green-200 flex justify-center">
                <img
                  src={paymentInfo.twintQRCodeDataUrl}
                  alt="TWINT QR-Code für Zahlung"
                  className="w-48 h-48"
                />
              </div>
              <p className="text-xs text-gray-600 text-center mt-2">
                Scannen Sie diesen QR-Code mit der TWINT-App auf Ihrem Smartphone
              </p>
            </div>
          )}

        </div>
      )}


      {/* QR-Code */}
      {showQRCode && paymentInfo.qrCodeDataUrl && (
        <div className="mb-4">
          <button
            onClick={() => setShowQR(!showQR)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            <QrCode className="h-4 w-4" />
            {showQR ? 'QR-Code ausblenden' : 'QR-Code anzeigen'}
          </button>
          {showQR && (
            <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 flex justify-center">
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
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-sm text-gray-700 whitespace-pre-line">
          {paymentInfo.paymentInstructions}
        </div>
      </div>

      {/* Hinweis */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <strong>Wichtig:</strong> Bitte überweisen Sie den Betrag innerhalb von 14 Tagen nach Kontaktaufnahme.
            Verwenden Sie die Referenz bei der Überweisung, damit die Zahlung zugeordnet werden kann.
          </div>
        </div>
      </div>
    </div>
  )
}

