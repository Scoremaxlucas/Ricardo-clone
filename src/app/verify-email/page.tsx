'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 sm:px-6 lg:px-8">
      {/* Abstract background patterns */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-gradient-to-br from-gray-800 to-transparent opacity-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-gradient-to-tr from-gray-800 to-transparent opacity-20 blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center">
          {/* Logo/Icon */}
          <div className="mx-auto mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
              <span className="text-2xl font-bold text-white">H</span>
            </div>
          </div>

          {/* Status Icon */}
          {status === 'loading' && (
            <div className="mx-auto mb-8 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-white/10 blur-xl"></div>
                <div className="relative rounded-full border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                  <Loader2 className="h-12 w-12 animate-spin text-white" strokeWidth={1.5} />
                </div>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="mx-auto mb-8 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-green-500/20 blur-xl"></div>
                <div className="relative rounded-full border border-green-500/20 bg-green-500/10 p-6 backdrop-blur-sm">
                  <CheckCircle2 className="h-12 w-12 text-green-400" strokeWidth={1.5} />
                </div>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="mx-auto mb-8 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-red-500/20 blur-xl"></div>
                <div className="relative rounded-full border border-red-500/20 bg-red-500/10 p-6 backdrop-blur-sm">
                  <XCircle className="h-12 w-12 text-red-400" strokeWidth={1.5} />
                </div>
              </div>
            </div>
          )}

          {/* Heading */}
          {status === 'loading' && (
            <>
              <h1 className="mb-4 text-3xl font-bold text-white">Confirming your account</h1>
              <p className="text-lg text-gray-300">Please wait a moment...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <h1 className="mb-4 text-3xl font-bold text-white">Account Confirmed</h1>
              <p className="mb-8 text-lg text-gray-300">{message}</p>
              <p className="mb-8 text-sm text-gray-500">
                You will be redirected to the login page shortly...
              </p>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-lg bg-white px-6 py-3 font-medium text-black transition-colors duration-200 hover:bg-gray-100"
              >
                Go to login →
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <h1 className="mb-4 text-3xl font-bold text-white">Error</h1>
              <p className="mb-8 text-lg text-gray-300">{message}</p>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-lg bg-white px-6 py-3 font-medium text-black transition-colors duration-200 hover:bg-gray-100"
              >
                Go to login →
              </Link>
              <p className="mt-6 text-sm text-gray-500">
                If you have any issue confirming your account, please{' '}
                <a href="mailto:support@helvenda.ch" className="text-white hover:underline">
                  contact support
                </a>
                .
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    }>
      <VerifyEmailPageContent />
    </Suspense>
  )
}
