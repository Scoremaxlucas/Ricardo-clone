'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Mail, Phone, MapPin } from 'lucide-react'

export default function AccountPage() {
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
      <div className="max-w-4xl mx-auto px-4">
        <Link
          href="/my-watches"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zu Meine Uhren
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Benutzerkonto
        </h1>

        <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline h-4 w-4 mr-2" />
              Name
            </label>
            <input
              type="text"
              defaultValue={session.user?.name || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="inline h-4 w-4 mr-2" />
              E-Mail
            </label>
            <input
              type="email"
              defaultValue={session.user?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="inline h-4 w-4 mr-2" />
              Telefonnummer (optional)
            </label>
            <input
              type="tel"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
              placeholder="+41 79 123 45 67"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline h-4 w-4 mr-2" />
              Adresse (optional)
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
              placeholder="Strasse, PLZ, Ort"
            />
          </div>

          <button
            onClick={() => alert('Profil speichern - Funktion kommt bald!')}
            className="w-full bg-primary-600 text-white py-3 rounded-md hover:bg-primary-700 transition-colors"
          >
            Änderungen speichern
          </button>

          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Passwort ändern
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aktuelles Passwort
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Neues Passwort
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
              </div>
            </div>
            <button
              onClick={() => alert('Passwort ändern - Funktion kommt bald!')}
              className="mt-4 w-full bg-gray-200 text-gray-800 py-3 rounded-md hover:bg-gray-300 transition-colors"
            >
              Passwort ändern
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
