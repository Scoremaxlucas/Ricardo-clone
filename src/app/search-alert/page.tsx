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
    isActive: true
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
      setSuccess('Suchabo erfolgreich erstellt! Sie erhalten E-Mail-Benachrichtigungen bei neuen passenden Uhren.')
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg">
          <div className="px-6 py-8 border-b border-gray-200">
            <div className="flex items-center mb-4">
              <Bell className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Suchabo erstellen</h1>
            </div>
            <p className="text-gray-600">
              Erstellen Sie ein Suchabo und erhalten Sie automatisch Benachrichtigungen, wenn neue Uhren 
              zu Ihren Suchkriterien eingestellt werden.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-8 space-y-8">
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            {/* Suchbegriff */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Suchkriterien
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suchbegriff *
                </label>
                <input
                  type="text"
                  name="searchTerm"
                  value={searchAlert.searchTerm}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  placeholder="z.B. Rolex Submariner"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marke
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={searchAlert.brand}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    placeholder="z.B. Rolex"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modell
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={searchAlert.model}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    placeholder="z.B. Submariner"
                  />
                </div>
              </div>
            </div>

            {/* Filter */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filter
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preis von (CHF)
                  </label>
                  <input
                    type="number"
                    name="minPrice"
                    value={searchAlert.minPrice}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    placeholder="1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preis bis (CHF)
                  </label>
                  <input
                    type="number"
                    name="maxPrice"
                    value={searchAlert.maxPrice}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    placeholder="50000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zustand
                  </label>
                  <select
                    name="condition"
                    value={searchAlert.condition}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jahr von
                  </label>
                  <input
                    type="number"
                    name="yearFrom"
                    value={searchAlert.yearFrom}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    placeholder="1990"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jahr bis
                  </label>
                  <input
                    type="number"
                    name="yearTo"
                    value={searchAlert.yearTo}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    placeholder="2024"
                  />
                </div>
              </div>
            </div>

            {/* Benachrichtigungen */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Benachrichtigungen</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-Mail-Adresse *
                </label>
                <input
                  type="email"
                  name="email"
                  value={searchAlert.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  placeholder="ihre@email.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Sie erhalten E-Mail-Benachrichtigungen bei neuen passenden Uhren
                </p>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Abbrechen
              </button>
              
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Wird erstellt...' : 'Suchabo erstellen'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

