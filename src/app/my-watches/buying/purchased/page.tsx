'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle,
  Clock,
  ShoppingBag,
  User,
  Package,
  PackageCheck,
  CreditCard,
  AlertCircle,
  CreditCard as PaymentIcon,
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  MessageSquare,
  FileText,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { SellerInfoModal } from '@/components/seller/SellerInfoModal'
import { PaymentModal } from '@/components/payment/PaymentModal'
import { PaymentInfoCard } from '@/components/payment/PaymentInfoCard'
import { ShippingInfoCard } from '@/components/shipping/ShippingInfoCard'
import { getShippingLabels, getShippingCost } from '@/lib/shipping'

interface Purchase {
  id: string
  purchasedAt: string
  shippingMethod: string | null
  paid: boolean
  status: string
  itemReceived: boolean
  itemReceivedAt: string | null
  paymentConfirmed: boolean
  paymentConfirmedAt: string | null
  // Kontaktfrist-Felder
  contactDeadline: string | null
  sellerContactedAt: string | null
  buyerContactedAt: string | null
  contactWarningSentAt: string | null
  contactDeadlineMissed: boolean
  // Zahlungsfrist-Felder
  paymentDeadline: string | null
  paymentReminderSentAt: string | null
  paymentDeadlineMissed: boolean
  // Dispute-Felder
  disputeOpenedAt: string | null
  disputeReason: string | null
  disputeStatus: string | null
  disputeResolvedAt: string | null
  // Versand-Felder
  trackingNumber?: string | null
  trackingProvider?: string | null
  shippedAt?: string | null
  watch: {
    id: string
    title: string
    brand: string
    model: string
    images: string[]
    seller: {
      id: string
      name: string | null
      email: string | null
      phone: string | null
      firstName: string | null
      lastName: string | null
      street: string | null
      streetNumber: string | null
      postalCode: string | null
      city: string | null
      paymentMethods: string | null
    }
    price: number
    finalPrice: number
    purchaseType: 'auction' | 'buy-now'
  }
}

