'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'

function LoginPageContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || searchParams.get('redirect') || '/'

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
        setError(`Fehler: ${result.error}. Bitte überprüfen Sie E-Mail und Passwort.`)
        setIsLoading(false)
        return
      }

      if (result?.ok === true) {
        setEmail('')
        setPassword('')
        const updatedSession = await getSession()
        console.log('Session updated:', updatedSession?.user?.email)
        setTimeout(() => {
          router.push(callbackUrl)
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
      <div className="space-y-8 rounded-xl bg-white px-8 py-10 shadow-lg ring-1 ring-gray-100">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <Logo size="lg" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Bei Ihrem Konto anmelden
          </h2>
          <p className="mt-3 text-center text-sm text-gray-600">
            Oder{' '}
            <Link
              href="/register"
              className="font-semibold text-primary-600 transition-colors hover:text-primary-700"
            >
              erstellen Sie ein neues Konto
            </Link>
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
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-Mail-Adresse
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="relative mt-1 block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:z-10 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 sm:text-sm"
                placeholder="ihre@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Passwort
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="relative block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-gray-900 placeholder-gray-400 transition-colors focus:z-10 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm"
                  placeholder="Ihr Passwort"
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
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary-600 transition-colors focus:ring-2 focus:ring-primary-500/20"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Angemeldet bleiben
              </label>
            </div>

            <div className="text-sm">
              <Link
                href="/forgot-password"
                className="font-semibold text-primary-600 transition-colors hover:text-primary-700"
              >
                Passwort vergessen?
              </Link>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              variant="primary-teal"
              disabled={isLoading}
              loading={isLoading}
              className="w-full"
            >
              {isLoading ? 'Wird angemeldet...' : 'Anmelden'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary-600" />
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}
