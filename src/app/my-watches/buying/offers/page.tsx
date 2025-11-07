'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Handshake, Tag } from 'lucide-react'

export default function OffersPage() {
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
          <Tag className="h-8 w-8 mr-3 text-primary-600" />
          Preisvorschläge
        </h1>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center py-12">
            <Handshake className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Keine Preisvorschläge
            </h3>
            <p className="text-gray-600 mb-6">
              Sie haben noch keine Preisvorschläge abgegeben.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Uhren durchstöbern
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
