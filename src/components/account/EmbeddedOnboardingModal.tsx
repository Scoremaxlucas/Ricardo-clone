'use client'

import { ExternalLink, Loader2, Shield, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface EmbeddedOnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  onExit: () => void
}

/**
 * Modal for Stripe Connect onboarding
 * Uses the redirect flow (account-link) which is more reliable for Express accounts
 * The embedded components SDK has limitations with Express accounts
 */
export function EmbeddedOnboardingModal({
  isOpen,
  onClose,
  onComplete,
  onExit,
}: EmbeddedOnboardingModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Start the onboarding redirect flow
  const handleStartOnboarding = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/connect/account-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ return_to: '/my-watches/account' }),
      })

      const data = await response.json()

      if (response.ok && data.url) {
        // Redirect to Stripe onboarding
        window.location.href = data.url
      } else {
        throw new Error(data.message || data.error || 'Fehler beim Starten der Einrichtung')
      }
    } catch (err: any) {
      console.error('[EmbeddedOnboarding] Error:', err)
      setError(err.message || 'Fehler beim Starten der Einrichtung')
      setLoading(false)
    }
  }, [])

  // Handle modal close
  const handleClose = useCallback(() => {
    if (!loading) {
      onClose()
    }
  }, [loading, onClose])

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !loading) {
        handleClose()
      }
    },
    [handleClose, loading]
  )

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, handleClose, loading])

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
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary-100 p-2">
              <Shield className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Auszahlung einrichten</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Schliessen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6 text-center">
            <p className="text-sm text-gray-600">
              Um Verkaufserlöse aus Zahlungsschutz-Verkäufen zu erhalten, müssen Sie Ihre
              Auszahlungsdaten bei unserem Zahlungspartner Stripe einrichten.
            </p>
          </div>

          {/* What you'll need */}
          <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="mb-3 text-sm font-medium text-gray-900">Was Sie benötigen:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-xs text-primary-700">
                  ✓
                </span>
                Schweizer Bankverbindung (IBAN)
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-xs text-primary-700">
                  ✓
                </span>
                Ausweisdokument (ID oder Pass)
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-xs text-primary-700">
                  ✓
                </span>
                Persönliche Angaben
              </li>
            </ul>
            <p className="mt-3 text-xs text-gray-500">Der Prozess dauert ca. 5 Minuten.</p>
          </div>

          {/* Error display */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* CTA Button */}
          <button
            type="button"
            onClick={handleStartOnboarding}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Wird gestartet...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4" />
                Jetzt einrichten
              </>
            )}
          </button>

          {/* Info text */}
          <p className="mt-4 text-center text-xs text-gray-500">
            Sie werden zu Stripe weitergeleitet und nach Abschluss automatisch zurück zu Helvenda
            gebracht.
          </p>
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
