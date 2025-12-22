'use client'

import {
  AlertCircle,
  ArrowRight,
  Banknote,
  CheckCircle2,
  ExternalLink,
  Loader2,
  RefreshCw,
  Shield,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface PayoutStatus {
  hasAccount: boolean
  accountId?: string
  status: 'NOT_STARTED' | 'INCOMPLETE' | 'COMPLETE'
  payoutsEnabled: boolean
  chargesEnabled?: boolean
  detailsSubmitted?: boolean
  onboardingComplete: boolean
}

interface PendingPayouts {
  count: number
  totalAmount: number
  message: string
}

export function StripePayoutSection() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [status, setStatus] = useState<PayoutStatus | null>(null)
  const [pendingPayouts, setPendingPayouts] = useState<PendingPayouts | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingOnboarding, setProcessingOnboarding] = useState(false)
  const [processingPayouts, setProcessingPayouts] = useState(false)

  // Check for return from Stripe onboarding
  useEffect(() => {
    const payoutReturn = searchParams.get('payout_return')
    const payoutRefresh = searchParams.get('payout_refresh')
    const setupPayout = searchParams.get('setup_payout')

    if (payoutReturn === '1' || payoutRefresh === '1') {
      // Returned from onboarding - refresh status
      loadStatus().then(() => {
        // Clear the URL parameter
        const url = new URL(window.location.href)
        url.searchParams.delete('payout_return')
        url.searchParams.delete('payout_refresh')
        router.replace(url.pathname + url.search)

        if (payoutReturn === '1') {
          toast.success('Willkommen zurück! Prüfen Sie Ihren Auszahlungsstatus.')
        }
      })
    }

    if (setupPayout === '1') {
      // Scroll to this section and show setup prompt
      const section = document.getElementById('stripe-payout-section')
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      // Clear the URL parameter
      const url = new URL(window.location.href)
      url.searchParams.delete('setup_payout')
      router.replace(url.pathname + url.search)
    }
  }, [searchParams, router])

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true)

      // Load payout status
      const statusRes = await fetch('/api/stripe/connect/ensure-account')
      if (statusRes.ok) {
        const data = await statusRes.json()
        setStatus(data)
      } else {
        setStatus({
          hasAccount: false,
          status: 'NOT_STARTED',
          payoutsEnabled: false,
          onboardingComplete: false,
        })
      }

      // Load pending payouts
      const pendingRes = await fetch('/api/stripe/connect/process-pending-payouts')
      if (pendingRes.ok) {
        const data = await pendingRes.json()
        setPendingPayouts(data)
      }
    } catch (error) {
      console.error('Error loading payout status:', error)
      toast.error('Fehler beim Laden des Auszahlungsstatus')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  const handleStartOnboarding = async () => {
    setProcessingOnboarding(true)

    try {
      // Get onboarding link
      const res = await fetch('/api/stripe/connect/account-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ return_to: '/my-watches/account' }),
      })

      const data = await res.json()

      if (res.ok && data.url) {
        // Redirect to onboarding
        window.location.href = data.url
      } else {
        // Zeige detaillierte Fehlermeldung
        const errorMessage =
          data.error || data.message || 'Fehler beim Starten der Einrichtung'
        console.error('[StripePayoutSection] API Error:', {
          status: res.status,
          statusText: res.statusText,
          data,
        })
        toast.error(
          `${errorMessage}${data.errorCode ? ` (Code: ${data.errorCode})` : ''}`
        )
      }
    } catch (error: any) {
      console.error('[StripePayoutSection] Error starting onboarding:', error)
      toast.error(
        `Fehler beim Starten der Einrichtung: ${error.message || 'Unbekannter Fehler'}`
      )
    } finally {
      setProcessingOnboarding(false)
    }
  }

  const handleProcessPendingPayouts = async () => {
    setProcessingPayouts(true)

    try {
      const res = await fetch('/api/stripe/connect/process-pending-payouts', {
        method: 'POST',
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(data.message || 'Auszahlungen verarbeitet')
        // Reload to refresh pending payouts count
        await loadStatus()
      } else {
        if (data.needsOnboarding) {
          toast.error('Bitte richten Sie zuerst Ihre Auszahlungsdaten ein.')
          handleStartOnboarding()
        } else {
          toast.error(data.message || 'Fehler bei der Verarbeitung')
        }
      }
    } catch (error) {
      console.error('Error processing pending payouts:', error)
      toast.error('Fehler bei der Verarbeitung der Auszahlungen')
    } finally {
      setProcessingPayouts(false)
    }
  }

  if (loading) {
    return (
      <div id="stripe-payout-section" className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  const isComplete = status?.status === 'COMPLETE' && status?.onboardingComplete
  const hasPendingPayouts = (pendingPayouts?.count || 0) > 0

  return (
    <div id="stripe-payout-section" className="border-t border-gray-200 pt-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="mb-1 flex items-center text-lg font-semibold text-gray-900">
            <Shield className="mr-2 h-5 w-5 text-primary-600" />
            Helvenda Zahlungsschutz - Auszahlungen
          </h3>
          <p className="text-xs text-gray-500">
            Richten Sie Ihre Auszahlungsdaten ein, um Verkaufserlöse aus geschützten Verkäufen zu
            erhalten.
          </p>
        </div>
      </div>

      {/* Status Card */}
      <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isComplete ? (
              // Complete Status
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Auszahlung aktiv</p>
                  <p className="text-sm text-gray-600">
                    Ihre Auszahlungsdaten sind eingerichtet. Verkaufserlöse werden automatisch
                    überwiesen.
                  </p>
                </div>
              </div>
            ) : status?.status === 'INCOMPLETE' ? (
              // Incomplete Status
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="font-medium text-gray-900">Einrichtung unvollständig</p>
                  <p className="text-sm text-gray-600">
                    Bitte schliessen Sie die Einrichtung ab, um Auszahlungen zu erhalten.
                  </p>
                </div>
              </div>
            ) : (
              // Not Started Status
              <div className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Auszahlung nicht eingerichtet</p>
                  <p className="text-sm text-gray-600">
                    Richten Sie Ihre Auszahlungsdaten ein, um Erlöse aus geschützten Verkäufen zu
                    erhalten.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => loadStatus()}
            disabled={loading}
            className="ml-2 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Status aktualisieren"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Pending Payouts Alert */}
      {hasPendingPayouts && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div className="flex-1">
              <p className="font-medium text-amber-800">
                {pendingPayouts!.count} Auszahlung{pendingPayouts!.count > 1 ? 'en' : ''} ausstehend
              </p>
              <p className="mt-1 text-sm text-amber-700">
                Gesamtbetrag: CHF {pendingPayouts!.totalAmount.toFixed(2)}
              </p>
              <p className="mt-1 text-sm text-amber-600">
                {isComplete
                  ? 'Klicken Sie unten, um die ausstehenden Auszahlungen zu verarbeiten.'
                  : 'Bitte richten Sie Ihre Auszahlungsdaten ein, um diese Beträge zu erhalten.'}
              </p>
            </div>
          </div>

          {/* Process pending payouts button (only if onboarding is complete) */}
          {isComplete && (
            <div className="mt-3">
              <button
                type="button"
                onClick={handleProcessPendingPayouts}
                disabled={processingPayouts}
                className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processingPayouts ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Wird verarbeitet...
                  </>
                ) : (
                  <>
                    <Banknote className="h-4 w-4" />
                    Auszahlungen verarbeiten
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* CTA Buttons */}
      <div className="space-y-3">
        {!isComplete && (
          <button
            type="button"
            onClick={handleStartOnboarding}
            disabled={processingOnboarding}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {processingOnboarding ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Wird gestartet...
              </>
            ) : status?.status === 'INCOMPLETE' ? (
              <>
                <ArrowRight className="h-4 w-4" />
                Einrichtung fortsetzen
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4" />
                Auszahlung einrichten
              </>
            )}
          </button>
        )}

        {/* Info Text */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="flex items-start gap-2">
            <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-600" />
            <div>
              <p className="text-xs text-gray-600">
                <strong>Was ist der Helvenda Zahlungsschutz?</strong>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Beim Helvenda Zahlungsschutz werden Zahlungen sicher gehalten, bis der Käufer den
                Erhalt bestätigt oder ein Zeitfenster abgelaufen ist. Dann wird das Geld automatisch
                an Sie überwiesen.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
