'use client'

import { DisputeModal } from '@/components/dispute/DisputeModal'
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
  AlertTriangle,
  ArrowUpDown,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  ExternalLink,
  Loader2,
  MessageSquare,
  Package,
  PackageCheck,
  Phone,
  Search,
  Shield,
  ShoppingBag,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'

interface MyPurchasesClientProps {
  initialPurchases: MyPurchaseItem[]
}

export function MyPurchasesClient({ initialPurchases }: MyPurchasesClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [purchases, setPurchases] = useState<MyPurchaseItem[]>(initialPurchases)
  const [isInitialLoad, setIsInitialLoad] = useState(true) // Track if initial data has been confirmed
  const [selectedPurchase, setSelectedPurchase] = useState<MyPurchaseItem | null>(null)
  const [showSellerInfo, setShowSellerInfo] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [expandedPurchaseId, setExpandedPurchaseId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortBy, setSortBy] = useState<'newest' | 'deadline_soon' | 'price_high' | 'price_low'>(
    'newest'
  )
  const [processingStripePayment, setProcessingStripePayment] = useState<string | null>(null) // purchaseId being processed
  const [protectionUnavailable, setProtectionUnavailable] = useState(false) // true when protection was expected but seller lacks Stripe
  const [highlightedPurchaseId, setHighlightedPurchaseId] = useState<string | null>(null)
  const highlightedRef = useRef<HTMLDivElement>(null)

  // OPTIMIERT: Lade Updates non-blocking im Hintergrund (Polling)
  // WICHTIG: Initial purchases werden sofort angezeigt, Updates kommen später
  useEffect(() => {
    // Get userId for user-specific localStorage key
    const currentUserId = (session?.user as { id?: string })?.id
    const readPurchasesKey = currentUserId ? `readPurchases_${currentUserId}` : 'readPurchases'

    // Markiere initial purchases als gelesen (sofort, ohne Wartezeit)
    if (initialPurchases.length > 0) {
      const readPurchases = JSON.parse(localStorage.getItem(readPurchasesKey) || '[]')
      const newReadPurchases = Array.from(
        new Set([...readPurchases, ...initialPurchases.map(p => p.id)])
      )
      localStorage.setItem(readPurchasesKey, JSON.stringify(newReadPurchases))
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

            // Markiere alle Purchases als gelesen (user-specific key)
            const readPurchases = JSON.parse(localStorage.getItem(readPurchasesKey) || '[]')
            const newReadPurchases = Array.from(
              new Set([...readPurchases, ...data.purchases.map((p: any) => p.id)])
            )
            localStorage.setItem(readPurchasesKey, JSON.stringify(newReadPurchases))
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

  // Handle highlight and action from query params (from success page redirect)
  // Use ref to track if action has been processed to prevent re-triggering
  const actionProcessedRef = useRef(false)

  useEffect(() => {
    const highlight = searchParams.get('highlight')
    const action = searchParams.get('action')

    if (highlight && purchases.length > 0) {
      setHighlightedPurchaseId(highlight)

      // Find the purchase to highlight (check both purchase ID and order ID)
      const purchaseToHighlight = purchases.find(
        p => p.id === highlight || p.orderId === highlight
      )

      if (purchaseToHighlight) {
        // Expand and scroll to the highlighted purchase
        setExpandedPurchaseId(purchaseToHighlight.id)

        // Auto-open seller info modal if action=contact (only once!)
        if (action === 'contact' && !actionProcessedRef.current) {
          actionProcessedRef.current = true
          setSelectedPurchase(purchaseToHighlight)
          setShowSellerInfo(true)

          // Clear URL params IMMEDIATELY to prevent re-opening on close
          router.replace('/my-watches/buying/purchased', { scroll: false })
        }

        // Scroll to highlighted purchase after a short delay
        setTimeout(() => {
          if (highlightedRef.current) {
            highlightedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 300)
      }

      // Clear highlight after 5 seconds
      const clearTimer = setTimeout(() => {
        setHighlightedPurchaseId(null)
      }, 5000)

      return () => clearTimeout(clearTimer)
    }
  }, [searchParams, purchases, router])

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
      // Finde den Purchase um zu prüfen ob es ein geschützter Kauf ist
      const purchase = purchases.find(p => p.id === purchaseId)

      // Für geschützte Käufe mit Order → Nutze Order-API um Geld freizugeben
      if (purchase?.paymentProtectionEnabled && purchase?.orderId) {
        console.log(
          `[handleConfirmReceived] Geschützter Kauf - nutze Order-API für ${purchase.orderId}`
        )

        const res = await fetch(`/api/orders/${purchase.orderId}/confirm-receipt`, {
          method: 'POST',
        })

        const data = await res.json()

        if (res.ok) {
          if (data.pendingOnboarding) {
            toast.success(
              'Erhalt bestätigt! Der Verkäufer muss noch seine Auszahlungsdaten einrichten.'
            )
          } else {
            toast.success('Erhalt bestätigt und Auszahlung an Verkäufer erfolgt!')
          }

          // Auch Purchase aktualisieren
          await fetch(`/api/purchases/${purchaseId}/confirm-received`, {
            method: 'POST',
          })

          handleMarkPaid()
        } else {
          toast.error(data.message || 'Fehler beim Bestätigen des Erhalts')
        }
      } else {
        // Für nicht-geschützte Käufe → Nutze Purchase-API
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
    // JUST-IN-TIME ONBOARDING: Route to Stripe checkout whenever payment protection is enabled
    // The seller's Stripe account will be created/onboarded when they want to receive payout
    const hasProtection = purchase.paymentProtectionEnabled

    if (hasProtection) {
      // Route to Stripe checkout for protected payment
      setProcessingStripePayment(purchase.id)

      try {
        // Check if Order already exists
        let orderId = purchase.orderId

        if (!orderId) {
          // Determine delivery mode from shippingMethod
          const isPickupMethod = purchase.shippingMethod === 'pickup' ||
                                  purchase.shippingMethod === 'abholung' ||
                                  !purchase.shippingMethod
          const deliveryMode = isPickupMethod ? 'pickup' : 'shipping'

          // Map old shipping method to new shipping code
          let shippingCode = null
          if (!isPickupMethod && purchase.shippingMethod) {
            // Map legacy shipping methods to new codes
            if (purchase.shippingMethod === 'b-post' || purchase.shippingMethod === 'b_post') {
              shippingCode = 'post_economy_2kg'
            } else if (purchase.shippingMethod === 'a-post' || purchase.shippingMethod === 'a_post') {
              shippingCode = 'post_priority_2kg'
            }
          }

          // Create Order first
          const createOrderRes = await fetch('/api/orders/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              watchId: purchase.watch.id,
              purchaseId: purchase.id,
              selectedDeliveryMode: deliveryMode,
              selectedShippingCode: shippingCode,
              // Legacy field for backwards compatibility
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
      // No protection - show bank transfer modal
      setSelectedPurchase(purchase)
      setProtectionUnavailable(false)
      setShowPaymentModal(true)
    }
  }

  // Filtere Purchases nach Status und Suche - VEREINFACHT
  const filteredPurchases = purchases.filter(purchase => {
    // Status filter - nur noch "all", "open", "completed"
    if (statusFilter === 'open') {
      // Offen = alles was nicht abgeschlossen oder storniert ist
      if (purchase.status === 'completed' || purchase.status === 'cancelled') return false
    } else if (statusFilter === 'completed') {
      // Nur abgeschlossene
      if (purchase.status !== 'completed') return false
    }
    // 'all' zeigt alles

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
            autoReleaseAt: a.autoReleaseAt || null,
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
            autoReleaseAt: b.autoReleaseAt || null,
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

  // VEREINFACHT: Nur 2 Status wie Ricardo - "Offen" und "Abgeschlossen"
  const stats = {
    total: purchases.length,
    open: purchases.filter(p => p.status !== 'completed' && p.status !== 'cancelled').length,
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

      {/* Filter Tabs - VEREINFACHT wie Ricardo: nur "Offen" und "Abgeschlossen" */}
      <div className="mb-6 flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setStatusFilter('all')}
          className={`relative px-4 py-3 text-sm font-medium transition-colors ${
            statusFilter === 'all'
              ? 'text-primary-600'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Alle ({stats.total})
          {statusFilter === 'all' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
          )}
        </button>
        <button
          onClick={() => setStatusFilter('open')}
          className={`relative px-4 py-3 text-sm font-medium transition-colors ${
            statusFilter === 'open'
              ? 'text-primary-600'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Offen ({stats.open})
          {statusFilter === 'open' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
          )}
        </button>
        <button
          onClick={() => setStatusFilter('completed')}
          className={`relative px-4 py-3 text-sm font-medium transition-colors ${
            statusFilter === 'completed'
              ? 'text-primary-600'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Abgeschlossen ({stats.completed})
          {statusFilter === 'completed' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
          )}
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
                autoReleaseAt: purchase.autoReleaseAt || null, // Ricardo-style deadline
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
                onViewDispute: () => router.push(`/disputes/${purchase.id}`),
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
                onOpenDispute: () => {
                  setSelectedPurchase(purchase)
                  setShowDisputeModal(true)
                },
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
              AlertTriangle,
              Loader2,
            }

            const isHighlighted = highlightedPurchaseId === purchase.id || highlightedPurchaseId === purchase.orderId

            return (
              <div
                key={purchase.id}
                ref={isHighlighted ? highlightedRef : undefined}
                className={`rounded-lg border bg-white shadow-sm transition-all ${
                  isHighlighted
                    ? 'border-primary-400 ring-2 ring-primary-200 shadow-lg shadow-primary-100'
                    : 'border-gray-200 hover:shadow-md'
                }`}
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

                          {/* VEREINFACHT: Nur wichtigste Infos - Ricardo-Style */}
                          <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                            <span>
                              Gekauft am{' '}
                              {new Date(purchase.purchasedAt).toLocaleDateString('de-CH', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })}
                            </span>
                            {purchase.watch.seller && (
                              <span>
                                von{' '}
                                <span className="font-medium text-gray-700">
                                  {purchase.watch.seller.firstName && purchase.watch.seller.lastName
                                    ? `${purchase.watch.seller.firstName} ${purchase.watch.seller.lastName}`
                                    : purchase.watch.seller.name || 'Verkäufer'}
                                </span>
                              </span>
                            )}
                          </div>

                          {/* Status - VEREINFACHT: Nur ein klarer Status + optionale Aktion */}
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Bezahlt-Status als Checkmark */}
                            {purchase.paymentConfirmed && (
                              <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
                                <CheckCircle className="h-4 w-4" />
                                Bezahlt
                              </span>
                            )}
                            {/* Versandt-Status */}
                            {purchase.trackingNumber && (
                              <span className="inline-flex items-center gap-1 text-sm text-blue-600">
                                <Package className="h-4 w-4" />
                                Versandt
                              </span>
                            )}
                            {/* Abholung Badge */}
                            {(purchase.shippingMethod === 'pickup' || purchase.shippingMethod === 'abholung') && (
                              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                                Abholung
                              </span>
                            )}
                            {/* Abgeschlossen Badge */}
                            {purchase.status === 'completed' && (
                              <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                Abgeschlossen
                              </span>
                            )}
                          </div>

                          {/* Ricardo-Style Deadline Anzeige - prominent wenn Erhalt-Bestätigung ausstehend */}
                          {stateInfo.state === 'RECEIPT_PENDING' && stateInfo.deadline?.daysRemaining && (
                            <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-sm">
                              <Clock className="h-4 w-4 text-amber-600" />
                              <span className="text-amber-800">
                                <span className="font-semibold">
                                  {stateInfo.deadline.daysRemaining} {stateInfo.deadline.daysRemaining === 1 ? 'Tag' : 'Tage'}
                                </span>
                                {' '}verbleibend, um Erhalt zu bestätigen
                              </span>
                            </div>
                          )}
                          {/* Erhalt-Bestätigung fällig heute */}
                          {stateInfo.state === 'RECEIPT_PENDING' && stateInfo.deadline?.date && !stateInfo.deadline?.daysRemaining && !stateInfo.deadline?.isOverdue && (
                            <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-orange-100 px-3 py-1.5 text-sm">
                              <Clock className="h-4 w-4 text-orange-600" />
                              <span className="font-medium text-orange-800">
                                Heute letzte Chance zur Bestätigung – danach automatisch freigegeben
                              </span>
                            </div>
                          )}
                          {/* Auto-Released */}
                          {stateInfo.state === 'RECEIPT_PENDING' && stateInfo.deadline?.isOverdue && (
                            <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-sm">
                              <CheckCircle className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-600">
                                Automatisch freigegeben
                              </span>
                            </div>
                          )}
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
                                  {(() => {
                                    const IconComponent = iconMap[uiState.primaryAction.icon!]
                                    return IconComponent ? (
                                      <IconComponent className="h-4 w-4" />
                                    ) : null
                                  })()}
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

                {/* Expanded Details - VEREINFACHT */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4">
                    <div className="space-y-4">
                      {/* Verkäufer-Kontakt - Wichtigste Info */}
                      {purchase.watch.seller && (
                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm text-gray-500">Verkäufer</div>
                              <div className="font-medium text-gray-900">
                                {purchase.watch.seller.firstName && purchase.watch.seller.lastName
                                  ? `${purchase.watch.seller.firstName} ${purchase.watch.seller.lastName}`
                                  : purchase.watch.seller.name || 'Verkäufer'}
                              </div>
                              {purchase.watch.seller.phone && (
                                <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
                                  <Phone className="h-3.5 w-3.5" />
                                  {purchase.watch.seller.phone}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                setSelectedPurchase(purchase)
                                setShowSellerInfo(true)
                              }}
                              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                            >
                              Kontakt
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Versand-Tracking - nur wenn vorhanden */}
                      {purchase.trackingNumber && (
                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                          <div className="mb-2 flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-600" />
                            <span className="font-medium text-gray-900">Versand-Tracking</span>
                          </div>
                          <ShippingInfoCard purchaseId={purchase.id} />
                        </div>
                      )}

                      {/* Dispute Warnung */}
                      {purchase.disputeOpenedAt && (
                        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                              <span className="font-medium text-orange-800">Problem gemeldet</span>
                            </div>
                            <Link
                              href={`/disputes/${purchase.id}`}
                              className="text-sm font-medium text-orange-700 hover:underline"
                            >
                              Details →
                            </Link>
                          </div>
                        </div>
                      )}

                      {/* Aktions-Buttons */}
                      <div className="flex flex-wrap gap-2">
                        {/* Bestelldetails wenn Order existiert */}
                        {purchase.orderId && (
                          <Link
                            href={`/orders/${purchase.orderId}`}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Bestelldetails
                          </Link>
                        )}
                        {/* Artikel ansehen */}
                        <Link
                          href={`/products/${purchase.watch.id}`}
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          Angebot ansehen
                        </Link>
                        {/* Problem melden - nur wenn noch kein Dispute */}
                        {!purchase.disputeOpenedAt && purchase.status !== 'completed' && (
                          <button
                            onClick={() => {
                              setSelectedPurchase(purchase)
                              setShowDisputeModal(true)
                            }}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            <AlertTriangle className="h-4 w-4" />
                            Problem melden
                          </button>
                        )}
                      </div>
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
              // Payment protection props for Stripe payment
              // IMPORTANT: No payment protection for pickup orders!
              paymentProtectionEnabled={
                selectedPurchase.paymentProtectionEnabled &&
                selectedPurchase.shippingMethod !== 'pickup' &&
                selectedPurchase.shippingMethod !== 'abholung'
              }
              onPayViaStripe={() => handlePayment(selectedPurchase)}
              isProcessingStripePayment={processingStripePayment === selectedPurchase.id}
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
          <DisputeModal
            purchaseId={selectedPurchase.id}
            watchTitle={selectedPurchase.watch.title}
            isOpen={showDisputeModal}
            onClose={() => {
              setShowDisputeModal(false)
              setSelectedPurchase(null)
            }}
            onSuccess={() => {
              // Refresh data after dispute opened
              handleMarkPaid()
            }}
          />
        </>
      )}
    </>
  )
}
