'use client'

import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { validateCallbackUrl } from '@/lib/url-validation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { getSession, signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

function LoginPageContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawCallbackUrl = searchParams.get('callbackUrl') || searchParams.get('redirect') || '/'
  const callbackUrl = validateCallbackUrl(rawCallbackUrl)

  /** Default `/` keeps Marktplatz on helvenda.ch; `/meine-matches` is redirected to wohnen by middleware. */
  const determinePostLoginRoute = () => {
    if (callbackUrl && callbackUrl !== '/') return callbackUrl
    return '/'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!email || !password) {
      setError('Bitte füllen Sie alle Felder aus.')
      return
    }

    const emailValue = email.trim()
    const passwordValue = password

    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: emailValue,
        password: passwordValue,
        redirect: false,
      })

      if (result?.error) {
        console.error('Login error:', result.error)
        // Check for email not verified error
        if (
          result.error.includes('EMAIL_NOT_VERIFIED') ||
          result.error.includes('CredentialsSignin')
        ) {
          // Could be email not verified - show helpful message
          setError(
            'Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre E-Mail und Passwort. Falls Sie Ihre E-Mail noch nicht bestätigt haben, klicken Sie auf den Bestätigungslink in Ihrer E-Mail.'
          )
        } else {
          setError(`Fehler: ${result.error}. Bitte überprüfen Sie E-Mail und Passwort.`)
        }
        setIsLoading(false)
        return
      }

      if (result?.ok === true) {
        setEmail('')
        setPassword('')
        await getSession()
        const postLoginHref = determinePostLoginRoute()
        setTimeout(() => {
          router.push(postLoginHref)
          router.refresh()
        }, 100)
      } else {
        console.error('❌ Unexpected login result')
        setError('Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.')
        setIsLoading(false)
      }
    } catch (error: any) {
      console.error('❌ Login exception:', error)
      setError(`Fehler: ${error.message || 'Unbekannter Fehler'}`)
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl bg-white px-6 py-6 shadow-xl ring-1 ring-gray-100 md:px-8 md:py-8">
        {/* Header - Kompakter */}
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <Logo size="md" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Willkommen zurück</h1>
          <p className="mt-2 text-sm text-gray-500">
            Melden Sie sich bei Ihrem Konto an
          </p>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="animate-shake rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* E-Mail Input */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
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
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 transition-all focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                placeholder="ihre@email.com"
              />
            </div>

            {/* Passwort Input */}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                Passwort
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 pr-12 text-gray-900 placeholder-gray-400 transition-all focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Options Row */}
          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600">Angemeldet bleiben</span>
            </label>

            <Link
              href="/forgot-password"
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Passwort vergessen?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            loading={isLoading}
            className="w-full py-3"
          >
            {isLoading ? 'Wird angemeldet...' : 'Anmelden'}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-3 text-gray-400">oder</span>
          </div>
        </div>

        {/* Google Sign In */}
        <button
          type="button"
          onClick={() => {
            setIsLoading(true)
            void signIn('google', { callbackUrl: determinePostLoginRoute() })
          }}
          disabled={isLoading}
          className="mt-4 flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l3.56-2.77z" /* Typo fix: closing was wrong */ />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Mit Google anmelden
        </button>

        {/* Footer Link */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Noch kein Konto?{' '}
          <Link
            href="/register"
            className="font-semibold text-primary-600 hover:text-primary-700"
          >
            Jetzt registrieren
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
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
      <LoginPageContent />
    </Suspense>
  )
}
