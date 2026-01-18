'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import {
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Home,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Shield,
  Sparkles,
  Truck,
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Order {
  id: string
  orderNumber: string
  itemPrice: number
  shippingCost: number
  platformFee: number
  protectionFee: number
  totalAmount: number
  paymentStatus: string
  orderStatus: string
  paymentMethod: string | null
  paymentDeadline: string | null
  contactDeadline: string | null
  selectedDeliveryMode: string | null
  createdAt: string
  watch: {
    id: string
    title: string
    brand: string
    model: string
    images: string
    price: number
  }
  seller: {
    id: string
    name: string | null
    email: string
    firstName: string | null
    lastName: string | null
  }
  buyer: {
    id: string
    name: string | null
    email: string
  }
}

export default function PurchaseSuccessPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const orderId = params.orderId as string
  const fromStripe = searchParams.get('session_id') !== null

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch(`/api/orders/${orderId}`)
        if (!res.ok) throw new Error('Bestellung nicht gefunden')
        const data = await res.json()
        setOrder(data.order)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      loadOrder()
    }

    // Hide confetti after 3 seconds
    const timer = setTimeout(() => setShowConfetti(false), 3000)
    return () => clearTimeout(timer)
  }, [orderId])

  // Parse watch images
  const getWatchImage = () => {
    if (!order?.watch.images) return null
    try {
      const images = JSON.parse(order.watch.images)
      return images[0] || null
    } catch {
      return null
    }
  }

  // Determine purchase type
  const isPickup = order?.selectedDeliveryMode === 'pickup'
  const isStripePayment = order?.paymentMethod === 'stripe'
  const isBankTransfer = order?.paymentMethod === 'bank_transfer'

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('de-CH', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  // Format deadline
  const formatDeadline = (dateStr: string | null) => {
    if (!dateStr) return '7 Tagen'
    const deadline = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? `${diffDays} Tagen` : 'heute'
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-emerald-50 via-white to-gray-50">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600"></div>
            <p className="text-gray-600">Bestellung wird geladen...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-50 to-white">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4">
          <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <Package className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="mb-2 text-xl font-bold text-gray-900">Bestellung nicht gefunden</h1>
            <p className="mb-6 text-gray-600">{error || 'Die Bestellung konnte nicht geladen werden.'}</p>
            <Link
              href="/my-watches/buying/purchased"
              className="inline-flex items-center rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white transition-all hover:bg-primary-700"
            >
              Zu meinen Käufen
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const watchImage = getWatchImage()

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-emerald-50 via-white to-gray-50">
      <Header />

      <main className="flex-1 pb-12 pt-6">
        <div className="mx-auto max-w-3xl px-4">
          {/* Success Hero Section */}
          <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-8 text-white shadow-2xl sm:p-12">
            {/* Decorative Elements */}
            <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl"></div>
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-teal-300/20 blur-2xl"></div>

            {/* Confetti Animation */}
            {showConfetti && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute animate-bounce"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 0.5}s`,
                      animationDuration: `${0.5 + Math.random() * 0.5}s`,
                    }}
                  >
                    <Sparkles className="h-4 w-4 text-yellow-300 opacity-70" />
                  </div>
                ))}
              </div>
            )}

            <div className="relative text-center">
              {/* Animated Checkmark */}
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/30 backdrop-blur-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </div>
              </div>

              <h1 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
                🎉 Herzlichen Glückwunsch!
              </h1>
              <p className="text-lg text-emerald-100">
                {isStripePayment
                  ? 'Ihre Zahlung war erfolgreich. Der Artikel gehört Ihnen!'
                  : 'Ihr Kauf wurde bestätigt!'}
              </p>

              {/* Order Number Badge */}
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm">
                <span className="text-sm text-emerald-100">Bestellnummer:</span>
                <span className="font-mono font-bold">{order.orderNumber}</span>
              </div>
            </div>
          </div>

          {/* Purchase Summary Card */}
          <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
            <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
              <h2 className="flex items-center text-lg font-semibold text-gray-900">
                <Package className="mr-2 h-5 w-5 text-emerald-600" />
                Ihr Kauf
              </h2>
            </div>

            <div className="p-6">
              <div className="flex gap-5">
                {/* Product Image */}
                <div className="flex-shrink-0">
                  {watchImage ? (
                    <img
                      src={watchImage}
                      alt={order.watch.title}
                      className="h-28 w-28 rounded-xl object-cover shadow-md ring-1 ring-gray-200"
                    />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                      <Package className="h-10 w-10" />
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1">
                  <Link
                    href={`/products/${order.watch.id}`}
                    className="text-lg font-semibold text-gray-900 hover:text-primary-600"
                  >
                    {order.watch.title}
                  </Link>
                  <p className="mt-1 text-sm text-gray-500">
                    {order.watch.brand} {order.watch.model}
                  </p>

                  {/* Delivery Method Badge */}
                  <div className="mt-3 flex items-center gap-2">
                    {isPickup ? (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                        <MapPin className="mr-1.5 h-3.5 w-3.5" />
                        Abholung
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
                        <Truck className="mr-1.5 h-3.5 w-3.5" />
                        Versand
                      </span>
                    )}
                    {isStripePayment && (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                        <Shield className="mr-1.5 h-3.5 w-3.5" />
                        Bezahlt
                      </span>
                    )}
                  </div>
                </div>

                {/* Price - Only what buyer pays */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    CHF {(order.itemPrice + (order.shippingCost || 0)).toFixed(2)}
                  </div>
                  {order.shippingCost > 0 && (
                    <p className="mt-1 text-xs text-gray-500">inkl. Versand</p>
                  )}
                </div>
              </div>

              {/* Price Breakdown - Only show what buyer pays */}
              <div className="mt-6 rounded-xl bg-gray-50 p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Artikelpreis</span>
                    <span className="font-medium">CHF {order.itemPrice.toFixed(2)}</span>
                  </div>
                  {order.shippingCost > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Versandkosten</span>
                      <span className="font-medium">CHF {order.shippingCost.toFixed(2)}</span>
                    </div>
                  )}
                  {/* Note: platformFee and protectionFee are paid by SELLER, not buyer */}
                  {/* So we don't show them here */}
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-900">Gesamtbetrag</span>
                      <span className="text-emerald-600">
                        CHF {(order.itemPrice + (order.shippingCost || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps Card */}
          <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
            <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
              <h2 className="flex items-center text-lg font-semibold text-gray-900">
                <Clock className="mr-2 h-5 w-5 text-emerald-600" />
                Nächste Schritte
              </h2>
            </div>

            <div className="p-6">
              <div className="space-y-5">
                {/* Step 1: Contact Seller */}
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <span className="text-lg font-bold">1</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      Verkäufer kontaktieren
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {isPickup
                        ? `Kontaktieren Sie den Verkäufer innerhalb von ${formatDeadline(order.contactDeadline)}, um Ort und Zeit für die Abholung zu vereinbaren.`
                        : `Kontaktieren Sie den Verkäufer innerhalb von ${formatDeadline(order.contactDeadline)}, um Versanddetails zu klären.`}
                    </p>
                  </div>
                </div>

                {/* Step 2: Payment (if not Stripe) */}
                {!isStripePayment && (
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                      <span className="text-lg font-bold">2</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {isPickup ? 'Bei Abholung bezahlen' : 'Zahlung tätigen'}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {isPickup
                          ? 'Bezahlen Sie den Artikel bei der Abholung direkt an den Verkäufer (bar oder nach Vereinbarung).'
                          : `Überweisen Sie den Betrag innerhalb von ${formatDeadline(order.paymentDeadline)} an den Verkäufer.`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 3: Receive Item */}
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <span className="text-lg font-bold">{isStripePayment ? '2' : '3'}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {isPickup ? 'Artikel abholen' : 'Artikel erhalten'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {isPickup
                        ? 'Holen Sie den Artikel beim Verkäufer ab und prüfen Sie ihn vor Ort.'
                        : 'Prüfen Sie die Ware bei Erhalt und melden Sie eventuelle Probleme.'}
                    </p>
                  </div>
                </div>

                {/* Step 4: Confirm & Rate */}
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                    <span className="text-lg font-bold">{isStripePayment ? '3' : '4'}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      Erhalt bestätigen & bewerten
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Bestätigen Sie den Erhalt der Ware und hinterlassen Sie eine Bewertung für den Verkäufer.
                    </p>
                  </div>
                </div>
              </div>

              {/* Deadline Warning */}
              {order.contactDeadline && (
                <div className="mt-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <Calendar className="h-5 w-5 flex-shrink-0 text-amber-600" />
                  <p className="text-sm text-amber-800">
                    <span className="font-semibold">Kontaktfrist:</span>{' '}
                    Bitte kontaktieren Sie den Verkäufer bis {formatDate(order.contactDeadline)}.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Protection Info (only for Stripe shipping, NOT pickup) */}
          {isStripePayment && !isPickup && (
            <div className="mb-6 overflow-hidden rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <Shield className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-emerald-900">
                      Helvenda Zahlungsschutz aktiv
                    </h3>
                    <p className="mt-2 text-sm text-emerald-700">
                      Ihr Geld wird sicher verwahrt, bis Sie den Erhalt der Ware bestätigen.
                      Sie haben 72 Stunden Zeit, die Ware zu prüfen und bei Problemen einen Dispute zu eröffnen.
                    </p>
                    <ul className="mt-3 space-y-1.5 text-sm text-emerald-700">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        100% Geld-zurück-Garantie bei Problemen
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        Sichere Zahlung über Stripe
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        72h Prüfzeit nach Erhalt
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-center">
            <Link
              href={`/my-watches/buying/purchased?highlight=${order.id}&action=contact`}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-4 font-semibold text-white shadow-lg shadow-emerald-200 transition-all hover:from-emerald-700 hover:to-teal-700 hover:shadow-xl"
            >
              <MessageCircle className="h-5 w-5" />
              Verkäufer kontaktieren
            </Link>
          </div>

          {/* Helpful Links */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Haben Sie Fragen?{' '}
              <Link href="/help" className="font-medium text-primary-600 hover:underline">
                Hilfe-Center
              </Link>
              {' · '}
              <Link href="/contact" className="font-medium text-primary-600 hover:underline">
                Support kontaktieren
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
