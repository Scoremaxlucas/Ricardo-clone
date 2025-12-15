/**
 * LoginPromptModal - Helvenda-styled modal for login prompts
 * 
 * Consistent design matching Helvenda brand:
 * - Clean, modern modal with rounded corners
 * - Primary teal button for login action
 * - Subtle shadow and backdrop
 * - Mobile responsive
 */

'use client'

import { X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from './Button'
import { Logo } from './Logo'

interface LoginPromptModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message?: string
  loginButtonText?: string
  loginHref?: string
}

export function LoginPromptModal({
  isOpen,
  onClose,
  title = 'Anmeldung erforderlich',
  message = 'Bitte melden Sie sich an, um diese Funktion zu nutzen.',
  loginButtonText = 'Anmelden',
  loginHref,
}: LoginPromptModalProps) {
  const router = useRouter()

  if (!isOpen) return null

  const handleLogin = () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/'
    const href = loginHref || `/login?callbackUrl=${encodeURIComponent(currentUrl)}`
    router.push(href)
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-xl bg-white shadow-2xl ring-1 ring-gray-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="Schließen"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="px-6 py-8 text-center sm:px-8">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <Logo size="md" />
          </div>

          {/* Title */}
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-gray-900">
            {title}
          </h2>

          {/* Message */}
          <p className="mb-6 text-sm text-gray-600">
            {message}
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              variant="primary-teal"
              onClick={handleLogin}
              className="w-full sm:w-auto sm:px-8"
            >
              {loginButtonText}
            </Button>
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
