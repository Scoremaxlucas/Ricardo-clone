'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Menu, User, Heart, ShoppingCart, Bell, LogOut, ChevronDown } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { UserName } from '@/components/ui/UserName'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [userNickname, setUserNickname] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [isVerified, setIsVerified] = useState<boolean>(false)
  const { data: session, status } = useSession()
  const router = useRouter()

  // Lade Nickname und Admin-Status aus der DB, falls nicht in Session
  useEffect(() => {
    if (session?.user?.id) {
      if (!session.user.nickname) {
        fetch(`/api/user/nickname?userId=${session.user.id}`)
          .then(res => res.json())
          .then(data => {
            if (data.nickname) {
              setUserNickname(data.nickname)
            }
          })
          .catch(err => console.error('Error loading nickname:', err))
      } else {
        setUserNickname(session.user.nickname)
      }

      // Prüfe Admin-Status: Direkt per E-Mail oder über API
      const userEmail = session.user.email?.toLowerCase()
      const isAdminEmail = userEmail === 'admin@admin.ch'
      
      // Wenn E-Mail Admin@Admin.ch ist, setze direkt auf true
      if (isAdminEmail) {
        console.log('User is Admin based on email, setting isAdmin to true')
        setIsAdmin(true)
      } else {
        // Sonst versuche API-Aufruf
        console.log('Loading admin status for user ID:', session.user.id)
        fetch(`/api/user/admin-status`)
          .then(res => {
            console.log('Admin status API response status:', res.status)
            if (!res.ok) {
              throw new Error(`API returned status ${res.status}`)
            }
            return res.json()
          })
          .then(data => {
            console.log('Admin status from API:', data)
            const adminValue = data.isAdmin === true || data.isAdmin === 1 || data.isAdmin === 'true'
            console.log('Setting isAdmin to:', adminValue)
            setIsAdmin(adminValue)
          })
          .catch(err => {
            console.error('Error loading admin status:', err)
            // Fallback: Verwende Session-Wert
            const fallbackValue = session.user.isAdmin === true || session.user.isAdmin === 1
            console.log('Using fallback admin value:', fallbackValue)
            setIsAdmin(fallbackValue)
          })
      }

      // Lade Verifizierungsstatus
      if (session.user.id) {
        fetch(`/api/user/verified?userId=${session.user.id}`)
          .then(res => res.json())
          .then(data => {
            setIsVerified(data.verified === true)
          })
          .catch(err => console.error('Error loading verification status:', err))
      }
    }
  }, [session?.user?.id, session?.user?.nickname, session?.user?.isAdmin])

  // Profilbild aus localStorage laden
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedImage = localStorage.getItem('profileImage')
      if (storedImage) {
        setProfileImage(storedImage)
      }
    }
  }, [])

  // Initialen aus Name extrahieren
  const getInitials = (name?: string | null) => {
    if (!name) return 'U'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  // Profilbild anzeigen
  const getProfileImage = () => {
    if (profileImage) return profileImage
    if (session?.user?.image) return session.user.image
    return null
  }

  // Suchfunktion
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Logo size="md" />
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-8 hidden md:block">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Suchen Sie nach Uhren..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                />
              </div>
            </form>
          </div>

          {/* Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/categories" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
              Marken
            </Link>
            <Link href="/auctions" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
              Auktionen
            </Link>
            <Link href="/sell" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
              Uhr verkaufen
            </Link>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-500">
              <Bell className="h-6 w-6" />
            </button>
            {session && (
              <Link 
                href="/my-watches/buying"
                className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                title="Meine Favoriten"
              >
                <Heart className="h-6 w-6" />
              </Link>
            )}
            {!session && (
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <Heart className="h-6 w-6" />
              </button>
            )}
            <button className="p-2 text-gray-400 hover:text-gray-500">
              <ShoppingCart className="h-6 w-6" />
            </button>
            
            {/* User Menu */}
            <div className="relative flex items-center space-x-2">
              {session ? (
                <>
                  <div className="hidden md:block text-sm text-gray-700 mr-2 flex items-center gap-1">
                    Hallo, <UserName userId={session.user.id} userName={userNickname || session.user?.nickname || session.user?.name || 'Benutzer'} badgeSize="sm" />
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                      className="relative flex items-center justify-center gap-1 px-2 py-1 rounded-full bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                      title="Profilmenü"
                    >
                      <Link
                        href={session.user?.id ? `/users/${session.user.id}` : '/profile'}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-700 hover:opacity-80 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {getProfileImage() ? (
                          <img
                            src={getProfileImage()}
                            alt={session.user?.name || 'Profil'}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-semibold">
                            {getInitials(session.user?.name)}
                          </span>
                        )}
                      </Link>
                      <ChevronDown 
                        className={`h-4 w-4 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {isProfileMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setIsProfileMenuOpen(false)}
                        />
                        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                          <div className="py-1">
                            <div className="px-4 py-3 border-b border-gray-200">
                              <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                                <UserName userId={session.user.id} userName={userNickname || session.user?.nickname || session.user?.name || 'Benutzer'} badgeSize="sm" />
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                {session.user?.email}
                              </p>
                            </div>
                            <Link
                              href="/profile"
                              onClick={() => setIsProfileMenuOpen(false)}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Mein Profil
                            </Link>
                            <Link
                              href="/my-watches"
                              onClick={() => setIsProfileMenuOpen(false)}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Mein Verkaufen
                            </Link>
                            <Link
                              href="/my-watches/buying"
                              onClick={() => setIsProfileMenuOpen(false)}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Mein Kaufen
                            </Link>
                            <Link
                              href="/my-watches/account"
                              onClick={() => setIsProfileMenuOpen(false)}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Einstellungen
                            </Link>
                            <div className="border-t border-gray-200 my-1" />
                            <div className="px-4 py-2">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Gebühren</p>
                            </div>
                            <Link
                              href="/my-watches/selling/fees"
                              onClick={() => setIsProfileMenuOpen(false)}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Gebühren & Rechnungen
                            </Link>
                            {((isAdmin || session.user?.isAdmin === true || session.user?.isAdmin === 1) || session.user?.email?.toLowerCase() === 'admin@admin.ch') && (
                              <>
                                <div className="border-t border-gray-200 my-1" />
                                <Link
                                  href="/admin/dashboard"
                                  onClick={() => setIsProfileMenuOpen(false)}
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-semibold text-primary-600"
                                >
                                  Admin-Dashboard
                                </Link>
                              </>
                            )}
                            <div className="border-t border-gray-200 my-1" />
                            <button
                              onClick={async () => {
                                setIsProfileMenuOpen(false)
                                try {
                                  await signOut({ callbackUrl: '/' })
                                } catch (error) {
                                  console.error('Error signing out:', error)
                                  // Fallback: manuell zur Hauptseite
                                  window.location.href = '/'
                                }
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                            >
                              <div className="flex items-center">
                                <LogOut className="h-4 w-4 mr-2" />
                                Abmelden
                              </div>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <button className="p-2 text-gray-400 hover:text-gray-500">
                    <User className="h-6 w-6" />
                  </button>
                  <div className="hidden md:block">
                    <Link href="/login" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                      Anmelden
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-gray-500"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-4">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Suchen Sie nach Produkten..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
              />
            </div>
          </form>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
              <Link href="/categories" className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium">
                Kategorien
              </Link>
              <Link href="/auctions" className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium">
                Auktionen
              </Link>
              <Link href="/sell" className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium">
                Verkaufen
              </Link>
              {session ? (
                <>
                  <div className="px-3 py-3 border-b border-gray-200 flex items-center space-x-3">
                    <Link
                      href={session.user?.id ? `/users/${session.user.id}` : '/profile'}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-600 text-white cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      {getProfileImage() ? (
                        <img
                          src={getProfileImage()}
                          alt={session.user?.name || 'Profil'}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold">
                          {getInitials(session.user?.name)}
                        </span>
                      )}
                    </Link>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {session.user?.name || 'Benutzer'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {session.user?.email}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium"
                  >
                    Mein Profil
                  </Link>
                  <Link
                    href="/my-watches"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium"
                  >
                    Mein Verkaufen
                  </Link>
                  <Link
                    href="/my-watches/buying"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium"
                  >
                    Mein Kaufen
                  </Link>
                  <Link
                    href="/my-watches/account"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium"
                  >
                    Einstellungen
                  </Link>
                  {(session?.user?.isAdmin || isAdmin) && (
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-primary-600 hover:text-primary-700 block px-3 py-2 rounded-md text-base font-semibold"
                    >
                      Admin-Dashboard
                    </Link>
                  )}
                              <button 
                                onClick={async () => {
                                  setIsMenuOpen(false)
                                  try {
                                    await signOut({ callbackUrl: '/' })
                                  } catch (error) {
                                    console.error('Error signing out:', error)
                                    // Fallback: manuell zur Hauptseite
                                    window.location.href = '/'
                                  }
                                }}
                                className="text-red-600 hover:text-red-700 block px-3 py-2 rounded-md text-base font-medium w-full text-left flex items-center"
                              >
                                <LogOut className="h-5 w-5 mr-2" />
                                Abmelden
                              </button>
                </>
              ) : (
                <Link href="/login" className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium">
                  Anmelden
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
