'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, Plus } from 'lucide-react'

export default function DraftsPage() {
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
          href="/my-watches"
          className="mb-6 inline-flex items-center text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zu Mein Verkaufen
        </Link>

        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="mr-3 h-8 w-8 text-primary-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Entwürfe</h1>
              <p className="mt-1 text-gray-600">Noch nicht veröffentlichte Anzeigen</p>
            </div>
          </div>
          <Link
            href="/sell"
            className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Neue Anzeige
          </Link>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-md">
          <div className="py-12 text-center">
            <FileText className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Keine Entwürfe</h3>
            <p className="mb-6 text-gray-600">Sie haben noch keine gespeicherten Entwürfe.</p>
            <Link
              href="/sell"
              className="inline-flex items-center rounded-md bg-primary-600 px-6 py-3 text-white transition-colors hover:bg-primary-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Neue Anzeige erstellen
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
