'use client'

import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { useAuthWohnenSurface } from '@/contexts/AuthSurfaceContext'
import { authCardShellClass, authInputClass, authLabelClass, authLinkAccentClass } from '@/lib/auth-surface-classes'
import { cn } from '@/lib/utils'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

function ResetPasswordContent() {
  const isWohnen = useAuthWohnenSurface()
  const cardClass = cn(authCardShellClass(isWohnen), 'space-y-8 px-8 py-10')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!token) {
      setError('Ungültiger oder fehlender Token.')
      setIsLoading(false)
      return
    }

    if (!password || !confirmPassword) {
      setError('Bitte füllen Sie alle Felder aus.')
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein.')
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen lang sein.')
      setIsLoading(false)
      return
    }

    if (!/\d/.test(password)) {
      setError('Passwort muss mindestens eine Zahl enthalten.')
      setIsLoading(false)
      return
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      setError('Passwort muss mindestens ein Sonderzeichen enthalten.')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        setError(data.message || 'Ein Fehler ist aufgetreten.')
      }
    } catch (error) {
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="w-full max-w-md">
        <div className={cardClass}>
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <Logo size="lg" />
            </div>
            <h2
              className={cn(
                'mt-6 text-center text-3xl font-bold tracking-tight',
                isWohnen ? 'font-extrabold text-[#0d2b1f]' : 'text-gray-900'
              )}
            >
              Ungültiger Link
            </h2>
            <p className={cn('mt-3 text-center text-sm', isWohnen ? 'text-[#5a7a6e]' : 'text-gray-600')}>
              Der Link zum Zurücksetzen des Passworts ist ungültig oder abgelaufen.
            </p>
            <Link href="/forgot-password" className={cn('mt-4 inline-block', authLinkAccentClass(isWohnen))}>
              Neuen Link anfordern
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="w-full max-w-md">
        <div className={cardClass}>
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <Logo size="lg" />
            </div>
            <h2
              className={cn(
                'mt-6 text-center text-3xl font-bold tracking-tight',
                isWohnen ? 'font-extrabold text-[#0d2b1f]' : 'text-gray-900'
              )}
            >
              Passwort erfolgreich zurückgesetzt
            </h2>
            <p className={cn('mt-3 text-center text-sm', isWohnen ? 'text-[#5a7a6e]' : 'text-gray-600')}>
              Sie werden in Kürze zur Anmeldeseite weitergeleitet.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className={cardClass}>
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <Logo size="lg" />
          </div>
          <h2
            className={cn(
              'mt-6 text-center text-3xl font-bold tracking-tight',
              isWohnen ? 'font-extrabold text-[#0d2b1f]' : 'text-gray-900'
            )}
          >
            Neues Passwort festlegen
          </h2>
          <p className={cn('mt-3 text-center text-sm', isWohnen ? 'text-[#5a7a6e]' : 'text-gray-600')}>
            Geben Sie Ihr neues Passwort ein.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="password" className={cn(authLabelClass(isWohnen), 'block')}>
                Neues Passwort
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={cn(authInputClass(isWohnen), 'relative pr-10 sm:text-sm')}
                  placeholder="Mindestens 8 Zeichen, Zahl und Sonderzeichen"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={cn(
                    'absolute inset-y-0 right-0 flex items-center pr-3',
                    isWohnen ? 'text-slate-400 hover:text-[#107a5a]' : 'text-gray-400 hover:text-gray-600'
                  )}
                >
                  {showPassword ?
                    <EyeOff className="h-5 w-5" />
                  : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className={cn(authLabelClass(isWohnen), 'block')}>
                Passwort bestätigen
              </label>
              <div className="relative mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className={cn(authInputClass(isWohnen), 'relative pr-10 sm:text-sm')}
                  placeholder="Passwort wiederholen"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={cn(
                    'absolute inset-y-0 right-0 flex items-center pr-3',
                    isWohnen ? 'text-slate-400 hover:text-[#107a5a]' : 'text-gray-400 hover:text-gray-600'
                  )}
                >
                  {showConfirmPassword ?
                    <EyeOff className="h-5 w-5" />
                  : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              loading={isLoading}
              className="w-full"
            >
              {isLoading ? 'Wird gespeichert...' : 'Passwort zurücksetzen'}
            </Button>
            <Link href="/login" className={cn('text-center', authLinkAccentClass(isWohnen, 'medium'))}>
              Zurück zur Anmeldung
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary-600" />
            <p className="text-gray-600">Laden...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
