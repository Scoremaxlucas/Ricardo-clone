'use client'

import { useState, useEffect } from 'react'
import {
  Building2,
  Smartphone,
  Copy,
  CheckCircle,
  QrCode,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

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
  paymentInstructions: string
}

interface InvoicePaymentMethodsProps {
  invoiceId: string
  invoiceNumber: string
  amount: number
  onPaymentSuccess?: () => void
}

/**
 * InvoicePaymentMethods - Zahlungskomponente für Gebühren-Rechnungen an Helvenda
 *
 * WICHTIG: Gebühren werden NUR per Banküberweisung (Swiss QR-Bill) bezahlt!
 * Wie bei Ricardo - keine Kreditkarte, kein Stripe für Plattform-Gebühren.
 *
 * Der Swiss QR-Bill Code kann sowohl von Banking-Apps als auch von der TWINT-App
 * gescannt werden - TWINT erkennt den Swiss QR-Bill Standard automatisch.
 */
export function InvoicePaymentMethods({
  invoiceId,
  invoiceNumber,
  amount,
  onPaymentSuccess,
}: InvoicePaymentMethodsProps) {
  const [paymentInfo, setPaymentInfo] = useState<InvoicePaymentInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [showQR, setShowQR] = useState(true) // QR-Code standardmäßig anzeigen

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

  const copyAllBankDetails = async () => {
    if (!paymentInfo) return

    const formattedText = `Empfänger: ${paymentInfo.accountHolder}
IBAN: ${paymentInfo.iban}
BIC: ${paymentInfo.bic}
Referenz: ${paymentInfo.reference}
Betrag: ${paymentInfo.currency} ${paymentInfo.amount.toFixed(2)}`

    try {
      await navigator.clipboard.writeText(formattedText)
      toast.success('Alle Bankdaten kopiert!')
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
          <span className="ml-2 text-gray-600">Lade Zahlungsinformationen...</span>
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
      {/* Banküberweisung - einzige Zahlungsmethode für Gebühren */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Banküberweisung / Swiss QR-Rechnung</h3>
        </div>

        <div className="space-y-4">
          {/* Betrag */}
          <div className="rounded-lg border border-primary-200 bg-primary-50 p-4">
            <div className="mb-1 text-sm text-gray-600">Zu zahlender Betrag</div>
            <div className="text-2xl font-bold text-primary-700">
              {paymentInfo.currency} {paymentInfo.amount.toFixed(2)}
            </div>
          </div>

          {/* QR-Code - prominent anzeigen */}
          {paymentInfo.qrCodeDataUrl && (
            <div>
              <button
                onClick={() => setShowQR(!showQR)}
                className="mb-2 flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-left transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-gray-500" />
                  <span className="font-medium text-gray-700">
                    {showQR ? 'QR-Code ausblenden' : 'QR-Code anzeigen'}
                  </span>
                </div>
                {showQR ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </button>
              {showQR && (
                <div className="mt-2 space-y-3">
                  <div className="flex justify-center rounded-lg border border-gray-200 bg-white p-4">
                    <img
                      src={paymentInfo.qrCodeDataUrl}
                      alt="Swiss QR-Rechnung"
                      className="h-56 w-56"
                    />
                  </div>
                  {/* TWINT-Hinweis */}
                  <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
                    <Smartphone className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                    <div className="text-sm text-green-800">
                      <strong>Tipp:</strong> Dieser QR-Code kann mit Ihrer <strong>Banking-App</strong> oder
                      direkt mit der <strong>TWINT-App</strong> gescannt werden.
                      Der Swiss QR-Bill Standard wird automatisch erkannt.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Alles kopieren Button */}
          <button
            onClick={copyAllBankDetails}
            className="w-full rounded-lg border-2 border-primary-500 bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            <Copy className="mr-2 inline h-4 w-4" />
            Alle Bankdaten kopieren
          </button>

          {/* Bankverbindung */}
          <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Empfänger</label>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-gray-900">{paymentInfo.accountHolder}</span>
                <button
                  onClick={() => copyToClipboard(paymentInfo.accountHolder, 'Empfänger')}
                  className="rounded p-1 hover:bg-gray-200"
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
                  className="rounded p-1 hover:bg-gray-200"
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
                  className="rounded p-1 hover:bg-gray-200"
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
                  className="rounded p-1 hover:bg-gray-200"
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

          {/* Hinweis */}
          <div className="rounded-lg border border-primary-200 bg-primary-50 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" />
              <div className="text-sm text-primary-800">
                <strong>Wichtig:</strong> Bitte überweisen Sie den Betrag bis zum Fälligkeitsdatum.
                Verwenden Sie die Referenz bei der Überweisung, damit die Zahlung automatisch
                zugeordnet werden kann.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
