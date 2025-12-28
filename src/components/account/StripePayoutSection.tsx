'use client'

import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Shield,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { PayoutOnboardingModal } from './PayoutOnboardingModal'

type ConnectStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'ACTION_REQUIRED' | 'VERIFIED'

interface AccountStatus {
  accountId: string | null
  status: ConnectStatus
  payoutsEnabled: boolean
  chargesEnabled: boolean
  detailsSubmitted: boolean
  requirements: {
    currently_due: string[]
    eventually_due: string[]
    past_due: string[]
    pending_verification: string[]
    disabled_reason: string | null
  } | null
}

interface PendingPayouts {
  count: number
  totalAmount: number
  message: string
}

export function StripePayoutSection() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [status, setStatus] = useState<AccountStatus | null>(null)
  const [pendingPayouts, setPendingPayouts] = useState<PendingPayouts | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingPayouts, setProcessingPayouts] = useState(false)
  const [showOnboardingModal, setShowOnboardingModal] = useState(false)

  // Check for return from Stripe onboarding (redirect flow)
  useEffect(() => {
    const payoutReturn = searchParams.get('payout_return')
    const payoutRefresh = searchParams.get('payout_refresh')
    const setupPayout = searchParams.get('setup_payout')

    if (payoutReturn === '1' || payoutRefresh === '1') {
      loadStatus().then(() => {
        const url = new URL(window.location.href)
        url.searchParams.delete('payout_return')
        url.searchParams.delete('payout_refresh')
        router.replace(url.pathname + url.search)

        if (payoutReturn === '1') {
          toast.success('Willkommen zurück! Status wird aktualisiert.')
        }
      })
    }

    if (setupPayout === '1') {
      setShowOnboardingModal(true)
      const url = new URL(window.location.href)
      url.searchParams.delete('setup_payout')
      router.replace(url.pathname + url.search)
    }
  }, [searchParams, router])

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true)

      // Load account status
      const statusRes = await fetch('/api/stripe/connect/account')
      if (statusRes.ok) {
        const data: AccountStatus = await statusRes.json()
        setStatus(data)
      } else {
        setStatus({
          accountId: null,
          status: 'NOT_STARTED',
          payoutsEnabled: false,
          chargesEnabled: false,
          detailsSubmitted: false,
          requirements: null,
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
      toast.error('Fehler beim Laden des Status')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  const handleOpenOnboarding = () => {
    setShowOnboardingModal(true)
  }

  const handleOnboardingClose = () => {
    setShowOnboardingModal(false)
  }

  const handleStatusChange = async () => {
    await loadStatus()
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
        await loadStatus()
      } else {
        if (data.needsOnboarding) {
          toast.error('Bitte richten Sie zuerst Ihre Auszahlungsdaten ein.')
          handleOpenOnboarding()
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

  const currentStatus = status?.status || 'NOT_STARTED'
  const hasPendingPayouts = (pendingPayouts?.count || 0) > 0
  const hasActionRequired =
    (status?.requirements?.currently_due?.length || 0) > 0 ||
    (status?.requirements?.past_due?.length || 0) > 0

  // Get status display info
  const getStatusInfo = () => {
    switch (currentStatus) {
      case 'VERIFIED':
        return {
          icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
          label: 'Verifiziert',
          labelClass: 'bg-green-100 text-green-700',
          title: 'Auszahlungen aktiv',
          description:
            'Ihre Auszahlungsdaten sind verifiziert. Erlöse werden nach Freigabe automatisch überwiesen.',
        }
      case 'IN_PROGRESS':
        return {
          icon: <Clock className="h-5 w-5 text-blue-500" />,
          label: 'In Prüfung',
          labelClass: 'bg-blue-100 text-blue-700',
          title: 'Verifizierung läuft',
          description:
            'Ihre Angaben werden geprüft. Dies kann einige Minuten bis Tage dauern.',
        }
      case 'ACTION_REQUIRED':
        return {
          icon: <AlertCircle className="h-5 w-5 text-amber-500" />,
          label: 'Aktion erforderlich',
          labelClass: 'bg-amber-100 text-amber-700',
          title: 'Angaben erforderlich',
          description:
            'Bitte vervollständigen Sie Ihre Angaben, um Auszahlungen zu aktivieren.',
        }
      default:
        return {
          icon: <Banknote className="h-5 w-5 text-gray-400" />,
          label: 'Nicht eingerichtet',
          labelClass: 'bg-gray-100 text-gray-600',
          title: 'Auszahlung nicht eingerichtet',
          description:
            'Richten Sie Auszahlungen ein, um Verkaufserlöse aus Zahlungsschutz-Verkäufen zu erhalten.',
        }
    }
  }

  const statusInfo = getStatusInfo()

  // Get CTA button info
  const getCtaInfo = () => {
    switch (currentStatus) {
      case 'VERIFIED':
        return {
          text: 'Auszahlungsdaten verwalten',
          variant: 'secondary' as const,
        }
      case 'ACTION_REQUIRED':
        return {
          text: 'Weiter einrichten',
          variant: 'primary' as const,
        }
      case 'IN_PROGRESS':
        return {
          text: 'Status ansehen',
          variant: 'secondary' as const,
        }
      default:
        return {
          text: 'Jetzt einrichten',
          variant: 'primary' as const,
        }
    }
  }

  const ctaInfo = getCtaInfo()

  return (
    <>
      <div id="stripe-payout-section" className="border-t border-gray-200 pt-6">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="mb-1 flex items-center text-lg font-semibold text-gray-900">
              <Shield className="mr-2 h-5 w-5 text-primary-600" />
              Auszahlungen (Zahlungsschutz)
            </h3>
            <p className="text-xs text-gray-500">
              Verkaufserlöse aus Zahlungsschutz-Transaktionen • Abwicklung über Stripe
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadStatus()}
            disabled={loading}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Status aktualisieren"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Status Card */}
        <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">{statusInfo.icon}</div>
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="font-medium text-gray-900">{statusInfo.title}</span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.labelClass}`}
                >
                  {statusInfo.label}
                </span>
              </div>
              <p className="text-sm text-gray-600">{statusInfo.description}</p>
            </div>
          </div>
        </div>

        {/* Pending Payouts Alert */}
        {hasPendingPayouts && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
              <div className="flex-1">
                <p className="font-medium text-amber-800">
                  {pendingPayouts!.count} Auszahlung{pendingPayouts!.count > 1 ? 'en' : ''}{' '}
                  ausstehend
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  Gesamtbetrag: CHF {pendingPayouts!.totalAmount.toFixed(2)}
                </p>
                {currentStatus !== 'VERIFIED' && (
                  <p className="mt-1 text-sm text-amber-600">
                    Bitte richten Sie Ihre Auszahlungsdaten ein, um diese Beträge zu erhalten.
                  </p>
                )}
              </div>
            </div>

            {currentStatus === 'VERIFIED' && (
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

        {/* CTA Button */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleOpenOnboarding}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto ${
              ctaInfo.variant === 'primary'
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Shield className="h-4 w-4" />
            {ctaInfo.text}
          </button>

          {/* Requirements Progress (for action required or in progress) */}
          {(currentStatus === 'ACTION_REQUIRED' || currentStatus === 'IN_PROGRESS') && (
            <div
              className={`rounded-lg border p-3 ${
                currentStatus === 'ACTION_REQUIRED'
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-blue-200 bg-blue-50'
              }`}
            >
              <div className="mb-2 flex items-center justify-between text-sm">
                <span
                  className={
                    currentStatus === 'ACTION_REQUIRED' ? 'text-amber-700' : 'text-blue-700'
                  }
                >
                  Einrichtungs-Fortschritt
                </span>
                <span
                  className={`font-medium ${
                    currentStatus === 'ACTION_REQUIRED' ? 'text-amber-800' : 'text-blue-800'
                  }`}
                >
                  {currentStatus === 'IN_PROGRESS' ? 'Wird geprüft' : 'Angaben erforderlich'}
                </span>
              </div>
              <div
                className={`h-2 w-full overflow-hidden rounded-full ${
                  currentStatus === 'ACTION_REQUIRED' ? 'bg-amber-200' : 'bg-blue-200'
                }`}
              >
                <div
                  className={`h-full transition-all duration-300 ${
                    currentStatus === 'ACTION_REQUIRED' ? 'bg-amber-500' : 'bg-blue-500'
                  }`}
                  style={{
                    width:
                      currentStatus === 'IN_PROGRESS'
                        ? '80%'
                        : hasActionRequired
                          ? '30%'
                          : '50%',
                  }}
                />
              </div>
              {status?.requirements?.currently_due &&
                status.requirements.currently_due.length > 0 && (
                  <p
                    className={`mt-2 text-xs ${
                      currentStatus === 'ACTION_REQUIRED' ? 'text-amber-600' : 'text-blue-600'
                    }`}
                  >
                    {status.requirements.currently_due.length} Angabe(n) noch erforderlich
                  </p>
                )}
              {status?.requirements?.pending_verification &&
                status.requirements.pending_verification.length > 0 && (
                  <p className="mt-2 text-xs text-blue-600">
                    {status.requirements.pending_verification.length} Prüfung(en) ausstehend
                  </p>
                )}
            </div>
          )}

          {/* Info Box */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="flex items-start gap-2">
              <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-600" />
              <div>
                <p className="text-xs font-medium text-gray-700">
                  Was ist der Helvenda Zahlungsschutz?
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Beim Zahlungsschutz werden Zahlungen sicher gehalten, bis der Käufer den Erhalt
                  bestätigt. Dann wird das Geld automatisch an Sie überwiesen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Modal */}
      <PayoutOnboardingModal
        open={showOnboardingModal}
        onClose={handleOnboardingClose}
        onStatusChange={handleStatusChange}
      />
    </>
  )
}
