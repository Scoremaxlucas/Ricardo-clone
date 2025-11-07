'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, DollarSign, Wallet } from 'lucide-react'

export default function BuyingFeesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center">Lädt...</div>
  }

  if (!session) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <Link
          href="/my-watches/buying"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zu Mein Kaufen
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
          <Wallet className="h-8 w-8 mr-3 text-primary-600" />
          Gebühren
        </h1>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center py-12">
            <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Keine Gebühren
            </h3>
            <p className="text-gray-600 mb-6">
              Aktuell haben Sie keine fälligen Gebühren.
            </p>
          </div>

          <div className="mt-8 border-t pt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Gebührenübersicht für Käufer
            </h3>
            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex justify-between py-2 border-b">
                <span>Kaufgebühr (bei erfolgreichem Kauf)</span>
                <span className="font-medium">0%</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Sofortkaufgebühr</span>
                <span className="font-medium">kostenlos</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Versand (wird gesondert vereinbart)</span>
                <span className="font-medium">kostenlos</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
