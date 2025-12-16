'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, Shield, Clock, CheckCircle, XCircle, AlertTriangle, DollarSign } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { calculateSellerAmount } from '@/lib/order-fees'
import { toast } from 'react-hot-toast'

interface Order {
  id: string
  orderNumber: string
  totalAmount: number
  itemPrice: number
  platformFee: number
  orderStatus: string
  paymentStatus: string
  paidAt: string | null
  releasedAt: string | null
  refundedAt: string | null
  buyerConfirmedReceipt: boolean
  disputeStatus: string
  watch: {
    id: string
    title: string
    brand: string
    model: string
    images: string[]
  }
  buyer: {
    name: string | null
    email: string
  }
  createdAt: string
}

export default function SellerOrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/my-watches/selling/orders')
      return
    }

    if (status === 'authenticated') {
      loadOrders()
    }
  }, [status, router])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/orders/my-orders?role=seller')
      if (!res.ok) {
        throw new Error('Fehler beim Laden der Bestellungen')
      }
      const data = await res.json()
      setOrders(data.orders || [])
    } catch (error: any) {
      console.error('Error loading orders:', error)
      toast.error('Fehler beim Laden der Bestellungen')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      awaiting_payment: { label: 'Zahlung ausstehend', color: 'bg-yellow-100 text-yellow-800' },
      processing: { label: 'In Bearbeitung', color: 'bg-blue-100 text-blue-800' },
      shipped: { label: 'Versandt', color: 'bg-purple-100 text-purple-800' },
      delivered: { label: 'Geliefert', color: 'bg-green-100 text-green-800' },
      completed: { label: 'Abgeschlossen', color: 'bg-green-100 text-green-800' },
      canceled: { label: 'Storniert', color: 'bg-red-100 text-red-800' },
    }

    const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' }
    return (
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    )
  }


  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-gray-500">Lädt...</div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/my-watches/selling"
            className="inline-flex items-center font-medium text-primary-600 hover:text-primary-700"
          >
            ← Zurück zu Mein Verkaufen
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Meine Bestellungen</h1>
          <p className="mt-1 text-gray-600">Übersicht Ihrer Verkäufe mit Zahlungsschutz</p>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Keine Bestellungen</h3>
            <p className="mt-2 text-gray-600">Sie haben noch keine Bestellungen erhalten.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const sellerAmount = calculateSellerAmount(order.itemPrice, order.platformFee)
              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex flex-1 gap-4">
                      {order.watch.images && order.watch.images.length > 0 && (
                        <img
                          src={order.watch.images[0]}
                          alt={order.watch.title}
                          className="h-20 w-20 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {order.watch.title}
                            </h3>
                            <p className="mt-1 text-sm text-gray-600">
                              {order.watch.brand} {order.watch.model}
                            </p>
                            <p className="mt-2 text-sm text-gray-500">
                              Bestellnummer: {order.orderNumber}
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                              Käufer: {order.buyer.name || order.buyer.email}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="mb-2">
                              <p className="text-sm text-gray-600">Verkaufspreis:</p>
                              <p className="text-lg font-bold text-primary-600">
                                CHF {sellerAmount.toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500">
                                (CHF {order.itemPrice.toFixed(2)} - CHF {order.platformFee.toFixed(2)} Gebühr)
                              </p>
                            </div>
                            {getStatusBadge(order.orderStatus)}
                          </div>
                        </div>

                        <div className="mt-4 flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {order.paymentStatus === 'paid' && !order.releasedAt ? (
                              <>
                                <Clock className="h-4 w-4 text-blue-600" />
                                <span className="text-sm text-gray-600">
                                  Zahlung wird geschützt gehalten
                                </span>
                              </>
                            ) : order.paymentStatus === 'released' ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-gray-600">
                                  Zahlung freigegeben
                                </span>
                              </>
                            ) : order.paymentStatus === 'refunded' ? (
                              <>
                                <XCircle className="h-4 w-4 text-red-600" />
                                <span className="text-sm text-gray-600">Zurückerstattet</span>
                              </>
                            ) : order.paymentStatus === 'disputed' ? (
                              <>
                                <AlertTriangle className="h-4 w-4 text-orange-600" />
                                <span className="text-sm text-gray-600">Dispute geöffnet</span>
                              </>
                            ) : (
                              <>
                                <Clock className="h-4 w-4 text-yellow-600" />
                                <span className="text-sm text-gray-600">Zahlung ausstehend</span>
                              </>
                            )}
                          </div>
                          {order.paidAt && (
                            <span className="text-sm text-gray-500">
                              Bezahlt: {new Date(order.paidAt).toLocaleDateString('de-CH')}
                            </span>
                          )}
                          {order.releasedAt && (
                            <span className="text-sm text-green-600">
                              Freigegeben: {new Date(order.releasedAt).toLocaleDateString('de-CH')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
