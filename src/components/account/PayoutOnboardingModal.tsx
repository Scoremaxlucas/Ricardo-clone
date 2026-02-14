'use client'

import { loadConnectAndInitialize } from '@stripe/connect-js'
import { ConnectAccountOnboarding, ConnectComponentsProvider } from '@stripe/react-connect-js'
import { Clock, ExternalLink, Loader2, Lock, Shield, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface PayoutOnboardingModalProps {
  open: boolean
  onClose: () => void
  onStatusChange?: () => void
}

type ConnectInstance = Awaited<ReturnType<typeof loadConnectAndInitialize>>

/**
 * Clean, user-friendly modal for Stripe Connect embedded onboarding
 * - Friendly intro before Stripe iframe
 * - Auto-redirect on fallback
 * - Mobile-optimized
 */
export function PayoutOnboardingModal({
  open,
  onClose,
  onStatusChange,
}: PayoutOnboardingModalProps) {
  const [stripeConnectInstance, setStripeConnectInstance] = useState<ConnectInstance | null>(null)
  const [loading, setLoading] = useState(true)
  const [fallbackMode, setFallbackMode] = useState(false)
  const [fallbackLoading, setFallbackLoading] = useState(false)
  const [showStripeForm, setShowStripeForm] = useState(false)

  // Fetch client secret for embedded onboarding
  const fetchClientSecret = useCallback(async (): Promise<string> => {
    const response = await fetch('/api/stripe/connect/account-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.message || 'Fehler beim Laden der Session')
    }

    const data = await response.json()
    return data.clientSecret
  }, [])

  // Initialize Stripe Connect
  useEffect(() => {
    if (!open) {
      // Reset state when modal closes
      setStripeConnectInstance(null)
      setLoading(true)
      setFallbackMode(false)
      setShowStripeForm(false)
      return
    }

    const initializeConnect = async () => {
      try {
        setLoading(true)

        const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        if (!publishableKey) {
          throw new Error('Stripe Publishable Key nicht konfiguriert')
        }

        const instance = await loadConnectAndInitialize({
          publishableKey,
          fetchClientSecret,
          appearance: {
            overlays: 'dialog',
            variables: {
              colorPrimary: '#0d9488',
              colorBackground: '#ffffff',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              borderRadius: '8px',
            },
          },
          locale: 'de',
        })

        setStripeConnectInstance(instance)
        setLoading(false)
      } catch (err: any) {
        console.error('[PayoutOnboardingModal] Initialization error:', err)
        // Auto-redirect on fallback after short delay
        setFallbackMode(true)
        setLoading(false)
        // Automatically trigger redirect after 2 seconds
        setTimeout(() => {
          handleFallbackRedirect()
        }, 2000)
      }
    }

    initializeConnect()
  }, [open, fetchClientSecret])

  // Handle onboarding exit (user completed or left early)
  const handleOnboardingExit = useCallback(() => {
    // Refresh status
    if (onStatusChange) {
      onStatusChange()
    }

    // Close modal
    onClose()

    // Show toast
    toast.success('Einrichtung abgeschlossen!', { duration: 3000 })
  }, [onClose, onStatusChange])

  // Fallback: Use redirect flow
  const handleFallbackRedirect = useCallback(async () => {
    setFallbackLoading(true)

    try {
      const response = await fetch('/api/stripe/connect/account-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ return_to: '/my-watches/account' }),
      })

      const data = await response.json()

      if (response.ok && data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.message || 'Fehler beim Erstellen des Links')
      }
    } catch (err: any) {
      console.error('[PayoutOnboardingModal] Fallback error:', err)
      toast.error('Fehler beim Öffnen. Bitte versuchen Sie es erneut.')
      setFallbackLoading(false)
    }
  }, [])

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !loading && !fallbackLoading) {
        onClose()
      }
    },
    [loading, fallbackLoading, onClose]
  )

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && !loading && !fallbackLoading) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, loading, fallbackLoading, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative mx-auto flex w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl max-h-[95vh] sm:max-h-[90vh]">
        {/* Minimal Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-white px-4 py-3 sm:px-6 sm:py-4">
          <h2 className="text-base font-semibold text-gray-900 sm:text-lg">Auszahlung einrichten</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading || fallbackLoading}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Schliessen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content - Mobile-optimized scrolling */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 sm:py-20">
              <Loader2 className="mb-4 h-7 w-7 animate-spin text-primary-600 sm:h-8 sm:w-8" />
              <p className="text-sm text-gray-500">Wird vorbereitet...</p>
            </div>
          )}

          {/* Fallback Mode - Auto-redirecting */}
          {fallbackMode && !loading && (
            <div className="p-6 text-center sm:p-8">
              <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary-600" />
              <p className="text-sm text-gray-600">
                Sie werden weitergeleitet...
              </p>
              <p className="mt-2 text-xs text-gray-400">
                Falls nichts passiert:{' '}
                <button
                  type="button"
                  onClick={handleFallbackRedirect}
                  disabled={fallbackLoading}
                  className="text-primary-600 underline hover:text-primary-700"
                >
                  Manuell öffnen
                </button>
              </p>
            </div>
          )}

          {/* Intro Screen - Before showing Stripe */}
          {stripeConnectInstance && !loading && !fallbackMode && !showStripeForm && (
            <div className="p-6 sm:p-8">
              {/* Friendly intro */}
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 sm:h-16 sm:w-16">
                  <Shield className="h-7 w-7 text-primary-600 sm:h-8 sm:w-8" />
                </div>
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  Bankkonto verbinden
                </h3>
                <p className="mx-auto max-w-sm text-sm text-gray-500">
                  Damit Sie Verkaufserlöse erhalten können, verbinden Sie einmalig Ihr Bankkonto.
                </p>
              </div>

              {/* Info points */}
              <div className="mb-6 space-y-3">
                <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
                  <Lock className="h-4 w-4 flex-shrink-0 text-gray-400" />
                  <span className="text-sm text-gray-600">Sichere Übertragung via Stripe</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
                  <Clock className="h-4 w-4 flex-shrink-0 text-gray-400" />
                  <span className="text-sm text-gray-600">Dauert ca. 2-3 Minuten</span>
                </div>
              </div>

              {/* CTA */}
              <button
                type="button"
                onClick={() => setShowStripeForm(true)}
                className="w-full rounded-lg bg-primary-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700"
              >
                Weiter zur Einrichtung
              </button>

              <p className="mt-4 text-center text-xs text-gray-400">
                Einmalige Einrichtung • Danach automatische Auszahlungen
              </p>
            </div>
          )}

          {/* Embedded Onboarding - Stripe Form */}
          {stripeConnectInstance && !loading && !fallbackMode && showStripeForm && (
            <>
              <div className="flex min-h-[450px] flex-col">
                <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
                  <ConnectAccountOnboarding onExit={handleOnboardingExit} />
                </ConnectComponentsProvider>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
