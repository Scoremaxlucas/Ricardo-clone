'use client'

import { loadConnectAndInitialize, StripeConnectInstance } from '@stripe/connect-js'
import { Loader2, Shield, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

interface EmbeddedOnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  onExit: () => void
}

export function EmbeddedOnboardingModal({
  isOpen,
  onClose,
  onComplete,
  onExit,
}: EmbeddedOnboardingModalProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const stripeConnectRef = useRef<StripeConnectInstance | null>(null)
  const mountedRef = useRef(false)

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    const response = await fetch('/api/stripe/connect/account-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.message || 'Fehler beim Laden der Onboarding-Session')
    }

    const data = await response.json()
    return data.client_secret
  }, [])

  useEffect(() => {
    if (!isOpen || mountedRef.current) return

    const initializeStripeConnect = async () => {
      try {
        setLoading(true)
        setError(null)

        const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        if (!publishableKey) {
          throw new Error('Stripe Publishable Key fehlt')
        }

        // Initialize Stripe Connect
        const stripeConnect = await loadConnectAndInitialize({
          publishableKey,
          fetchClientSecret,
          appearance: {
            overlays: 'dialog',
            variables: {
              colorPrimary: '#008080', // Helvenda primary color
              colorBackground: '#ffffff',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              borderRadius: '8px',
            },
          },
          locale: 'de', // German locale
        })

        stripeConnectRef.current = stripeConnect
        mountedRef.current = true

        // Create and mount the onboarding component
        if (containerRef.current) {
          const onboardingComponent = stripeConnect.create('account-onboarding')

          // Listen for exit events
          onboardingComponent.setOnExit(() => {
            console.log('[EmbeddedOnboarding] User exited onboarding')
            onExit()
          })

          // Clear container and mount
          containerRef.current.innerHTML = ''
          containerRef.current.appendChild(onboardingComponent)
        }

        setLoading(false)
      } catch (err: any) {
        console.error('[EmbeddedOnboarding] Initialization error:', err)
        setError(err.message || 'Fehler beim Laden des Onboarding')
        setLoading(false)
      }
    }

    initializeStripeConnect()

    return () => {
      // Cleanup on unmount
      if (stripeConnectRef.current) {
        // Note: Stripe Connect doesn't have an explicit destroy method
        stripeConnectRef.current = null
      }
      mountedRef.current = false
    }
  }, [isOpen, fetchClientSecret, onExit])

  // Handle modal close
  const handleClose = useCallback(() => {
    mountedRef.current = false
    stripeConnectRef.current = null
    onClose()
  }, [onClose])

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleClose()
      }
    },
    [handleClose]
  )

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, handleClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

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
              <p className="text-sm text-gray-500">
                Sie bleiben auf Helvenda. Die Eingaben werden sicher von Stripe verarbeitet.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Schliessen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary-600" />
              <p className="text-sm text-gray-500">Onboarding wird geladen...</p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">Fehler beim Laden</p>
              <p className="mt-1 text-sm text-red-600">{error}</p>
              <button
                type="button"
                onClick={() => {
                  mountedRef.current = false
                  setError(null)
                  setLoading(true)
                  // Re-trigger initialization
                  const event = new Event('reinit')
                  window.dispatchEvent(event)
                }}
                className="mt-3 rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200"
              >
                Erneut versuchen
              </button>
            </div>
          )}

          {/* Stripe Connect Embedded Component Container */}
          <div ref={containerRef} className={loading || error ? 'hidden' : 'min-h-[400px]'} />
        </div>

        {/* Footer info */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-3">
          <p className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <Shield className="h-3.5 w-3.5" />
            Sichere Zahlungsabwicklung durch Stripe
          </p>
        </div>
      </div>
    </div>
  )
}
