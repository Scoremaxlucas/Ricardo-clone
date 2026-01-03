'use client'

import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { CheckCircle, Loader2, Mail, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

function VerifyEmailNoticeContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState('')

  const handleResendEmail = async () => {
    if (!email) return

    setIsResending(true)
    setResendError('')
    setResendSuccess(false)

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setResendSuccess(true)
      } else {
        setResendError(data.message || 'Fehler beim Senden der E-Mail')
      }
    } catch (error) {
      setResendError('Ein Fehler ist aufgetreten')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="space-y-8 rounded-xl bg-white px-8 py-10 shadow-lg ring-1 ring-gray-100">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <Logo size="lg" />
          </div>

          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-teal-50">
            <Mail className="h-10 w-10 text-teal-600" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Bestätigen Sie Ihre E-Mail
          </h2>

          <p className="mt-4 text-gray-600">
            Wir haben eine E-Mail an
            {email && <span className="mt-1 block font-semibold text-gray-900">{email}</span>}
            gesendet.
          </p>

          <p className="mt-4 text-sm text-gray-500">
            Klicken Sie auf den Bestätigungslink in der E-Mail, um Ihr Konto zu aktivieren.
          </p>
        </div>

        <div className="rounded-lg border border-teal-100 bg-teal-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 flex-shrink-0 text-teal-600" />
            <div className="text-sm text-teal-800">
              <p className="font-medium">Wichtig:</p>
              <ul className="mt-1 list-inside list-disc space-y-1">
                <li>Der Link ist 24 Stunden gültig</li>
                <li>Prüfen Sie auch Ihren Spam-Ordner</li>
                <li>Die E-Mail kommt von noreply@helvenda.ch</li>
              </ul>
            </div>
          </div>
        </div>

        {resendSuccess && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            ✅ Neue Bestätigungs-E-Mail wurde gesendet!
          </div>
        )}

        {resendError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {resendError}
          </div>
        )}

        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={handleResendEmail}
            disabled={isResending || !email}
            className="w-full"
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird gesendet...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                E-Mail erneut senden
              </>
            )}
          </Button>

          <Link href="/login" className="block">
            <Button variant="ghost" className="w-full text-gray-600">
              Zurück zur Anmeldung
            </Button>
          </Link>
        </div>

        <p className="text-center text-xs text-gray-500">
          Haben Sie Probleme? Kontaktieren Sie uns unter{' '}
          <a href="mailto:support@helvenda.ch" className="text-teal-600 hover:underline">
            support@helvenda.ch
          </a>
        </p>
      </div>
    </div>
  )
}

export default function VerifyEmailNoticePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary-600" />
            <p className="text-gray-600">Laden...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailNoticeContent />
    </Suspense>
  )
}

