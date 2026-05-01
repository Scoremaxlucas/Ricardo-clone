'use client'

import { Logo } from '@/components/ui/Logo'
import { WOHNEN_SITE_ORIGIN } from '@/lib/site-urls'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

function normalizeOrigin(origin: string) {
  return origin.replace(/\/$/, '')
}

function isWohnenTenantHost(): boolean {
  if (typeof window === 'undefined') return false
  return normalizeOrigin(window.location.origin) === normalizeOrigin(WOHNEN_SITE_ORIGIN)
}

function VerifyEmailPageContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [wohnenFlow, setWohnenFlow] = useState(false)

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setStatus('error')
      setMessage('No confirmation token found')
      return
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`, {
          method: 'GET',
        })

        const data = await response.json()

        if (response.ok) {
          setWohnenFlow(isWohnenTenantHost())
          setStatus('success')
          setMessage(data.message || 'Ihre E-Mail-Adresse wurde erfolgreich bestätigt!')
        } else {
          setStatus('error')
          setMessage(data.message || 'Error confirming email address')
        }
      } catch (error) {
        setStatus('error')
        setMessage('An error occurred')
      }
    }

    verifyEmail()
  }, [searchParams])

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-50 px-4 sm:px-6 lg:px-8">
      {/* Subtle background patterns */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-gradient-to-br from-primary-100 to-transparent opacity-30 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-gradient-to-tr from-primary-100 to-transparent opacity-30 blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <div className="text-center">
            {/* Logo/Icon */}
            <div className="mx-auto mb-8">
              <Logo size="lg" />
            </div>

            {/* Status Icon */}
            {status === 'loading' && (
              <div className="mx-auto mb-8 flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-primary-100 blur-xl"></div>
                  <div className="relative rounded-full border-2 border-primary-200 bg-primary-50 p-6">
                    <Loader2
                      className="h-12 w-12 animate-spin text-primary-600"
                      strokeWidth={1.5}
                    />
                  </div>
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="mx-auto mb-8 flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-green-100 blur-xl"></div>
                  <div className="relative rounded-full border-2 border-green-200 bg-green-50 p-6">
                    <CheckCircle2 className="h-12 w-12 text-green-600" strokeWidth={1.5} />
                  </div>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="mx-auto mb-8 flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-red-100 blur-xl"></div>
                  <div className="relative rounded-full border-2 border-red-200 bg-red-50 p-6">
                    <XCircle className="h-12 w-12 text-red-600" strokeWidth={1.5} />
                  </div>
                </div>
              </div>
            )}

            {/* Heading */}
            {status === 'loading' && (
              <>
                <h1 className="mb-4 text-3xl font-semibold text-gray-900">
                  Confirming your account
                </h1>
                <p className="text-lg text-gray-600">Please wait a moment...</p>
              </>
            )}

            {status === 'success' && (
              <>
                <h1 className="mb-4 text-3xl font-semibold text-gray-900">Konto bestätigt!</h1>
                <p className="mb-6 text-lg text-gray-600">{message}</p>

                {wohnenFlow ?
                  <>
                    <div className="mb-6 rounded-xl border border-primary-100 bg-primary-50 p-4 text-left">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary-600">Nächster Schritt</p>
                      <p className="text-sm text-gray-700">
                        Melden Sie sich an und vervollständigen Sie Ihr Suchprofil. Bei Bedarf können Sie einen Betreibungsregisterauszug hochladen — viele Vermieter erwarten das bei Bewerbungen.
                      </p>
                    </div>
                    <div className="flex flex-col gap-3">
                      <Link
                        href="/login?callbackUrl=%2Fmeine-matches"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 px-6 py-3 font-medium text-white transition-all duration-200 hover:bg-primary-700 hover:shadow-md"
                      >
                        Anmelden und weiter →
                      </Link>
                      <Link
                        href="/wohnungen"
                        className="inline-flex w-full items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 py-3 font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50"
                      >
                        Wohnungen ansehen
                      </Link>
                    </div>
                    <p className="mt-4 text-xs text-gray-400">
                      Profil und Dokumente können Sie jederzeit unter «Mein Profil» ergänzen.
                    </p>
                  </>
                : <>
                    <div className="mb-6 rounded-xl border border-primary-100 bg-primary-50 p-4 text-left">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary-600">Nächster Schritt</p>
                      <p className="text-sm text-gray-700">
                        Um auf Helvenda <strong>verkaufen</strong> zu können, verifizieren Sie Ihre Identität. Dies dauert nur wenige Minuten.
                      </p>
                    </div>
                    <div className="flex flex-col gap-3">
                      <Link
                        href="/verification"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 px-6 py-3 font-medium text-white transition-all duration-200 hover:bg-primary-700 hover:shadow-md"
                      >
                        Identität verifizieren →
                      </Link>
                      <Link
                        href="/login"
                        className="inline-flex w-full items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 py-3 font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50"
                      >
                        Erst einmal stöbern
                      </Link>
                    </div>
                    <p className="mt-4 text-xs text-gray-400">
                      Sie können die Identitätsverifizierung auch später unter «Meine Angebote» nachholen.
                    </p>
                  </>
                }
              </>
            )}

            {status === 'error' && (
              <>
                <h1 className="mb-4 text-3xl font-semibold text-gray-900">Error</h1>
                <p className="mb-8 text-lg text-gray-600">{message}</p>
                <Link
                  href="/login"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-primary-600 px-6 py-3 font-medium text-white transition-all duration-200 hover:bg-primary-700 hover:shadow-md"
                >
                  Go to login →
                </Link>
                <p className="mt-6 text-sm text-gray-500">
                  If you have any issue confirming your account, please{' '}
                  <a
                    href="mailto:support@helvenda.ch"
                    className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
                  >
                    contact support
                  </a>
                  .
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
            <p className="text-gray-600">Laden...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailPageContent />
    </Suspense>
  )
}
