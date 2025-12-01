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
    <header className="sticky top-0 z-50 border-b border-[#F4F4F4] bg-white shadow-[0px_2px_12px_rgba(0,0,0,0.08)]">
      <div className="flex h-20 items-center">
        <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-6">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#137A5F]">
                  <span className="text-xl font-bold text-white">H</span>
                </div>
                <span className="hidden text-xl font-semibold text-[#3A3A3A] sm:block">
                  Helvenda
                </span>
              </div>
            </Link>

            {/* Centered Search */}
            <form onSubmit={handleSearch} className="max-w-2xl flex-1">
              <ModernInput
                type="text"
                placeholder="Suche nach Artikel, Verkäufer oder Artikelnummer"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                showSearchIcon={true}
                className="w-full"
              />
            </form>

            {/* Right Side Actions */}
            <div className="flex flex-shrink-0 items-center gap-2">
              {/* Favorites */}
              <Link
                href="/favorites"
                className="relative rounded-full p-2 transition-colors hover:bg-[#F4F4F4]"
                aria-label="Favoriten"
              >
                <Heart className="h-5 w-5 text-[#3A3A3A]" />
                {favoritesCount > 0 && (
                  <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {favoritesCount > 9 ? '9+' : favoritesCount}
                  </span>
                )}
              </Link>

              {/* Auctions */}
              <Link
                href="/auctions"
                className="rounded-full p-2 transition-colors hover:bg-[#F4F4F4]"
                aria-label="Auktionen"
              >
                <Gavel className="h-5 w-5 text-[#3A3A3A]" />
              </Link>

              {/* Notifications */}
              <Link
                href="/notifications"
                className="relative rounded-full p-2 transition-colors hover:bg-[#F4F4F4]"
                aria-label="Benachrichtigungen"
              >
                <Bell className="h-5 w-5 text-[#3A3A3A]" />
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
              </Link>

              {/* Create Listing Button */}
              <ModernButton
                variant="primary"
                size="md"
                onClick={() => (window.location.href = '/sell')}
                className="hidden items-center gap-2 sm:flex"
              >
                <Plus className="h-4 w-4" />
                <span>Inserat erstellen</span>
              </ModernButton>

              {/* User Menu */}
              {session?.user ? (
                <Link
                  href="/my-watches"
                  className="flex items-center gap-2 rounded-full p-2 transition-colors hover:bg-[#F4F4F4]"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#137A5F]">
                    <span className="text-sm font-medium text-white">
                      {session.user.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="hidden text-sm font-medium text-[#3A3A3A] md:block">
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
                className="rounded-full p-2 transition-colors hover:bg-[#F4F4F4] md:hidden"
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
