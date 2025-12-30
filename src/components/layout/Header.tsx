'use client'

/**
 * HeaderOptimized - Performance-optimierter Header
 *
 * Optimierungen:
 * 1. Deferred Data Loading - Nicht-kritische Daten verzögert
 * 2. Minimal Initial JS - Event Listener bei Interaktion
 * 3. Prefetch auf Hover - Intent-based prefetching
 * 4. Memo für teure Berechnungen
 */

import { HeaderSearch } from '@/components/search/HeaderSearch'
import { MobileSearchOverlay } from '@/components/search/MobileSearchOverlay'
import { LoginPromptModal } from '@/components/ui/LoginPromptModal'
import { Logo } from '@/components/ui/Logo'
import { Sheet, SheetContent } from '@/components/ui/Sheet'
import { UserName } from '@/components/ui/UserName'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Baby,
  Bell,
  Car,
  ChevronDown,
  ChevronRight,
  Dumbbell,
  Gamepad2,
  Gavel,
  Grid3x3,
  Heart,
  Home,
  Laptop,
  LogOut,
  Menu,
  Package,
  Plus,
  Search,
  Settings,
  Shield,
  Shirt,
  ShoppingBag,
  User,
  Wallet,
  Watch,
  X,
} from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { memo, useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { CategorySidebarNew } from './CategorySidebarNew'

// Deferred data types
interface DeferredData {
  nickname: string | null
  isAdmin: boolean
  isVerified: boolean
  favoritesCount: number
  unreadNotifications: number
}

export const HeaderOptimized = memo(function HeaderOptimized() {
  // === CRITICAL STATE (sofort benötigt) ===
  const { data: session, status } = useSession()
  const router = useRouter()
  const { language, setLanguage, t } = useLanguage()
  const [isPending, startTransition] = useTransition()

  // === UI STATE (Dropdowns) ===
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false)
  const [isSellMenuOpen, setIsSellMenuOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // === SEARCH STATE ===
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)

  // === DEFERRED STATE (nicht-kritisch, verzögert laden) ===
  const [deferredData, setDeferredData] = useState<DeferredData>({
    nickname: null,
    isAdmin: false,
    isVerified: false,
    favoritesCount: 0,
    unreadNotifications: 0,
  })
  const [profileImage, setProfileImage] = useState<string | null>(null)

  // === REFS ===
  const menuTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const dataLoadedRef = useRef(false)
  const prefetchedRef = useRef<Set<string>>(new Set())

  // === CONSTANTS ===
  const languages = [
    { code: 'de' as const, name: 'Deutsch', flag: '🇨🇭' },
    { code: 'en' as const, name: 'English', flag: '🇬🇧' },
    { code: 'fr' as const, name: 'Français', flag: '🇫🇷' },
    { code: 'it' as const, name: 'Italiano', flag: '🇮🇹' },
  ]

  // === OPTIMIERT: Deferred Data Loading ===
  // Lädt nicht-kritische Daten NACH dem ersten Paint
  useEffect(() => {
    if (!session?.user || dataLoadedRef.current) return
    dataLoadedRef.current = true

    const userId = (session.user as any)?.id
    if (!userId) return

    // Lade alle Daten parallel, aber verzögert
    const loadDeferredData = async () => {
      const [nicknameRes, adminRes, verifiedRes, favoritesRes, notificationsRes] =
        await Promise.allSettled([
          fetch(`/api/user/nickname?userId=${userId}`)
            .then(r => r.json())
            .catch(() => ({})),
          fetch(`/api/user/admin-status`)
            .then(r => r.json())
            .catch(() => ({})),
          fetch(`/api/user/verified?userId=${userId}`)
            .then(r => r.json())
            .catch(() => ({})),
          fetch('/api/favorites')
            .then(r => r.json())
            .catch(() => ({})),
          fetch('/api/notifications/unread-count')
            .then(r => r.json())
            .catch(() => ({})),
        ])

      setDeferredData({
        nickname: nicknameRes.status === 'fulfilled' ? nicknameRes.value.nickname : null,
        isAdmin: adminRes.status === 'fulfilled' ? adminRes.value.isAdmin === true : false,
        isVerified:
          verifiedRes.status === 'fulfilled' ? verifiedRes.value.verified === true : false,
        favoritesCount:
          favoritesRes.status === 'fulfilled' ? favoritesRes.value.favorites?.length || 0 : 0,
        unreadNotifications:
          notificationsRes.status === 'fulfilled' ? notificationsRes.value.count || 0 : 0,
      })
    }

    // Verzögere um 100ms nach Mount für besseren FCP
    if ('requestIdleCallback' in window) {
      ;(window as any).requestIdleCallback(loadDeferredData, { timeout: 1000 })
    } else {
      setTimeout(loadDeferredData, 100)
    }

    // Profilbild aus localStorage (synchron, aber klein)
    const storedImage = localStorage.getItem('profileImage')
    if (storedImage) setProfileImage(storedImage)
  }, [session?.user])

  // === OPTIMIERT: Notification Polling nur wenn sichtbar ===
  useEffect(() => {
    if (!session?.user) return

    let pollInterval: NodeJS.Timeout | null = null

    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications/unread-count')
        if (res.ok) {
          const data = await res.json()
          setDeferredData(prev => ({ ...prev, unreadNotifications: data.count || 0 }))
        }
      } catch {
        // Silent fail
      }
    }

    // Nur pollen wenn Tab sichtbar
    const startPolling = () => {
      if (pollInterval) clearInterval(pollInterval)
      pollInterval = setInterval(fetchNotifications, 30000) // Alle 30s statt 5s
    }

    const stopPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval)
        pollInterval = null
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications() // Sofort aktualisieren
        startPolling()
      } else {
        stopPolling()
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    if (document.visibilityState === 'visible') {
      startPolling()
    }

    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [session?.user])

  // === OPTIMIERT: Menu Handlers mit Cleanup ===
  const handleMenuEnter = useCallback((setter: (v: boolean) => void) => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current)
      menuTimeoutRef.current = null
    }
    setter(true)
  }, [])

  const handleMenuLeave = useCallback((setter: (v: boolean) => void) => {
    menuTimeoutRef.current = setTimeout(() => setter(false), 150)
  }, [])

  useEffect(() => {
    return () => {
      if (menuTimeoutRef.current) clearTimeout(menuTimeoutRef.current)
    }
  }, [])

  // === Close all dropdown menus on scroll ===
  useEffect(() => {
    if (!isLanguageMenuOpen && !isProfileMenuOpen && !isSellMenuOpen) return

    const handleScroll = () => {
      setIsLanguageMenuOpen(false)
      setIsProfileMenuOpen(false)
      setIsSellMenuOpen(false)
    }

    window.addEventListener('scroll', handleScroll, true) // Use capture phase to catch all scroll events

    return () => {
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [isLanguageMenuOpen, isProfileMenuOpen, isSellMenuOpen])

  // === OPTIMIERT: Prefetch bei Hover ===
  const handlePrefetch = useCallback(
    (href: string) => {
      if (prefetchedRef.current.has(href)) return
      prefetchedRef.current.add(href)
      router.prefetch(href)
    },
    [router]
  )

  // === OPTIMIERT: Schnelle Navigation mit startTransition ===
  const handleNavigation = useCallback(
    (href: string) => {
      startTransition(() => {
        router.push(href)
      })
    },
    [router]
  )

  // === HELPER FUNCTIONS ===
  const getInitials = (name?: string | null) => {
    if (!name) return 'U'
    const parts = name.split(' ')
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase()
  }

  const getProfileImage = () => profileImage || session?.user?.image || null

  const displayName =
    deferredData.nickname || (session?.user as any)?.nickname || session?.user?.name || 'Benutzer'

  return (
    <header id="navigation" className="sticky top-0 z-50 border-b bg-white shadow-md" tabIndex={-1}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* MOBILE HEADER */}
        <div className="flex h-14 items-center justify-between md:hidden">
          {/* Logo */}
          <Link href="/" prefetch={true} className="flex-shrink-0">
            <Logo size="sm" />
          </Link>

          {/* Actions Row */}
          <div className="flex items-center gap-2">
            {/* Search Icon - Opens Mobile Overlay */}
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-md text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary-600"
              aria-label="Suche öffnen"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Sell Button - Always visible */}
            <Link
              href="/sell"
              className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700"
              title={t.header.sell}
            >
              <Plus className="h-4 w-4" />
              <span className="xs:inline hidden">Verkaufen</span>
            </Link>

            {/* Notifications */}
            {session && (
              <Link
                href="/notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-md text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary-600"
                title={t.header.notifications}
              >
                <Bell className="h-5 w-5" />
                {deferredData.unreadNotifications > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500/90 text-[10px] font-bold text-white">
                    {deferredData.unreadNotifications > 9 ? '9+' : deferredData.unreadNotifications}
                  </span>
                )}
              </Link>
            )}

            {/* Profile Avatar */}
            {session ? (
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white transition-all hover:bg-primary-700"
                title={t.header.profileMenu}
              >
                {getProfileImage() ? (
                  <img
                    src={getProfileImage() || undefined}
                    alt={session.user?.name || t.header.myProfile}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-semibold">{getInitials(session.user?.name)}</span>
                )}
              </button>
            ) : (
              <Link
                href="/login"
                className="flex h-10 w-10 items-center justify-center rounded-md text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary-600"
                title={t.header.login}
              >
                <User className="h-5 w-5" />
              </Link>
            )}

            {/* Hamburger Menu */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-md text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary-600"
              title="Menü"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* DESKTOP HEADER - Ricardo-Style zweizeiliges Layout */}
        <div className="hidden md:block">
          {/* === ROW 1: Logo + Navigation + User Actions === */}
          <div className="flex h-12 items-center justify-between border-b border-gray-100">
            {/* Left: Logo */}
            <Link href="/" prefetch={true} className="flex-none">
              <Logo size="md" />
            </Link>

            {/* Right: Navigation + User Actions */}
            <div className="flex items-center gap-1 lg:gap-2">
              {/* Verkaufen Dropdown */}
              <div
                className="relative z-50"
                onMouseEnter={() => {
                  setIsLanguageMenuOpen(false)
                  setIsProfileMenuOpen(false)
                  handleMenuEnter(setIsSellMenuOpen)
                  handlePrefetch('/sell')
                }}
                onMouseLeave={() => handleMenuLeave(setIsSellMenuOpen)}
              >
                <Link
                  href="/sell"
                  prefetch={true}
                  className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary-600"
                  title={t.header.sell}
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm font-medium">Angebot erstellen</span>
                  <ChevronDown
                    className={`h-3 w-3 transition-transform ${isSellMenuOpen ? 'rotate-180' : ''}`}
                  />
                </Link>

                {isSellMenuOpen && (
                  <>
                    <div className="absolute left-0 top-full z-[10001] h-1 w-full" />
                    <div
                      className="absolute left-0 top-full z-[10002] mt-1 w-56 rounded-lg border border-gray-100 bg-white py-1 shadow-lg"
                      style={{ pointerEvents: 'auto' }}
                    >
                      <Link
                        href="/sell"
                        prefetch={true}
                        onClick={() => setIsSellMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary-600"
                      >
                        <div className="font-medium">{t.header.singleItem}</div>
                        <div className="text-xs text-gray-500">{t.header.singleItemDesc}</div>
                      </Link>
                      <Link
                        href="/sell/bulk"
                        prefetch={true}
                        onMouseEnter={() => handlePrefetch('/sell/bulk')}
                        onClick={() => setIsSellMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary-600"
                      >
                        <div className="font-medium">{t.header.multipleItems}</div>
                        <div className="text-xs text-gray-500">{t.header.multipleItemsDesc}</div>
                      </Link>
                    </div>
                  </>
                )}
              </div>

              {/* Favoriten */}
              {session ? (
                <Link
                  href="/favorites"
                  prefetch={true}
                  onMouseEnter={() => handlePrefetch('/favorites')}
                  className="relative flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary-600"
                  title={t.header.favorites}
                >
                  <Heart className="h-4 w-4" />
                  <span className="text-sm font-medium">{t.header.favorites}</span>
                  {deferredData.favoritesCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {deferredData.favoritesCount > 9 ? '9+' : deferredData.favoritesCount}
                    </span>
                  )}
                </Link>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary-600"
                  title={t.header.favorites}
                >
                  <Heart className="h-4 w-4" />
                  <span className="text-sm font-medium">{t.header.favorites}</span>
                </button>
              )}

              {/* Notifications */}
              <Link
                href="/notifications"
                prefetch={true}
                onMouseEnter={() => handlePrefetch('/notifications')}
                className="relative flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary-600"
                title={t.header.notifications}
              >
                <Bell className="h-4 w-4" />
                <span className="hidden text-sm font-medium lg:inline">Benachrichtigungen</span>
                {deferredData.unreadNotifications > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {deferredData.unreadNotifications > 9 ? '9+' : deferredData.unreadNotifications}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              {session ? (
                <div
                  className="relative"
                  onMouseEnter={() => {
                    setIsLanguageMenuOpen(false)
                    setIsSellMenuOpen(false)
                    handleMenuEnter(setIsProfileMenuOpen)
                    handlePrefetch('/profile')
                    handlePrefetch('/my-watches')
                  }}
                  onMouseLeave={() => handleMenuLeave(setIsProfileMenuOpen)}
                >
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-md px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100"
                    title={t.header.profileMenu}
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-white">
                      {getProfileImage() ? (
                        <img
                          src={getProfileImage() || undefined}
                          alt={session.user?.name || t.header.myProfile}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] font-semibold">
                          {getInitials(session.user?.name)}
                        </span>
                      )}
                    </div>
                    <span className="hidden text-sm font-medium lg:inline">{displayName}</span>
                    <ChevronDown
                      className={`h-3 w-3 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isProfileMenuOpen && (
                    <div
                      className="absolute right-0 top-full z-[9999] w-56 rounded-lg border border-gray-100 bg-white py-1 shadow-lg"
                      style={{ marginTop: '4px', pointerEvents: 'auto' }}
                    >
                      <div className="border-b border-gray-100 px-4 py-3">
                        <p className="flex items-center gap-1 text-sm font-medium text-gray-900">
                          <UserName
                            userId={(session?.user as any)?.id || ''}
                            userName={displayName}
                            badgeSize="sm"
                          />
                        </p>
                        <p className="truncate text-sm text-gray-500">{session.user?.email}</p>
                      </div>

                      <Link
                        href="/profile"
                        prefetch={true}
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary-600"
                      >
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          {t.header.myProfile}
                        </div>
                      </Link>
                      <Link
                        href="/my-watches"
                        prefetch={true}
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary-600"
                      >
                        <div className="flex items-center">
                          <Package className="mr-2 h-4 w-4" />
                          {t.header.mySelling}
                        </div>
                      </Link>
                      <Link
                        href="/my-watches/buying"
                        prefetch={true}
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary-600"
                      >
                        <div className="flex items-center">
                          <ShoppingBag className="mr-2 h-4 w-4" />
                          {t.header.myBuying}
                        </div>
                      </Link>
                      <Link
                        href="/my-watches/account"
                        prefetch={true}
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary-600"
                      >
                        <div className="flex items-center">
                          <Settings className="mr-2 h-4 w-4" />
                          {t.header.settings}
                        </div>
                      </Link>

                      <div className="my-1 border-t border-gray-100" />

                      <Link
                        href="/my-watches/selling/fees"
                        prefetch={true}
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary-600"
                      >
                        <div className="flex items-center">
                          <Wallet className="mr-2 h-4 w-4" />
                          {t.header.feesAndInvoices}
                        </div>
                      </Link>
                      <Link
                        href="/my-watches/selling/cancel-request"
                        prefetch={true}
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary-600"
                      >
                        <div className="flex items-center">
                          <X className="mr-2 h-4 w-4" />
                          {t.header.cancel}
                        </div>
                      </Link>

                      {(deferredData.isAdmin || (session.user as any)?.isAdmin) && (
                        <>
                          <div className="my-1 border-t border-gray-100" />
                          <Link
                            href="/admin/dashboard"
                            prefetch={true}
                            onClick={() => setIsProfileMenuOpen(false)}
                            className="block px-4 py-2 text-sm font-semibold text-primary-600 transition-colors hover:bg-gray-50 hover:text-primary-700"
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
                          await signOut({ callbackUrl: '/' })
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
                      >
                        <div className="flex items-center">
                          <LogOut className="mr-2 h-4 w-4" />
                          {t.header.logout}
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  prefetch={true}
                  onMouseEnter={() => handlePrefetch('/login')}
                  className="flex items-center gap-1.5 rounded-md px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary-600"
                  title={t.header.login}
                >
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">{t.header.login}</span>
                </Link>
              )}

              {/* Language Selector */}
              <div
                className="relative"
                onMouseEnter={() => {
                  setIsProfileMenuOpen(false)
                  setIsSellMenuOpen(false)
                  handleMenuEnter(setIsLanguageMenuOpen)
                }}
                onMouseLeave={() => handleMenuLeave(setIsLanguageMenuOpen)}
              >
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-md px-2 py-2 text-gray-700 transition-colors hover:bg-gray-100"
                  title={`${t.header.selectLanguage}: ${languages.find(l => l.code === language)?.name}`}
                >
                  <span className="text-base">
                    {languages.find(l => l.code === language)?.flag}
                  </span>
                  <span className="hidden text-sm lg:inline">{language.toUpperCase()}</span>
                  <ChevronDown
                    className={`h-3 w-3 transition-transform ${isLanguageMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isLanguageMenuOpen && (
                  <div
                    className="absolute right-0 top-full z-[10000] w-36 rounded-md border border-gray-200 bg-white py-0.5 shadow-lg"
                    style={{ marginTop: '4px', pointerEvents: 'auto' }}
                  >
                    {languages.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code)
                          setIsLanguageMenuOpen(false)
                        }}
                        className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-gray-50 ${
                          language === lang.code
                            ? 'bg-primary-50 font-medium text-primary-600'
                            : 'text-gray-700 hover:text-primary-600'
                        }`}
                      >
                        <span className="text-base">{lang.flag}</span>
                        <span className="flex-1">{lang.name}</span>
                        {language === lang.code && (
                          <span className="text-xs text-primary-600">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* === ROW 2: Ricardo-Style Full-Width Searchbar === */}
          <div className="flex h-14 items-center">
            <HeaderSearch
              className="w-full"
              placeholder="Suche nach Artikel, Verkäufer oder Artikelnummer"
            />
          </div>
        </div>
      </div>

      {/* === ROW 3: Desktop Category Navigation Bar (Ricardo-Style) === */}
      <nav
        className="hidden border-t border-gray-100 bg-gray-50/80 lg:block"
        role="navigation"
        aria-label="Kategorien-Navigation"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-11 items-center justify-center gap-1">
            {/* "Alle Kategorien" Button - GANZ LINKS - Opens existing sidebar */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="flex items-center gap-1.5 rounded-md bg-primary-50 px-3 py-1.5 text-[13px] font-semibold text-primary-700 transition-colors hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
            >
              <Grid3x3 className="h-4 w-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Alle Kategorien</span>
              <ChevronRight className="h-3 w-3" />
            </button>

            {/* Divider */}
            <div className="mx-1 h-5 w-px bg-gray-300" />

            {/* Top 8 Categories */}
            {[
              { slug: 'auto-motorrad', name: 'Auto & Motorrad', icon: Car },
              { slug: 'computer-netzwerk', name: 'Computer & Netzwerk', icon: Laptop },
              { slug: 'kleidung-accessoires', name: 'Kleidung', icon: Shirt },
              { slug: 'haushalt-wohnen', name: 'Haushalt & Wohnen', icon: Home },
              { slug: 'sport', name: 'Sport', icon: Dumbbell },
              { slug: 'uhren-schmuck', name: 'Uhren & Schmuck', icon: Watch },
              { slug: 'games-konsolen', name: 'Games & Konsolen', icon: Gamepad2 },
              { slug: 'kind-baby', name: 'Kind & Baby', icon: Baby },
            ].map(category => (
              <Link
                key={category.slug}
                href={`/search?category=${category.slug}`}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium text-gray-700 transition-colors hover:bg-white hover:text-primary-600 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
              >
                <category.icon className="h-4 w-4 flex-shrink-0" />
                <span className="whitespace-nowrap">{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile Menu Sheet */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent onClose={() => setIsMobileMenuOpen(false)}>
          <div className="space-y-1 p-4">
            {/* Kategorien */}
            <button
              onClick={() => {
                setIsSidebarOpen(true)
                setIsMobileMenuOpen(false)
              }}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-gray-700 transition-colors hover:bg-gray-100"
            >
              <Grid3x3 className="h-5 w-5" />
              <span className="font-medium">Kategorien</span>
            </button>

            {/* Favoriten */}
            {session ? (
              <Link
                href="/favorites"
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-gray-700 transition-colors hover:bg-gray-100"
              >
                <Heart className="h-5 w-5" />
                <span className="font-medium">{t.header.favorites}</span>
                {deferredData.favoritesCount > 0 && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500/90 text-[10px] font-bold text-white">
                    {deferredData.favoritesCount > 9 ? '9+' : deferredData.favoritesCount}
                  </span>
                )}
              </Link>
            ) : (
              <button
                onClick={() => {
                  setIsLoginModalOpen(true)
                  setIsMobileMenuOpen(false)
                }}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-gray-700 transition-colors hover:bg-gray-100"
              >
                <Heart className="h-5 w-5" />
                <span className="font-medium">{t.header.favorites}</span>
              </button>
            )}

            {/* Auktionen */}
            <Link
              href="/auctions"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-gray-700 transition-colors hover:bg-gray-100"
            >
              <Gavel className="h-5 w-5" />
              <span className="font-medium">{t.header.auctions}</span>
            </Link>

            {/* Verkaufen */}
            <Link
              href="/sell"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex w-full items-center gap-3 rounded-lg bg-primary-50 px-4 py-3 text-left font-semibold text-primary-700 transition-colors hover:bg-primary-100"
            >
              <Plus className="h-5 w-5" />
              <span>{t.header.sell}</span>
            </Link>

            {/* Divider */}
            {session && (
              <>
                <div className="my-2 border-t border-gray-200" />
                <Link
                  href="/my-watches"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-gray-700 transition-colors hover:bg-gray-100"
                >
                  <Package className="h-5 w-5" />
                  <span className="font-medium">{t.header.mySelling}</span>
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-gray-700 transition-colors hover:bg-gray-100"
                >
                  <User className="h-5 w-5" />
                  <span className="font-medium">{t.header.myProfile}</span>
                </Link>
                <Link
                  href="/my-watches/account"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-gray-700 transition-colors hover:bg-gray-100"
                >
                  <Settings className="h-5 w-5" />
                  <span className="font-medium">{t.header.settings}</span>
                </Link>
                <div className="my-2 border-t border-gray-200" />
                <button
                  onClick={async () => {
                    setIsMobileMenuOpen(false)
                    await signOut({ callbackUrl: '/' })
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">{t.header.logout}</span>
                </button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile Profile Menu (when clicking avatar) */}
      {session && isProfileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setIsProfileMenuOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-xl border-t bg-white p-4 shadow-lg md:hidden">
            <div className="mb-4 border-b pb-4">
              <p className="flex items-center gap-1 text-sm font-medium text-gray-900">
                <UserName
                  userId={(session?.user as any)?.id || ''}
                  userName={displayName}
                  badgeSize="sm"
                />
              </p>
              <p className="truncate text-sm text-gray-500">{session.user?.email}</p>
            </div>
            <Link
              href="/profile"
              onClick={() => setIsProfileMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-700 hover:bg-gray-100"
            >
              <User className="h-5 w-5" />
              <span>{t.header.myProfile}</span>
            </Link>
            <Link
              href="/my-watches"
              onClick={() => setIsProfileMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-700 hover:bg-gray-100"
            >
              <Package className="h-5 w-5" />
              <span>{t.header.mySelling}</span>
            </Link>
            <button onClick={() => setIsProfileMenuOpen(false)} className="w-full text-left">
              <div className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-700 hover:bg-gray-100">
                <X className="h-5 w-5" />
                <span>Schließen</span>
              </div>
            </button>
          </div>
        </>
      )}

      <CategorySidebarNew isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <LoginPromptModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        title="Anmeldung erforderlich"
        message={t.header.pleaseLoginForFavorites}
        loginButtonText="Anmelden"
      />
      <MobileSearchOverlay
        isOpen={isMobileSearchOpen}
        onClose={() => setIsMobileSearchOpen(false)}
      />
    </header>
  )
})

export { HeaderOptimized as Header }
