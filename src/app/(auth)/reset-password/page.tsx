'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'

function ResetPasswordContent() {
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

    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein.')
      setIsLoading(false)
      return
    }

    try {
      // TODO: Implement reset password API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (error) {
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="w-full max-w-md">
        <div className="space-y-8 rounded-xl bg-white px-8 py-10 shadow-lg ring-1 ring-gray-100">
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <Logo size="lg" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
              Ungültiger Link
            </h2>
            <p className="mt-3 text-center text-sm text-gray-600">
              Der Link zum Zurücksetzen des Passworts ist ungültig oder abgelaufen.
            </p>
            <Link href="/forgot-password" className="mt-4 inline-block text-sm font-semibold text-primary-600 hover:text-primary-700">
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
        <div className="space-y-8 rounded-xl bg-white px-8 py-10 shadow-lg ring-1 ring-gray-100">
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <Logo size="lg" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
              Passwort erfolgreich zurückgesetzt
            </h2>
            <p className="mt-3 text-center text-sm text-gray-600">
              Sie werden in Kürze zur Anmeldeseite weitergeleitet.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="space-y-8 rounded-xl bg-white px-8 py-10 shadow-lg ring-1 ring-gray-100">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <Logo size="lg" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Neues Passwort festlegen
          </h2>
          <p className="mt-3 text-center text-sm text-gray-600">
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Neues Passwort
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="relative block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-gray-900 placeholder-gray-400 transition-colors focus:z-10 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm"
                  placeholder="Mindestens 6 Zeichen"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Passwort bestätigen
              </label>
              <div className="relative mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="relative block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-gray-900 placeholder-gray-400 transition-colors focus:z-10 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm"
                  placeholder="Passwort wiederholen"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              type="submit"
              variant="primary-teal"
              disabled={isLoading}
              loading={isLoading}
              className="w-full"
            >
              {isLoading ? 'Wird gespeichert...' : 'Passwort zurücksetzen'}
            </Button>
            <Link href="/login" className="text-center text-sm text-gray-600 hover:text-primary-600">
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
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary-600" />
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
