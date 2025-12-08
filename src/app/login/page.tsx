'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Logo } from '@/components/ui/Logo'

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

    // Validierung
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
        // Felder erst jetzt leeren (nach erfolgreichem Login)
        setEmail('')
        setPassword('')
        // Session aktualisieren und dann umleiten
        // Aktualisiere Session explizit
        const updatedSession = await getSession()
        console.log('Session updated:', updatedSession?.user?.email)
        // Verwende router.push statt window.location.href für Client-Side Navigation
        // Warte kurz, damit Session vollständig aktualisiert wird
        setTimeout(() => {
          router.push(callbackUrl)
          router.refresh() // Stelle sicher, dass die Seite aktualisiert wird
        }, 100)
      } else {
        console.error('❌ Unexpected login result')
        console.error('Full result:', result)
        setError('Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.')
        setIsLoading(false)
      }
    } catch (error: any) {
      console.error('❌ Login exception:', error)
      console.error('Error stack:', error.stack)
      setError(`Fehler: ${error.message || 'Unbekannter Fehler'}`)
      setIsLoading(false)
    } finally {
      console.log('=== LOGIN END ===')
    }
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="space-y-8 rounded-lg bg-white px-8 py-10 shadow-xl">
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <Logo size="lg" />
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Bei Ihrem Konto anmelden
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Oder{' '}
                <Link
                  href="/register"
                  className="font-medium text-primary-600 hover:text-primary-500"
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
                    className="relative mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
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
                      className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 pr-10 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-primary-500 focus:outline-none focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-gray-100 sm:text-sm"
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
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Angemeldet bleiben
                  </label>
                </div>

                <div className="text-sm">
                  <Link
                    href="/forgot-password"
                    className="font-medium text-primary-600 hover:text-primary-500"
                  >
                    Passwort vergessen?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative flex w-full justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <span className="mr-2">⏳</span>
                      Wird angemeldet...
                    </>
                  ) : (
                    'Anmelden'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}
