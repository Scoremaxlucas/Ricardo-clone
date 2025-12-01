'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Bell, Search, Filter, Save } from 'lucide-react'

export default function SearchAlertPage() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const [searchAlert, setSearchAlert] = useState({
    searchTerm: '',
    brand: '',
    model: '',
    minPrice: '',
    maxPrice: '',
    condition: '',
    yearFrom: '',
    yearTo: '',
    email: session?.user?.email || '',
    isActive: true,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setSearchAlert(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setSuccess(
        'Suchabo erfolgreich erstellt! Sie erhalten E-Mail-Benachrichtigungen bei neuen passenden Artikeln.'
      )
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white shadow-lg">
          <div className="border-b border-gray-200 px-6 py-8">
            <div className="mb-4 flex items-center">
              <Bell className="mr-3 h-8 w-8 text-primary-600" />
              <h1 className="text-3xl font-bold text-gray-900">Suchabo erstellen</h1>
            </div>
            <p className="text-gray-600">
              Erstellen Sie ein Suchabo und erhalten Sie automatisch Benachrichtigungen, wenn neue
              Artikel zu Ihren Suchkriterien eingestellt werden.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 px-6 py-8">
            {success && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-600">
                {success}
              </div>
            )}

            {/* Suchbegriff */}
            <div className="space-y-6">
              <h2 className="flex items-center text-xl font-semibold text-gray-900">
                <Search className="mr-2 h-5 w-5" />
                Suchkriterien
              </h2>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Suchbegriff *
                </label>
                <input
                  type="text"
                  name="searchTerm"
                  value={searchAlert.searchTerm}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                  placeholder="z.B. Rolex Submariner"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Marke</label>
                  <input
                    type="text"
                    name="brand"
                    value={searchAlert.brand}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    placeholder="z.B. Rolex"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Modell</label>
                  <input
                    type="text"
                    name="model"
                    value={searchAlert.model}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    placeholder="z.B. Submariner"
                  />
                </div>
              </div>
            </div>

            {/* Filter */}
            <div className="space-y-6">
              <h2 className="flex items-center text-xl font-semibold text-gray-900">
                <Filter className="mr-2 h-5 w-5" />
                Filter
              </h2>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Preis von (CHF)
                  </label>
                  <input
                    type="number"
                    name="minPrice"
                    value={searchAlert.minPrice}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    placeholder="1000"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Preis bis (CHF)
                  </label>
                  <input
                    type="number"
                    name="maxPrice"
                    value={searchAlert.maxPrice}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    placeholder="50000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Zustand</label>
                  <select
                    name="condition"
                    value={searchAlert.condition}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                  >
                    <option value="">Alle</option>
                    <option value="fabrikneu">Fabrikneu</option>
                    <option value="ungetragen">Ungetragen</option>
                    <option value="leichte-tragespuren">Leichte Tragespuren</option>
                    <option value="tragespuren">Mit Tragespuren</option>
                    <option value="stark-gerockt">Stark gerockt</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Jahr von</label>
                  <input
                    type="number"
                    name="yearFrom"
                    value={searchAlert.yearFrom}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    placeholder="1990"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Jahr bis</label>
                  <input
                    type="number"
                    name="yearTo"
                    value={searchAlert.yearTo}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    placeholder="2024"
                  />
                </div>
              </div>
            </div>

            {/* Benachrichtigungen */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Benachrichtigungen</h2>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  E-Mail-Adresse *
                </label>
                <input
                  type="email"
                  name="email"
                  value={searchAlert.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                  placeholder="ihre@email.com"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Sie erhalten E-Mail-Benachrichtigungen bei neuen passenden Artikeln
                </p>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="rounded-md border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50"
              >
                Abbrechen
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center rounded-md bg-primary-600 px-6 py-2 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              >
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? 'Wird erstellt...' : 'Suchabo erstellen'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
