'use client'

import { useParams, useRouter } from 'next/navigation'
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function CheckoutCancelPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as string

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-2xl px-4">
        {/* Cancel Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Zahlung abgebrochen</h1>
          <p className="mt-2 text-gray-600">
            Die Zahlung wurde nicht abgeschlossen. Ihre Bestellung ist noch aktiv.
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4">Was passiert jetzt?</h2>
          <div className="space-y-4 text-gray-600">
            <p>
              Ihre Bestellung wurde nicht gelöscht. Sie können jederzeit zur Kasse zurückkehren
              und die Zahlung erneut versuchen.
            </p>
            <p>
              Falls Sie Probleme bei der Zahlung hatten, können Sie eine andere Zahlungsmethode
              wählen oder unseren Support kontaktieren.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.back()}
            className="flex-1 flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Erneut versuchen
          </button>
          <Link
            href="/"
            className="flex-1 flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Startseite
          </Link>
        </div>

        {/* Help Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Benötigen Sie Hilfe?{' '}
            <Link href="/contact" className="text-primary-600 hover:underline">
              Kontaktieren Sie uns
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
