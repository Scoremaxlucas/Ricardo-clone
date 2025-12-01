'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Globe,
  Star,
  TrendingUp,
  Calendar,
  ShoppingCart,
  Package,
  CheckCircle,
  XCircle,
  Minus,
} from 'lucide-react'

export default function PublicProfilePage() {
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

  // Mock data - später aus der Datenbank laden
  const memberSince = session.user ? 'September 2024' : ''
  const itemsBought = 0
  const itemsSold = 0
  const positiveReviews = 0
  const neutralReviews = 0
  const negativeReviews = 0
  const totalReviews = positiveReviews + neutralReviews + negativeReviews

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-4">
        <Link
          href="/my-watches"
          className="mb-6 inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zu Mein Verkaufen
        </Link>

        <h1 className="mb-8 text-3xl font-bold text-gray-900">Öffentliches Profil</h1>

        {/* Profil-Header */}
        <div className="mb-6 rounded-lg bg-white p-8 shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-4 flex items-center space-x-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100">
                  <span className="text-2xl font-bold text-primary-600">
                    {session.user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {session.user?.name || 'Benutzer'}
                  </h2>
                  <p className="mt-1 flex items-center text-gray-600">
                    <Calendar className="mr-1 h-4 w-4" />
                    Mitglied seit {memberSince}
                  </p>
                </div>
              </div>

              {/* Statistiken */}
              <div className="mt-6 grid grid-cols-3 gap-4 border-t pt-6">
                <div className="text-center">
                  <ShoppingCart className="mx-auto mb-2 h-6 w-6 text-blue-600" />
                  <div className="text-2xl font-bold text-gray-900">{itemsBought}</div>
                  <div className="text-sm text-gray-600">Gekauft</div>
                </div>
                <div className="text-center">
                  <Package className="mx-auto mb-2 h-6 w-6 text-green-600" />
                  <div className="text-2xl font-bold text-gray-900">{itemsSold}</div>
                  <div className="text-sm text-gray-600">Verkauft</div>
                </div>
                <div className="text-center">
                  <Star className="mx-auto mb-2 h-6 w-6 text-yellow-500" />
                  <div className="text-2xl font-bold text-gray-900">
                    {totalReviews > 0
                      ? `${Math.round((positiveReviews / totalReviews) * 100)}%`
                      : '---'}
                  </div>
                  <div className="text-sm text-gray-600">Positive</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bewertungsübersicht */}
        <div className="mb-6 rounded-lg bg-white p-8 shadow-md">
          <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
            <Star className="mr-2 h-5 w-5" />
            Bewertungen ({totalReviews})
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
              <div className="flex items-center">
                <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                <span className="font-medium text-gray-900">Positiv</span>
              </div>
              <span className="font-bold text-green-600">{positiveReviews}</span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <div className="flex items-center">
                <Minus className="mr-2 h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-900">Neutral</span>
              </div>
              <span className="font-bold text-gray-600">{neutralReviews}</span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-red-50 p-3">
              <div className="flex items-center">
                <XCircle className="mr-2 h-5 w-5 text-red-600" />
                <span className="font-medium text-gray-900">Negativ</span>
              </div>
              <span className="font-bold text-red-600">{negativeReviews}</span>
            </div>
          </div>
        </div>

        {/* Profil bearbeiten */}
        <div className="rounded-lg bg-white p-8 shadow-md">
          <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
            <Globe className="mr-2 h-5 w-5" />
            Profil bearbeiten
          </h3>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Profilbild URL (optional)
              </label>
              <input
                type="url"
                placeholder="https://..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Kurzbeschreibung (optional)
              </label>
              <textarea
                rows={3}
                placeholder="Beschreiben Sie sich in wenigen Sätzen..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Spezialisierung (optional)
              </label>
              <input
                type="text"
                placeholder="z.B. Elektronik, Möbel, Kleidung, etc."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              />
            </div>
          </div>

          <button
            onClick={() => alert('Profil speichern - Funktion kommt bald!')}
            className="mt-6 w-full rounded-md bg-primary-600 py-3 text-white transition-colors hover:bg-primary-700"
          >
            Profil speichern
          </button>
        </div>
      </div>
    </div>
  )
}
