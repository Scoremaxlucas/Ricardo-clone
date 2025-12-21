'use client'

import { PaymentInfoCard } from '@/components/payment/PaymentInfoCard'
import { PaymentModal } from '@/components/payment/PaymentModal'
import { SellerInfoModal } from '@/components/seller/SellerInfoModal'
import { ShippingInfoCard } from '@/components/shipping/ShippingInfoCard'
import { MyPurchaseItem } from '@/lib/my-purchases'
import { getPurchaseStateInfo } from '@/lib/purchase-state-machine'
import { getShippingCost } from '@/lib/shipping'
import {
  AlertCircle,
  ArrowUpDown,
  CheckCircle,
  Clock,
  CreditCard,
  Mail,
  MessageSquare,
  Package,
  PackageCheck,
  CreditCard as PaymentIcon,
  Phone,
  Search,
  ShoppingBag,
  User,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

interface MyPurchasesClientProps {
  initialPurchases: MyPurchaseItem[]
}

export function MyPurchasesClient({ initialPurchases }: MyPurchasesClientProps) {
  const [purchases, setPurchases] = useState<MyPurchaseItem[]>(initialPurchases)
  const [isInitialLoad, setIsInitialLoad] = useState(true) // Track if initial data has been confirmed
  const [selectedPurchase, setSelectedPurchase] = useState<MyPurchaseItem | null>(null)
  const [showSellerInfo, setShowSellerInfo] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [expandedPurchaseId, setExpandedPurchaseId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortBy, setSortBy] = useState<'newest' | 'deadline_soon' | 'price_high' | 'price_low'>(
    'newest'
  )

  // OPTIMIERT: Lade Updates non-blocking im Hintergrund (Polling)
  // WICHTIG: Initial purchases werden sofort angezeigt, Updates kommen später
  useEffect(() => {
    // Markiere initial purchases als gelesen (sofort, ohne Wartezeit)
    if (initialPurchases.length > 0) {
      const readPurchases = JSON.parse(localStorage.getItem('readPurchases') || '[]')
      const newReadPurchases = Array.from(
        new Set([...readPurchases, ...initialPurchases.map(p => p.id)])
      )
      localStorage.setItem('readPurchases', JSON.stringify(newReadPurchases))
      window.dispatchEvent(new CustomEvent('purchases-viewed'))
    }

    // Markiere initial load als abgeschlossen nach kurzer Verzögerung
    // Dies gibt dem Server-Side Render Zeit, die Daten zu übertragen
    const timer = setTimeout(() => {
      setIsInitialLoad(false)
    }, 100)

    const loadPurchases = async () => {
      try {
        const res = await fetch(`/api/purchases/my-purchases?t=${Date.now()}`)
        if (res.ok) {
          const data = await res.json()
          // WICHTIG: Nur updaten wenn Daten vorhanden sind UND nicht leer
          // Verhindert dass Purchases verschwinden wenn Update fehlschlägt
          if (data.purchases && Array.isArray(data.purchases) && data.purchases.length > 0) {
            setPurchases(data.purchases)

            // Markiere alle Purchases als gelesen
            const readPurchases = JSON.parse(localStorage.getItem('readPurchases') || '[]')
            const newReadPurchases = Array.from(
              new Set([...readPurchases, ...data.purchases.map((p: any) => p.id)])
            )
            localStorage.setItem('readPurchases', JSON.stringify(newReadPurchases))
            window.dispatchEvent(new CustomEvent('purchases-viewed'))
          } else if (
            initialPurchases.length === 0 &&
            (!data.purchases || data.purchases.length === 0)
          ) {
            // Wenn initialPurchases leer ist UND API auch leer ist, versuche es nochmal
            // (könnte temporärer Fehler sein)
            setTimeout(loadPurchases, 2000)
          }
          // Wenn data.purchases leer ist aber initialPurchases vorhanden sind, behalte initiale Daten
        }
      } catch (error) {
        // Silently fail - initial purchases are already displayed
        // WICHTIG: Initiale Purchases bleiben erhalten, werden NICHT überschrieben
        console.error('Error loading purchases:', error)
        // Wenn initialPurchases leer ist, versuche es nochmal nach kurzer Verzögerung
        if (initialPurchases.length === 0) {
          setTimeout(loadPurchases, 2000)
        }
      }
    }

    // WICHTIG: Wenn initialPurchases leer ist, lade sofort (könnte Server-Side-Fehler sein)
    if (initialPurchases.length === 0) {
      loadPurchases()
    }

    // Rufe check-expired auf (non-blocking, nach 2 Sekunden)
    const checkExpired = async () => {
      try {
        await fetch('/api/auctions/check-expired', { method: 'POST' })
        setTimeout(loadPurchases, 1000)
      } catch (error) {
        console.error('Error checking expired auctions:', error)
      }
    }

    // OPTIMIERT: Warte 2 Sekunden bevor Background-Updates starten
    // Initial purchases sind bereits sichtbar
    let intervalId: NodeJS.Timeout | null = null

    const timeoutId = setTimeout(() => {
      checkExpired()

      // Polling alle 5 Sekunden für Updates
      intervalId = setInterval(() => {
        loadPurchases()
        checkExpired()
      }, 5000)
    }, 2000)

    return () => {
      clearTimeout(timer)
      clearTimeout(timeoutId)
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [initialPurchases])

  const handleMarkPaid = () => {
    fetch(`/api/purchases/my-purchases?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        setPurchases(data.purchases || [])
      })
      .catch(error => console.error('Error loading purchases:', error))
  }

  const handleConfirmReceived = async (purchaseId: string) => {
    try {
      const res = await fetch(`/api/purchases/${purchaseId}/confirm-received`, {
        method: 'POST',
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Erhalt erfolgreich bestätigt!')
        handleMarkPaid()
      } else {
        toast.error(data.message || 'Fehler beim Bestätigen des Erhalts')
      }
    } catch (error) {
      console.error('Error confirming received:', error)
      toast.error('Fehler beim Bestätigen des Erhalts')
    }
  }

  // Filtere Purchases nach Status und Suche
  const filteredPurchases = purchases.filter(purchase => {
    // Status filter
    if (statusFilter !== 'all') {
      const stateInfo = getPurchaseStateInfo(
        {
          status: purchase.status,
          contactDeadline: purchase.contactDeadline,
          sellerContactedAt: purchase.sellerContactedAt,
          buyerContactedAt: purchase.buyerContactedAt,
          contactDeadlineMissed: purchase.contactDeadlineMissed,
          paymentDeadline: purchase.paymentDeadline,
          paymentConfirmed: purchase.paymentConfirmed,
          paymentDeadlineMissed: purchase.paymentDeadlineMissed,
          paid: purchase.paid,
          itemReceived: purchase.itemReceived,
          trackingNumber: purchase.trackingNumber || null,
          shippedAt: purchase.shippedAt || null,
          disputeOpenedAt: purchase.disputeOpenedAt,
          disputeStatus: purchase.disputeStatus,
        },
        purchase.id
      )
      if (statusFilter !== stateInfo.state) return false
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const matchesTitle = purchase.watch.title.toLowerCase().includes(query)
      const matchesBrand = purchase.watch.brand.toLowerCase().includes(query)
      const matchesModel = purchase.watch.model.toLowerCase().includes(query)
      const matchesSeller =
        `${purchase.watch.seller.firstName || ''} ${purchase.watch.seller.lastName || ''}`
          .toLowerCase()
          .includes(query) ||
        purchase.watch.seller.name?.toLowerCase().includes(query) ||
        purchase.watch.seller.email?.toLowerCase().includes(query)
      if (!matchesTitle && !matchesBrand && !matchesModel && !matchesSeller) return false
    }

    return true
  })

  // Sortiere nach gewählter Option
  const sortedPurchases = [...filteredPurchases].sort((a, b) => {
    const shippingMethodsA = a.shippingMethod
      ? (() => {
          try {
            return JSON.parse(a.shippingMethod)
          } catch {
            return []
          }
        })()
      : []
    const shippingCostA = a.shippingCost || getShippingCost(shippingMethodsA)
    const totalA = a.totalAmount || a.watch.finalPrice + shippingCostA

    const shippingMethodsB = b.shippingMethod
      ? (() => {
          try {
            return JSON.parse(b.shippingMethod)
          } catch {
            return []
          }
        })()
      : []
    const shippingCostB = b.shippingCost || getShippingCost(shippingMethodsB)
    const totalB = b.totalAmount || b.watch.finalPrice + shippingCostB

    switch (sortBy) {
      case 'newest':
        return new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
      case 'deadline_soon': {
        const stateInfoA = getPurchaseStateInfo(
          {
            status: a.status,
            contactDeadline: a.contactDeadline,
            sellerContactedAt: a.sellerContactedAt,
            buyerContactedAt: a.buyerContactedAt,
            contactDeadlineMissed: a.contactDeadlineMissed,
            paymentDeadline: a.paymentDeadline,
            paymentConfirmed: a.paymentConfirmed,
            paymentDeadlineMissed: a.paymentDeadlineMissed,
            paid: a.paid,
            itemReceived: a.itemReceived,
            trackingNumber: a.trackingNumber || null,
            shippedAt: a.shippedAt || null,
            disputeOpenedAt: a.disputeOpenedAt,
            disputeStatus: a.disputeStatus,
          },
          a.id
        )
        const stateInfoB = getPurchaseStateInfo(
          {
            status: b.status,
            contactDeadline: b.contactDeadline,
            sellerContactedAt: b.sellerContactedAt,
            buyerContactedAt: b.buyerContactedAt,
            contactDeadlineMissed: b.contactDeadlineMissed,
            paymentDeadline: b.paymentDeadline,
            paymentConfirmed: b.paymentConfirmed,
            paymentDeadlineMissed: b.paymentDeadlineMissed,
            paid: b.paid,
            itemReceived: b.itemReceived,
            trackingNumber: b.trackingNumber || null,
            shippedAt: b.shippedAt || null,
            disputeOpenedAt: b.disputeOpenedAt,
            disputeStatus: b.disputeStatus,
          },
          b.id
        )
        const deadlineA = stateInfoA.deadline?.date?.getTime() || Infinity
        const deadlineB = stateInfoB.deadline?.date?.getTime() || Infinity
        return deadlineA - deadlineB
      }
      case 'price_high':
        return totalB - totalA
      case 'price_low':
        return totalA - totalB
      default:
        return new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
    }
  })

  // Berechne Statistiken
  const stats = {
    total: purchases.length,
    pending: purchases.filter(p => p.status === 'pending').length,
    payment_confirmed: purchases.filter(p => p.status === 'payment_confirmed').length,
    item_received: purchases.filter(p => p.status === 'item_received').length,
    completed: purchases.filter(p => p.status === 'completed').length,
  }

  return (
    <>
      {/* Statistiken */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Gesamt</div>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
          <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
          <div className="text-sm text-yellow-600">Ausstehend</div>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <div className="text-2xl font-bold text-blue-700">{stats.payment_confirmed}</div>
          <div className="text-sm text-blue-600">Zahlung bestätigt</div>
        </div>
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 shadow-sm">
          <div className="text-2xl font-bold text-orange-700">{stats.item_received}</div>
          <div className="text-sm text-orange-600">Erhalt bestätigt</div>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 shadow-sm">
          <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
          <div className="text-sm text-green-600">Abgeschlossen</div>
        </div>
      </div>

      {/* Search and Sort */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Suche nach Artikel, Marke, Modell oder Verkäufer..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-gray-400" />
          <select
            value={sortBy}
            onChange={e =>
              setSortBy(e.target.value as 'newest' | 'deadline_soon' | 'price_high' | 'price_low')
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="newest">Neueste zuerst</option>
            <option value="deadline_soon">Frist bald ablaufend</option>
            <option value="price_high">Preis: Hoch → Niedrig</option>
            <option value="price_low">Preis: Niedrig → Hoch</option>
          </select>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            statusFilter === 'all'
              ? 'bg-primary-600 text-white'
              : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Alle ({stats.total})
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            statusFilter === 'pending'
              ? 'bg-yellow-600 text-white'
              : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Ausstehend ({stats.pending})
        </button>
        <button
          onClick={() => setStatusFilter('payment_confirmed')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            statusFilter === 'payment_confirmed'
              ? 'bg-blue-600 text-white'
              : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Zahlung bestätigt ({stats.payment_confirmed})
        </button>
        <button
          onClick={() => setStatusFilter('item_received')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            statusFilter === 'item_received'
              ? 'bg-orange-600 text-white'
              : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Erhalt bestätigt ({stats.item_received})
        </button>
        <button
          onClick={() => setStatusFilter('completed')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            statusFilter === 'completed'
              ? 'bg-green-600 text-white'
              : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Abgeschlossen ({stats.completed})
        </button>
      </div>

      {isInitialLoad && purchases.length === 0 ? (
        <div className="rounded-lg bg-white p-12 text-center shadow-md">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
          </div>
          <h3 className="mb-2 text-xl font-semibold text-gray-900">Lädt...</h3>
          <p className="mb-6 text-gray-600">Ihre Käufe werden geladen...</p>
        </div>
      ) : purchases.length === 0 ? (
        <div className="rounded-lg bg-white p-12 text-center shadow-md">
          <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-gray-400" />
          <h3 className="mb-2 text-xl font-semibold text-gray-900">Noch keine Käufe</h3>
          <p className="mb-6 text-gray-600">
            Sie haben noch keine Artikel gekauft. Durchstöbern Sie die Angebote oder bieten Sie bei
            Auktionen mit!
          </p>
          <Link
            href="/"
            className="inline-block rounded-md bg-primary-600 px-6 py-3 text-white hover:bg-primary-700"
          >
            Angebote durchstöbern
          </Link>
        </div>
      ) : sortedPurchases.length === 0 ? (
        <div className="rounded-lg bg-white p-12 text-center shadow-md">
          <p className="text-gray-600">Keine Artikel mit diesem Status gefunden.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedPurchases.map(purchase => {
            const isExpanded = expandedPurchaseId === purchase.id
            const shippingMethods = purchase.shippingMethod
              ? (() => {
                  try {
                    return JSON.parse(purchase.shippingMethod)
                  } catch {
                    return []
                  }
                })()
              : []
            const shippingCost = purchase.shippingCost || getShippingCost(shippingMethods)
            const total = purchase.totalAmount || purchase.watch.finalPrice + shippingCost

            // Use state machine to compute state and next action
            const stateInfo = getPurchaseStateInfo(
              {
                status: purchase.status,
                contactDeadline: purchase.contactDeadline,
                sellerContactedAt: purchase.sellerContactedAt,
                buyerContactedAt: purchase.buyerContactedAt,
                contactDeadlineMissed: purchase.contactDeadlineMissed,
                paymentDeadline: purchase.paymentDeadline,
                paymentConfirmed: purchase.paymentConfirmed,
                paymentDeadlineMissed: purchase.paymentDeadlineMissed,
                paid: purchase.paid,
                itemReceived: purchase.itemReceived,
                trackingNumber: purchase.trackingNumber || null,
                shippedAt: purchase.shippedAt || null,
                disputeOpenedAt: purchase.disputeOpenedAt,
                disputeStatus: purchase.disputeStatus,
              },
              purchase.id
            )

            return (
              <div
                key={purchase.id}
                className="rounded-lg border-2 border-gray-200 bg-white shadow-md transition-all hover:border-primary-300"
                onClick={e => {
                  e.stopPropagation()
                }}
              >
                {/* Hauptzeile - Kompaktansicht */}
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Produktbild */}
                    <div className="flex-shrink-0">
                      {purchase.watch.images && purchase.watch.images.length > 0 ? (
                        <img
                          src={purchase.watch.images[0]}
                          alt={purchase.watch.title}
                          className="h-24 w-24 rounded-lg border border-gray-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-gray-200 text-xs text-gray-500">
                          Kein Bild
                        </div>
                      )}
                    </div>

                    {/* Hauptinformationen */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                purchase.watch.purchaseType === 'auction'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {purchase.watch.purchaseType === 'auction'
                                ? 'Ersteigert'
                                : 'Sofortkauf'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(purchase.purchasedAt).toLocaleDateString('de-CH', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <h3 className="mb-1 line-clamp-1 text-lg font-semibold text-gray-900">
                            {purchase.watch.title}
                          </h3>
                          <div className="mb-2 text-sm text-gray-600">
                            {purchase.watch.brand} {purchase.watch.model}
                          </div>

                          {/* Status-Badge - Use state machine */}
                          <div className="mb-2 flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${
                                stateInfo.state === 'COMPLETED'
                                  ? 'bg-green-100 text-green-700'
                                  : stateInfo.state === 'PAYMENT_CONFIRMED' ||
                                      stateInfo.state === 'SHIPPED'
                                    ? 'bg-blue-100 text-blue-700'
                                    : stateInfo.state === 'RECEIPT_PENDING' ||
                                        stateInfo.state === 'RECEIPT_CONFIRMED'
                                      ? 'bg-orange-100 text-orange-700'
                                      : stateInfo.state === 'DISPUTE_OPEN'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {stateInfo.state === 'COMPLETED' ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : stateInfo.state === 'PAYMENT_PENDING' ? (
                                <CreditCard className="h-3 w-3" />
                              ) : stateInfo.state === 'RECEIPT_PENDING' ? (
                                <PackageCheck className="h-3 w-3" />
                              ) : (
                                <Clock className="h-3 w-3" />
                              )}
                              {stateInfo.label}
                            </span>
                          </div>

                          {/* Preis mit Breakdown */}
                          <div className="mb-2">
                            {purchase.itemPrice && purchase.shippingCost !== undefined ? (
                              <div className="text-sm text-gray-600">
                                <div className="text-xl font-bold text-green-700">
                                  CHF {new Intl.NumberFormat('de-CH').format(total)}
                                </div>
                                <div className="text-xs">
                                  Artikel CHF{' '}
                                  {new Intl.NumberFormat('de-CH').format(purchase.itemPrice)}
                                  {purchase.shippingCost > 0 &&
                                    ` + Versand CHF ${new Intl.NumberFormat('de-CH').format(purchase.shippingCost)}`}
                                  {purchase.platformFee &&
                                    purchase.platformFee > 0 &&
                                    ` + Gebühr CHF ${new Intl.NumberFormat('de-CH').format(purchase.platformFee)}`}
                                </div>
                              </div>
                            ) : (
                              <div className="text-xl font-bold text-green-700">
                                CHF {new Intl.NumberFormat('de-CH').format(total)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Rechte Seite - Verkäufer & Aktionen */}
                        <div className="flex-shrink-0 text-right">
                          <div className="mb-2">
                            <div className="mb-1 text-xs text-gray-500">Verkäufer</div>
                            <div className="text-sm font-medium text-gray-900">
                              {purchase.watch.seller.firstName && purchase.watch.seller.lastName
                                ? `${purchase.watch.seller.firstName} ${purchase.watch.seller.lastName}`
                                : purchase.watch.seller.name ||
                                  purchase.watch.seller.email ||
                                  'Unbekannt'}
                            </div>
                          </div>

                          {/* Deadline Info */}
                          {stateInfo.deadline && stateInfo.deadline.date && (
                            <div
                              className={`mb-2 rounded px-2 py-1 text-xs font-medium ${
                                stateInfo.deadline.isOverdue
                                  ? 'bg-red-100 text-red-700'
                                  : stateInfo.deadline.daysRemaining !== null &&
                                      stateInfo.deadline.daysRemaining <= 2
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {stateInfo.deadline.isOverdue
                                ? `⚠️ ${stateInfo.deadline.label} überschritten`
                                : stateInfo.deadline.daysRemaining !== null &&
                                    stateInfo.deadline.daysRemaining > 0
                                  ? `⏰ ${stateInfo.deadline.daysRemaining} Tag${stateInfo.deadline.daysRemaining !== 1 ? 'e' : ''} bis ${stateInfo.deadline.label}`
                                  : `⏰ ${stateInfo.deadline.label} läuft heute ab`}
                            </div>
                          )}

                          {/* Primary CTA - Next Action */}
                          {stateInfo.nextAction && (
                            <button
                              onClick={() => {
                                if (stateInfo.nextAction?.action === 'contact_seller') {
                                  setSelectedPurchase(purchase)
                                  setShowSellerInfo(true)
                                } else if (stateInfo.nextAction?.action === 'pay') {
                                  setSelectedPurchase(purchase)
                                  setShowPaymentModal(true)
                                } else if (stateInfo.nextAction?.action === 'confirm_receipt') {
                                  handleConfirmReceived(purchase.id)
                                } else if (stateInfo.nextAction?.action === 'view_dispute') {
                                  setExpandedPurchaseId(purchase.id)
                                }
                              }}
                              className={`mb-2 w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
                                stateInfo.nextAction.type === 'primary'
                                  ? 'bg-primary-600 hover:bg-primary-700'
                                  : stateInfo.nextAction.type === 'danger'
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-gray-600 hover:bg-gray-700'
                              }`}
                            >
                              {stateInfo.nextAction.label}
                            </button>
                          )}

                          {/* Secondary: Details */}
                          <button
                            onClick={() => setExpandedPurchaseId(isExpanded ? null : purchase.id)}
                            className="w-full rounded border border-primary-300 px-3 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 hover:text-primary-700"
                          >
                            {isExpanded ? 'Weniger anzeigen' : 'Details anzeigen'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Erweiterte Ansicht */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50 p-4">
                    <div className="space-y-4">
                      {/* Status-Timeline - Kompakt */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              purchase.status === 'pending' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                          />
                          <span>Kauf abgeschlossen</span>
                        </div>
                        {(purchase.sellerContactedAt || purchase.buyerContactedAt) && (
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                            <span>Kontakt aufgenommen</span>
                          </div>
                        )}
                        {purchase.paymentConfirmed && (
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            <span>Zahlung bestätigt</span>
                          </div>
                        )}
                        {purchase.itemReceived && (
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            <span>Erhalt bestätigt</span>
                          </div>
                        )}
                        {purchase.status === 'completed' && (
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            <span className="font-medium text-gray-900">Abgeschlossen</span>
                          </div>
                        )}
                      </div>

                      {/* Fristen - Kompakt */}
                      <div className="flex flex-wrap gap-2">
                        {contactDeadline && (
                          <div
                            className={`rounded px-3 py-2 text-xs font-medium ${
                              contactIsOverdue || purchase.contactDeadlineMissed
                                ? 'bg-red-100 text-red-800'
                                : contactDaysRemaining && contactDaysRemaining <= 2
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {contactIsOverdue || purchase.contactDeadlineMissed
                              ? '❌ Kontaktfrist überschritten'
                              : contactDaysRemaining && contactDaysRemaining > 0
                                ? `⏰ Kontakt: ${contactDaysRemaining} Tag${contactDaysRemaining !== 1 ? 'e' : ''}`
                                : '⏰ Kontaktfrist läuft heute ab'}
                            {!purchase.buyerContactedAt && (
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await fetch(
                                      `/api/purchases/${purchase.id}/mark-contacted`,
                                      {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ role: 'buyer' }),
                                      }
                                    )
                                    if (res.ok) {
                                      toast.success('Kontaktaufnahme markiert!')
                                      handleMarkPaid()
                                    } else {
                                      const data = await res.json()
                                      toast.error(data.message || 'Fehler beim Markieren')
                                    }
                                  } catch (error) {
                                    console.error('Error marking contact:', error)
                                    toast.error('Fehler beim Markieren der Kontaktaufnahme')
                                  }
                                }}
                                className="ml-2 rounded bg-white px-2 py-0.5 text-xs hover:bg-gray-50"
                              >
                                ✓ Markieren
                              </button>
                            )}
                          </div>
                        )}

                        {paymentDeadline && (
                          <div
                            className={`rounded px-3 py-2 text-xs font-medium ${
                              paymentIsOverdue || purchase.paymentDeadlineMissed
                                ? 'bg-red-100 text-red-800'
                                : paymentDaysRemaining && paymentDaysRemaining <= 3
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {paymentIsOverdue || purchase.paymentDeadlineMissed
                              ? '❌ Zahlungsfrist überschritten'
                              : paymentDaysRemaining && paymentDaysRemaining > 0
                                ? `💳 Zahlung: ${paymentDaysRemaining} Tag${paymentDaysRemaining !== 1 ? 'e' : ''}`
                                : '💳 Zahlungsfrist läuft heute ab'}
                          </div>
                        )}
                      </div>

                      {/* Verkäufer & Zahlung - Kompakt */}
                      <div className="space-y-3">
                        {/* Verkäufer-Kontaktdaten - Kompakt */}
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-semibold text-gray-900">Verkäufer</span>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedPurchase(purchase)
                                setShowSellerInfo(true)
                              }}
                              className="text-xs text-blue-700 underline hover:text-blue-800"
                            >
                              Details
                            </button>
                          </div>
                          <div className="space-y-1 text-xs text-gray-700">
                            {(purchase.watch.seller.firstName ||
                              purchase.watch.seller.lastName) && (
                              <div className="font-medium text-gray-900">
                                {purchase.watch.seller.firstName} {purchase.watch.seller.lastName}
                              </div>
                            )}
                            {purchase.watch.seller.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {purchase.watch.seller.phone}
                              </div>
                            )}
                            {purchase.watch.seller.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {purchase.watch.seller.email}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Zahlungsinformationen - Kompakt */}
                        {(purchase.sellerContactedAt || purchase.buyerContactedAt) &&
                          !purchase.paymentConfirmed && (
                            <div>
                              <div className="mb-2 flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-gray-600" />
                                <span className="text-sm font-semibold text-gray-900">
                                  Zahlungsinformationen
                                </span>
                              </div>
                              <PaymentInfoCard purchaseId={purchase.id} showQRCode={false} />
                            </div>
                          )}

                        {/* Versand-Tracking - Kompakt */}
                        {purchase.trackingNumber && (
                          <div>
                            <div className="mb-2 flex items-center gap-2">
                              <Package className="h-4 w-4 text-gray-600" />
                              <span className="text-sm font-semibold text-gray-900">
                                Versand-Tracking
                              </span>
                            </div>
                            <ShippingInfoCard purchaseId={purchase.id} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Aktionen - Kompakt */}
                    <div className="mt-4 border-t border-gray-200 pt-3">
                      <div className="flex flex-wrap gap-2">
                        {/* Stornierungs-Button */}
                        {purchase.status === 'pending' &&
                          purchase.contactDeadlineMissed &&
                          !purchase.sellerContactedAt && (
                            <button
                              onClick={async () => {
                                if (
                                  !confirm(
                                    'Möchten Sie diesen Kauf wirklich stornieren? Der Verkäufer hat nicht innerhalb von 7 Tagen kontaktiert.'
                                  )
                                ) {
                                  return
                                }
                                try {
                                  const res = await fetch(
                                    `/api/purchases/${purchase.id}/cancel-by-buyer`,
                                    {
                                      method: 'POST',
                                    }
                                  )
                                  const data = await res.json()
                                  if (res.ok) {
                                    toast.success(
                                      'Kauf erfolgreich storniert. Die Kommission wurde zurückerstattet.'
                                    )
                                    handleMarkPaid()
                                  } else {
                                    toast.error(data.message || 'Fehler beim Stornieren')
                                  }
                                } catch (error) {
                                  console.error('Error cancelling purchase:', error)
                                  toast.error('Fehler beim Stornieren')
                                }
                              }}
                              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                            >
                              <AlertCircle className="h-4 w-4" />
                              Kauf stornieren
                            </button>
                          )}

                        {/* Jetzt bezahlen Button */}
                        {purchase.status === 'pending' && (
                          <button
                            onClick={() => {
                              setSelectedPurchase(purchase)
                              setShowPaymentModal(true)
                            }}
                            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                          >
                            <PaymentIcon className="h-4 w-4" />
                            Jetzt Artikel bezahlen
                          </button>
                        )}

                        {/* Artikel erhalten Button */}
                        {!purchase.itemReceived && (
                          <button
                            onClick={() => handleConfirmReceived(purchase.id)}
                            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                          >
                            <PackageCheck className="h-4 w-4" />
                            Artikel erhalten bestätigen
                          </button>
                        )}

                        {/* Verkäufer kontaktieren */}
                        <button
                          onClick={() => {
                            setSelectedPurchase(purchase)
                            setShowSellerInfo(true)
                          }}
                          className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Verkäufer kontaktieren
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      {selectedPurchase && (
        <>
          <SellerInfoModal
            sellerId={selectedPurchase.watch.seller.id}
            watchTitle={selectedPurchase.watch.title}
            isOpen={showSellerInfo}
            onClose={() => {
              setShowSellerInfo(false)
              setSelectedPurchase(null)
            }}
          />
          <PaymentModal
            purchaseId={selectedPurchase.id}
            watchTitle={selectedPurchase.watch.title}
            isPaid={selectedPurchase.paid}
            isOpen={showPaymentModal}
            onClose={() => {
              setShowPaymentModal(false)
              setSelectedPurchase(null)
            }}
            onMarkPaid={handleMarkPaid}
          />
        </>
      )}
    </>
  )
}
