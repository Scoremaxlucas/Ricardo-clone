'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Clock } from 'lucide-react'

export default function ActivePage() {
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
          href="/my-watches/selling"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zu Mein Verkaufen
        </Link>

        <div className="flex items-center mb-8">
          <TrendingUp className="h-8 w-8 mr-3 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Am Verkaufen
            </h1>
            <p className="text-gray-600 mt-1">
              Ihre aktiven Verkaufsanzeigen
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center py-12">
            <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Keine aktiven Verkäufe
            </h3>
            <p className="text-gray-600 mb-6">
              Sie haben momentan keine aktiven Verkaufsanzeigen.
            </p>
            <Link
              href="/sell"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Jetzt verkaufen
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
