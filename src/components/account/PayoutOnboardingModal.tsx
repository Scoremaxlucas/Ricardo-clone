'use client'

import {
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
} from '@stripe/react-connect-js'
import { loadConnectAndInitialize } from '@stripe/connect-js'
import { ExternalLink, Loader2, Shield, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface PayoutOnboardingModalProps {
  open: boolean
  onClose: () => void
  onStatusChange?: () => void
}

type ConnectInstance = Awaited<ReturnType<typeof loadConnectAndInitialize>>

/**
 * Modal for Stripe Connect embedded onboarding using React Connect components
 * Falls back to redirect flow if embedded components fail to initialize
 */
export function PayoutOnboardingModal({
  open,
  onClose,
  onStatusChange,
}: PayoutOnboardingModalProps) {
  const [stripeConnectInstance, setStripeConnectInstance] = useState<ConnectInstance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fallbackMode, setFallbackMode] = useState(false)
  const [fallbackLoading, setFallbackLoading] = useState(false)

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
      setError(null)
      setFallbackMode(false)
      return
    }

    const initializeConnect = async () => {
      try {
        setLoading(true)
        setError(null)

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
              colorPrimary: '#008080',
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
        setError(err.message || 'Fehler beim Laden')
        setFallbackMode(true)
        setLoading(false)
      }
    }

    initializeConnect()
  }, [open, fetchClientSecret])

  // Handle onboarding exit (user completed or left early)
  const handleOnboardingExit = useCallback(() => {
    console.log('[PayoutOnboardingModal] Onboarding exited')
    
    // Refresh status
    if (onStatusChange) {
      onStatusChange()
    }

    // Close modal
    onClose()

    // Show toast based on what happened
    toast.success('Status wird aktualisiert...', { duration: 2000 })
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
      toast.error('Fehler beim Öffnen der Einrichtung')
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary-100 p-2">
              <Shield className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Auszahlung einrichten</h2>
              <p className="text-sm text-gray-500">Sichere Abwicklung durch Stripe</p>
            </div>
          </div>
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

        {/* Content */}
        <div className="max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary-600" />
              <p className="text-sm text-gray-500">Wird geladen...</p>
            </div>
          )}

          {/* Fallback Mode */}
          {fallbackMode && !loading && (
            <div className="p-6">
              <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-800">
                  Die eingebettete Einrichtung konnte nicht geladen werden. Wir öffnen die sichere
                  Stripe-Einrichtung in einem neuen Fenster.
                </p>
              </div>

              <div className="mb-6 text-center">
                <p className="text-sm text-gray-600">
                  Um Verkaufserlöse aus Zahlungsschutz-Verkäufen zu erhalten, richten Sie Ihre
                  Auszahlungsdaten bei Stripe ein.
                </p>
              </div>

              <button
                type="button"
                onClick={handleFallbackRedirect}
                disabled={fallbackLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {fallbackLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Wird geöffnet...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4" />
                    Bei Stripe einrichten
                  </>
                )}
              </button>

              <p className="mt-4 text-center text-xs text-gray-500">
                Sie werden zu Stripe weitergeleitet und nach Abschluss automatisch zurückgebracht.
              </p>
            </div>
          )}

          {/* Embedded Onboarding Component */}
          {stripeConnectInstance && !loading && !fallbackMode && (
            <div className="p-6">
              <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
                <ConnectAccountOnboarding
                  onExit={handleOnboardingExit}
                />
              </ConnectComponentsProvider>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-3">
          <p className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <Shield className="h-3.5 w-3.5" />
            Ihre Daten werden sicher bei Stripe gespeichert
          </p>
        </div>
      </div>
    </div>
  )
}
