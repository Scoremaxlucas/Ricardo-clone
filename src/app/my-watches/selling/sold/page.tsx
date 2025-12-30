'use client'

import { BuyerInfoModal } from '@/components/buyer/BuyerInfoModal'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { ShippingInfoCard } from '@/components/shipping/ShippingInfoCard'
import { getShippingCostForMethod, getShippingLabels } from '@/lib/shipping'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  CreditCard,
  ExternalLink,
  Package,
  PackageCheck,
  Shield,
  User,
  Wallet,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

interface Sale {
  id: string
  soldAt: string
  shippingMethod: string | null
  paid: boolean
  paidAt: string | null
  status: string
  itemReceived: boolean
  itemReceivedAt: string | null
  paymentConfirmed: boolean
  paymentConfirmedAt: string | null
  paymentProtectionEnabled?: boolean
  isPaidViaStripe?: boolean
  stripePaymentStatus?: string | null
  orderId?: string | null
  contactDeadline: string | null
  sellerContactedAt: string | null
  buyerContactedAt: string | null
  contactWarningSentAt: string | null
  contactDeadlineMissed: boolean
  disputeOpenedAt: string | null
  disputeReason: string | null
  disputeStatus: string | null
  disputeResolvedAt: string | null
  watch: {
    id: string
    title: string
    brand: string
    model: string
    images: string[]
    price: number
    finalPrice: number
    purchaseType: 'auction' | 'buy-now'
  }
  buyer: {
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
}

interface SellerStripeStatus {
  hasStripeAccount: boolean
  isOnboardingComplete: boolean
  connectOnboardingStatus: string
  payoutsEnabled: boolean
}

export default function SoldPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [showBuyerInfo, setShowBuyerInfo] = useState(false)
  const [sellerStripeStatus, setSellerStripeStatus] = useState<SellerStripeStatus | null>(null)

