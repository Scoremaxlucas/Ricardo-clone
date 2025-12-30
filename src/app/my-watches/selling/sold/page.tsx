'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import {
  ArrowLeft,
  CheckCircle,
  Filter,
  Package,
  RefreshCw,
  Search,
  Wallet,
} from 'lucide-react'

import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { BuyerInfoModal } from '@/components/buyer/BuyerInfoModal'
import { SaleRow, type Sale } from '@/components/sales/SaleRow'
import { SaleDetailsDrawer } from '@/components/sales/SaleDetailsDrawer'

// === TYPES ===
interface SellerStripeStatus {
  hasStripeAccount: boolean
  isOnboardingComplete: boolean
  connectOnboardingStatus: string
  payoutsEnabled: boolean
}

type FilterStatus = 'all' | 'pending' | 'payment_confirmed' | 'completed'

// === COMPONENT ===
export default function SoldPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // State
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showBuyerInfo, setShowBuyerInfo] = useState(false)
  const [sellerStripeStatus, setSellerStripeStatus] = useState<SellerStripeStatus | null>(null)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Refs
  const hasInitializedRef = useRef(false)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const initialLoadDoneRef = useRef(false)

  // === DATA LOADING ===
  const loadSalesData = useCallback(async (isInitialLoad: boolean = false) => {
    if (!session?.user) return
    
    try {
      if (isInitialLoad) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }

      // Check expired auctions
      try {
        await fetch('/api/auctions/check-expired', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      } catch (error) {
        console.error('Error checking expired auctions:', error)
      }

      const res = await fetch(`/api/sales/my-sales?t=${Date.now()}`)
      if (res.ok) {
        const data = await res.json()
        setSales(data.sales || [])
        if (data.sellerStripeStatus) {
          setSellerStripeStatus(data.sellerStripeStatus)
        }
      }
    } catch (error) {
      console.error('Error loading sales:', error)
      if (isInitialLoad) {
        toast.error('Fehler beim Laden der Verkäufe')
      }
    } finally {
      if (isInitialLoad) {
        setLoading(false)
      } else {
        setRefreshing(false)
      }
    }
  }, [session?.user])

  // === DEEP LINK SUPPORT ===
  useEffect(() => {
    const saleId = searchParams.get('saleId')
    if (saleId && sales.length > 0) {
      const sale = sales.find(s => s.id === saleId)
      if (sale) {
        setSelectedSale(sale)
        setDrawerOpen(true)
      }
    }
  }, [searchParams, sales])

  // === INITIAL LOAD & POLLING ===
  useEffect(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }

    if (status === 'loading') return

    if (status === 'unauthenticated' || !session?.user) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/my-watches/selling/sold'
      router.push(`/login?callbackUrl=${encodeURIComponent(currentPath)}`)
      return
    }

    if (initialLoadDoneRef.current) {
      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true
        pollingIntervalRef.current = setInterval(() => loadSalesData(false), 10000)
      }
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
        hasInitializedRef.current = false
      }
    }

    initialLoadDoneRef.current = true
    hasInitializedRef.current = true
    loadSalesData(true)
    pollingIntervalRef.current = setInterval(() => loadSalesData(false), 10000)

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      hasInitializedRef.current = false
    }
  }, [status, session?.user, loadSalesData, router])

  // === ACTIONS ===
  const handleMarkContacted = useCallback(async (saleId: string) => {
    try {
      const res = await fetch(`/api/purchases/${saleId}/mark-contacted`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'seller' }),
      })
      if (res.ok) {
        toast.success('Kontaktaufnahme markiert!')
        loadSalesData(false)
      } else {
        const data = await res.json()
        toast.error(data.message || 'Fehler beim Markieren')
      }
    } catch (error) {
      console.error('Error marking contact:', error)
      toast.error('Fehler beim Markieren der Kontaktaufnahme')
    }
  }, [loadSalesData])

  const handleConfirmPayment = useCallback(async (purchaseId: string) => {
    try {
      const res = await fetch(`/api/purchases/${purchaseId}/confirm-payment`, {
        method: 'POST',
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Zahlung erfolgreich bestätigt!')
        loadSalesData(false)
      } else {
        toast.error(data.message || 'Fehler beim Bestätigen der Zahlung')
      }
    } catch (error) {
      console.error('Error confirming payment:', error)
      toast.error('Fehler beim Bestätigen der Zahlung')
    }
  }, [loadSalesData])

  const handleOpenDetails = useCallback((sale: Sale) => {
    setSelectedSale(sale)
    setDrawerOpen(true)
    // Update URL with deep link
    const url = new URL(window.location.href)
    url.searchParams.set('saleId', sale.id)
    window.history.replaceState({}, '', url.toString())
  }, [])

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false)
    setSelectedSale(null)
    // Remove deep link from URL
    const url = new URL(window.location.href)
    url.searchParams.delete('saleId')
    window.history.replaceState({}, '', url.toString())
  }, [])

  const handleOpenBuyerContact = useCallback((sale: Sale) => {
    setSelectedSale(sale)
    setShowBuyerInfo(true)
  }, [])

  const handleCloseBuyerModal = useCallback(() => {
    setShowBuyerInfo(false)
    if (!drawerOpen) {
      setSelectedSale(null)
    }
  }, [drawerOpen])

  const handleManualRefresh = useCallback(() => {
    loadSalesData(false)
  }, [loadSalesData])

  // === FILTERED & SEARCHED SALES ===
  const filteredSales = useMemo(() => {
    let result = sales

    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter(sale => {
        switch (filterStatus) {
          case 'pending':
            return sale.status === 'pending' && !sale.paymentConfirmed
          case 'payment_confirmed':
            return sale.paymentConfirmed && sale.status !== 'completed'
          case 'completed':
            return sale.status === 'completed'
          default:
            return true
        }
      })
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(sale =>
        sale.watch.title.toLowerCase().includes(query) ||
        sale.watch.brand.toLowerCase().includes(query) ||
        sale.buyer.name?.toLowerCase().includes(query) ||
        sale.buyer.email?.toLowerCase().includes(query)
      )
    }

    return result
  }, [sales, filterStatus, searchQuery])

  // === STATISTICS ===
  const stats = useMemo(() => {
    const pending = sales.filter(s => s.status === 'pending' && !s.paymentConfirmed).length
    const awaitingShipment = sales.filter(s => s.paymentConfirmed && s.status !== 'completed').length
    const completed = sales.filter(s => s.status === 'completed').length
    const contactRequired = sales.filter(s => 
      s.status === 'pending' && s.contactDeadline && !s.sellerContactedAt
    ).length
    return { pending, awaitingShipment, completed, contactRequired, total: sales.length }
  }, [sales])

  // === LOADING STATES ===
  if (status === 'loading' || (loading && !initialLoadDoneRef.current)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
            <p className="text-gray-500">Lädt Verkäufe...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (status === 'unauthenticated' || !session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-gray-500">Weiterleitung zur Anmeldung...</p>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
        {/* Back Link */}
        <Link
          href="/my-watches/selling"
          className="mb-4 inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Zurück zu Meine Angebote
        </Link>

        {/* Page Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 lg:text-2xl">Verkäufe verwalten</h1>
              <p className="text-sm text-gray-500">{stats.total} Verkäufe</p>
            </div>
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Aktualisieren
          </button>
        </div>

        {/* Payout Setup Banner */}
        {sellerStripeStatus &&
          !sellerStripeStatus.isOnboardingComplete &&
          sales.some(s => s.paymentProtectionEnabled && s.isPaidViaStripe) && (
            <div className="mb-6 rounded-lg border-2 border-primary-200 bg-primary-50 p-4">
              <div className="flex items-start gap-3">
                <Wallet className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-primary-900">Auszahlung einrichten</h3>
                  <p className="mt-1 text-sm text-primary-700">
                    Sie haben Zahlungen über Helvenda Zahlungsschutz erhalten. Richten Sie Ihre
                    Auszahlungsdaten ein, um das Geld zu erhalten.
                  </p>
                  <Link
                    href="/my-watches/account?setup_payout=1"
                    className="mt-2 inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                  >
                    <Wallet className="h-4 w-4" />
                    Jetzt einrichten
                  </Link>
                </div>
              </div>
            </div>
          )}

        {/* Quick Stats (Desktop) */}
        {sales.length > 0 && (
          <div className="mb-6 hidden grid-cols-4 gap-4 lg:grid">
            <button
              onClick={() => setFilterStatus('all')}
              className={`rounded-lg border p-3 text-left transition-colors ${
                filterStatus === 'all' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Alle Verkäufe</p>
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`rounded-lg border p-3 text-left transition-colors ${
                filterStatus === 'pending' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-xs text-gray-500">Warten auf Zahlung</p>
              {stats.contactRequired > 0 && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {stats.contactRequired} Kontakt erforderlich
                </p>
              )}
            </button>
            <button
              onClick={() => setFilterStatus('payment_confirmed')}
              className={`rounded-lg border p-3 text-left transition-colors ${
                filterStatus === 'payment_confirmed' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <p className="text-2xl font-bold text-blue-600">{stats.awaitingShipment}</p>
              <p className="text-xs text-gray-500">Versand vorbereiten</p>
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`rounded-lg border p-3 text-left transition-colors ${
                filterStatus === 'completed' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-xs text-gray-500">Abgeschlossen</p>
            </button>
          </div>
        )}

        {/* Search & Filter Bar */}
        {sales.length > 0 && (
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Suche nach Titel, Marke oder Käufer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            
            {/* Mobile Filter */}
            <div className="flex items-center gap-2 lg:hidden">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                aria-label="Status-Filter"
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="all">Alle ({stats.total})</option>
                <option value="pending">Warten auf Zahlung ({stats.pending})</option>
                <option value="payment_confirmed">Versand vorbereiten ({stats.awaitingShipment})</option>
                <option value="completed">Abgeschlossen ({stats.completed})</option>
              </select>
            </div>
          </div>
        )}

        {/* Empty State */}
        {sales.length === 0 ? (
          <div className="rounded-lg bg-white p-8 shadow-sm">
            <div className="py-12 text-center">
              <Package className="mx-auto mb-4 h-16 w-16 text-gray-300" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Noch nichts verkauft</h3>
              <p className="mb-6 text-gray-500">Sie haben noch keine Artikel verkauft.</p>
              <Link
                href="/sell"
                className="inline-flex items-center rounded-lg bg-primary-600 px-6 py-3 text-white transition-colors hover:bg-primary-700"
              >
                Erste Uhr verkaufen
              </Link>
            </div>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow-sm">
            <p className="text-gray-500">Keine Verkäufe gefunden für die ausgewählten Filter.</p>
            <button
              onClick={() => {
                setFilterStatus('all')
                setSearchQuery('')
              }}
              className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Filter zurücksetzen
            </button>
          </div>
        ) : (
          /* Sales List */
          <div className="space-y-2">
            {filteredSales.map((sale) => (
              <SaleRow
                key={sale.id}
                sale={sale}
                onOpenDetails={handleOpenDetails}
                onMarkContacted={handleMarkContacted}
                onConfirmPayment={handleConfirmPayment}
                onOpenBuyerContact={handleOpenBuyerContact}
              />
            ))}
          </div>
        )}
      </div>

      <Footer />

      {/* Details Drawer */}
      <SaleDetailsDrawer
        sale={selectedSale}
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        onMarkContacted={handleMarkContacted}
        onConfirmPayment={handleConfirmPayment}
        onOpenBuyerContact={handleOpenBuyerContact}
        onDataRefresh={() => loadSalesData(false)}
        sellerStripeStatus={sellerStripeStatus}
      />

      {/* Buyer Info Modal */}
      {selectedSale && (
        <BuyerInfoModal
          buyer={selectedSale.buyer}
          watchTitle={selectedSale.watch.title}
          purchaseId={selectedSale.id}
          isPaid={selectedSale.paid}
          isOpen={showBuyerInfo}
          onClose={handleCloseBuyerModal}
          onMarkPaid={() => loadSalesData(false)}
        />
      )}
    </div>
  )
}
