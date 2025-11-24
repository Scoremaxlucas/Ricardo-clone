'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export default function VerifyEmailPage() {
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
    <div className="min-h-screen bg-black flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Abstract background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-gray-800 to-transparent rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-gray-800 to-transparent rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center">
          {/* Logo/Icon */}
          <div className="mx-auto mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-white/10 backdrop-blur-sm">
              <span className="text-white font-bold text-2xl">H</span>
            </div>
          </div>

          {/* Status Icon */}
          {status === 'loading' && (
            <div className="mx-auto mb-8 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-white/10 rounded-full blur-xl"></div>
                <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-full p-6">
                  <Loader2 className="w-12 h-12 text-white animate-spin" strokeWidth={1.5} />
                </div>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="mx-auto mb-8 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl"></div>
                <div className="relative bg-green-500/10 backdrop-blur-sm border border-green-500/20 rounded-full p-6">
                  <CheckCircle2 className="w-12 h-12 text-green-400" strokeWidth={1.5} />
                </div>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="mx-auto mb-8 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl"></div>
                <div className="relative bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-full p-6">
                  <XCircle className="w-12 h-12 text-red-400" strokeWidth={1.5} />
                </div>
              </div>
            </div>
          )}

          {/* Heading */}
          {status === 'loading' && (
            <>
              <h1 className="text-3xl font-bold text-white mb-4">
                Confirming your account
              </h1>
              <p className="text-gray-300 text-lg">
                Please wait a moment...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <h1 className="text-3xl font-bold text-white mb-4">
                Account Confirmed
              </h1>
              <p className="text-gray-300 text-lg mb-8">
                {message}
              </p>
              <p className="text-gray-500 text-sm mb-8">
                You will be redirected to the login page shortly...
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200"
              >
                Go to login →
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <h1 className="text-3xl font-bold text-white mb-4">
                Error
              </h1>
              <p className="text-gray-300 text-lg mb-8">
                {message}
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200"
              >
                Go to login →
              </Link>
              <p className="mt-6 text-sm text-gray-500">
                If you have any issue confirming your account, please{' '}
                <a 
                  href="mailto:support@helvenda.ch" 
                  className="text-white hover:underline"
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
  )
}
