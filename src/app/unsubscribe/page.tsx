'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { CheckCircle, Loader2, Mail, MailX, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userData, setUserData] = useState<{ name: string; email: string } | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Kein gültiger Abmelde-Link.')
      setLoading(false)
      return
    }

    fetch(`/api/email/unsubscribe?token=${encodeURIComponent(token)}`)
      .then(res => {
        if (!res.ok) throw new Error('Ungültiger Link')
        return res.json()
      })
      .then(data => {
        setUserData({ name: data.name, email: data.email })
      })
      .catch(() => {
        setError('Dieser Abmelde-Link ist ungültig oder abgelaufen.')
      })
      .finally(() => setLoading(false))
  }, [token])

  const handleUnsubscribe = async (type: 'all' | 'marketing' | 'transactional') => {
    if (!token) return
    setProcessing(true)
    setError(null)

    try {
      const res = await fetch('/api/email/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, type }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Fehler')
      }

      const labels: Record<string, string> = {
        all: 'allen E-Mail-Benachrichtigungen',
        marketing: 'Marketing-E-Mails',
        transactional: 'optionalen Benachrichtigungen',
      }

      setSuccess(`Sie wurden erfolgreich von ${labels[type]} abgemeldet.`)
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

  if (error && !userData) {
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

  if (success) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
        <h1 className="mb-2 text-xl font-bold text-gray-900">Erfolgreich abgemeldet</h1>
        <p className="mb-6 text-gray-600">{success}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/settings/notifications"
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Einstellungen anpassen
          </Link>
          <Link
            href="/"
            className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Zur Startseite
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg py-8 sm:py-12">
      <div className="mb-8 text-center">
        <MailX className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h1 className="mb-2 text-xl font-bold text-gray-900 sm:text-2xl">
          E-Mail-Benachrichtigungen verwalten
        </h1>
        {userData && (
          <p className="text-sm text-gray-500">
            Einstellungen für <span className="font-medium">{userData.email}</span>
          </p>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {/* Marketing Only */}
        <button
          onClick={() => handleUnsubscribe('marketing')}
          disabled={processing}
          className="flex w-full items-start gap-4 rounded-lg border border-gray-200 bg-white p-4 text-left transition-colors hover:border-primary-200 hover:bg-primary-50 disabled:opacity-50 sm:p-5"
        >
          <Mail className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Nur Marketing-E-Mails abbestellen
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Newsletter, Aktionen und Empfehlungen. Sie erhalten weiterhin wichtige
              Benachrichtigungen zu Ihren Käufen und Verkäufen.
            </p>
          </div>
        </button>

        {/* Optional Transactional */}
        <button
          onClick={() => handleUnsubscribe('transactional')}
          disabled={processing}
          className="flex w-full items-start gap-4 rounded-lg border border-gray-200 bg-white p-4 text-left transition-colors hover:border-amber-200 hover:bg-amber-50 disabled:opacity-50 sm:p-5"
        >
          <Mail className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Optionale Benachrichtigungen abbestellen
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Neue Nachrichten, Gebote, Preisänderungen und Suchalarm. Wichtige E-Mails zu Käufen
              und Versand bleiben aktiv.
            </p>
          </div>
        </button>

        {/* All */}
        <button
          onClick={() => handleUnsubscribe('all')}
          disabled={processing}
          className="flex w-full items-start gap-4 rounded-lg border border-red-200 bg-white p-4 text-left transition-colors hover:bg-red-50 disabled:opacity-50 sm:p-5"
        >
          <MailX className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
          <div>
            <h3 className="text-sm font-semibold text-red-700">
              Alle E-Mail-Benachrichtigungen abbestellen
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Sie erhalten keine E-Mails mehr von Helvenda (ausser kritische Sicherheits- und
              Kontoinformationen).
            </p>
          </div>
        </button>
      </div>

      {processing && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Wird verarbeitet...
        </div>
      )}

      <p className="mt-8 text-center text-xs text-gray-400">
        Sie können Ihre Einstellungen jederzeit unter{' '}
        <Link href="/settings/notifications" className="text-primary-600 hover:underline">
          Benachrichtigungseinstellungen
        </Link>{' '}
        anpassen.
      </p>
    </div>
  )
}

export default function UnsubscribePage() {
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
