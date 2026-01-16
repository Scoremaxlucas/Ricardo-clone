'use client'

import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
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

  return (
    <>
      <div id="stripe-payout-section" className="border-t border-gray-200 pt-6">
        {/* Compact Header */}
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center text-sm font-medium text-gray-900">
            <Banknote className="mr-2 h-4 w-4 text-gray-500" />
            Auszahlungen
          </h3>
          <button
            type="button"
            onClick={() => loadStatus()}
            disabled={loading}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Aktualisieren"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Compact Status Display */}
        <div className="mb-3 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
          <div className="flex items-center gap-2">
            {currentStatus === 'VERIFIED' ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-700">Aktiv</span>
              </>
            ) : currentStatus === 'IN_PROGRESS' ? (
              <>
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-700">Wird geprüft</span>
              </>
            ) : currentStatus === 'ACTION_REQUIRED' ? (
              <>
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-gray-700">Einrichtung fortsetzen</span>
              </>
            ) : (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                <span className="text-sm text-gray-500">Nicht eingerichtet</span>
              </>
            )}
          </div>
          
          <button
            type="button"
            onClick={handleOpenOnboarding}
            className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              currentStatus === 'NOT_STARTED' || currentStatus === 'ACTION_REQUIRED'
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {currentStatus === 'VERIFIED'
              ? 'Verwalten'
              : currentStatus === 'IN_PROGRESS'
                ? 'Ansehen'
                : currentStatus === 'ACTION_REQUIRED'
                  ? 'Fortsetzen'
                  : 'Einrichten'}
          </button>
        </div>

        {/* Pending Payouts - Only show when relevant */}
        {hasPendingPayouts && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-800">
                  CHF {pendingPayouts!.totalAmount.toFixed(2)} ausstehend
                </span>
              </div>
              {currentStatus === 'VERIFIED' && (
                <button
                  type="button"
                  onClick={handleProcessPendingPayouts}
                  disabled={processingPayouts}
                  className="rounded bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {processingPayouts ? 'Läuft...' : 'Auszahlen'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Subtle hint - only for NOT_STARTED */}
        {currentStatus === 'NOT_STARTED' && !hasPendingPayouts && (
          <p className="text-xs text-gray-400">
            Nur nötig bei Verkäufen mit Zahlungsschutz
          </p>
        )}
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
