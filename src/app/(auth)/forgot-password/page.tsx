'use client'

import { AuthBrandLogo } from '@/components/layout/AuthBrandLogo'
import { Button } from '@/components/ui/Button'
import { useAuthWohnenSurface } from '@/contexts/AuthSurfaceContext'
import { authCardShellClass, authInputClass, authLabelClass, authLinkAccentClass } from '@/lib/auth-surface-classes'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ForgotPasswordPage() {
  const isWohnen = useAuthWohnenSurface()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess(false)

    if (!email) {
      setError('Bitte geben Sie Ihre E-Mail-Adresse ein.')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        setError(data.message || 'Ein Fehler ist aufgetreten.')
      }
    } catch (error) {
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className={cn(authCardShellClass(isWohnen), 'space-y-8 px-8 py-10')}>
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <AuthBrandLogo isSic={isWohnen} />
          </div>
          <h2
            className={cn(
              'mt-6 text-center text-3xl font-bold tracking-tight',
              isWohnen ? 'font-extrabold text-[#0d2b1f]' : 'text-gray-900'
            )}
          >
            Passwort zurücksetzen
          </h2>
          <p className={cn('mt-3 text-center text-sm', isWohnen ? 'text-[#5a7a6e]' : 'text-gray-600')}>
            Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen des
            Passworts.
          </p>
        </div>

        {success ? (
          <div className="space-y-4">
            <div
              className={cn(
                'rounded-lg border px-4 py-3 text-sm',
                isWohnen
                  ? 'border-[#bfe8d4] bg-[#f0faf5] text-[#107a5a]'
                  : 'border-green-200 bg-green-50 text-green-600'
              )}
            >
              Wir haben Ihnen eine E-Mail mit Anweisungen zum Zurücksetzen Ihres Passworts gesendet.
            </div>
            <Link href="/login">
              <Button variant="primary" className="w-full">
                Zurück zur Anmeldung
              </Button>
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className={cn(authLabelClass(isWohnen), 'block')}>
                E-Mail-Adresse
              </label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={cn(authInputClass(isWohnen), 'relative mt-1 sm:text-sm')}
                placeholder="ihre@email.com"
              />
            </div>

            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
                loading={isLoading}
                className="w-full"
              >
                {isLoading ? 'Wird gesendet...' : 'Link senden'}
              </Button>
              <Link href="/login" className={cn('text-center', authLinkAccentClass(isWohnen, 'medium'))}>
                Zurück zur Anmeldung
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
