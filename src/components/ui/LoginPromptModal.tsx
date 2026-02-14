/**
 * LoginPromptModal - Helvenda-styled modal for login prompts
 *
 * Consistent design matching Helvenda brand:
 * - Clean, modern modal with rounded corners
 * - Primary teal button for login action
 * - Secondary register link (Ricardo-style)
 * - Subtle shadow and backdrop
 * - Mobile responsive
 * - Smooth animations (Ricardo-style)
 */

'use client'

import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from './Button'
import { Logo } from './Logo'

interface LoginPromptModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message?: string
  loginButtonText?: string
  registerButtonText?: string
  loginHref?: string
}

export function LoginPromptModal({
  isOpen,
  onClose,
  title = 'Anmeldung erforderlich',
  message = 'Bitte melden Sie sich an oder erstellen Sie ein Konto, um diese Funktion zu nutzen.',
  loginButtonText = 'Anmelden',
  registerButtonText = 'Konto erstellen',
  loginHref,
}: LoginPromptModalProps) {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true)
        })
      })
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    } else {
      setIsAnimating(false)
      document.body.style.overflow = ''
      const timer = setTimeout(() => setIsVisible(false), 200)
      return () => clearTimeout(timer)
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isVisible) return null

  const callbackUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/'

  const handleLogin = () => {
    const href = loginHref || `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
    router.push(href)
    onClose()
  }

  const handleRegister = () => {
    router.push(`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`)
    onClose()
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-200 ${
        isAnimating ? 'bg-black/40' : 'bg-black/0'
      }`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-prompt-title"
    >
      <div
        className={`relative w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-gray-100 transition-all duration-300 ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-600 active:scale-95"
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
          <h2 id="login-prompt-title" className="mb-3 text-2xl font-bold tracking-tight text-gray-900">
            {title}
          </h2>

          {/* Message */}
          <p className="mb-6 text-sm leading-relaxed text-gray-600">
            {message}
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              onClick={handleLogin}
              className="w-full"
            >
              {loginButtonText}
            </Button>

            <button
              onClick={handleRegister}
              className="w-full rounded-lg border-2 border-primary-600 px-4 py-2.5 text-sm font-semibold text-primary-600 transition-colors hover:bg-primary-50 active:scale-[0.98]"
            >
              {registerButtonText}
            </button>
          </div>

          {/* Divider + benefit text */}
          <div className="mt-5 border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400">
              Kostenlos registrieren und alle Vorteile von Helvenda nutzen.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
