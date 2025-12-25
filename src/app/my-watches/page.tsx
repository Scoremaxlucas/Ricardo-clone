'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Settings,
  TrendingUp,
  FileText,
  Wallet,
  Tag,
  Plus,
  Package,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { BuyerInfoModal } from '@/components/buyer/BuyerInfoModal'
import { useLanguage } from '@/contexts/LanguageContext'
import { DashboardTile } from '@/components/dashboard/DashboardTile'
import { QuickOverviewChips, QuickOverviewChip } from '@/components/dashboard/QuickOverviewChips'

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
    pendingInvoices: 0,
    pendingInvoiceAmount: 0,
  })
  const [hasDraft, setHasDraft] = useState(false)
  const [draftId, setDraftId] = useState<string | null>(null)

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
          const drafts = draftsData.drafts || []
          setStats(prev => ({
            ...prev,
            drafts: drafts.length,
          }))
          setHasDraft(drafts.length > 0)
          setDraftId(drafts.length > 0 ? drafts[0].id : null)
        }
      } catch (error) {
        console.error('Error loading drafts:', error)
      }

      // Lade offene Rechnungen
      try {
        const invoicesRes = await fetch('/api/invoices/my-invoices')
        if (invoicesRes.ok) {
          const invoicesData = await invoicesRes.json()
          const invoices = invoicesData.invoices || []
          const pending = invoices.filter(
            (inv: any) => inv.status === 'pending' || inv.status === 'overdue'
          )
          const pendingAmount = pending.reduce((sum: number, inv: any) => sum + inv.total, 0)
          setStats(prev => ({
            ...prev,
            pendingInvoices: pending.length,
            pendingInvoiceAmount: pendingAmount,
          }))
        }
      } catch (error) {
        console.error('Error loading invoices:', error)
      }

      // Lade Preisvorschläge
      try {
        const offersRes = await fetch('/api/offers?type=received')
        if (offersRes.ok) {
          const offersData = await offersRes.json()
          const offers = offersData.offers || []
          // Zähle nur neue/offene Angebote
          const newOffers = offers.filter(
            (offer: any) => offer.status === 'pending' || offer.status === 'new'
          )
          setStats(prev => ({
            ...prev,
            offers: newOffers.length,
          }))
        }
      } catch (error) {
        console.error('Error loading offers:', error)
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
      title: 'Aktive Angebote',
      description: 'Ihre aktuell aktiven Verkaufsanzeigen',
      icon: TrendingUp,
      href: '/my-watches/selling',
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
      title: 'Verkaufte Artikel',
      description: 'Erfolgreich verkaufte Artikel',
      icon: CheckCircle,
      href: '/my-watches/selling/sold',
      color: 'bg-blue-100 text-blue-600',
      count: stats.sold,
    },
    {
      title: 'Gebühren & Rechnungen',
      description: 'Übersicht Ihrer Gebühren und Rechnungen',
      icon: Wallet,
      href: '/my-watches/selling/fees',
      color: 'bg-yellow-100 text-yellow-600',
      count: stats.pendingInvoices > 0 ? stats.pendingInvoices : null,
    },
    {
      title: 'Preisvorschläge',
      description: 'Erhaltene Preisvorschläge von Käufern',
      icon: Tag,
      href: '/my-watches/selling/offers',
      color: 'bg-purple-100 text-purple-600',
      count: stats.offers,
    },
  ]

  // Quick overview chips data
  const hasQuickOverview =
    stats.active > 0 ||
    stats.drafts > 0 ||
    stats.pendingInvoices > 0 ||
    stats.offers > 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto max-w-6xl px-4 py-8 pb-24 sm:px-6 lg:px-8 md:pb-8">
        {/* Breadcrumb */}
        <div className="mb-4 text-sm text-gray-600">
          <Link href="/" className="text-primary-600 hover:text-primary-700">
            {t.myWatches.homepage}
          </Link>
          <span className="mx-2">›</span>
          <span>Mein Verkaufen</span>
        </div>

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-100 p-2">
              <Package className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mein Verkaufen</h1>
              <p className="mt-1 text-sm text-gray-600">Verwalten Sie Ihre Verkaufsanzeigen</p>
            </div>
          </div>
          {isVerified === true && (
            <div className="flex items-center rounded-lg border border-green-300 bg-green-100 px-4 py-2">
              <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">Verifiziert</span>
            </div>
          )}
        </div>

        {/* Quick Overview Chips */}
        {hasQuickOverview && (
          <QuickOverviewChips>
            {stats.active > 0 && (
              <QuickOverviewChip label="Aktive Angebote" value={stats.active} />
            )}
            {stats.drafts > 0 && (
              <QuickOverviewChip label="Entwürfe" value={stats.drafts} />
            )}
            {stats.pendingInvoices > 0 && (
              <QuickOverviewChip
                label={`Offene Rechnungen: ${stats.pendingInvoices} · CHF ${stats.pendingInvoiceAmount.toFixed(2)}`}
                value=""
                highlight={true}
              />
            )}
            {stats.offers > 0 && (
              <QuickOverviewChip label="Neue Preisvorschläge" value={stats.offers} highlight={true} />
            )}
          </QuickOverviewChips>
        )}

        {/* Verifizierungs-Button/Banner */}
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

        {/* Dashboard Tiles - Responsive grid */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {menuItems.map(item => (
            <DashboardTile
              key={item.href}
              title={item.title}
              description={item.description}
              icon={item.icon}
              href={item.href}
              count={item.count}
              color={item.color}
            />
          ))}
        </div>

        {/* Primary CTA + Resume Draft */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/sell"
            className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white shadow-md transition-all hover:bg-primary-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 active:scale-[0.98] sm:justify-start"
          >
            <Plus className="mr-2 h-5 w-5" />
            Neuen Artikel verkaufen
          </Link>
          {hasDraft && draftId && (
            <Link
              href={`/sell?draft=${draftId}`}
              className="inline-flex items-center justify-center rounded-lg border-2 border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:justify-start"
            >
              <FileText className="mr-2 h-5 w-5" />
              Entwurf fortsetzen
            </Link>
          )}
        </div>

        {/* Mobile-only sticky CTA */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white p-4 shadow-lg md:hidden">
          <Link
            href="/sell"
            className="flex w-full items-center justify-center rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white shadow-md transition-all hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 active:scale-[0.98]"
          >
            <Plus className="mr-2 h-5 w-5" />
            Neuen Artikel verkaufen
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

      {/* Booster Modal - Keep existing implementation */}
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
                    <Package className="mr-2 h-5 w-5" />
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
                          const priceDifference = booster.price - (currentBooster?.price || 0)

                          return (
                            <label
                              key={booster.id}
                              className={`relative flex cursor-pointer flex-col rounded-lg border-2 p-3 transition-all ${
                                isSelected
                                  ? 'border-primary-500 bg-primary-50'
                                  : isCurrent
                                    ? 'border-green-300 bg-green-50'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                              }`}
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
                              <div className="mb-2">
                                <h3 className="text-base font-bold text-gray-900">{booster.name}</h3>
                              </div>
                              <p className="mb-2 flex-1 text-xs leading-relaxed text-gray-700">
                                {booster.description}
                              </p>
                              <div className="mt-auto border-t border-gray-200/50 pt-2">
                                {currentBoosterCode && !isCurrent ? (
                                  <div className="flex items-baseline justify-between">
                                    <span className="text-[10px] uppercase tracking-wide text-gray-500">
                                      {t.myWatches.upgrade}
                                    </span>
                                    <div className="text-lg font-bold text-primary-600">
                                      CHF {priceDifference.toFixed(2)}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-baseline justify-between">
                                    <span className="text-[10px] uppercase tracking-wide text-gray-500">
                                      {t.myWatches.price}
                                    </span>
                                    <div className="text-lg font-bold text-primary-600">
                                      CHF {booster.price.toFixed(2)}
                                    </div>
                                  </div>
                                )}
                              </div>
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
