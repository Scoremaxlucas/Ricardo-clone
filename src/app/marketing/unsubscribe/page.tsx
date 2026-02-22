'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { CheckCircle, Loader2, MailX, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [alreadyUnsubscribed, setAlreadyUnsubscribed] = useState(false)
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Kein gültiger Abmelde-Link.')
      setLoading(false)
      return
    }

    fetch(`/api/marketing/unsubscribe?token=${encodeURIComponent(token)}`)
      .then(res => {
        if (!res.ok) throw new Error('Ungültiger Link')
        return res.json()
      })
      .then(data => {
        setMaskedEmail(data.email)
        if (data.status === 'unsubscribed') {
          setAlreadyUnsubscribed(true)
        }
      })
      .catch(() => {
        setError('Dieser Abmelde-Link ist ungültig oder abgelaufen.')
      })
      .finally(() => setLoading(false))
  }, [token])

  const handleUnsubscribe = async () => {
    if (!token) return
    setProcessing(true)
    setError(null)

    try {
      const res = await fetch('/api/marketing/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Fehler')
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error && !maskedEmail) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-red-400" />
        <h1 className="mb-2 text-xl font-bold text-gray-900">Link ungültig</h1>
        <p className="mb-6 text-gray-600">{error}</p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
        >
          Zur Startseite
        </Link>
      </div>
    )
  }

  if (success || alreadyUnsubscribed) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
        <h1 className="mb-2 text-xl font-bold text-gray-900">
          {alreadyUnsubscribed && !success ? 'Bereits abgemeldet' : 'Erfolgreich abgemeldet'}
        </h1>
        <p className="mb-6 text-gray-600">
          {alreadyUnsubscribed && !success
            ? 'Sie haben sich bereits von unseren Marketing-E-Mails abgemeldet.'
            : 'Sie erhalten keine Marketing-E-Mails mehr von Helvenda.'}
        </p>
        {maskedEmail && (
          <p className="mb-6 text-sm text-gray-500">
            E-Mail: <span className="font-medium">{maskedEmail}</span>
          </p>
        )}
        <Link
          href="/"
          className="inline-block rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
        >
          Zur Startseite
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg py-8 sm:py-12">
      <div className="mb-8 text-center">
        <MailX className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h1 className="mb-2 text-xl font-bold text-gray-900 sm:text-2xl">
          Marketing-E-Mails abbestellen
        </h1>
        {maskedEmail && (
          <p className="text-sm text-gray-500">
            Abmeldung für <span className="font-medium">{maskedEmail}</span>
          </p>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mx-auto max-w-md">
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
          <p className="mb-6 text-sm text-gray-600">
            Möchten Sie keine Marketing-E-Mails und Newsletter mehr von Helvenda erhalten? Klicken
            Sie unten, um sich abzumelden.
          </p>

          <button
            onClick={handleUnsubscribe}
            disabled={processing}
            className="w-full rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Wird verarbeitet...
              </span>
            ) : (
              'Marketing-E-Mails abbestellen'
            )}
          </button>

          <p className="mt-4 text-xs text-gray-400">
            Sie erhalten weiterhin wichtige E-Mails zu Ihrem Konto und Ihren Transaktionen.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function MarketingUnsubscribePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="flex-1 px-4">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          }
        >
          <UnsubscribeContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
