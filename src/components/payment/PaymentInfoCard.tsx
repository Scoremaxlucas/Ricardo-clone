'use client'

import { useState, useEffect } from 'react'
import {
  CreditCard,
  Copy,
  CheckCircle,
  QrCode,
  AlertCircle,
  Loader2,
  Smartphone,
} from 'lucide-react'
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
      <div className="rounded-lg border-2 border-blue-200 bg-white p-6 shadow-md">
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
        <div className="rounded-lg border-2 border-yellow-300 bg-yellow-50 p-4">
          <div className="flex items-start gap-2 text-yellow-800">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div className="text-sm">
              <strong>Hinweis:</strong> {error}
              <br />
              <span className="mt-1 block text-xs">
                Bitte kontaktieren Sie den Verkäufer direkt, um die Zahlungsmodalitäten zu klären.
              </span>
            </div>
          </div>
        </div>
      )
    }
    return (
      <div className="rounded-lg border-2 border-yellow-300 bg-yellow-50 p-4">
        <div className="flex items-center gap-2 text-yellow-800">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">Zahlungsinformationen werden vorbereitet...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border-2 border-blue-200 bg-white p-6 shadow-md">
      <div className="mb-4 flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Zahlungsinformationen</h3>
      </div>

      {/* Betrag */}
      <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
        <div className="mb-1 text-sm text-gray-600">Zu zahlender Betrag</div>
        <div className="text-2xl font-bold text-blue-700">
          {paymentInfo.currency} {paymentInfo.amount.toFixed(2)}
        </div>
      </div>

      {/* Bankverbindung */}
      <div className="mb-4 space-y-3">
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

      {/* TWINT-Zahlung */}
      {paymentInfo.twintPhone && (
        <div className="mb-4 rounded-lg border-2 border-green-300 bg-green-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-green-700" />
            <span className="text-lg font-bold text-green-700">TWINT-Zahlung</span>
          </div>

          {/* TWINT Deep Link Button (für mobile Nutzer) */}
          {paymentInfo.twintDeepLink && (
            <div className="mb-4">
              <a
                href={paymentInfo.twintDeepLink}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-green-700"
              >
                <Smartphone className="h-5 w-5" />
                Mit TWINT bezahlen
              </a>
              <p className="mt-2 text-center text-xs text-gray-600">
                Öffnet die TWINT-App direkt mit dem korrekten Betrag
              </p>
            </div>
          )}

          {/* TWINT QR-Code (für Desktop-Nutzer) */}
          {paymentInfo.twintQRCodeDataUrl && (
            <div className="mb-4">
              <div className="mb-2 text-center text-sm font-medium text-gray-700">
                Oder scannen Sie den QR-Code:
              </div>
              <div className="flex justify-center rounded-lg border border-green-200 bg-white p-3">
                <img
                  src={paymentInfo.twintQRCodeDataUrl}
                  alt="TWINT QR-Code für Zahlung"
                  className="h-48 w-48"
                />
              </div>
              <p className="mt-2 text-center text-xs text-gray-600">
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
            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <QrCode className="h-4 w-4" />
            {showQR ? 'QR-Code ausblenden' : 'QR-Code anzeigen'}
          </button>
          {showQR && (
            <div className="mt-3 flex justify-center rounded-lg border border-gray-200 bg-gray-50 p-4">
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
      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <div className="whitespace-pre-line text-sm text-gray-700">
          {paymentInfo.paymentInstructions}
        </div>
      </div>

      {/* Hinweis */}
      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
          <div className="text-sm text-blue-800">
            <strong>Wichtig:</strong> Bitte überweisen Sie den Betrag innerhalb von 14 Tagen nach
            Kontaktaufnahme. Verwenden Sie die Referenz bei der Überweisung, damit die Zahlung
            zugeordnet werden kann.
          </div>
        </div>
      </div>
    </div>
  )
}
