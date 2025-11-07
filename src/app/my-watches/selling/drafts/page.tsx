'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, Plus } from 'lucide-react'

export default function DraftsPage() {
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

        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <FileText className="h-8 w-8 mr-3 text-primary-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Entwürfe
              </h1>
              <p className="text-gray-600 mt-1">
                Noch nicht veröffentlichte Anzeigen
              </p>
            </div>
          </div>
          <Link
            href="/sell"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Neue Anzeige
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Keine Entwürfe
            </h3>
            <p className="text-gray-600 mb-6">
              Sie haben noch keine gespeicherten Entwürfe.
            </p>
            <Link
              href="/sell"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Neue Anzeige erstellen
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
