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
    country: 'Schweiz',
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
    const userId = (session?.user as { id?: string })?.id
    if (userId) {
      loadUserData()
    }
  }, [status, session, router])

  const loadUserData = async () => {
    try {
      const userId = (session?.user as { id?: string })?.id
      if (!userId) return
      const res = await fetch(`/api/user/${userId}`)
      if (res.ok) {
        const data = await res.json()
        setFormData({
          name: data.name || session?.user?.name || '',
          phone: data.phone || '',
          street: data.street || '',
          streetNumber: data.streetNumber || '',
          postalCode: data.postalCode || '',
          city: data.city || '',
          country: data.country || 'Schweiz',
        })
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
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
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          street: formData.street.trim(),
          streetNumber: formData.streetNumber.trim(),
          postalCode: formData.postalCode.trim(),
          city: formData.city.trim(),
          country: formData.country.trim(),
        }),
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

  if (status === 'loading' || isLoading) {
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
      <div className="mx-auto max-w-4xl px-4">
        <Link
          href="/my-watches"
          className="mb-6 inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zu Mein Verkaufen
        </Link>

        <h1 className="mb-8 text-3xl font-bold text-gray-900">Benutzerkonto</h1>

        <div className="space-y-6 rounded-lg bg-white p-8 shadow-md">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              <User className="mr-2 inline h-4 w-4" />
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              <Mail className="mr-2 inline h-4 w-4" />
              E-Mail
            </label>
            <input
              type="email"
              value={session.user?.email || ''}
              disabled
              className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              <Phone className="mr-2 inline h-4 w-4" />
              Telefonnummer (optional)
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              placeholder="+41 79 123 45 67"
            />
          </div>

          <div className="border-t pt-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Adresse</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Strasse <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    placeholder="Musterstrasse"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Hausnummer <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="streetNumber"
                    value={formData.streetNumber}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    placeholder="12"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Postleitzahl <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    placeholder="8000"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Ort <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    placeholder="Zürich"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Land <span className="text-red-500">*</span>
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
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
            className="w-full rounded-md bg-primary-600 py-3 text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? 'Wird gespeichert...' : 'Änderungen speichern'}
          </button>

        </div>
      </div>
    </div>
  )
}
