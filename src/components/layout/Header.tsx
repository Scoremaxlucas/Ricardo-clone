'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import {
  Search,
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
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false)
  const [isSellMenuOpen, setIsSellMenuOpen] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [profileDropdownPosition, setProfileDropdownPosition] = useState({ top: 0, right: 0 })
  const [languageDropdownPosition, setLanguageDropdownPosition] = useState({ top: 0, right: 0 })
  const profileButtonRef = useRef<HTMLButtonElement>(null)
  const languageButtonRef = useRef<HTMLButtonElement>(null)
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
    { code: 'de' as const, name: 'Deutsch', flag: '🇨🇭' }, // Schweizer Flagge für Deutsch
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
      if (session.user.isAdmin === true) {
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
              data.isAdmin === true || data.isAdmin === 'true'
            console.log('Setting isAdmin to:', adminValue)
            setIsAdmin(adminValue)
          })
          .catch(err => {
            console.error('Error loading admin status:', err)
            // Fallback: Verwende Session-Wert
            const fallbackValue = session.user.isAdmin === true
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
    <header className="sticky top-0 z-50 border-b bg-white shadow-md" style={{ position: 'relative' }}>
      <div className="mx-auto max-w-[1600px] px-2 sm:px-4 md:px-6 lg:px-8">
        {/* ERSTE ZEILE: Logo, Navigation, User Actions - NO OVERFLOW */}
        <div className="flex h-12 min-w-0 items-center justify-between py-1 md:h-14">
          {/* Logo - Mobile kleiner */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Logo size="sm" className="md:hidden" />
              <Logo size="md" className="hidden md:block" />
            </Link>
          </div>

          {/* Navigation - Responsive: Icons auf Mobile, Text auf Desktop */}
          {/* Overflow-hidden verhindert dass Elemente ausbrechen */}
          <div className="ml-1 flex min-w-0 flex-1 items-center justify-start gap-0.5 overflow-hidden sm:ml-2 sm:gap-1 md:ml-4 md:gap-2 lg:ml-8 lg:gap-4">
            {/* Favoriten - Icon auf Mobile, Icon + Text auf Desktop */}
            {session ? (
              <Link
                href="/favorites"
                className="relative flex items-center gap-1 rounded-md p-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary-600 sm:gap-2 sm:px-3 sm:py-2"
                title={t.header.favorites}
              >
                <Heart className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden text-sm font-medium sm:inline">{t.header.favorites}</span>
                {favoritesCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white sm:-right-1 sm:-top-1 sm:h-5 sm:w-5 sm:text-xs">
                    {favoritesCount > 9 ? '9+' : favoritesCount}
                  </span>
                )}
              </Link>
            ) : (
              <button
                onClick={() => alert(t.header.pleaseLoginForFavorites)}
                className="flex items-center gap-1 rounded-md p-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary-600 sm:gap-2 sm:px-3 sm:py-2"
                title={t.header.favorites}
              >
                <Heart className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden text-sm font-medium sm:inline">{t.header.favorites}</span>
              </button>
            )}
            {/* Auktionen - Icon auf Mobile, Icon + Text auf Desktop */}
            <Link
              href="/auctions"
              className="flex items-center gap-1 rounded-md p-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary-600 sm:gap-2 sm:px-3 sm:py-2"
              title={t.header.auctions}
            >
              <Gavel className="h-5 w-5 sm:h-4 sm:w-4" />
              <span className="hidden text-sm font-medium sm:inline">{t.header.auctions}</span>
            </Link>
            {/* Verkaufen Dropdown - Icon auf Mobile, Icon + Text auf Desktop */}
            <div
              className="relative"
              onMouseEnter={() => setIsSellMenuOpen(true)}
              onMouseLeave={() => setIsSellMenuOpen(false)}
            >
              <Link
                href="/sell"
                className="flex items-center gap-1 rounded-md p-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary-600 sm:gap-2 sm:px-3 sm:py-2"
                title={t.header.sell}
              >
                <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden text-sm font-medium sm:inline">{t.header.sell}</span>
                <ChevronDown className="hidden h-3 w-3 sm:block" />
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

            {/* User Actions - Rechts - IMMER SICHTBAR - Overflow verhindern - NO BRANCHING OUT */}
          <div className="flex flex-shrink-0 items-center gap-0.5 overflow-hidden sm:gap-1 md:gap-1.5 lg:gap-2">
            {/* Notifications - Icon auf Mobile, Icon + Text auf Desktop */}
            <Link
              href="/notifications"
              className="relative flex items-center gap-1 rounded-md p-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary-600 sm:gap-2 sm:px-3 sm:py-2"
              title={t.header.notifications}
            >
              <div className="relative">
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white sm:-right-2 sm:-top-2 sm:h-5 sm:w-5 sm:text-xs">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </div>
              <span className="hidden text-sm font-medium sm:inline">{t.header.notifications}</span>
            </Link>

            {/* User Menu - IMMER SICHTBAR */}
            <div className="relative flex items-center space-x-1 sm:space-x-2">
              {session ? (
                <>
                  {/* Begrüßung - Versteckt auf sehr kleinen Bildschirmen, gekürzter Name */}
                  <div className="mr-0.5 hidden min-w-0 items-center gap-0.5 overflow-hidden text-xs text-gray-700 sm:flex md:mr-1 md:gap-1 md:text-sm">
                    <span className="hidden lg:inline">{t.header.hello},</span>
                    {/* Gekürzter Name mit max-width um Overflow zu verhindern - NO OVERFLOW */}
                    <div className="max-w-[35px] truncate sm:max-w-[50px] md:max-w-[65px] lg:max-w-[85px] xl:max-w-[110px]">
                      <UserName
                        userId={session.user.id}
                        userName={
                          userNickname || session.user?.nickname || session.user?.name || 'Benutzer'
                        }
                        badgeSize="sm"
                        className="truncate"
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      ref={profileButtonRef}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        console.log('Profile button clicked, current state:', isProfileMenuOpen)
                        if (profileButtonRef.current) {
                          const rect = profileButtonRef.current.getBoundingClientRect()
                          setProfileDropdownPosition({
                            top: rect.bottom + 8,
                            right: window.innerWidth - rect.right
                          })
                        }
                        setIsProfileMenuOpen(!isProfileMenuOpen)
                      }}
                      className="relative flex items-center justify-center gap-1 rounded-full bg-primary-600 p-1 text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:px-2 sm:py-1"
                      title={t.header.profileMenu}
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-700 sm:h-8 sm:w-8">
                        {getProfileImage() ? (
                          <img
                            src={getProfileImage() || undefined}
                            alt={session.user?.name || t.header.myProfile}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] font-semibold sm:text-xs">
                            {getInitials(session.user?.name)}
                          </span>
                        )}
                      </div>
                      <ChevronDown
                        className={`h-3 w-3 transition-transform sm:h-4 sm:w-4 ${isProfileMenuOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {isProfileMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-[45] bg-transparent"
                          onClick={() => {
                            console.log('Overlay clicked, closing dropdown')
                            setIsProfileMenuOpen(false)
                          }}
                        />
                        <div
                          className="fixed z-[60] w-56 rounded-md bg-white shadow-xl ring-1 ring-black ring-opacity-5"
                          onClick={(e) => {
                            console.log('Dropdown clicked, isProfileMenuOpen:', isProfileMenuOpen)
                            e.stopPropagation()
                          }}
                          style={{
                            display: 'block',
                            visibility: 'visible',
                            opacity: 1,
                            top: `${profileDropdownPosition.top}px`,
                            right: `${profileDropdownPosition.right}px`
                          }}
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
                            {(isAdmin || session.user?.isAdmin === true) && (
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
                  {/* Login - Icon auf Mobile, Icon + Text auf Desktop */}
                  <Link
                    href="/login"
                    className="flex items-center gap-1 rounded-md p-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary-600 sm:gap-2 sm:px-3 sm:py-2"
                    title={t.header.login}
                  >
                    <User className="h-5 w-5 sm:h-4 sm:w-4" />
                    <span className="hidden text-sm font-medium sm:inline">{t.header.login}</span>
                  </Link>
                </>
              )}
            </div>

            {/* Language Selector - Far Right - Nur Flagge, kein Text um Overflow zu vermeiden */}
            <div className="relative flex-shrink-0">
              <button
                ref={languageButtonRef}
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('Language button clicked, current state:', isLanguageMenuOpen)
                  if (languageButtonRef.current) {
                    const rect = languageButtonRef.current.getBoundingClientRect()
                    setLanguageDropdownPosition({
                      top: rect.bottom + 8,
                      right: window.innerWidth - rect.right
                    })
                  }
                  setIsLanguageMenuOpen(!isLanguageMenuOpen)
                }}
                className="flex items-center justify-center rounded-md p-1.5 font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary-600 sm:p-2"
                title={`${t.header.selectLanguage}: ${languages.find(l => l.code === language)?.name}`}
              >
                {/* Nur Flagge anzeigen, kein Text um Overflow zu vermeiden */}
                <span className="text-lg sm:text-xl">{languages.find(l => l.code === language)?.flag}</span>
                <ChevronDown
                  className={`ml-0.5 h-3 w-3 transition-transform sm:h-4 sm:w-4 ${isLanguageMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Language Dropdown */}
              {isLanguageMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[45] bg-transparent"
                    onClick={() => {
                      console.log('Language overlay clicked, closing dropdown')
                      setIsLanguageMenuOpen(false)
                    }}
                  />
                  <div
                    className="fixed z-[60] w-48 rounded-md bg-white shadow-xl ring-1 ring-black ring-opacity-5"
                    onClick={(e) => {
                      console.log('Language dropdown clicked, isLanguageMenuOpen:', isLanguageMenuOpen)
                      e.stopPropagation()
                    }}
                    style={{
                      display: 'block',
                      visibility: 'visible',
                      opacity: 1,
                      top: `${languageDropdownPosition.top}px`,
                      right: `${languageDropdownPosition.right}px`
                    }}
                  >
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

          </div>
        </div>

        {/* ZWEITE ZEILE: Suchleiste - ZENTRIERT - Versteckt auf sehr kleinen Bildschirmen */}
        <div className="hidden border-t border-gray-200 py-3 sm:block">
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

        {/* Mobile Search - Kompakter */}
        <div className="border-t border-gray-200 px-2 pb-2 pt-2 md:hidden">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t.header.searchPlaceholder}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </form>
        </div>

      </div>
    </header>
  )
}