export default function MyPurchasedPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [showSellerInfo, setShowSellerInfo] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [expandedPurchaseId, setExpandedPurchaseId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all') // all, pending, payment_confirmed, item_received, completed

  const handleMarkPaid = () => {
    // Refresh purchases data
    if (session?.user) {
      fetch(`/api/purchases/my-purchases?t=${Date.now()}`)
        .then(res => res.json())
        .then(data => {
          setPurchases(data.purchases || [])
        })
        .catch(error => console.error('Error loading purchases:', error))
    }
  }

  const handleConfirmReceived = async (purchaseId: string) => {
    try {
      const res = await fetch(`/api/purchases/${purchaseId}/confirm-received`, {
        method: 'POST',
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Erhalt erfolgreich bestätigt!')
        // Refresh purchases
        handleMarkPaid()
      } else {
        toast.error(data.message || 'Fehler beim Bestätigen des Erhalts')
      }
    } catch (error) {
      console.error('Error confirming received:', error)
      toast.error('Fehler beim Bestätigen des Erhalts')
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

    const loadPurchases = async () => {
      try {
        console.log(
          '[purchased-page] Lade Purchases für User:',
          session.user.id,
          session.user.email
        )
        const res = await fetch(`/api/purchases/my-purchases?t=${Date.now()}`)
        if (res.ok) {
          const data = await res.json()
          console.log(
            '[purchased-page] Purchases geladen:',
            data.purchases?.length || 0,
            'Purchases'
          )
          if (data.purchases && data.purchases.length > 0) {
            console.log(
              '[purchased-page] Purchase Details:',
              data.purchases.map((p: any) => ({
                id: p.id,
                watchTitle: p.watch.title,
                finalPrice: p.watch.finalPrice,
              }))
            )
          }
          const loadedPurchases = data.purchases || []
          setPurchases(loadedPurchases)

          // Markiere alle Purchases als gelesen
          const readPurchases = JSON.parse(localStorage.getItem('readPurchases') || '[]')
          const newReadPurchases = Array.from(
            new Set([...readPurchases, ...loadedPurchases.map((p: any) => p.id)])
          )
          localStorage.setItem('readPurchases', JSON.stringify(newReadPurchases))

          // Trigger event für Badge-Update
          window.dispatchEvent(new CustomEvent('purchases-viewed'))
        } else {
          const errorData = await res.json().catch(() => ({}))
          console.error(
            '[purchased-page] Fehler beim Laden:',
            res.status,
            res.statusText,
            errorData
          )
        }
      } catch (error) {
        console.error('[purchased-page] Error loading purchases:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPurchases()

    // Rufe check-expired auf, um abgelaufene Auktionen zu verarbeiten
    const checkExpired = async () => {
      try {
        await fetch('/api/auctions/check-expired', { method: 'POST' })
        // Nach dem Check die Purchases neu laden
        setTimeout(loadPurchases, 1000)
      } catch (error) {
        console.error('[purchased-page] Fehler beim Prüfen abgelaufener Auktionen:', error)
      }
    }

    // Sofort prüfen beim Laden der Seite
    checkExpired()

    // Polling alle 5 Sekunden für Updates (häufiger für bessere Reaktionszeit)
    const interval = setInterval(() => {
      loadPurchases()
      checkExpired() // Auch beim Polling prüfen
    }, 5000)
    return () => clearInterval(interval)
  }, [session, status, router])

  // Warte auf Session-Laden bevor Redirect
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-gray-500">Lädt...</div>
        </div>
        <Footer />
      </div>
    )
  }

  // Redirect nur wenn Session definitiv nicht vorhanden ist
  if (status === 'unauthenticated' || !session) {
    // Redirect wird in useEffect behandelt, hier nur Loading zeigen
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-gray-500">Weiterleitung zur Anmeldung...</div>
        </div>
        <Footer />
      </div>
    )
  }

  // Filtere Purchases nach Status
  const filteredPurchases = purchases.filter(purchase => {
    if (statusFilter === 'all') return true
    return purchase.status === statusFilter
  })

  // Sortiere: Pending zuerst, dann nach Datum
  const sortedPurchases = [...filteredPurchases].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1
    if (a.status !== 'pending' && b.status === 'pending') return 1
    return new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
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
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/my-watches/buying"
            className="inline-flex items-center font-medium text-primary-600 hover:text-primary-700"
          >
            ← Zurück zu Mein Kaufen
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gekaufte Artikel</h1>
          <p className="mt-1 text-gray-600">Übersicht Ihrer Käufe und deren Status</p>
        </div>

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

        {purchases.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow-md">
            <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="mb-2 text-xl font-semibold text-gray-900">Noch keine Käufe</h3>
            <p className="mb-6 text-gray-600">
              Sie haben noch keine Artikel gekauft. Durchstöbern Sie die Angebote oder bieten Sie
              bei Auktionen mit!
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
              const shippingCost = getShippingCost(shippingMethods)
              const total = purchase.watch.finalPrice + shippingCost

              // Berechne Kontaktfrist
              const contactDeadline = purchase.contactDeadline
                ? new Date(purchase.contactDeadline)
                : null
              const contactDaysRemaining = contactDeadline
                ? Math.ceil(
                    (contactDeadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  )
                : null
              const contactIsOverdue =
                contactDeadline && contactDeadline.getTime() < new Date().getTime()

              // Berechne Zahlungsfrist
              const paymentDeadline = purchase.paymentDeadline
                ? new Date(purchase.paymentDeadline)
                : null
              const paymentDaysRemaining = paymentDeadline
                ? Math.ceil(
                    (paymentDeadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  )
                : null
              const paymentIsOverdue =
                paymentDeadline && paymentDeadline.getTime() < new Date().getTime()

              return (
                <div
                  key={purchase.id}
                  className="rounded-lg border-2 border-gray-200 bg-white shadow-md transition-all hover:border-primary-300"
                  onClick={e => {
                    // Verhindere Navigation zur Produktseite bei Klick auf die Karte
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

                            {/* Status-Badge */}
                            <div className="mb-2 flex items-center gap-2">
                              {purchase.status === 'completed' ? (
                                <span className="inline-flex items-center gap-1 rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                                  <CheckCircle className="h-3 w-3" />
                                  Abgeschlossen
                                </span>
                              ) : purchase.status === 'payment_confirmed' ? (
                                <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                                  <CreditCard className="h-3 w-3" />
                                  Zahlung bestätigt
                                </span>
                              ) : purchase.status === 'item_received' ? (
                                <span className="inline-flex items-center gap-1 rounded bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
                                  <PackageCheck className="h-3 w-3" />
                                  Erhalt bestätigt
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
                                  <Clock className="h-3 w-3" />
                                  Ausstehend
                                </span>
                              )}
                            </div>

                            {/* Preis */}
                            <div className="text-xl font-bold text-green-700">
                              CHF {new Intl.NumberFormat('de-CH').format(total)}
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

                            {/* Kritische Fristen */}
                            {purchase.status === 'pending' &&
                              contactDeadline &&
                              !purchase.buyerContactedAt && (
                                <div
                                  className={`mb-2 rounded px-2 py-1 text-xs font-medium ${
                                    contactIsOverdue || purchase.contactDeadlineMissed
                                      ? 'bg-red-100 text-red-700'
                                      : contactDaysRemaining && contactDaysRemaining <= 2
                                        ? 'bg-orange-100 text-orange-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                  }`}
                                >
                                  {contactIsOverdue || purchase.contactDeadlineMissed
                                    ? '⚠️ Kontaktfrist überschritten'
                                    : contactDaysRemaining && contactDaysRemaining > 0
                                      ? `⏰ ${contactDaysRemaining} Tag${contactDaysRemaining !== 1 ? 'e' : ''} bis Kontaktfrist`
                                      : '⏰ Kontaktfrist läuft heute ab'}
                                </div>
                              )}

                            {purchase.paymentDeadline && !purchase.paymentConfirmed && (
                              <div
                                className={`mb-2 rounded px-2 py-1 text-xs font-medium ${
                                  paymentIsOverdue || purchase.paymentDeadlineMissed
                                    ? 'bg-red-100 text-red-700'
                                    : paymentDaysRemaining && paymentDaysRemaining <= 3
                                      ? 'bg-orange-100 text-orange-700'
                                      : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {paymentIsOverdue || purchase.paymentDeadlineMissed
                                  ? '⚠️ Zahlungsfrist überschritten'
                                  : paymentDaysRemaining && paymentDaysRemaining > 0
                                    ? `💳 ${paymentDaysRemaining} Tag${paymentDaysRemaining !== 1 ? 'e' : ''} bis Zahlungsfrist`
                                    : '💳 Zahlungsfrist läuft heute ab'}
                              </div>
                            )}

                            <button
                              onClick={() => setExpandedPurchaseId(isExpanded ? null : purchase.id)}
                              className="mt-2 rounded border border-primary-300 px-3 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 hover:text-primary-700"
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
                        {/* Kompakte Ansicht - alles in einer Spalte */}
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
                        </div>

                        {/* Verkäufer & Zahlung - Kompakt */}
                        <div className="space-y-3">
                          {/* Verkäufer-Kontaktdaten - Kompakt */}
                          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-semibold text-gray-900">
                                  Verkäufer
                                </span>
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
      </div>

      <Footer />

      {/* Verkäuferinformationen Modal - nur Kontaktinformationen */}
      {selectedPurchase && (
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

      {/* Zahlungsinformationen Modal */}
      {selectedPurchase && (
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
      )}
    </div>
  )
}
