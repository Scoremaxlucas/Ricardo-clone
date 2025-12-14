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

import { Logo } from '@/components/ui/Logo'
import { UserName } from '@/components/ui/UserName'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Bell,
  ChevronDown,
  Gavel,
  Heart,
  LogOut,
  Package,
  Plus,
  Settings,
  Shield,
  ShoppingBag,
  User,
  Wallet,
  X,
} from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { memo, useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { CategoryBar } from './CategoryBar'

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
      const [nicknameRes, adminRes, verifiedRes, favoritesRes, notificationsRes] = await Promise.allSettled([
        fetch(`/api/user/nickname?userId=${userId}`).then(r => r.json()).catch(() => ({})),
        fetch(`/api/user/admin-status`).then(r => r.json()).catch(() => ({})),
        fetch(`/api/user/verified?userId=${userId}`).then(r => r.json()).catch(() => ({})),
        fetch('/api/favorites').then(r => r.json()).catch(() => ({})),
        fetch('/api/notifications/unread-count').then(r => r.json()).catch(() => ({})),
      ])

      setDeferredData({
        nickname: nicknameRes.status === 'fulfilled' ? nicknameRes.value.nickname : null,
        isAdmin: adminRes.status === 'fulfilled' ? adminRes.value.isAdmin === true : false,
        isVerified: verifiedRes.status === 'fulfilled' ? verifiedRes.value.verified === true : false,
        favoritesCount: favoritesRes.status === 'fulfilled' ? favoritesRes.value.favorites?.length || 0 : 0,
        unreadNotifications: notificationsRes.status === 'fulfilled' ? notificationsRes.value.count || 0 : 0,
      })
    }

    // Verzögere um 100ms nach Mount für besseren FCP
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(loadDeferredData, { timeout: 1000 })
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

  // === OPTIMIERT: Prefetch bei Hover ===
  const handlePrefetch = useCallback((href: string) => {
    if (prefetchedRef.current.has(href)) return
    prefetchedRef.current.add(href)
    router.prefetch(href)
  }, [router])

  // === OPTIMIERT: Schnelle Navigation mit startTransition ===
  const handleNavigation = useCallback((href: string) => {
    startTransition(() => {
      router.push(href)
    })
  }, [router])

  // === HELPER FUNCTIONS ===
  const getInitials = (name?: string | null) => {
    if (!name) return 'U'
    const parts = name.split(' ')
    return parts.length >= 2 
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase()
  }

  const getProfileImage = () => profileImage || session?.user?.image || null

  const displayName = deferredData.nickname || (session?.user as any)?.nickname || session?.user?.name || 'Benutzer'

  return (
    <header id="navigation" className="sticky top-0 z-50 border-b bg-white shadow-md" tabIndex={-1}>
      <div className="mx-auto w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        {/* ERSTE ZEILE: Logo, Navigation, User Actions */}
        <div className="flex h-12 min-w-0 items-center justify-between py-1 md:h-14">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" prefetch={true} className="inline-flex items-center">
              <Logo size="sm" className="md:hidden" />
              <Logo size="md" className="hidden md:block" />
            </Link>
          </div>

          {/* Navigation */}
          <div className="ml-1 hidden min-w-0 flex-1 items-center justify-start gap-0.5 sm:ml-2 sm:flex sm:gap-1 md:ml-4 md:gap-2 lg:ml-8 lg:gap-4">
            {/* Favoriten */}
            {session ? (
              <Link
                href="/favorites"
                prefetch={true}
                onMouseEnter={() => handlePrefetch('/favorites')}
                className="relative flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-md p-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary-600 sm:min-h-0 sm:min-w-0 sm:justify-start sm:gap-2 sm:px-3 sm:py-2"
                title={t.header.favorites}
              >
                <Heart className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden text-sm font-medium sm:inline">{t.header.favorites}</span>
                {deferredData.favoritesCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white sm:-right-1 sm:-top-1 sm:h-5 sm:w-5 sm:text-xs">
                    {deferredData.favoritesCount > 9 ? '9+' : deferredData.favoritesCount}
                  </span>
                )}
              </Link>
            ) : (
              <button
                onClick={() => alert(t.header.pleaseLoginForFavorites)}
                className="hidden min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-md p-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary-600 sm:flex sm:min-h-0 sm:min-w-0 sm:justify-start sm:gap-2 sm:px-3 sm:py-2"
                title={t.header.favorites}
              >
                <Heart className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden text-sm font-medium sm:inline">{t.header.favorites}</span>
              </button>
            )}

            {/* Auktionen */}
            <Link
              href="/auctions"
              prefetch={true}
              onMouseEnter={() => handlePrefetch('/auctions')}
              className="hidden min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-md p-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary-600 sm:flex sm:min-h-0 sm:min-w-0 sm:justify-start sm:gap-2 sm:px-3 sm:py-2"
              title={t.header.auctions}
            >
              <Gavel className="h-5 w-5 sm:h-4 sm:w-4" />
              <span className="hidden text-sm font-medium sm:inline">{t.header.auctions}</span>
            </Link>

            {/* Verkaufen Dropdown */}
            <div
              className="relative z-50"
              onMouseEnter={() => {
                handleMenuEnter(setIsSellMenuOpen)
                handlePrefetch('/sell')
              }}
              onMouseLeave={() => handleMenuLeave(setIsSellMenuOpen)}
            >
              <Link
                href="/sell"
                prefetch={true}
                className="flex min-h-[44px] min-w-[44px] w-full items-center justify-center gap-1 rounded-md p-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary-600 sm:min-h-0 sm:min-w-0 sm:justify-start sm:gap-2 sm:px-3 sm:py-2"
                title={t.header.sell}
              >
                <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden text-sm font-medium sm:inline">{t.header.sell}</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${isSellMenuOpen ? 'rotate-180' : ''}`} />
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
          </div>

          {/* User Actions */}
          <div className="flex flex-shrink-0 items-center gap-0.5 sm:gap-1 md:gap-1.5 lg:gap-2">
            {/* Notifications */}
            <Link
              href="/notifications"
              prefetch={true}
              onMouseEnter={() => handlePrefetch('/notifications')}
              className="relative flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-md p-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary-600 sm:min-h-0 sm:min-w-0 sm:justify-start sm:gap-2 sm:px-3 sm:py-2"
              title={t.header.notifications}
            >
              <div className="relative">
                <Bell className="h-5 w-5" />
                {deferredData.unreadNotifications > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white sm:-right-2 sm:-top-2 sm:h-5 sm:w-5 sm:text-xs">
                    {deferredData.unreadNotifications > 9 ? '9+' : deferredData.unreadNotifications}
                  </span>
                )}
              </div>
              <span className="hidden text-sm font-medium sm:inline">{t.header.notifications}</span>
            </Link>

            {/* User Menu */}
            <div className="relative flex items-center space-x-1 sm:space-x-2">
              {session ? (
                <>
                  {/* Username */}
                  <div className="mr-0.5 hidden min-w-0 items-center gap-0.5 overflow-hidden text-xs text-gray-700 sm:flex md:mr-1 md:gap-1 md:text-sm">
                    <span className="hidden lg:inline">{t.header.hello},</span>
                    <div className="max-w-[35px] truncate sm:max-w-[50px] md:max-w-[65px] lg:max-w-[85px] xl:max-w-[110px]">
                      <UserName
                        userId={(session?.user as any)?.id || ''}
                        userName={displayName}
                        badgeSize="sm"
                        className="truncate"
                      />
                    </div>
                  </div>

                  {/* Profile Dropdown */}
                  <div
                    className="relative"
                    onMouseEnter={() => {
                      handleMenuEnter(setIsProfileMenuOpen)
                      handlePrefetch('/profile')
                      handlePrefetch('/my-watches')
                    }}
                    onMouseLeave={() => handleMenuLeave(setIsProfileMenuOpen)}
                  >
                    <button
                      type="button"
                      className="relative flex items-center justify-center gap-1 rounded-full bg-primary-600 p-1 text-white transition-all duration-200 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:px-2 sm:py-1"
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
                      <ChevronDown className={`h-3 w-3 transition-transform sm:h-4 sm:w-4 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
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

                        <Link href="/profile" prefetch={true} onClick={() => setIsProfileMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary-600">
                          <div className="flex items-center"><User className="mr-2 h-4 w-4" />{t.header.myProfile}</div>
                        </Link>
                        <Link href="/my-watches" prefetch={true} onClick={() => setIsProfileMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary-600">
                          <div className="flex items-center"><Package className="mr-2 h-4 w-4" />{t.header.mySelling}</div>
                        </Link>
                        <Link href="/my-watches/buying" prefetch={true} onClick={() => setIsProfileMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary-600">
                          <div className="flex items-center"><ShoppingBag className="mr-2 h-4 w-4" />{t.header.myBuying}</div>
                        </Link>
                        <Link href="/my-watches/account" prefetch={true} onClick={() => setIsProfileMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary-600">
                          <div className="flex items-center"><Settings className="mr-2 h-4 w-4" />{t.header.settings}</div>
                        </Link>

                        <div className="my-1 border-t border-gray-100" />

                        <Link href="/my-watches/selling/fees" prefetch={true} onClick={() => setIsProfileMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary-600">
                          <div className="flex items-center"><Wallet className="mr-2 h-4 w-4" />{t.header.feesAndInvoices}</div>
                        </Link>
                        <Link href="/my-watches/selling/cancel-request" prefetch={true} onClick={() => setIsProfileMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary-600">
                          <div className="flex items-center"><X className="mr-2 h-4 w-4" />{t.header.cancel}</div>
                        </Link>

                        {(deferredData.isAdmin || (session.user as any)?.isAdmin) && (
                          <>
                            <div className="my-1 border-t border-gray-100" />
                            <Link href="/admin/dashboard" prefetch={true} onClick={() => setIsProfileMenuOpen(false)} className="block px-4 py-2 text-sm font-semibold text-primary-600 transition-colors hover:bg-gray-50 hover:text-primary-700">
                              <div className="flex items-center"><Shield className="mr-2 h-4 w-4" />{t.header.adminDashboard}</div>
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
                          <div className="flex items-center"><LogOut className="mr-2 h-4 w-4" />{t.header.logout}</div>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Link
                  href="/login"
                  prefetch={true}
                  onMouseEnter={() => handlePrefetch('/login')}
                  className="hidden min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-md p-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary-600 sm:flex sm:min-h-0 sm:min-w-0 sm:justify-start sm:gap-2 sm:px-3 sm:py-2"
                  title={t.header.login}
                >
                  <User className="h-5 w-5 sm:h-4 sm:w-4" />
                  <span className="hidden text-sm font-medium sm:inline">{t.header.login}</span>
                </Link>
              )}
            </div>

            {/* Language Selector */}
            <div
              className="relative flex-shrink-0"
              onMouseEnter={() => handleMenuEnter(setIsLanguageMenuOpen)}
              onMouseLeave={() => handleMenuLeave(setIsLanguageMenuOpen)}
            >
              <button
                type="button"
                className="flex items-center justify-center rounded-md p-1.5 font-medium text-gray-700 transition-all duration-200 hover:bg-gray-100 hover:text-primary-600 sm:p-2"
                title={`${t.header.selectLanguage}: ${languages.find(l => l.code === language)?.name}`}
              >
                <span className="text-lg sm:text-xl">{languages.find(l => l.code === language)?.flag}</span>
                <ChevronDown className={`ml-0.5 h-3 w-3 transition-transform sm:h-4 sm:w-4 ${isLanguageMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLanguageMenuOpen && (
                <div
                  className="absolute right-0 top-full z-[9999] w-48 rounded-lg border border-gray-100 bg-white py-1 shadow-lg"
                  style={{ marginTop: '4px', pointerEvents: 'auto' }}
                >
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code)
                        setIsLanguageMenuOpen(false)
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${
                        language === lang.code
                          ? 'bg-primary-50 font-medium text-primary-600'
                          : 'text-gray-700 hover:text-primary-600'
                      }`}
                    >
                      <span className="text-xl">{lang.flag}</span>
                      <span>{lang.name}</span>
                      {language === lang.code && <span className="ml-auto text-primary-600">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CategoryBar */}
        <CategoryBar />
      </div>
    </header>
  )
})

export { HeaderOptimized as Header }
