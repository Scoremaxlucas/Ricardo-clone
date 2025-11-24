'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Globe, Star, TrendingUp, Calendar, ShoppingCart, Package, CheckCircle, XCircle, Minus } from 'lucide-react'

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
    return <div className="flex min-h-screen items-center justify-center">Weiterleitung zur Anmeldung...</div>
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
      <div className="max-w-4xl mx-auto px-4">
        <Link
          href="/my-watches"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zu Meine Uhren
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Öffentliches Profil
        </h1>

        {/* Profil-Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-600">
                    {session.user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {session.user?.name || 'Benutzer'}
                  </h2>
                  <p className="text-gray-600 flex items-center mt-1">
                    <Calendar className="h-4 w-4 mr-1" />
                    Mitglied seit {memberSince}
                  </p>
                </div>
              </div>

              {/* Statistiken */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
                <div className="text-center">
                  <ShoppingCart className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{itemsBought}</div>
                  <div className="text-sm text-gray-600">Gekauft</div>
                </div>
                <div className="text-center">
                  <Package className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{itemsSold}</div>
                  <div className="text-sm text-gray-600">Verkauft</div>
                </div>
                <div className="text-center">
                  <Star className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {totalReviews > 0 ? `${Math.round((positiveReviews / totalReviews) * 100)}%` : '---'}
                  </div>
                  <div className="text-sm text-gray-600">Positive</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bewertungsübersicht */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Star className="h-5 w-5 mr-2" />
            Bewertungen ({totalReviews})
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-medium text-gray-900">Positiv</span>
              </div>
              <span className="font-bold text-green-600">{positiveReviews}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Minus className="h-5 w-5 text-gray-600 mr-2" />
                <span className="font-medium text-gray-900">Neutral</span>
              </div>
              <span className="font-bold text-gray-600">{neutralReviews}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="font-medium text-gray-900">Negativ</span>
              </div>
              <span className="font-bold text-red-600">{negativeReviews}</span>
            </div>
          </div>
        </div>

        {/* Profil bearbeiten */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            Profil bearbeiten
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profilbild URL (optional)
              </label>
              <input
                type="url"
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kurzbeschreibung (optional)
              </label>
              <textarea
                rows={3}
                placeholder="Beschreiben Sie sich in wenigen Sätzen..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Spezialisierung (optional)
              </label>
              <input
                type="text"
                placeholder="z.B. Vintage Rolex, Sportuhren, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
              />
            </div>
          </div>

          <button
            onClick={() => alert('Profil speichern - Funktion kommt bald!')}
            className="mt-6 w-full bg-primary-600 text-white py-3 rounded-md hover:bg-primary-700 transition-colors"
          >
            Profil speichern
          </button>
        </div>
      </div>
    </div>
  )
}
