'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Menu, User, Heart, Bell, LogOut, ChevronDown, Gavel, Plus, X, Package, ShoppingBag, Settings, Wallet, Shield } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { UserName } from '@/components/ui/UserName'
import { useLanguage } from '@/contexts/LanguageContext'
import { CategoryBar } from './CategoryBar'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false)
  const [isSellMenuOpen, setIsSellMenuOpen] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [userNickname, setUserNickname] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [isVerified, setIsVerified] = useState<boolean>(false)
  const [favoritesCount, setFavoritesCount] = useState<number>(0)
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0)
  const { data: session, status } = useSession()
  const router = useRouter()
  const { language, setLanguage, t } = useLanguage()

  const languages = [
    { code: 'de' as const, name: 'Deutsch', flag: '🇩🇪' },
    { code: 'en' as const, name: 'English', flag: '🇬🇧' },
    { code: 'fr' as const, name: 'Français', flag: '🇫🇷' },
    { code: 'it' as const, name: 'Italiano', flag: '🇮🇹' }
  ]

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

      // Prüfe Admin-Status nur aus Session
      if (session.user.isAdmin === true || session.user.isAdmin === 1) {
        console.log('User is Admin based on session, setting isAdmin to true')
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

  // Lade Favoriten-Anzahl
  useEffect(() => {
    const fetchFavoritesCount = async () => {
      if (!session?.user) {
        setFavoritesCount(0)
        return
      }
      
      try {
        const response = await fetch('/api/favorites')
        if (response.ok) {
          const data = await response.json()
          setFavoritesCount(data.favorites?.length || 0)
        }
      } catch (error) {
        console.error('Error fetching favorites count:', error)
      }
    }
    
    fetchFavoritesCount()
  }, [session?.user])

  // Fetch unread notifications count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!session?.user) {
        setUnreadNotifications(0)
        return
      }
      
      try {
        const response = await fetch('/api/notifications/unread-count')
        if (response.ok) {
          const data = await response.json()
          setUnreadNotifications(data.count || 0)
        }
      } catch (error) {
        console.error('Error fetching notifications count:', error)
      }
    }
    
    fetchUnreadCount()
    
    // Poll every 5 seconds for new notifications (schneller für bessere UX)
    const interval = setInterval(fetchUnreadCount, 5000)
    
    // Aktualisiere auch wenn Seite wieder fokussiert wird
    const handleFocus = () => {
      fetchUnreadCount()
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUnreadCount()
      }
    }
    
    // Event-basierte Aktualisierung nach bestimmten Aktionen
    const handleNotificationUpdate = () => {
      console.log('[Header] notifications-update Event empfangen, aktualisiere unreadCount')
      fetchUnreadCount()
    }
    
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('notifications-update', handleNotificationUpdate)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('notifications-update', handleNotificationUpdate)
    }
  }, [session?.user])

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
            router.push(`/products/${data.watches[0].id}`)
            return
          }
        }
      } catch (error) {
        console.error('Error searching by article number:', error)
      }
    }
    
    // Normale Suche
    router.push(`/search?q=${encodeURIComponent(query)}`)
  }

  return (
    <header className="bg-white shadow-md border-b sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* ERSTE ZEILE: Logo, Navigation, User Actions */}
        <div className="flex justify-between items-center h-12 py-1">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Logo size="md" />
            </Link>
          </div>

          {/* Navigation */}
          <div className="hidden md:flex items-center space-x-6 flex-1 justify-start ml-8">
            {session ? (
              <Link 
                href="/favorites" 
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 relative transition-colors"
              >
                <Heart className="h-4 w-4" />
                {t.header.favorites}
                {favoritesCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {favoritesCount > 9 ? '9+' : favoritesCount}
                  </span>
                )}
              </Link>
            ) : (
              <button 
                onClick={() => alert(t.header.pleaseLoginForFavorites)}
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <Heart className="h-4 w-4" />
                {t.header.favorites}
              </button>
            )}
            <Link 
              href="/auctions" 
              className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Gavel className="h-4 w-4" />
              {t.header.auctions}
            </Link>
            {/* Verkaufen Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setIsSellMenuOpen(true)}
              onMouseLeave={() => setIsSellMenuOpen(false)}
            >
              <Link 
                href="/sell" 
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                {t.header.sell}
                <ChevronDown className="h-3 w-3" />
              </Link>
              
              {/* Dropdown Menu */}
              {isSellMenuOpen && (
                <div className="absolute left-0 mt-1 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <Link
                      href="/sell"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <div className="font-medium">{t.header.singleItem}</div>
                      <div className="text-xs text-gray-500">{t.header.singleItemDesc}</div>
                    </Link>
                    <Link
                      href="/sell/bulk"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <div className="font-medium">{t.header.multipleItems}</div>
                      <div className="text-xs text-gray-500">{t.header.multipleItemsDesc}</div>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User Actions - Rechts */}
          <div className="flex items-center space-x-3">
            <Link 
              href="/notifications"
              className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors relative"
            >
              <div className="relative">
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </div>
              <span className="hidden md:inline font-medium">{t.header.notifications}</span>
            </Link>
            
            {/* User Menu */}
            <div className="relative flex items-center space-x-2">
              {session ? (
                <>
                  <div className="hidden md:block text-sm text-gray-700 mr-2 flex items-center gap-1">
                    {t.header.hello}, <UserName userId={session.user.id} userName={userNickname || session.user?.nickname || session.user?.name || 'Benutzer'} badgeSize="sm" />
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                      className="relative flex items-center justify-center gap-1 px-2 py-1 rounded-full bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                      title={t.header.profileMenu}
                    >
                      <Link
                        href={session.user?.id ? `/users/${session.user.id}` : '/profile'}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-700 hover:opacity-80 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {getProfileImage() ? (
                          <img
                            src={getProfileImage()}
                            alt={session.user?.name || t.header.myProfile}
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
                          className="fixed inset-0 z-[5]"
                          onClick={(e) => {
                            // Prüfe ob Klick auf Dropdown-Menü war
                            const target = e.target as HTMLElement
                            if (target.closest('[data-dropdown-menu]')) {
                              return // Ignoriere Klicks auf Dropdown
                            }
                            setIsProfileMenuOpen(false)
                          }}
                          style={{ pointerEvents: 'auto' }}
                        />
                        <div 
                          data-dropdown-menu
                          className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-[100]"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Verhindere dass Overlay geschlossen wird
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation()
                          }}
                          style={{ pointerEvents: 'auto' }}
                        >
                          <div className="py-1 relative" style={{ pointerEvents: 'auto' }}>
                            <div className="px-4 py-3 border-b border-gray-200">
                              <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                                <UserName userId={session.user.id} userName={userNickname || session.user?.nickname || session.user?.name || t.header.user} badgeSize="sm" />
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                {session.user?.email}
                              </p>
                            </div>
                            <Link
                              href="/profile"
                              onClick={(e) => {
                                e.stopPropagation()
                                setIsProfileMenuOpen(false)
                              }}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer relative"
                              style={{ pointerEvents: 'auto', zIndex: 1000, position: 'relative' }}
                            >
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-2" />
                                {t.header.myProfile}
                              </div>
                            </Link>
                            <Link
                              href="/my-watches"
                              onClick={(e) => {
                                e.stopPropagation()
                                setIsProfileMenuOpen(false)
                              }}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer relative"
                              style={{ pointerEvents: 'auto', zIndex: 1000, position: 'relative' }}
                            >
                              <div className="flex items-center">
                                <Package className="h-4 w-4 mr-2" />
                                {t.header.mySelling}
                              </div>
                            </Link>
                            <Link
                              href="/my-watches/buying"
                              onClick={(e) => {
                                e.stopPropagation()
                                setIsProfileMenuOpen(false)
                              }}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer relative"
                              style={{ pointerEvents: 'auto', zIndex: 1000, position: 'relative' }}
                            >
                              <div className="flex items-center">
                                <ShoppingBag className="h-4 w-4 mr-2" />
                                {t.header.myBuying}
                              </div>
                            </Link>
                            <Link
                              href="/my-watches/account"
                              onClick={(e) => {
                                e.stopPropagation()
                                setIsProfileMenuOpen(false)
                              }}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer relative"
                              style={{ pointerEvents: 'auto', zIndex: 1000, position: 'relative' }}
                            >
                              <div className="flex items-center">
                                <Settings className="h-4 w-4 mr-2" />
                                {t.header.settings}
                              </div>
                            </Link>
                            <div className="border-t border-gray-200 my-1" />
                            <Link
                              href="/my-watches/selling/fees"
                              onClick={(e) => {
                                e.stopPropagation()
                                setIsProfileMenuOpen(false)
                              }}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer relative"
                              style={{ 
                                pointerEvents: 'auto',
                                zIndex: 1000,
                                position: 'relative'
                              }}
                            >
                              <div className="flex items-center">
                                <Wallet className="h-4 w-4 mr-2" />
                                {t.header.feesAndInvoices}
                              </div>
                            </Link>
                            <Link
                              href="/my-watches/selling/cancel-request"
                              onClick={(e) => {
                                e.stopPropagation()
                                setIsProfileMenuOpen(false)
                              }}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer relative"
                              style={{ 
                                pointerEvents: 'auto',
                                zIndex: 1000,
                                position: 'relative'
                              }}
                            >
                              <div className="flex items-center">
                                <X className="h-4 w-4 mr-2" />
                                {t.header.cancel}
                              </div>
                            </Link>
                            {(isAdmin || session.user?.isAdmin === true || session.user?.isAdmin === 1) && (
                              <>
                                <div className="border-t border-gray-200 my-1" />
                                <Link
                                  href="/admin/dashboard"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setIsProfileMenuOpen(false)
                                  }}
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-semibold text-primary-600 cursor-pointer relative"
                                  style={{ pointerEvents: 'auto', zIndex: 1000, position: 'relative' }}
                                >
                                  <div className="flex items-center">
                                    <Shield className="h-4 w-4 mr-2" />
                                    {t.header.adminDashboard}
                                  </div>
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
                                {t.header.logout}
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
                      {t.header.login}
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* Language Selector - Far Right */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                className="flex items-center gap-1 px-3 py-2 text-gray-700 hover:text-primary-600 rounded-md transition-colors font-medium"
                title={t.header.selectLanguage}
              >
                <span className="text-lg">{languages.find(l => l.code === language)?.flag}</span>
                <span className="text-sm">{languages.find(l => l.code === language)?.code.toUpperCase()}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isLanguageMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Language Dropdown */}
              {isLanguageMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsLanguageMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                    <div className="py-1">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setLanguage(lang.code)
                            setIsLanguageMenuOpen(false)
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-3 ${
                            language === lang.code ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-700'
                          }`}
                        >
                          <span className="text-xl">{lang.flag}</span>
                          <span>{lang.name}</span>
                          {language === lang.code && (
                            <span className="ml-auto text-primary-600">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
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

        {/* ZWEITE ZEILE: Suchleiste - ZENTRIERT */}
        <div className="hidden md:block border-t border-gray-200 py-3">
          <div className="flex items-center justify-center">
            {/* Suchleiste - Zentriert */}
            <div className="flex-1 max-w-3xl">
              <form onSubmit={handleSearch}>
                <div className="relative flex items-center">
                  <div className="absolute left-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder={t.header.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  />
                  <button
                    type="submit"
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-r-lg transition-colors font-medium"
                  >
                    {t.header.search}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* DRITTE ZEILE: CategoryBar mit Kategorien */}
        <CategoryBar />

        {/* Mobile Search */}
        <div className="md:hidden pb-4">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t.header.searchPlaceholder}
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
                {t.header.categories}
              </Link>
              <Link href="/auctions" className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium">
                {t.header.auctions}
              </Link>
              <div className="px-3 py-2">
                <div className="text-gray-700 font-medium text-base mb-1">{t.header.sell}</div>
                <Link href="/sell" className="block py-2 text-sm text-gray-600 hover:text-primary-600 pl-4">
                  {t.header.singleItem}
                </Link>
                <Link href="/sell/bulk" className="block py-2 text-sm text-gray-600 hover:text-primary-600 pl-4">
                  {t.header.multipleItems}
                </Link>
              </div>
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
                          alt={session.user?.name || t.header.profile}
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
                        {session.user?.name || t.header.user}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {session.user?.email}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium flex items-center"
                  >
                    <User className="h-5 w-5 mr-2" />
                    {t.header.myProfile}
                  </Link>
                  <Link
                    href="/my-watches"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium flex items-center"
                  >
                    <Package className="h-5 w-5 mr-2" />
                    {t.header.mySelling}
                  </Link>
                  <Link
                    href="/my-watches/buying"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium flex items-center"
                  >
                    <ShoppingBag className="h-5 w-5 mr-2" />
                    {t.header.myBuying}
                  </Link>
                  <Link
                    href="/my-watches/account"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium flex items-center"
                  >
                    <Settings className="h-5 w-5 mr-2" />
                    {t.header.settings}
                  </Link>
                  <Link
                    href="/my-watches/selling/fees"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium flex items-center"
                  >
                    <Wallet className="h-5 w-5 mr-2" />
                    {t.header.feesAndInvoices}
                  </Link>
                  <Link
                    href="/my-watches/selling/cancel-request"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium flex items-center"
                  >
                    <X className="h-5 w-5 mr-2" />
                    {t.header.cancel}
                  </Link>
                  {(session?.user?.isAdmin || isAdmin) && (
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-primary-600 hover:text-primary-700 block px-3 py-2 rounded-md text-base font-semibold flex items-center"
                    >
                      <Shield className="h-5 w-5 mr-2" />
                      {t.header.adminDashboard}
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
                                {t.header.logout}
                              </button>
                </>
              ) : (
                <Link href="/login" className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium">
                  {t.header.login}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
