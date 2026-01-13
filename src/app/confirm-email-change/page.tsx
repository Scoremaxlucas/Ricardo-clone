'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { AlertCircle, CheckCircle, Clock, Loader2, XCircle } from 'lucide-react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

type ConfirmationState = 'loading' | 'success' | 'error' | 'expired'

interface ConfirmationResult {
  state: ConfirmationState
  message: string
  newEmail?: string
}

function ConfirmEmailChangeContent() {
  const searchParams = useSearchParams()
  const token = searchParams?.get('token')

  const [result, setResult] = useState<ConfirmationResult>({
    state: 'loading',
    message: 'E-Mail-Änderung wird bestätigt...',
  })

  useEffect(() => {
    const confirmEmailChange = async () => {
      if (!token) {
        setResult({
          state: 'error',
          message: 'Kein Bestätigungstoken vorhanden. Bitte verwenden Sie den Link aus der E-Mail.',
        })
        return
      }

      try {
        const res = await fetch(`/api/account/confirm-email-change?token=${token}`)
        const data = await res.json()

        if (res.ok && data.success) {
          setResult({
            state: 'success',
            message: data.message || 'Ihre E-Mail-Adresse wurde erfolgreich geändert!',
            newEmail: data.newEmail,
          })
        } else if (data.expired) {
          setResult({
            state: 'expired',
            message: data.message || 'Der Bestätigungslink ist abgelaufen.',
          })
        } else {
          setResult({
            state: 'error',
            message: data.message || 'Die Bestätigung ist fehlgeschlagen.',
          })
        }
      } catch (error) {
        setResult({
          state: 'error',
          message: 'Ein Netzwerkfehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
        })
      }
    }

    confirmEmailChange()
  }, [token])

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        {/* Loading State */}
        {result.state === 'loading' && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Wird bestätigt...</h1>
            <p className="text-gray-600">{result.message}</p>
          </>
        )}

        {/* Success State */}
        {result.state === 'success' && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">E-Mail geändert!</h1>
            <p className="mb-4 text-gray-600">{result.message}</p>

            {result.newEmail && (
              <div className="mb-6 rounded-lg bg-green-50 p-4">
                <p className="text-sm text-green-800">
                  Ihre neue E-Mail-Adresse:{' '}
                  <span className="font-semibold">{result.newEmail}</span>
                </p>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Bitte melden Sie sich mit Ihrer neuen E-Mail-Adresse an.
              </p>
              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-full bg-primary-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-700"
              >
                Neu anmelden
              </button>
            </div>
          </>
        )}

        {/* Expired State */}
        {result.state === 'expired' && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Link abgelaufen</h1>
            <p className="mb-6 text-gray-600">{result.message}</p>

            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Sie können eine neue E-Mail-Änderung in Ihren Kontoeinstellungen anfordern.
              </p>
              <Link
                href="/my-watches/account"
                className="inline-flex items-center justify-center rounded-full bg-primary-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-700"
              >
                Zu den Einstellungen
              </Link>
            </div>
          </>
        )}

        {/* Error State */}
        {result.state === 'error' && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Fehler</h1>
            <p className="mb-6 text-gray-600">{result.message}</p>

            <div className="space-y-3">
              <Link
                href="/my-watches/account"
                className="inline-flex items-center justify-center rounded-full bg-primary-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-700"
              >
                Zu den Einstellungen
              </Link>
              <p className="text-sm text-gray-500">
                Bei weiteren Problemen kontaktieren Sie unseren{' '}
                <Link href="/hilfe" className="text-primary-600 underline hover:text-primary-700">
                  Support
                </Link>
                .
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function ConfirmEmailChangePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <Suspense
          fallback={
            <div className="flex min-h-[400px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          }
        >
          <ConfirmEmailChangeContent />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
