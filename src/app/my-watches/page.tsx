'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  User,
  Sparkles,
  Zap,
  Flame,
  Package,
  FileText,
  TrendingUp,
  Wallet,
  Tag,
  Plus,
  Settings,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { BuyerInfoModal } from '@/components/buyer/BuyerInfoModal'
import { useLanguage } from '@/contexts/LanguageContext'

interface BuyerInfo {
  id: string
  name: string | null
  email: string | null
  firstName: string | null
  lastName: string | null
  street: string | null
  streetNumber: string | null
  postalCode: string | null
  city: string | null
  phone: string | null
  paymentMethods: string | null
}

interface Item {
  id: string
  title: string
  brand: string
  model: string
  price: number
  images: string[]
  createdAt: string
  isSold?: boolean
  buyer?: BuyerInfo | null
  finalPrice?: number
  boosters?: string[]
}

export default function MyWatchesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Item[]>([])
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const [verificationInProgress, setVerificationInProgress] = useState(false)
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerInfo | null>(null)
  const [selectedItemTitle, setSelectedItemTitle] = useState<string>('')
  const [showBuyerInfo, setShowBuyerInfo] = useState(false)
  const [boosters, setBoosters] = useState<any[]>([])
  const [showBoosterModal, setShowBoosterModal] = useState(false)
  const [selectedItemForBooster, setSelectedItemForBooster] = useState<Item | null>(null)
  const [selectedBooster, setSelectedBooster] = useState<string>('')
  const [boosterLoading, setBoosterLoading] = useState(false)
  const [stats, setStats] = useState({
    active: 0,
    sold: 0,
    drafts: 0,
    offers: 0,
  })

  const loadItems = async () => {
    try {
      setLoading(true)
      // Cache-Busting hinzufügen
      const res = await fetch(`/api/articles/mine?t=${Date.now()}`)
      const data = await res.json()
      const itemsList = Array.isArray(data.watches) ? data.watches : []
      setItems(itemsList)

      // Berechne Statistiken
      setStats(prev => ({
        ...prev,
        active: itemsList.filter((w: Item) => !w.isSold).length,
        sold: itemsList.filter((w: Item) => w.isSold).length,
      }))

      // Lade Entwürfe
      try {
        const draftsRes = await fetch('/api/drafts')
        if (draftsRes.ok) {
          const draftsData = await draftsRes.json()
          setStats(prev => ({
            ...prev,
            drafts: (draftsData.drafts || []).length,
          }))
        }
      } catch (error) {
        console.error('Error loading drafts:', error)
      }
    } catch (error) {
      console.error('Error loading items:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Warte bis Session geladen ist
    if (status === 'loading') {
      return
    }

    // Wenn nicht authentifiziert, leite um
    if (status === 'unauthenticated' || !session?.user) {
      const currentPath = window.location.pathname
      router.push(`/login?callbackUrl=${encodeURIComponent(currentPath)}`)
      return
    }

    loadItems()
    const loadVerificationStatus = async () => {
      if ((session?.user as { id?: string })?.id) {
        try {
          const res = await fetch('/api/verification/get')
          if (res.ok) {
            const data = await res.json()
            setIsVerified(data.verified || false)
            // Prüfe ob Verifizierung in Bearbeitung ist
            if (
              !data.verified &&
              data.user &&
              (data.user.street || data.user.dateOfBirth || data.user.paymentMethods)
            ) {
              setVerificationInProgress(true)
            }
          }
        } catch (error) {
          console.error('Error loading verification status:', error)
        }
      }
    }
    loadVerificationStatus()
  }, [session, status, router])

  // Lade Booster-Optionen
  useEffect(() => {
    const loadBoosters = async () => {
      try {
        const res = await fetch('/api/admin/boosters')
        if (res.ok) {
          const data = await res.json()
          setBoosters(data.sort((a: any, b: any) => a.price - b.price))
        }
      } catch (error) {
        console.error('Error loading boosters:', error)
      }
    }
    loadBoosters()
  }, [])

  const handleAddBooster = (item: Item) => {
    setSelectedItemForBooster(item)
    setSelectedBooster('')
    setShowBoosterModal(true)
  }

  const handleBoosterSubmit = async () => {
    if (!selectedItemForBooster || !selectedBooster || selectedBooster === 'none') {
      return
    }

    setBoosterLoading(true)
    try {
      const res = await fetch(`/api/watches/${selectedItemForBooster.id}/upgrade-booster`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newBooster: selectedBooster }),
      })

      const data = await res.json()

      if (res.ok) {
        const currentBoosters = selectedItemForBooster.boosters || []
        const currentBoosterCode = currentBoosters.length > 0 ? currentBoosters[0] : null
        const message = currentBoosterCode
          ? t.myWatches.boosterSuccess
              .replace('{invoiceNumber}', data.invoice.invoiceNumber)
              .replace('{amount}', data.invoice.total.toFixed(2))
          : t.myWatches.boosterAdded
              .replace('{invoiceNumber}', data.invoice.invoiceNumber)
              .replace('{amount}', data.invoice.total.toFixed(2))

        toast.success(message, {
          duration: 5000,
          icon: '✅',
          style: {
            background: '#10b981',
            color: '#fff',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '500',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#10b981',
          },
        })

        setShowBoosterModal(false)
        setSelectedItemForBooster(null)
        setSelectedBooster('')
        loadItems() // Aktualisiere die Liste
      } else {
        toast.error(`${t.common.error}: ${data.message}`, {
          duration: 4000,
          style: {
            background: '#ef4444',
            color: '#fff',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '500',
          },
        })
      }
    } catch (error) {
      console.error('Error adding booster:', error)
      toast.error(t.myWatches.boosterError, {
        duration: 4000,
        style: {
          background: '#ef4444',
          color: '#fff',
          borderRadius: '8px',
          padding: '16px',
          fontSize: '14px',
          fontWeight: '500',
        },
      })
    } finally {
      setBoosterLoading(false)
    }
  }

  // Neu laden wenn Seite wieder fokussiert wird (z.B. nach Bearbeitung)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadItems()
      }
    }

    const handleFocus = () => {
      loadItems()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  if (status === 'loading') return <div className="p-6">{t.myWatches.loading}</div>
  // Session-Check wird in useEffect behandelt, hier nur Loading zeigen wenn nicht authentifiziert
  if (status === 'unauthenticated' || !session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-gray-500">{t.myWatches.redirecting}</div>
        </div>
        <Footer />
      </div>
    )
  }

  const menuItems = [
    {
      title: t.myWatches.currentlySelling,
      description: t.myWatches.currentlySellingDesc,
      icon: TrendingUp,
      href: '/my-watches/selling/active',
      color: 'bg-green-100 text-green-600',
      count: stats.active,
    },
    {
      title: 'Entwürfe',
      description: 'Noch nicht veröffentlichte Anzeigen',
      icon: FileText,
      href: '/my-watches/selling/drafts',
      color: 'bg-gray-100 text-gray-600',
      count: stats.drafts,
    },
    {
      title: t.myWatches.sold,
      description: t.myWatches.soldDesc,
      icon: CheckCircle,
      href: '/my-watches/selling/sold',
      color: 'bg-blue-100 text-blue-600',
      count: stats.sold,
    },
    {
      title: t.myWatches.fees,
      description: t.myWatches.feesDesc,
      icon: Wallet,
      href: '/my-watches/selling/fees',
      color: 'bg-yellow-100 text-yellow-600',
      count: 0,
    },
    {
      title: t.myWatches.priceOffers,
      description: t.myWatches.priceOffersDesc,
      icon: Tag,
      href: '/my-watches/selling/offers',
      color: 'bg-purple-100 text-purple-600',
      count: stats.offers,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-4 text-sm text-gray-600">
          <Link href="/" className="text-primary-600 hover:text-primary-700">
            {t.myWatches.homepage}
          </Link>
          <span className="mx-2">›</span>
          <span>{t.myWatches.title}</span>
        </div>

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-100 p-2">
              <Settings className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t.myWatches.title}</h1>
              <p className="mt-1 text-gray-600">{t.myWatches.subtitle}</p>
            </div>
          </div>
          {isVerified === true && (
            <div className="flex items-center rounded-lg border border-green-300 bg-green-100 px-4 py-2">
              <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">{t.myWatches.verified}</span>
            </div>
          )}
        </div>

        {/* Verifizierungs-Button/Banner */}
        {/* Verifizierungs-Button/Banner - NUR anzeigen wenn NICHT verifiziert */}
        {isVerified === false && (
          <div className="mb-6">
            {verificationInProgress ? (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">
                      {t.myWatches.validationInProgress}
                    </p>
                    <p className="mt-1 text-sm text-yellow-700">
                      {t.myWatches.validationInProgressDesc}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                href="/verification"
                className="inline-flex items-center rounded-lg bg-yellow-600 px-6 py-3 font-medium text-white transition-colors hover:bg-yellow-700"
              >
                <AlertCircle className="mr-2 h-5 w-5" />
                {t.myWatches.startVerification}
              </Link>
            )}
          </div>
        )}

        {/* Dashboard Karten */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {menuItems.map(item => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative cursor-pointer rounded-lg border border-gray-200 bg-white p-6 shadow-md transition-all hover:border-primary-300 hover:shadow-xl"
                onClick={e => {
                  e.preventDefault()
                  router.push(item.href)
                }}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className={`inline-flex rounded-lg p-3 ${item.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  {item.count > 0 && (
                    <span className="rounded-full bg-primary-600 px-2 py-1 text-xs font-bold text-white">
                      {item.count}
                    </span>
                  )}
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900 transition-colors group-hover:text-primary-600">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </Link>
            )
          })}
        </div>

        {/* Schnellzugriff: Artikel verkaufen */}
        <div className="mb-8">
          <Link
            href="/sell"
            className="inline-flex items-center rounded-lg bg-primary-600 px-6 py-3 font-medium text-white shadow-md transition-colors hover:bg-primary-700 hover:shadow-lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            {t.myWatches.sellNewItem}
          </Link>
        </div>
      </div>
      <Footer />

      {/* Käuferinformationen Modal */}
      {selectedBuyer && (
        <BuyerInfoModal
          buyer={selectedBuyer}
          watchTitle={selectedItemTitle}
          isOpen={showBuyerInfo}
          onClose={() => {
            setShowBuyerInfo(false)
            setSelectedBuyer(null)
            setSelectedItemTitle('')
          }}
        />
      )}

      {/* Booster Modal */}
      {showBoosterModal &&
        selectedItemForBooster &&
        (() => {
          const currentBoosters = selectedItemForBooster.boosters || []
          const currentBoosterCode = currentBoosters.length > 0 ? currentBoosters[0] : null
          const currentBooster = boosters.find((b: any) => b.code === currentBoosterCode)

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-2xl">
                <div className="mb-6">
                  <h2 className="mb-4 flex items-center text-2xl font-semibold text-gray-900">
                    <Sparkles className="mr-2 h-5 w-5" />
                    {currentBooster ? t.myWatches.boosterUpgrade : t.myWatches.addBooster}
                  </h2>
                  <p className="mb-4 text-sm text-gray-600">
                    {t.myWatches.selectBoosterFor}{' '}
                    <strong className="text-gray-900">{selectedItemForBooster.title}</strong>
                  </p>
                  {currentBooster && (
                    <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                      <p className="text-sm font-medium text-green-800">
                        ✓ {t.myWatches.currentActiveBooster} <strong>{currentBooster.name}</strong>{' '}
                        (CHF {currentBooster.price.toFixed(2)})
                      </p>
                    </div>
                  )}
                </div>
                {boosters.length === 0 ? (
                  <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                    <p className="text-sm text-yellow-800">{t.myWatches.boosterOptionsLoading}</p>
                  </div>
                ) : (
                  <div className="mb-6 grid grid-cols-1 gap-4">
                    {(() => {
                      // Wenn Super-Boost bereits aktiv ist, zeige keine Upgrade-Optionen mehr
                      if (currentBoosterCode === 'super-boost') {
                        return (
                          <div className="col-span-full rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                            <div className="mb-1 flex items-center justify-center gap-2">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <p className="text-base font-semibold text-green-800">
                                {t.myWatches.superBoostActive}
                              </p>
                            </div>
                            <p className="text-xs text-green-700">
                              {t.myWatches.superBoostActiveDesc}
                            </p>
                          </div>
                        )
                      }

                      return boosters
                        .filter((b: any) => {
                          // Filtere "none" und zeige nur Upgrades (teurere Booster) wenn bereits ein Booster vorhanden ist
                          if (b.code === 'none') return false
                          if (!currentBoosterCode) return true // Kein Booster vorhanden, zeige alle
                          const currentPrice = currentBooster?.price || 0
                          return b.price > currentPrice // Nur teurere Booster als Upgrade
                        })
                        .map((booster: any) => {
                          const isSelected = selectedBooster === booster.code
                          const isCurrent = booster.code === currentBoosterCode
                          const isSuperBoost = booster.code === 'super-boost'
                          const isTurboBoost = booster.code === 'turbo-boost'
                          const isBoost = booster.code === 'boost'

                          // Berechne Differenz
                          const currentPrice = currentBooster?.price || 0
                          const priceDifference = booster.price - currentPrice

                          // Gaming-ähnliche Styles für jeden Booster (helles Design)
                          let cardStyles = ''
                          let badgeStyles = ''
                          let priceStyles = ''

                          if (isSuperBoost) {
                            cardStyles = isSelected
                              ? 'border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 shadow-lg ring-2 ring-yellow-200/50'
                              : isCurrent
                                ? 'border-2 border-yellow-300 bg-gradient-to-br from-yellow-50/80 via-orange-50/80 to-red-50/80'
                                : 'border-2 border-yellow-300 bg-gradient-to-br from-yellow-50/50 via-orange-50/50 to-red-50/50 hover:border-yellow-400 hover:shadow-md'
                            badgeStyles =
                              'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white'
                            priceStyles = 'text-yellow-600'
                          } else if (isTurboBoost) {
                            cardStyles = isSelected
                              ? 'border-2 border-purple-500 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 shadow-lg ring-2 ring-purple-200/50'
                              : isCurrent
                                ? 'border-2 border-purple-300 bg-gradient-to-br from-purple-50/80 via-blue-50/80 to-indigo-50/80'
                                : 'border-2 border-purple-300 bg-gradient-to-br from-purple-50/50 via-blue-50/50 to-indigo-50/50 hover:border-purple-400 hover:shadow-md'
                            badgeStyles =
                              'bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-600 text-white'
                            priceStyles = 'text-purple-600'
                          } else if (isBoost) {
                            cardStyles = isSelected
                              ? 'border-2 border-emerald-500 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 shadow-lg ring-2 ring-emerald-200/50'
                              : isCurrent
                                ? 'border-2 border-emerald-300 bg-gradient-to-br from-emerald-50/80 via-green-50/80 to-teal-50/80'
                                : 'border-2 border-emerald-300 bg-gradient-to-br from-emerald-50/50 via-green-50/50 to-teal-50/50 hover:border-emerald-400 hover:shadow-md'
                            badgeStyles =
                              'bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 text-white'
                            priceStyles = 'text-blue-600'
                          }

                          return (
                            <label
                              key={booster.id}
                              className={`relative flex cursor-pointer flex-col rounded-lg p-3 transition-all ${
                                isSelected ? 'scale-[1.02]' : 'hover:scale-[1.01]'
                              } ${cardStyles}`}
                            >
                              <input
                                type="radio"
                                name="booster"
                                value={booster.code}
                                checked={isSelected}
                                onChange={e => setSelectedBooster(e.target.value)}
                                className="sr-only"
                                disabled={isCurrent}
                              />

                              {isCurrent && (
                                <div className="absolute right-2 top-2 rounded-full bg-green-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                  {t.myWatches.active}
                                </div>
                              )}

                              {/* Badge/Tier Indicator */}
                              <div className="mb-2 flex items-center justify-between">
                                <div
                                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badgeStyles}`}
                                >
                                  {isSuperBoost ? (
                                    <>
                                      <Sparkles className="h-3 w-3" />
                                      <span>Premium</span>
                                    </>
                                  ) : isTurboBoost ? (
                                    <>
                                      <Zap className="h-3 w-3" />
                                      <span>Turbo</span>
                                    </>
                                  ) : (
                                    <>
                                      <Flame className="h-3 w-3" />
                                      <span>Boost</span>
                                    </>
                                  )}
                                </div>
                                {isSelected && !isCurrent && (
                                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 shadow-md">
                                    <svg
                                      className="h-3 w-3 text-white"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={3}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  </div>
                                )}
                              </div>

                              {/* Booster Name */}
                              <div className="mb-1">
                                <h3
                                  className={`mb-0.5 text-base font-bold ${isSuperBoost ? 'text-orange-900' : isTurboBoost ? 'text-purple-900' : 'text-blue-900'}`}
                                >
                                  {booster.name}
                                </h3>
                              </div>

                              {/* Description */}
                              <p className="mb-2 flex-1 text-xs leading-relaxed text-gray-700">
                                {booster.description}
                              </p>

                              {/* Price Section */}
                              <div className="mt-auto border-t border-gray-200/50 pt-2">
                                {currentBoosterCode && !isCurrent ? (
                                  <div className="space-y-1">
                                    <div className="flex items-baseline justify-between">
                                      <span className="text-[10px] uppercase tracking-wide text-gray-500">
                                        {t.myWatches.upgrade}
                                      </span>
                                      <div className={`text-lg font-bold ${priceStyles}`}>
                                        CHF {priceDifference.toFixed(2)}
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px]">
                                      <span className="text-gray-400 line-through">
                                        CHF {booster.price.toFixed(2)}
                                      </span>
                                      <span className="text-green-600">
                                        {t.myWatches.save} CHF{' '}
                                        {(booster.price - priceDifference).toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-baseline justify-between">
                                    <span className="text-[10px] uppercase tracking-wide text-gray-500">
                                      {t.myWatches.price}
                                    </span>
                                    <div className={`text-lg font-bold ${priceStyles}`}>
                                      CHF {booster.price.toFixed(2)}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Special glow effect for Super-Boost when selected */}
                              {isSuperBoost && isSelected && (
                                <div className="pointer-events-none absolute inset-0 animate-pulse rounded-lg bg-gradient-to-r from-yellow-400/15 via-orange-400/15 to-red-400/15" />
                              )}
                            </label>
                          )
                        })
                    })()}
                  </div>
                )}
                <div className="flex gap-3 border-t border-gray-200 pt-4">
                  <button
                    onClick={() => {
                      setShowBoosterModal(false)
                      setSelectedItemForBooster(null)
                      setSelectedBooster('')
                    }}
                    className="flex-1 rounded bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
                    disabled={boosterLoading}
                  >
                    {t.myWatches.cancel}
                  </button>
                  <button
                    onClick={handleBoosterSubmit}
                    disabled={
                      !selectedBooster ||
                      selectedBooster === 'none' ||
                      boosterLoading ||
                      selectedBooster === currentBoosterCode
                    }
                    className="flex-1 rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
                  >
                    {boosterLoading
                      ? t.myWatches.processing
                      : currentBoosterCode
                        ? t.myWatches.performUpgrade
                        : t.myWatches.add}
                  </button>
                </div>
              </div>
            </div>
          )
        })()}
    </div>
  )
}
