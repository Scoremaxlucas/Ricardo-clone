'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    
    if (!token) {
      setStatus('error')
      setMessage('Kein Bestätigungstoken gefunden')
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
          setMessage(data.message || 'E-Mail-Adresse erfolgreich bestätigt!')
          setTimeout(() => {
            router.push('/login')
          }, 3000)
        } else {
          setStatus('error')
          setMessage(data.message || 'Fehler bei der Bestätigung')
        }
      } catch (error) {
        setStatus('error')
        setMessage('Ein Fehler ist aufgetreten')
      }
    }

    verifyEmail()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">W</span>
          </div>
          
          {status === 'loading' && (
            <>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                E-Mail wird bestätigt...
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Bitte warten Sie einen Moment
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mt-6 text-green-600">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                E-Mail bestätigt!
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {message}
              </p>
              <p className="mt-4 text-sm text-gray-500">
                Sie werden in Kürze zur Anmeldeseite weitergeleitet...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mt-6 text-red-600">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Fehler
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {message}
              </p>
              <div className="mt-6">
                <Link
                  href="/login"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  Zur Anmeldeseite
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
