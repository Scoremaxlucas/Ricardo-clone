'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Search, Bell, Plus, Menu, Heart, Gavel } from 'lucide-react'
import { ModernInput } from '@/components/ui/ModernInput'
import { ModernButton } from '@/components/ui/ModernButton'

export function ModernHeader() {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const [favoritesCount, setFavoritesCount] = useState(0)

  useEffect(() => {
    if (session?.user) {
      fetch('/api/favorites')
        .then(res => res.json())
        .then(data => {
          setFavoritesCount(data.favorites?.length || 0)
        })
        .catch(() => setFavoritesCount(0))
    }
  }, [session?.user])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const query = searchQuery.trim()
    if (!query) return
    
    // Prüfe ob es eine Artikelnummer ist (6-10 stellige Nummer)
    const isNumericArticleNumber = /^\d{6,10}$/.test(query)
    
    if (isNumericArticleNumber) {
      // Suche nach Artikelnummer
      try {
        const res = await fetch(`/api/watches/search?q=${encodeURIComponent(query)}&limit=1`)
        if (res.ok) {
          const data = await res.json()
          if (data.watches && data.watches.length === 1) {
            // Eindeutiger Treffer: Direkt zur Artikelseite
            window.location.href = `/products/${data.watches[0].id}`
            return
          }
        }
      } catch (error) {
        console.error('Error searching by article number:', error)
      }
    }
    
    // Normale Suche
    window.location.href = `/search?q=${encodeURIComponent(query)}`
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#F4F4F4] shadow-[0px_2px_12px_rgba(0,0,0,0.08)]">
      <div className="h-20 flex items-center">
        <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-6">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-[#137A5F] rounded-[12px] flex items-center justify-center">
                  <span className="text-white font-bold text-xl">H</span>
                </div>
                <span className="hidden sm:block text-xl font-semibold text-[#3A3A3A]">Helvenda</span>
              </div>
            </Link>

            {/* Centered Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
              <ModernInput
                type="text"
                placeholder="Suche nach Artikel, Verkäufer oder Artikelnummer"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                showSearchIcon={true}
                className="w-full"
              />
            </form>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Favorites */}
              <Link
                href="/favorites"
                className="relative p-2 rounded-full hover:bg-[#F4F4F4] transition-colors"
                aria-label="Favoriten"
              >
                <Heart className="h-5 w-5 text-[#3A3A3A]" />
                {favoritesCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {favoritesCount > 9 ? '9+' : favoritesCount}
                  </span>
                )}
              </Link>

              {/* Auctions */}
              <Link
                href="/auctions"
                className="p-2 rounded-full hover:bg-[#F4F4F4] transition-colors"
                aria-label="Auktionen"
              >
                <Gavel className="h-5 w-5 text-[#3A3A3A]" />
              </Link>

              {/* Notifications */}
              <Link
                href="/notifications"
                className="relative p-2 rounded-full hover:bg-[#F4F4F4] transition-colors"
                aria-label="Benachrichtigungen"
              >
                <Bell className="h-5 w-5 text-[#3A3A3A]" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Link>

              {/* Create Listing Button */}
              <ModernButton
                variant="primary"
                size="md"
                onClick={() => window.location.href = '/sell'}
                className="hidden sm:flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Inserat erstellen</span>
              </ModernButton>

              {/* User Menu */}
              {session?.user ? (
                <Link
                  href="/my-watches"
                  className="flex items-center gap-2 p-2 rounded-full hover:bg-[#F4F4F4] transition-colors"
                >
                  <div className="w-8 h-8 bg-[#137A5F] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {session.user.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="hidden md:block text-sm font-medium text-[#3A3A3A]">
                    {session.user.name || 'Benutzer'}
                  </span>
                </Link>
              ) : (
                <Link href="/api/auth/signin">
                  <ModernButton variant="secondary" size="sm">
                    Anmelden
                  </ModernButton>
                </Link>
              )}

              {/* Mobile Menu */}
              <button
                className="md:hidden p-2 rounded-full hover:bg-[#F4F4F4] transition-colors"
                aria-label="Menü"
              >
                <Menu className="h-5 w-5 text-[#3A3A3A]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

