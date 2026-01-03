'use client'

import { Logo } from '@/components/ui/Logo'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

function VerifyEmailPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

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
          setStatus('success')
          setMessage(data.message || 'Email address successfully confirmed!')
          setTimeout(() => {
            router.push('/login')
          }, 3000)
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
  }, [searchParams, router])

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
                <h1 className="mb-4 text-3xl font-semibold text-gray-900">Account Confirmed</h1>
                <p className="mb-8 text-lg text-gray-600">{message}</p>
                <p className="mb-8 text-sm text-gray-500">
                  You will be redirected to the login page shortly...
                </p>
                <Link
                  href="/login"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-primary-600 px-6 py-3 font-medium text-white transition-all duration-200 hover:bg-primary-700 hover:shadow-md"
                >
                  Go to login →
                </Link>
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
