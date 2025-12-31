'use client'

import { loadConnectAndInitialize } from '@stripe/connect-js'
import { ConnectAccountOnboarding, ConnectComponentsProvider } from '@stripe/react-connect-js'
import { ExternalLink, Loader2, Lock, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface PayoutOnboardingModalProps {
  open: boolean
  onClose: () => void
  onStatusChange?: () => void
}

type ConnectInstance = Awaited<ReturnType<typeof loadConnectAndInitialize>>

/**
 * Cleaner modal for Stripe Connect embedded onboarding
 * Minimalist design - direct to Stripe without unnecessary info boxes
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

    // Show toast
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
      <div className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Minimal Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Auszahlung einrichten</h2>
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

        {/* Content - Allow scrolling to see full Stripe footer */}
        <div className="flex max-h-[80vh] min-h-0 flex-1 flex-col overflow-y-auto bg-white">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary-600" />
              <p className="text-sm text-gray-500">Stripe wird geladen...</p>
            </div>
          )}

          {/* Fallback Mode - Clean & Simple */}
          {fallbackMode && !loading && (
            <div className="p-8 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
                <Lock className="h-8 w-8 text-primary-600" />
              </div>

              <h3 className="mb-2 text-lg font-medium text-gray-900">Bankkonto verbinden</h3>
              <p className="mx-auto mb-6 max-w-sm text-sm text-gray-500">
                Verbinden Sie Ihr Bankkonto sicher über Stripe, um Auszahlungen zu erhalten.
              </p>

              <button
                type="button"
                onClick={handleFallbackRedirect}
                disabled={fallbackLoading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {fallbackLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Wird geöffnet...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4" />
                    Mit Stripe verbinden
                  </>
                )}
              </button>

              <p className="mt-4 text-xs text-gray-400">
                Sie werden nach Abschluss automatisch zurückgeleitet
              </p>
            </div>
          )}

          {/* Embedded Onboarding - Direct, no info boxes, fills remaining space */}
          {stripeConnectInstance && !loading && !fallbackMode && (
            <>
              <style
                dangerouslySetInnerHTML={{
                  __html: `
                /* Ensure Stripe Connect content is fully visible - no clipping */
                [class*="ConnectAccountOnboarding"] {
                  display: block !important;
                  min-height: auto !important;
                  height: auto !important;
                  margin: 0 !important;
                  padding: 0 !important;
                }
                /* Ensure iframe allows full content to be visible */
                [class*="ConnectAccountOnboarding"] iframe {
                  display: block !important;
                  border: none !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  min-height: 500px !important;
                }
                /* Ensure wrapper allows scrolling */
                [class*="ConnectComponentsProvider"] {
                  display: block !important;
                  height: auto !important;
                  min-height: auto !important;
                  margin: 0 !important;
                  padding: 0 !important;
                }
              `,
                }}
              />
              <div className="flex min-h-[500px] flex-col">
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
