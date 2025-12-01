'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, DollarSign, Wallet } from 'lucide-react'

export default function BuyingFeesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Warte bis Session geladen ist
    if (status === 'loading') {
      return
    }

    // Wenn nicht authentifiziert, leite um
    if (status === 'unauthenticated' || !session) {
      const currentPath = window.location.pathname
      router.push(`/login?callbackUrl=${encodeURIComponent(currentPath)}`)
      return
    }
  }, [status, session, router])

  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center">Lädt...</div>
  }

  // Wenn nicht authentifiziert, zeige Loading (Redirect wird in useEffect behandelt)
  if (status === 'unauthenticated' || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Weiterleitung zur Anmeldung...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-4">
        <Link
          href="/my-watches/buying"
          className="mb-6 inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zu Mein Kaufen
        </Link>

        <h1 className="mb-8 flex items-center text-3xl font-bold text-gray-900">
          <Wallet className="mr-3 h-8 w-8 text-primary-600" />
          Gebühren
        </h1>

        <div className="rounded-lg bg-white p-8 shadow-md">
          <div className="py-12 text-center">
            <DollarSign className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Keine Gebühren</h3>
            <p className="mb-6 text-gray-600">Aktuell haben Sie keine fälligen Gebühren.</p>
          </div>

          <div className="mt-8 border-t pt-8">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Gebührenübersicht für Käufer
            </h3>
            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex justify-between border-b py-2">
                <span>Kaufgebühr (bei erfolgreichem Kauf)</span>
                <span className="font-medium">0%</span>
              </div>
              <div className="flex justify-between border-b py-2">
                <span>Sofortkaufgebühr</span>
                <span className="font-medium">kostenlos</span>
              </div>
              <div className="flex justify-between border-b py-2">
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