  const loadSales = useCallback(async () => {
    if (!session?.user) return

    try {
      // Check expired auctions (non-blocking)
      fetch('/api/auctions/check-expired', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => {})

      // Load sales
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
      toast.error('Fehler beim Laden der Verkäufe')
    } finally {
      setLoading(false)
    }
  }, [session?.user])

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated' || !session?.user) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/my-watches/selling/sold'
      router.push(`/login?callbackUrl=${encodeURIComponent(currentPath)}`)
      return
    }

    loadSales()

    // Poll for updates every 10 seconds
    const interval = setInterval(loadSales, 10000)
    return () => clearInterval(interval)
  }, [status, session?.user, loadSales, router])

  const handleConfirmPayment = async (purchaseId: string) => {
    try {
      const res = await fetch(`/api/purchases/${purchaseId}/confirm-payment`, {
        method: 'POST',
      })
      const data = await res.json()

      if (res.ok) {
        toast.success('Zahlung erfolgreich bestätigt!')
        loadSales()
      } else {
        toast.error(data.message || 'Fehler beim Bestätigen der Zahlung')
      }
    } catch (error) {
      console.error('Error confirming payment:', error)
      toast.error('Fehler beim Bestätigen der Zahlung')
    }
  }

  const handleMarkContacted = async (saleId: string) => {
    try {
      const res = await fetch(`/api/purchases/${saleId}/mark-contacted`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'seller' }),
      })
      if (res.ok) {
        toast.success('Kontaktaufnahme markiert!')
        loadSales()
      } else {
        const data = await res.json()
        toast.error(data.message || 'Fehler beim Markieren')
      }
    } catch (error) {
      console.error('Error marking contact:', error)
      toast.error('Fehler beim Markieren der Kontaktaufnahme')
    }
  }

  // Loading state
  if (status === 'loading' || loading) {
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

  // Redirect state
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
      <div className="mx-auto max-w-7xl px-4 py-12">
        <Link
          href="/my-watches/selling"
          className="mb-6 inline-flex items-center text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zu Mein Verkaufen
        </Link>

        <div className="mb-8 flex items-center">
          <CheckCircle className="mr-3 h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Verkäufe verwalten</h1>
            <p className="mt-1 text-gray-600">Zahlungen und Versand Ihrer Verkäufe</p>
          </div>
        </div>

        {/* Payout Setup Banner */}
        {sellerStripeStatus &&
          !sellerStripeStatus.isOnboardingComplete &&
          sales.some(s => s.paymentProtectionEnabled && s.isPaidViaStripe) && (
            <div className="mb-6 rounded-lg border-2 border-primary-200 bg-primary-50 p-4">
              <div className="flex items-start gap-3">
                <Wallet className="mt-0.5 h-6 w-6 flex-shrink-0 text-primary-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-primary-900">Auszahlung einrichten</h3>
                  <p className="mt-1 text-sm text-primary-700">
                    Sie haben Zahlungen über Helvenda Zahlungsschutz erhalten. Richten Sie Ihre
                    Auszahlungsdaten ein, um das Geld zu erhalten.
                  </p>
                  <Link
                    href="/my-watches/account?setup_payout=1"
                    className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                  >
                    <Wallet className="h-4 w-4" />
                    Jetzt einrichten
                  </Link>
                </div>
              </div>
            </div>
          )}

        {sales.length === 0 ? (
          <div className="rounded-lg bg-white p-8 shadow-md">
            <div className="py-12 text-center">
              <Package className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Noch nichts verkauft</h3>
              <p className="mb-6 text-gray-600">Sie haben noch keine Artikel verkauft.</p>
              <Link
                href="/sell"
                className="inline-flex items-center rounded-md bg-primary-600 px-6 py-3 text-white transition-colors hover:bg-primary-700"
              >
                Ersten Artikel verkaufen
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sales.map(sale => (
              <div
                key={sale.id}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {sale.watch.images && sale.watch.images.length > 0 ? (
                  <img
                    src={sale.watch.images[0]}
                    alt={sale.watch.title}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-48 w-full items-center justify-center bg-gray-200 text-gray-500">
                    Kein Bild
                  </div>
                )}
                <div className="p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <div className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                      {sale.watch.purchaseType === 'auction' ? 'Auktion' : 'Sofortkauf'}
                    </div>
                    {sale.paymentProtectionEnabled && (
                      <div className="flex items-center gap-1 rounded-full bg-primary-100 px-2 py-1 text-xs font-semibold text-primary-700">
                        <Shield className="h-3 w-3" />
                        Zahlungsschutz
                      </div>
                    )}
                    <div className="ml-auto text-xs text-gray-500">
                      {new Date(sale.soldAt).toLocaleDateString('de-CH')}
                    </div>
                  </div>
                  <div className="text-sm text-primary-600">
                    {sale.watch.brand} {sale.watch.model}
                  </div>
                  <div className="mb-3 line-clamp-2 font-semibold text-gray-900">
                    {sale.watch.title}
                  </div>

                  {/* Price breakdown */}
                  {sale.shippingMethod && (() => {
                    let shippingMethods: string[] = []
                    try {
                      shippingMethods = JSON.parse(sale.shippingMethod)
                    } catch {
                      shippingMethods = []
                    }
                    const shippingCost = shippingMethods.length > 0
                      ? getShippingCostForMethod(shippingMethods[0] as any)
                      : 0
                    const total = sale.watch.finalPrice + shippingCost

                    return (
                      <>
                        <div className="mb-3 rounded border border-gray-200 bg-gray-50 p-3">
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="text-gray-600">Verkaufspreis</span>
                            <span className="font-medium">CHF {new Intl.NumberFormat('de-CH').format(sale.watch.finalPrice)}</span>
                          </div>
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="text-gray-600">Versand</span>
                            <span className="font-medium">CHF {shippingCost.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                            <span className="font-semibold text-gray-900">Total</span>
                            <span className="text-lg font-bold text-green-700">CHF {new Intl.NumberFormat('de-CH').format(total)}</span>
                          </div>
                        </div>
                        <div className="mb-3 rounded border border-blue-200 bg-blue-50 p-2">
                          <div className="text-xs font-semibold text-blue-700">Lieferart</div>
                          <div className="text-sm text-blue-900">{getShippingLabels(shippingMethods as any).join(', ')}</div>
                        </div>
                      </>
                    )
                  })()}

                  {!sale.shippingMethod && (
                    <div className="mb-3 rounded border border-gray-200 bg-gray-50 p-3">
                      <div className="text-xs text-gray-600">Verkaufspreis</div>
                      <div className="text-xl font-bold text-green-700">
                        CHF {new Intl.NumberFormat('de-CH').format(sale.watch.finalPrice)}
                      </div>
                    </div>
                  )}

                  {/* Contact deadline warning */}
                  {sale.status === 'pending' && sale.contactDeadline && !sale.sellerContactedAt && (() => {
                    const deadline = new Date(sale.contactDeadline)
                    const now = new Date()
                    const timeUntilDeadline = deadline.getTime() - now.getTime()
                    const daysRemaining = Math.ceil(timeUntilDeadline / (1000 * 60 * 60 * 24))
                    const isOverdue = timeUntilDeadline < 0 || sale.contactDeadlineMissed

                    return (
                      <div className={`mb-3 rounded-lg border-2 p-3 ${
                        isOverdue ? 'border-red-400 bg-red-50' :
                        daysRemaining <= 2 ? 'border-orange-400 bg-orange-50' :
                        'border-yellow-300 bg-yellow-50'
                      }`}>
                        <div className="flex items-start gap-2">
                          <AlertCircle className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
                            isOverdue ? 'text-red-600' :
                            daysRemaining <= 2 ? 'text-orange-600' : 'text-yellow-600'
                          }`} />
                          <div className="flex-1">
                            <div className={`mb-1 text-sm font-semibold ${
                              isOverdue ? 'text-red-900' :
                              daysRemaining <= 2 ? 'text-orange-900' : 'text-yellow-900'
                            }`}>
                              {isOverdue ? '❌ Kontaktfrist überschritten' : '⚠️ Kontaktaufnahme erforderlich'}
                            </div>
                            <p className={`text-xs ${
                              isOverdue ? 'text-red-800' :
                              daysRemaining <= 2 ? 'text-orange-800' : 'text-yellow-800'
                            }`}>
                              {isOverdue
                                ? 'Die 7-Tage-Kontaktfrist wurde überschritten. Der Käufer kann den Kauf jetzt stornieren.'
                                : `Sie müssen innerhalb von ${daysRemaining} Tag${daysRemaining !== 1 ? 'en' : ''} mit dem Käufer Kontakt aufnehmen.`
                              }
                            </p>
                            <button
                              onClick={() => handleMarkContacted(sale.id)}
                              className="mt-2 rounded bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
                            >
                              ✓ Kontakt aufgenommen markieren
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Already contacted indicator */}
                  {sale.sellerContactedAt && (
                    <div className="mb-3 flex items-center gap-2 rounded-lg bg-green-50 p-2 text-xs text-green-700">
                      <CheckCircle className="h-4 w-4" />
                      Kontakt aufgenommen am {new Date(sale.sellerContactedAt).toLocaleDateString('de-CH')}
                    </div>
                  )}

                  {/* Status */}
                  <div className="mb-3 rounded-lg border p-2">
                    {sale.status === 'completed' ? (
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">Abgeschlossen</span>
                      </div>
                    ) : sale.isPaidViaStripe && !sale.itemReceived ? (
                      <div className="flex items-center gap-2 text-primary-700">
                        <Shield className="h-4 w-4" />
                        <span className="text-xs font-medium">Bezahlt - Warten auf Erhalt-Bestätigung</span>
                      </div>
                    ) : sale.paymentConfirmed ? (
                      <div className="flex items-center gap-2 text-blue-700">
                        <CreditCard className="h-4 w-4" />
                        <span className="text-xs font-medium">Zahlung bestätigt - Warten auf Erhalt</span>
                      </div>
                    ) : sale.status === 'item_received' ? (
                      <div className="flex items-center gap-2 text-orange-700">
                        <PackageCheck className="h-4 w-4" />
                        <span className="text-xs font-medium">Erhalt bestätigt - Warten auf Zahlung</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs font-medium">Warten auf Zahlung</span>
                      </div>
                    )}
                  </div>

                  {/* Buyer info */}
                  <div className="mb-3 text-xs text-gray-600">
                    Käufer: {sale.buyer.name || sale.buyer.email || 'Unbekannt'}
                  </div>

                  {/* Buyer contact details */}
                  {sale.buyer.phone && (
                    <div className="mb-3 rounded border border-blue-200 bg-blue-50 p-2 text-xs">
                      <div className="mb-1 font-semibold text-blue-900">Käufer-Kontaktdaten:</div>
                      <div className="text-blue-700">
                        {sale.buyer.firstName && sale.buyer.lastName && (
                          <div>{sale.buyer.firstName} {sale.buyer.lastName}</div>
                        )}
                        {sale.buyer.street && sale.buyer.streetNumber && (
                          <div>{sale.buyer.street} {sale.buyer.streetNumber}</div>
                        )}
                        {sale.buyer.postalCode && sale.buyer.city && (
                          <div>{sale.buyer.postalCode} {sale.buyer.city}</div>
                        )}
                        {sale.buyer.phone && <div className="mt-1 font-medium">Tel: {sale.buyer.phone}</div>}
                        {sale.buyer.email && <div>E-Mail: {sale.buyer.email}</div>}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2">
                    {/* Confirm payment button */}
                    {!sale.paymentConfirmed && sale.paid && (
                      <button
                        onClick={() => handleConfirmPayment(sale.id)}
                        className="flex w-full items-center justify-center gap-2 rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                      >
                        <CreditCard className="h-4 w-4" />
                        Zahlung erhalten bestätigen
                      </button>
                    )}

                    {/* Payment protection info */}
                    {sale.paymentProtectionEnabled && sale.isPaidViaStripe && !sale.itemReceived && (
                      <div className="rounded border border-primary-200 bg-primary-50 p-2 text-sm text-primary-700">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span className="font-medium">Zahlung sicher erhalten</span>
                        </div>
                        <p className="mt-1 text-xs">
                          Das Geld wird nach Erhalt-Bestätigung des Käufers freigegeben.
                        </p>
                      </div>
                    )}

                    {/* Waiting for payment */}
                    {!sale.paid && !sale.paymentConfirmed && (
                      <div className="rounded border border-yellow-200 bg-yellow-50 p-2 text-center text-sm text-yellow-700">
                        <Clock className="mr-1 inline h-4 w-4" />
                        {sale.paymentProtectionEnabled
                          ? 'Warten auf sichere Zahlung'
                          : 'Warten auf Zahlung'}
                      </div>
                    )}

                    {/* Payment confirmed */}
                    {sale.paymentConfirmed && (
                      <div className="flex items-center justify-center gap-2 rounded bg-green-100 p-2 text-sm text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        Zahlung bestätigt {sale.paymentConfirmedAt && new Date(sale.paymentConfirmedAt).toLocaleDateString('de-CH')}
                      </div>
                    )}

                    {/* Shipping info card */}
                    {sale.paymentConfirmed && (
                      <ShippingInfoCard
                        purchaseId={sale.id}
                        isSeller={true}
                        onShippingAdded={loadSales}
                      />
                    )}

                    {/* Buyer contact button */}
                    <button
                      onClick={() => {
                        setSelectedSale(sale)
                        setShowBuyerInfo(true)
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
                    >
                      <User className="h-4 w-4" />
                      Käufer-Kontakt
                    </button>

                    {/* Order details for payment protected sales */}
                    {sale.paymentProtectionEnabled && sale.orderId && (
                      <Link
                        href={`/orders/${sale.orderId}`}
                        className="flex w-full items-center justify-center gap-2 rounded border-2 border-primary-600 bg-white px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Bestelldetails ansehen
                      </Link>
                    )}

                    {/* View offer */}
                    <Link
                      href={`/products/${sale.watch.id}`}
                      className="block w-full rounded bg-primary-600 px-4 py-2 text-center text-sm text-white hover:bg-primary-700"
                    >
                      Angebot ansehen
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />

      {/* Buyer Info Modal */}
      {selectedSale && (
        <BuyerInfoModal
          buyer={selectedSale.buyer}
          watchTitle={selectedSale.watch.title}
          purchaseId={selectedSale.id}
          isPaid={selectedSale.paid}
          isOpen={showBuyerInfo}
          onClose={() => {
            setShowBuyerInfo(false)
            setSelectedSale(null)
          }}
          onMarkPaid={loadSales}
        />
      )}
    </div>
  )
}
