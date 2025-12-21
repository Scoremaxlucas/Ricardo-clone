'use client'

import { PaymentInfoCard } from '@/components/payment/PaymentInfoCard'
import { PaymentModal } from '@/components/payment/PaymentModal'
import { SellerInfoModal } from '@/components/seller/SellerInfoModal'
import { ShippingInfoCard } from '@/components/shipping/ShippingInfoCard'
import { MyPurchaseItem } from '@/lib/my-purchases'
import { getOrderUIState } from '@/lib/order-ui-state'
import { getPurchaseStateInfo } from '@/lib/purchase-state-machine'
import { getShippingCost } from '@/lib/shipping'
import {
  AlertCircle,
  ArrowUpDown,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  Loader2,
  Mail,
  MessageSquare,
  Package,
  PackageCheck,
  Phone,
  Search,
  Shield,
  ShoppingBag,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

interface MyPurchasesClientProps {
  initialPurchases: MyPurchaseItem[]
}

export function MyPurchasesClient({ initialPurchases }: MyPurchasesClientProps) {
  const router = useRouter()
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
  const [processingStripePayment, setProcessingStripePayment] = useState<string | null>(null) // purchaseId being processed
  const [protectionUnavailable, setProtectionUnavailable] = useState(false) // true when protection was expected but seller lacks Stripe

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

  /**
   * Handle payment for a purchase - routes to Stripe if protection is enabled
   * Otherwise shows bank transfer modal
   */
  const handlePayment = async (purchase: MyPurchaseItem) => {
    // Check if payment protection is enabled AND seller has Stripe Connect
    const hasProtection = purchase.paymentProtectionEnabled
    const sellerHasStripe =
      purchase.watch.seller?.stripeConnectedAccountId &&
      purchase.watch.seller?.stripeOnboardingComplete

    if (hasProtection && sellerHasStripe) {
      // Route to Stripe checkout for protected payment
      setProcessingStripePayment(purchase.id)

      try {
        // Check if Order already exists
        let orderId = purchase.orderId

        if (!orderId) {
          // Create Order first
          const createOrderRes = await fetch('/api/orders/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              watchId: purchase.watch.id,
              purchaseId: purchase.id,
              shippingMethod: purchase.shippingMethod || 'pickup',
            }),
          })

          if (!createOrderRes.ok) {
            const errorData = await createOrderRes.json()
            throw new Error(errorData.message || 'Fehler beim Erstellen der Bestellung')
          }

          const orderData = await createOrderRes.json()
          orderId = orderData.order.id
        }

        // Create Checkout Session and redirect
        const checkoutRes = await fetch(`/api/orders/${orderId}/checkout`, {
          method: 'POST',
        })

        if (!checkoutRes.ok) {
          const errorData = await checkoutRes.json()
          throw new Error(errorData.message || 'Fehler beim Erstellen der Checkout Session')
        }

        const checkoutData = await checkoutRes.json()

        if (checkoutData.checkoutUrl) {
          // Redirect to Stripe Checkout
          window.location.href = checkoutData.checkoutUrl
        } else {
          throw new Error('Keine Checkout URL erhalten')
        }
      } catch (error: any) {
        console.error('Error initiating Stripe payment:', error)
        toast.error(error.message || 'Fehler beim Starten der Zahlung')
        setProcessingStripePayment(null)
      }
    } else {
      // No protection or seller doesn't have Stripe - show bank transfer modal
      setSelectedPurchase(purchase)
      // Set flag if protection was expected but seller lacks Stripe
      setProtectionUnavailable(!!(hasProtection && !sellerHasStripe))
      setShowPaymentModal(true)
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
      const matchesSeller = purchase.watch.seller
        ? `${purchase.watch.seller.firstName || ''} ${purchase.watch.seller.lastName || ''}`
            .toLowerCase()
            .includes(query) ||
          purchase.watch.seller.name?.toLowerCase().includes(query) ||
          purchase.watch.seller.email?.toLowerCase().includes(query)
        : false
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
            aria-label="Sortierung"
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="newest">Neueste zuerst</option>
            <option value="deadline_soon">Frist bald ablaufend</option>
            <option value="price_high">Preis: Hoch → Niedrig</option>
            <option value="price_low">Preis: Niedrig → Hoch</option>
          </select>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
            statusFilter === 'all'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Alle ({stats.total})
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
            statusFilter === 'pending'
              ? 'border-b-2 border-yellow-600 text-yellow-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Ausstehend ({stats.pending})
        </button>
        <button
          onClick={() => setStatusFilter('payment_confirmed')}
          className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
            statusFilter === 'payment_confirmed'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Zahlung bestätigt ({stats.payment_confirmed})
        </button>
        <button
          onClick={() => setStatusFilter('item_received')}
          className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
            statusFilter === 'item_received'
              ? 'border-b-2 border-orange-600 text-orange-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Erhalt bestätigt ({stats.item_received})
        </button>
        <button
          onClick={() => setStatusFilter('completed')}
          className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
            statusFilter === 'completed'
              ? 'border-b-2 border-green-600 text-green-600'
              : 'text-gray-600 hover:text-gray-900'
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

            // Get clean UI state
            const uiState = getOrderUIState(
              purchase,
              stateInfo,
              {
                onContactSeller: () => {
                  setSelectedPurchase(purchase)
                  setShowSellerInfo(true)
                },
                onPay: () => handlePayment(purchase),
                onConfirmReceipt: () => handleConfirmReceived(purchase.id),
                onViewDispute: () => setExpandedPurchaseId(purchase.id),
                onCancel:
                  purchase.status === 'pending' &&
                  purchase.contactDeadlineMissed &&
                  !purchase.sellerContactedAt
                    ? async () => {
                        if (
                          !confirm(
                            'Möchten Sie diesen Kauf wirklich stornieren? Der Verkäufer hat nicht innerhalb von 7 Tagen kontaktiert.'
                          )
                        ) {
                          return
                        }
                        try {
                          const res = await fetch(`/api/purchases/${purchase.id}/cancel-by-buyer`, {
                            method: 'POST',
                          })
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
                      }
                    : undefined,
                onShowDetails: () => setExpandedPurchaseId(isExpanded ? null : purchase.id),
              },
              isExpanded,
              processingStripePayment === purchase.id
            )

            // Icon mapping
            const iconMap: Record<string, any> = {
              MessageSquare,
              CreditCard,
              Shield,
              PackageCheck,
              AlertCircle,
              Loader2,
            }

            return (
              <div
                key={purchase.id}
                className="rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Header Row */}
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      {purchase.watch.images && purchase.watch.images.length > 0 ? (
                        <img
                          src={purchase.watch.images[0]}
                          alt={purchase.watch.title}
                          className="h-20 w-20 rounded-lg border border-gray-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                          Kein Bild
                        </div>
                      )}
                    </div>

                    {/* Main Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          {/* Title Row */}
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h3 className="mb-1 line-clamp-2 text-base font-semibold text-gray-900">
                                {purchase.watch.title}
                              </h3>
                              <div className="mb-2 text-sm text-gray-600">
                                {purchase.watch.brand} {purchase.watch.model}
                              </div>
                            </div>
                            {/* Price */}
                            <div className="flex-shrink-0 text-right">
                              <div className="text-lg font-bold text-gray-900">
                                CHF {new Intl.NumberFormat('de-CH').format(total)}
                              </div>
                              {purchase.itemPrice && purchase.shippingCost !== undefined && (
                                <div className="text-xs text-gray-500">
                                  {purchase.shippingCost > 0 && `inkl. Versand`}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Metadata Row */}
                          <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                            <span
                              className={`rounded px-2 py-0.5 font-medium ${
                                purchase.watch.purchaseType === 'auction'
                                  ? 'bg-purple-50 text-purple-700'
                                  : 'bg-blue-50 text-blue-700'
                              }`}
                            >
                              {purchase.watch.purchaseType === 'auction'
                                ? 'Ersteigert'
                                : 'Sofortkauf'}
                            </span>
                            <span>
                              {new Date(purchase.purchasedAt).toLocaleDateString('de-CH', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })}
                            </span>
                            {purchase.watch.seller && (
                              <span>
                                Verkäufer:{' '}
                                {purchase.watch.seller.firstName && purchase.watch.seller.lastName
                                  ? `${purchase.watch.seller.firstName} ${purchase.watch.seller.lastName}`
                                  : purchase.watch.seller.name || 'Unbekannt'}
                              </span>
                            )}
                            {purchase.shippingMethod && (
                              <span>
                                {purchase.shippingMethod === 'pickup'
                                  ? 'Abholung'
                                  : purchase.shippingMethod === 'b-post'
                                    ? 'B-Post'
                                    : purchase.shippingMethod === 'a-post'
                                      ? 'A-Post'
                                      : 'Versand'}
                              </span>
                            )}
                          </div>

                          {/* Status Badge */}
                          <div className="mb-3 flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${
                                uiState.statusTone === 'success'
                                  ? 'bg-green-50 text-green-700'
                                  : uiState.statusTone === 'danger'
                                    ? 'bg-red-50 text-red-700'
                                    : uiState.statusTone === 'warn'
                                      ? 'bg-yellow-50 text-yellow-700'
                                      : 'bg-gray-50 text-gray-700'
                              }`}
                            >
                              {uiState.statusTone === 'success' ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : uiState.statusTone === 'danger' ? (
                                <AlertCircle className="h-3 w-3" />
                              ) : (
                                <Clock className="h-3 w-3" />
                              )}
                              {uiState.statusLabel}
                            </span>
                            {uiState.deadlineText && (
                              <span className="text-xs text-gray-600">{uiState.deadlineText}</span>
                            )}
                          </div>
                        </div>

                        {/* Right Side - Primary Action */}
                        <div className="flex-shrink-0">
                          {uiState.primaryAction ? (
                            <button
                              onClick={uiState.primaryAction.onClick}
                              disabled={processingStripePayment === purchase.id}
                              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
                                uiState.primaryAction.variant === 'danger'
                                  ? 'bg-red-600 hover:bg-red-700'
                                  : 'bg-primary-600 hover:bg-primary-700'
                              }`}
                            >
                              {processingStripePayment === purchase.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Wird vorbereitet...
                                </>
                              ) : uiState.primaryAction.icon ? (
                                <>
                                  {iconMap[uiState.primaryAction.icon] &&
                                    iconMap[uiState.primaryAction.icon]({ className: 'h-4 w-4' })}
                                  {uiState.primaryAction.label}
                                </>
                              ) : (
                                uiState.primaryAction.label
                              )}
                            </button>
                          ) : (
                            <div className="h-10" /> // Spacer when no action
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4">
                    <div className="space-y-4">
                      {/* Timeline */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          <span>Kauf abgeschlossen</span>
                        </div>
                        {(purchase.sellerContactedAt || purchase.buyerContactedAt) && (
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            <span>Kontakt aufgenommen</span>
                          </div>
                        )}
                        {purchase.paymentConfirmed && (
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            <span>Zahlung bestätigt</span>
                          </div>
                        )}
                        {purchase.trackingNumber && (
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            <span>Versandt</span>
                          </div>
                        )}
                        {purchase.itemReceived && (
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            <span>Erhalt bestätigt</span>
                          </div>
                        )}
                        {purchase.status === 'completed' && (
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            <span className="font-medium text-gray-900">Abgeschlossen</span>
                          </div>
                        )}
                      </div>

                      {/* Seller Contact */}
                      {purchase.watch.seller && (
                        <div className="rounded-lg border border-gray-200 bg-white p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-900">Verkäufer</span>
                            <button
                              onClick={() => {
                                setSelectedPurchase(purchase)
                                setShowSellerInfo(true)
                              }}
                              className="text-xs text-primary-600 hover:text-primary-700 hover:underline"
                            >
                              Vollständige Details
                            </button>
                          </div>
                          <div className="space-y-1.5 text-sm text-gray-700">
                            {(purchase.watch.seller.firstName ||
                              purchase.watch.seller.lastName) && (
                              <div className="font-medium text-gray-900">
                                {purchase.watch.seller.firstName} {purchase.watch.seller.lastName}
                              </div>
                            )}
                            {purchase.watch.seller.phone && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5 text-gray-400" />
                                {purchase.watch.seller.phone}
                              </div>
                            )}
                            {purchase.watch.seller.email && (
                              <div className="flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5 text-gray-400" />
                                {purchase.watch.seller.email}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Payment Info */}
                      {(purchase.sellerContactedAt || purchase.buyerContactedAt) &&
                        !purchase.paymentConfirmed && (
                          <div className="rounded-lg border border-gray-200 bg-white p-3">
                            <div className="mb-2 flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-gray-600" />
                              <span className="text-sm font-semibold text-gray-900">
                                Zahlungsinformationen
                              </span>
                            </div>
                            <PaymentInfoCard purchaseId={purchase.id} showQRCode={false} />
                          </div>
                        )}

                      {/* Shipping Tracking */}
                      {purchase.trackingNumber && (
                        <div className="rounded-lg border border-gray-200 bg-white p-3">
                          <div className="mb-2 flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-semibold text-gray-900">
                              Versand-Tracking
                            </span>
                          </div>
                          <ShippingInfoCard purchaseId={purchase.id} />
                        </div>
                      )}

                      {/* Secondary Actions */}
                      {uiState.secondaryActions.length > 0 && (
                        <div className="flex flex-wrap gap-2 border-t border-gray-200 pt-3">
                          {uiState.secondaryActions.map((action, idx) => {
                            const Icon = action.icon ? iconMap[action.icon] : null
                            return (
                              <button
                                key={idx}
                                onClick={action.onClick}
                                className="flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                              >
                                {Icon && <Icon className="h-4 w-4" />}
                                {action.label}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Expand/Collapse Button */}
                <div className="border-t border-gray-100 px-4 py-2">
                  <button
                    onClick={() => setExpandedPurchaseId(isExpanded ? null : purchase.id)}
                    className="flex w-full items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Weniger anzeigen
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Details anzeigen
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      {selectedPurchase && (
        <>
          {selectedPurchase.watch.seller && (
            <SellerInfoModal
              sellerId={selectedPurchase.watch.seller.id}
              watchTitle={selectedPurchase.watch.title}
              isOpen={showSellerInfo}
              onClose={() => {
                setShowSellerInfo(false)
                setSelectedPurchase(null)
              }}
            />
          )}
          <PaymentModal
            purchaseId={selectedPurchase.id}
            watchTitle={selectedPurchase.watch.title}
            isPaid={selectedPurchase.paid}
            isOpen={showPaymentModal}
            onClose={() => {
              setShowPaymentModal(false)
              setSelectedPurchase(null)
              setProtectionUnavailable(false)
            }}
            onMarkPaid={handleMarkPaid}
            protectionUnavailable={protectionUnavailable}
          />
        </>
      )}
    </>
  )
}
