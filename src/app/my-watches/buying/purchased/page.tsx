'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Clock, ShoppingBag, User, Package, PackageCheck, CreditCard, AlertCircle, CreditCard as PaymentIcon, AlertTriangle, X, Mail, Phone, MapPin, Calendar, TrendingUp, MessageSquare, FileText } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { SellerInfoModal } from '@/components/seller/SellerInfoModal'
import { PaymentModal } from '@/components/payment/PaymentModal'
import { PaymentInfoCard } from '@/components/payment/PaymentInfoCard'
import { DisputeModal } from '@/components/dispute/DisputeModal'
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
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [disputePurchaseId, setDisputePurchaseId] = useState<string | null>(null)
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
        method: 'POST'
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
        console.log('[purchased-page] Lade Purchases für User:', session.user.id, session.user.email)
        const res = await fetch(`/api/purchases/my-purchases?t=${Date.now()}`)
        if (res.ok) {
          const data = await res.json()
          console.log('[purchased-page] Purchases geladen:', data.purchases?.length || 0, 'Purchases')
          if (data.purchases && data.purchases.length > 0) {
            console.log('[purchased-page] Purchase Details:', data.purchases.map((p: any) => ({
              id: p.id,
              watchTitle: p.watch.title,
              finalPrice: p.watch.finalPrice
            })))
          }
          setPurchases(data.purchases || [])
        } else {
          const errorData = await res.json().catch(() => ({}))
          console.error('[purchased-page] Fehler beim Laden:', res.status, res.statusText, errorData)
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
        <div className="flex items-center justify-center min-h-screen">
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
        <div className="flex items-center justify-center min-h-screen">
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-6">
          <Link
            href="/my-watches/buying"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Zurück zu Mein Kaufen
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gekaufte Artikel</h1>
            <p className="text-gray-600 mt-1">
            Übersicht Ihrer Käufe und deren Status
          </p>
        </div>

        {/* Statistiken */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Gesamt</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow-sm p-4 border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
            <div className="text-sm text-yellow-600">Ausstehend</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow-sm p-4 border border-blue-200">
            <div className="text-2xl font-bold text-blue-700">{stats.payment_confirmed}</div>
            <div className="text-sm text-blue-600">Zahlung bestätigt</div>
          </div>
          <div className="bg-orange-50 rounded-lg shadow-sm p-4 border border-orange-200">
            <div className="text-2xl font-bold text-orange-700">{stats.item_received}</div>
            <div className="text-sm text-orange-600">Erhalt bestätigt</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow-sm p-4 border border-green-200">
            <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
            <div className="text-sm text-green-600">Abgeschlossen</div>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Alle ({stats.total})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Ausstehend ({stats.pending})
          </button>
          <button
            onClick={() => setStatusFilter('payment_confirmed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'payment_confirmed'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Zahlung bestätigt ({stats.payment_confirmed})
          </button>
          <button
            onClick={() => setStatusFilter('item_received')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'item_received'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Erhalt bestätigt ({stats.item_received})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'completed'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Abgeschlossen ({stats.completed})
          </button>
        </div>

        {purchases.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <ShoppingBag className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Noch keine Käufe</h3>
            <p className="text-gray-600 mb-6">
              Sie haben noch keine Artikel gekauft. Durchstöbern Sie die Angebote oder bieten Sie bei Auktionen mit!
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Angebote durchstöbern
            </Link>
          </div>
        ) : sortedPurchases.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600">Keine Artikel mit diesem Status gefunden.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedPurchases.map((purchase) => {
              const isExpanded = expandedPurchaseId === purchase.id
              const shippingMethods = purchase.shippingMethod ? (() => {
                try {
                  return JSON.parse(purchase.shippingMethod)
                    } catch {
                  return []
                    }
              })() : []
                    const shippingCost = getShippingCost(shippingMethods)
                    const total = purchase.watch.finalPrice + shippingCost

              // Berechne Kontaktfrist
              const contactDeadline = purchase.contactDeadline ? new Date(purchase.contactDeadline) : null
              const contactDaysRemaining = contactDeadline ? Math.ceil((contactDeadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null
              const contactIsOverdue = contactDeadline && contactDeadline.getTime() < new Date().getTime()

              // Berechne Zahlungsfrist
              const paymentDeadline = purchase.paymentDeadline ? new Date(purchase.paymentDeadline) : null
              const paymentDaysRemaining = paymentDeadline ? Math.ceil((paymentDeadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null
              const paymentIsOverdue = paymentDeadline && paymentDeadline.getTime() < new Date().getTime()

                    return (
                <div
                  key={purchase.id}
                  className="bg-white rounded-lg shadow-md border-2 border-gray-200 hover:border-primary-300 transition-all"
                  onClick={(e) => {
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
                            className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-xs">
                            Kein Bild
                          </div>
                        )}
                      </div>

                      {/* Hauptinformationen */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                purchase.watch.purchaseType === 'auction'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {purchase.watch.purchaseType === 'auction' ? 'Ersteigert' : 'Sofortkauf'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(purchase.purchasedAt).toLocaleDateString('de-CH', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                            </span>
                          </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
                              {purchase.watch.title}
                            </h3>
                            <div className="text-sm text-gray-600 mb-2">
                              {purchase.watch.brand} {purchase.watch.model}
                            </div>

                            {/* Status-Badge */}
                            <div className="flex items-center gap-2 mb-2">
                              {purchase.status === 'completed' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                                  <CheckCircle className="h-3 w-3" />
                                  Abgeschlossen
                                </span>
                              ) : purchase.status === 'payment_confirmed' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                  <CreditCard className="h-3 w-3" />
                                  Zahlung bestätigt
                                </span>
                              ) : purchase.status === 'item_received' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                                  <PackageCheck className="h-3 w-3" />
                                  Erhalt bestätigt
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
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
                              <div className="text-xs text-gray-500 mb-1">Verkäufer</div>
                              <div className="text-sm font-medium text-gray-900">
                                {purchase.watch.seller.firstName && purchase.watch.seller.lastName
                                  ? `${purchase.watch.seller.firstName} ${purchase.watch.seller.lastName}`
                                  : purchase.watch.seller.name || purchase.watch.seller.email || 'Unbekannt'}
                              </div>
                            </div>

                            {/* Kritische Fristen */}
                            {purchase.status === 'pending' && contactDeadline && !purchase.buyerContactedAt && (
                              <div className={`mb-2 px-2 py-1 rounded text-xs font-medium ${
                                contactIsOverdue || purchase.contactDeadlineMissed
                                  ? 'bg-red-100 text-red-700'
                                  : contactDaysRemaining && contactDaysRemaining <= 2
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {contactIsOverdue || purchase.contactDeadlineMissed
                                  ? '⚠️ Kontaktfrist überschritten'
                                  : contactDaysRemaining && contactDaysRemaining > 0
                                  ? `⏰ ${contactDaysRemaining} Tag${contactDaysRemaining !== 1 ? 'e' : ''} bis Kontaktfrist`
                                  : '⏰ Kontaktfrist läuft heute ab'}
                              </div>
                            )}

                            {purchase.paymentDeadline && !purchase.paymentConfirmed && (
                              <div className={`mb-2 px-2 py-1 rounded text-xs font-medium ${
                                paymentIsOverdue || purchase.paymentDeadlineMissed
                                  ? 'bg-red-100 text-red-700'
                                  : paymentDaysRemaining && paymentDaysRemaining <= 3
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {paymentIsOverdue || purchase.paymentDeadlineMissed
                                  ? '⚠️ Zahlungsfrist überschritten'
                                  : paymentDaysRemaining && paymentDaysRemaining > 0
                                  ? `💳 ${paymentDaysRemaining} Tag${paymentDaysRemaining !== 1 ? 'e' : ''} bis Zahlungsfrist`
                                  : '💳 Zahlungsfrist läuft heute ab'}
                        </div>
                            )}

                            <button
                              onClick={() => setExpandedPurchaseId(isExpanded ? null : purchase.id)}
                              className="mt-2 px-3 py-1 text-xs font-medium text-primary-600 hover:text-primary-700 border border-primary-300 rounded hover:bg-primary-50"
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
                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                      <div className="space-y-4">
                        {/* Kompakte Ansicht - alles in einer Spalte */}
                        <div className="space-y-4">
                          {/* Status-Timeline - Kompakt */}
                          <div className="flex items-center gap-3 flex-wrap text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${
                                purchase.status === 'pending' ? 'bg-yellow-500' : 'bg-green-500'
                              }`} />
                              <span>Kauf abgeschlossen</span>
                            </div>
                            {(purchase.sellerContactedAt || purchase.buyerContactedAt) && (
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                <span>Kontakt aufgenommen</span>
                              </div>
                            )}
                            {purchase.paymentConfirmed && (
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span>Zahlung bestätigt</span>
                              </div>
                            )}
                            {purchase.itemReceived && (
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span>Erhalt bestätigt</span>
                              </div>
                            )}
                            {purchase.status === 'completed' && (
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="font-medium text-gray-900">Abgeschlossen</span>
                              </div>
                            )}
                          </div>

                          {/* Fristen - Kompakt */}
                          <div className="flex gap-2 flex-wrap">
                            {contactDeadline && (
                              <div className={`px-3 py-2 rounded text-xs font-medium ${
                                contactIsOverdue || purchase.contactDeadlineMissed
                                  ? 'bg-red-100 text-red-800'
                                  : contactDaysRemaining && contactDaysRemaining <= 2
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {contactIsOverdue || purchase.contactDeadlineMissed
                                  ? '❌ Kontaktfrist überschritten'
                                  : contactDaysRemaining && contactDaysRemaining > 0
                                  ? `⏰ Kontakt: ${contactDaysRemaining} Tag${contactDaysRemaining !== 1 ? 'e' : ''}`
                                  : '⏰ Kontaktfrist läuft heute ab'}
                                {!purchase.buyerContactedAt && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(`/api/purchases/${purchase.id}/mark-contacted`, {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ role: 'buyer' })
                                        })
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
                                    className="ml-2 px-2 py-0.5 bg-white text-xs rounded hover:bg-gray-50"
                                  >
                                    ✓ Markieren
                                  </button>
                                )}
                              </div>
                            )}

                            {paymentDeadline && (
                              <div className={`px-3 py-2 rounded text-xs font-medium ${
                                paymentIsOverdue || purchase.paymentDeadlineMissed
                                  ? 'bg-red-100 text-red-800'
                                  : paymentDaysRemaining && paymentDaysRemaining <= 3
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
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
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-semibold text-gray-900">Verkäufer</span>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedPurchase(purchase)
                                  setShowSellerInfo(true)
                                }}
                                className="text-xs text-blue-700 hover:text-blue-800 underline"
                              >
                                Details
                              </button>
                            </div>
                            <div className="text-xs text-gray-700 space-y-1">
                              {(purchase.watch.seller.firstName || purchase.watch.seller.lastName) && (
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
                          {(purchase.sellerContactedAt || purchase.buyerContactedAt) && !purchase.paymentConfirmed && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <CreditCard className="h-4 w-4 text-gray-600" />
                                <span className="text-sm font-semibold text-gray-900">Zahlungsinformationen</span>
                              </div>
                              <PaymentInfoCard purchaseId={purchase.id} showQRCode={false} />
                            </div>
                          )}

                          {/* Versand-Tracking - Kompakt */}
                          {purchase.trackingNumber && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Package className="h-4 w-4 text-gray-600" />
                                <span className="text-sm font-semibold text-gray-900">Versand-Tracking</span>
                              </div>
                              <ShippingInfoCard purchaseId={purchase.id} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Aktionen - Kompakt */}
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <div className="flex flex-wrap gap-2">
                          {/* Stornierungs-Button */}
                          {purchase.status === 'pending' && purchase.contactDeadlineMissed && !purchase.sellerContactedAt && (
                            <button
                              onClick={async () => {
                                if (!confirm('Möchten Sie diesen Kauf wirklich stornieren? Der Verkäufer hat nicht innerhalb von 7 Tagen kontaktiert.')) {
                                  return
                                }
                                try {
                                  const res = await fetch(`/api/purchases/${purchase.id}/cancel-by-buyer`, {
                                    method: 'POST'
                                  })
                                  const data = await res.json()
                                  if (res.ok) {
                                    toast.success('Kauf erfolgreich storniert. Die Kommission wurde zurückerstattet.')
                                    handleMarkPaid()
                                  } else {
                                    toast.error(data.message || 'Fehler beim Stornieren')
                                  }
                                } catch (error) {
                                  console.error('Error cancelling purchase:', error)
                                  toast.error('Fehler beim Stornieren')
                                }
                              }}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-2"
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
                              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 flex items-center gap-2"
                            >
                              <PaymentIcon className="h-4 w-4" />
                              Jetzt Artikel bezahlen
                            </button>
                          )}

                          {/* Artikel erhalten Button */}
                          {!purchase.itemReceived && (
                            <button
                              onClick={() => handleConfirmReceived(purchase.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2"
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
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 flex items-center gap-2"
                    >
                            <MessageSquare className="h-4 w-4" />
                            Verkäufer kontaktieren
                    </button>

                          {/* Dispute eröffnen */}
                          {purchase.status !== 'completed' && purchase.status !== 'cancelled' && !purchase.disputeOpenedAt && (
                            <button
                              onClick={() => {
                                setDisputePurchaseId(purchase.id)
                                setShowDisputeModal(true)
                              }}
                              className="px-4 py-2 bg-red-50 text-red-700 border border-red-300 rounded-lg text-sm font-medium hover:bg-red-100 flex items-center gap-2"
                            >
                              <AlertTriangle className="h-4 w-4" />
                              Dispute eröffnen
                            </button>
                          )}

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

      {/* Dispute Modal */}
      {disputePurchaseId && (
        <DisputeModal
          isOpen={showDisputeModal}
          onClose={() => {
            setShowDisputeModal(false)
            setDisputePurchaseId(null)
          }}
          purchaseId={disputePurchaseId}
          onDisputeOpened={() => {
            handleMarkPaid()
          }}
        />
      )}

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
