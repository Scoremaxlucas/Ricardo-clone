'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Search,
  Menu,
  User,
  Heart,
  Bell,
  LogOut,
  ChevronDown,
  Gavel,
  Plus,
  X,
  Package,
  ShoppingBag,
  Settings,
  Wallet,
  Shield,
} from 'lucide-react'
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
    { code: 'it' as const, name: 'Italiano', flag: '🇮🇹' },
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
      if (session.user.isAdmin === true || session.user.isAdmin === true) {
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
            const adminValue =
              data.isAdmin === true || data.isAdmin === true || data.isAdmin === 'true'
            console.log('Setting isAdmin to:', adminValue)
            setIsAdmin(adminValue)
          })
          .catch(err => {
            console.error('Error loading admin status:', err)
            // Fallback: Verwende Session-Wert
            const fallbackValue = session.user.isAdmin === true || session.user.isAdmin === true
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
    <header className="sticky top-0 z-50 border-b bg-white shadow-md">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        {/* ERSTE ZEILE: Logo, Navigation, User Actions */}
        <div className="flex h-12 items-center justify-between py-1">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Logo size="md" />
            </Link>
          </div>

          {/* Navigation */}
          <div className="ml-8 hidden flex-1 items-center justify-start space-x-6 md:flex">
            {session ? (
              <Link
                href="/favorites"
                className="relative flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-primary-600"
              >
                <Heart className="h-4 w-4" />
                {t.header.favorites}
                {favoritesCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {favoritesCount > 9 ? '9+' : favoritesCount}
                  </span>
                )}
              </Link>
            ) : (
              <button
                onClick={() => alert(t.header.pleaseLoginForFavorites)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-primary-600"
              >
                <Heart className="h-4 w-4" />
                {t.header.favorites}
              </button>
            )}
            <Link
              href="/auctions"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-primary-600"
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
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-primary-600"
              >
                <Plus className="h-4 w-4" />
                {t.header.sell}
                <ChevronDown className="h-3 w-3" />
              </Link>

              {/* Dropdown Menu */}
              {isSellMenuOpen && (
                <div className="absolute left-0 z-50 mt-1 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    <Link
                      href="/sell"
                      className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                    >
                      <div className="font-medium">{t.header.singleItem}</div>
                      <div className="text-xs text-gray-500">{t.header.singleItemDesc}</div>
                    </Link>
                    <Link
                      href="/sell/bulk"
                      className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
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
              className="relative flex items-center gap-2 px-3 py-2 text-gray-700 transition-colors hover:text-primary-600"
            >
              <div className="relative">
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </div>
              <span className="hidden font-medium md:inline">{t.header.notifications}</span>
            </Link>

            {/* User Menu */}
            <div className="relative flex items-center space-x-2">
              {session ? (
                <>
                  <div className="mr-2 flex hidden items-center gap-1 text-sm text-gray-700 md:block">
                    {t.header.hello},{' '}
                    <UserName
                      userId={session.user.id}
                      userName={
                        userNickname || session.user?.nickname || session.user?.name || 'Benutzer'
                      }
                      badgeSize="sm"
                    />
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                      className="relative flex items-center justify-center gap-1 rounded-full bg-primary-600 px-2 py-1 text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                      title={t.header.profileMenu}
                    >
                      <Link
                        href={session.user?.id ? `/users/${session.user.id}` : '/profile'}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-700 transition-opacity hover:opacity-80"
                        onClick={e => e.stopPropagation()}
                      >
                        {getProfileImage() ? (
                          <img
                            src={getProfileImage()}
                            alt={session.user?.name || t.header.myProfile}
                            className="h-full w-full rounded-full object-cover"
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
                          onClick={e => {
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
                          className="absolute right-0 z-[100] mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5"
                          onClick={e => {
                            e.stopPropagation()
                            // Verhindere dass Overlay geschlossen wird
                          }}
                          onMouseDown={e => {
                            e.stopPropagation()
                          }}
                          style={{ pointerEvents: 'auto' }}
                        >
                          <div className="relative py-1" style={{ pointerEvents: 'auto' }}>
                            <div className="border-b border-gray-200 px-4 py-3">
                              <p className="flex items-center gap-1 text-sm font-medium text-gray-900">
                                <UserName
                                  userId={session.user.id}
                                  userName={
                                    userNickname ||
                                    session.user?.nickname ||
                                    session.user?.name ||
                                    t.header.user
                                  }
                                  badgeSize="sm"
                                />
                              </p>
                              <p className="truncate text-sm text-gray-500">
                                {session.user?.email}
                              </p>
                            </div>
                            <Link
                              href="/profile"
                              onClick={e => {
                                e.stopPropagation()
                                setIsProfileMenuOpen(false)
                              }}
                              className="relative block cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              style={{ pointerEvents: 'auto', zIndex: 1000, position: 'relative' }}
                            >
                              <div className="flex items-center">
                                <User className="mr-2 h-4 w-4" />
                                {t.header.myProfile}
                              </div>
                            </Link>
                            <Link
                              href="/my-watches"
                              onClick={e => {
                                e.stopPropagation()
                                setIsProfileMenuOpen(false)
                              }}
                              className="relative block cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              style={{ pointerEvents: 'auto', zIndex: 1000, position: 'relative' }}
                            >
                              <div className="flex items-center">
                                <Package className="mr-2 h-4 w-4" />
                                {t.header.mySelling}
                              </div>
                            </Link>
                            <Link
                              href="/my-watches/buying"
                              onClick={e => {
                                e.stopPropagation()
                                setIsProfileMenuOpen(false)
                              }}
                              className="relative block cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              style={{ pointerEvents: 'auto', zIndex: 1000, position: 'relative' }}
                            >
                              <div className="flex items-center">
                                <ShoppingBag className="mr-2 h-4 w-4" />
                                {t.header.myBuying}
                              </div>
                            </Link>
                            <Link
                              href="/my-watches/account"
                              onClick={e => {
                                e.stopPropagation()
                                setIsProfileMenuOpen(false)
                              }}
                              className="relative block cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              style={{ pointerEvents: 'auto', zIndex: 1000, position: 'relative' }}
                            >
                              <div className="flex items-center">
                                <Settings className="mr-2 h-4 w-4" />
                                {t.header.settings}
                              </div>
                            </Link>
                            <div className="my-1 border-t border-gray-200" />
                            <Link
                              href="/my-watches/selling/fees"
                              onClick={e => {
                                e.stopPropagation()
                                setIsProfileMenuOpen(false)
                              }}
                              className="relative block cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              style={{
                                pointerEvents: 'auto',
                                zIndex: 1000,
                                position: 'relative',
                              }}
                            >
                              <div className="flex items-center">
                                <Wallet className="mr-2 h-4 w-4" />
                                {t.header.feesAndInvoices}
                              </div>
                            </Link>
                            <Link
                              href="/my-watches/selling/cancel-request"
                              onClick={e => {
                                e.stopPropagation()
                                setIsProfileMenuOpen(false)
                              }}
                              className="relative block cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              style={{
                                pointerEvents: 'auto',
                                zIndex: 1000,
                                position: 'relative',
                              }}
                            >
                              <div className="flex items-center">
                                <X className="mr-2 h-4 w-4" />
                                {t.header.cancel}
                              </div>
                            </Link>
                            {(isAdmin ||
                              session.user?.isAdmin === true ||
                              session.user?.isAdmin === true) && (
                              <>
                                <div className="my-1 border-t border-gray-200" />
                                <Link
                                  href="/admin/dashboard"
                                  onClick={e => {
                                    e.stopPropagation()
                                    setIsProfileMenuOpen(false)
                                  }}
                                  className="relative block cursor-pointer px-4 py-2 text-sm font-semibold text-gray-700 text-primary-600 hover:bg-gray-100"
                                  style={{
                                    pointerEvents: 'auto',
                                    zIndex: 1000,
                                    position: 'relative',
                                  }}
                                >
                                  <div className="flex items-center">
                                    <Shield className="mr-2 h-4 w-4" />
                                    {t.header.adminDashboard}
                                  </div>
                                </Link>
                              </>
                            )}
                            <div className="my-1 border-t border-gray-200" />
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
                              className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
                            >
                              <div className="flex items-center">
                                <LogOut className="mr-2 h-4 w-4" />
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
                    <Link
                      href="/login"
                      className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600"
                    >
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
                className="flex items-center gap-1 rounded-md px-3 py-2 font-medium text-gray-700 transition-colors hover:text-primary-600"
                title={t.header.selectLanguage}
              >
                <span className="text-lg">{languages.find(l => l.code === language)?.flag}</span>
                <span className="text-sm">
                  {languages.find(l => l.code === language)?.code.toUpperCase()}
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${isLanguageMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Language Dropdown */}
              {isLanguageMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsLanguageMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      {languages.map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setLanguage(lang.code)
                            setIsLanguageMenuOpen(false)
                          }}
                          className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                            language === lang.code
                              ? 'bg-primary-50 font-medium text-primary-600'
                              : 'text-gray-700'
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
              className="p-2 text-gray-400 hover:text-gray-500 md:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* ZWEITE ZEILE: Suchleiste - ZENTRIERT */}
        <div className="hidden border-t border-gray-200 py-3 md:block">
          <div className="flex items-center justify-center">
            {/* Suchleiste - Zentriert */}
            <div className="max-w-3xl flex-1">
              <form onSubmit={handleSearch}>
                <div className="relative flex items-center">
                  <div className="pointer-events-none absolute left-4 flex items-center">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder={t.header.searchPlaceholder}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="block w-full rounded-l-lg border border-gray-300 py-2.5 pl-11 pr-4 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="submit"
                    className="rounded-r-lg bg-primary-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-primary-700"
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
        <div className="pb-4 md:hidden">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t.header.searchPlaceholder}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </form>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="space-y-1 border-t px-2 pb-3 pt-2 sm:px-3">
              <Link
                href="/categories"
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
              >
                {t.header.categories}
              </Link>
              <Link
                href="/auctions"
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
              >
                {t.header.auctions}
              </Link>
              <div className="px-3 py-2">
                <div className="mb-1 text-base font-medium text-gray-700">{t.header.sell}</div>
                <Link
                  href="/sell"
                  className="block py-2 pl-4 text-sm text-gray-600 hover:text-primary-600"
                >
                  {t.header.singleItem}
                </Link>
                <Link
                  href="/sell/bulk"
                  className="block py-2 pl-4 text-sm text-gray-600 hover:text-primary-600"
                >
                  {t.header.multipleItems}
                </Link>
              </div>
              {session ? (
                <>
                  <div className="flex items-center space-x-3 border-b border-gray-200 px-3 py-3">
                    <Link
                      href={session.user?.id ? `/users/${session.user.id}` : '/profile'}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-primary-600 text-white transition-opacity hover:opacity-80"
                    >
                      {getProfileImage() ? (
                        <img
                          src={getProfileImage()}
                          alt={session.user?.name || t.header.profile}
                          className="h-full w-full rounded-full object-cover"
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
                      <p className="truncate text-xs text-gray-500">{session.user?.email}</p>
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="block flex items-center rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                  >
                    <User className="mr-2 h-5 w-5" />
                    {t.header.myProfile}
                  </Link>
                  <Link
                    href="/my-watches"
                    onClick={() => setIsMenuOpen(false)}
                    className="block flex items-center rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                  >
                    <Package className="mr-2 h-5 w-5" />
                    {t.header.mySelling}
                  </Link>
                  <Link
                    href="/my-watches/buying"
                    onClick={() => setIsMenuOpen(false)}
                    className="block flex items-center rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                  >
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    {t.header.myBuying}
                  </Link>
                  <Link
                    href="/my-watches/account"
                    onClick={() => setIsMenuOpen(false)}
                    className="block flex items-center rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                  >
                    <Settings className="mr-2 h-5 w-5" />
                    {t.header.settings}
                  </Link>
                  <Link
                    href="/my-watches/selling/fees"
                    onClick={() => setIsMenuOpen(false)}
                    className="block flex items-center rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                  >
                    <Wallet className="mr-2 h-5 w-5" />
                    {t.header.feesAndInvoices}
                  </Link>
                  <Link
                    href="/my-watches/selling/cancel-request"
                    onClick={() => setIsMenuOpen(false)}
                    className="block flex items-center rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                  >
                    <X className="mr-2 h-5 w-5" />
                    {t.header.cancel}
                  </Link>
                  {(session?.user?.isAdmin || isAdmin) && (
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setIsMenuOpen(false)}
                      className="block flex items-center rounded-md px-3 py-2 text-base font-semibold text-primary-600 hover:text-primary-700"
                    >
                      <Shield className="mr-2 h-5 w-5" />
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
                    className="block flex w-full items-center rounded-md px-3 py-2 text-left text-base font-medium text-red-600 hover:text-red-700"
                  >
                    <LogOut className="mr-2 h-5 w-5" />
                    {t.header.logout}
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                >
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
