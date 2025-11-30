'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Mail, Phone, MapPin } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function AccountPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    street: '',
    streetNumber: '',
    postalCode: '',
    city: '',
    country: 'Schweiz'
  })

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

    // Lade Benutzerdaten
    if (session?.user?.id) {
      loadUserData()
    }
  }, [status, session, router])

  const loadUserData = async () => {
    try {
      const res = await fetch(`/api/user/${session?.user?.id}`)
      if (res.ok) {
        const data = await res.json()
        setFormData({
          name: data.name || session?.user?.name || '',
          phone: data.phone || '',
          street: data.street || '',
          streetNumber: data.streetNumber || '',
          postalCode: data.postalCode || '',
          city: data.city || '',
          country: data.country || 'Schweiz'
        })
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveProfile = async () => {
    // Validierung: Adresse ist Pflichtfeld
    if (!formData.street || !formData.street.trim()) {
      toast.error('Bitte geben Sie eine Strasse ein')
      return
    }
    if (!formData.streetNumber || !formData.streetNumber.trim()) {
      toast.error('Bitte geben Sie eine Hausnummer ein')
      return
    }
    if (!formData.postalCode || !formData.postalCode.trim()) {
      toast.error('Bitte geben Sie eine Postleitzahl ein')
      return
    }
    if (!formData.city || !formData.city.trim()) {
      toast.error('Bitte geben Sie einen Ort ein')
      return
    }
    if (!formData.country || !formData.country.trim()) {
      toast.error('Bitte geben Sie ein Land ein')
      return
    }

    setIsSaving(true)

    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          street: formData.street.trim(),
          streetNumber: formData.streetNumber.trim(),
          postalCode: formData.postalCode.trim(),
          city: formData.city.trim(),
          country: formData.country.trim()
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Profil erfolgreich gespeichert!')
        // Aktualisiere Session
        if (update) {
          await update()
        }
      } else {
        toast.error(data.message || 'Fehler beim Speichern')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Fehler beim Speichern des Profils')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    toast.error('Passwort ändern - Funktion kommt bald!')
  }

  if (status === 'loading' || isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Lädt...</div>
  }

  // Wenn nicht authentifiziert, zeige Loading (Redirect wird in useEffect behandelt)
  if (status === 'unauthenticated' || !session) {
    return <div className="flex min-h-screen items-center justify-center">Weiterleitung zur Anmeldung...</div>
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
              name="name"
              value={formData.name}
              onChange={handleInputChange}
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
              value={session.user?.email || ''}
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
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
              placeholder="+41 79 123 45 67"
            />
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Adresse
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Strasse <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    placeholder="Musterstrasse"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hausnummer <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="streetNumber"
                    value={formData.streetNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    placeholder="12"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postleitzahl <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    placeholder="8000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ort <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    placeholder="Zürich"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Land <span className="text-red-500">*</span>
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  required
                >
                  <option value="Schweiz">Schweiz</option>
                  <option value="Deutschland">Deutschland</option>
                  <option value="Österreich">Österreich</option>
                  <option value="Frankreich">Frankreich</option>
                  <option value="Italien">Italien</option>
                  <option value="Liechtenstein">Liechtenstein</option>
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="w-full bg-primary-600 text-white py-3 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Wird gespeichert...' : 'Änderungen speichern'}
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
              onClick={handlePasswordChange}
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
