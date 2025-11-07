'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, ArrowRight } from 'lucide-react'

export function Hero() {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement search functionality
    console.log('Searching for:', searchQuery)
  }

  return (
    <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Verkaufen und Kaufen von
            <span className="block text-yellow-300">Uhren leicht gemacht</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-primary-100">
            Auktionen und Sofortpreise
          </p>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Welche Uhr suchen Sie?"
                  className="w-full pl-12 pr-4 py-4 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300"
                />
              </div>
              <button
                type="submit"
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-8 py-4 rounded-lg transition-colors flex items-center justify-center"
              >
                Suchen
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </form>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sell"
              className="bg-white text-primary-600 hover:bg-gray-100 font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Uhr verkaufen
            </Link>
            <Link
              href="/auctions"
              className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Uhren-Auktionen
            </Link>
            <Link
              href="/search-alert"
              className="bg-yellow-400 text-gray-900 hover:bg-yellow-500 font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Suchabo
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
