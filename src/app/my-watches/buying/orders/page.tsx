'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, Shield, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { toast } from 'react-hot-toast'

interface Order {
  id: string
  orderNumber: string
  totalAmount: number
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
  createdAt: string
}

export default function MyOrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/my-watches/buying/orders')
      return
    }

    if (status === 'authenticated') {
      loadOrders()
    }
  }, [status, router])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/orders/my-orders?role=buyer')
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

  const getPaymentStatusIcon = (paymentStatus: string) => {
    if (paymentStatus === 'paid' || paymentStatus === 'released') {
      return <CheckCircle className="h-5 w-5 text-green-600" />
    }
    if (paymentStatus === 'refunded') {
      return <XCircle className="h-5 w-5 text-red-600" />
    }
    if (paymentStatus === 'disputed') {
      return <AlertTriangle className="h-5 w-5 text-orange-600" />
    }
    return <Clock className="h-5 w-5 text-yellow-600" />
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
            href="/my-watches/buying"
            className="inline-flex items-center font-medium text-primary-600 hover:text-primary-700"
          >
            ← Zurück zu Mein Kaufen
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Meine Bestellungen</h1>
          <p className="mt-1 text-gray-600">Übersicht Ihrer Bestellungen mit Zahlungsschutz</p>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Keine Bestellungen</h3>
            <p className="mt-2 text-gray-600">Sie haben noch keine Bestellungen aufgegeben.</p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
            >
              Artikel durchsuchen
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
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
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary-600">
                            CHF {order.totalAmount.toFixed(2)}
                          </p>
                          {getStatusBadge(order.orderStatus)}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-gray-600">
                            {order.paymentStatus === 'paid' && !order.buyerConfirmedReceipt
                              ? 'Zahlungsschutz aktiv'
                              : order.paymentStatus === 'released'
                                ? 'Zahlung freigegeben'
                                : order.paymentStatus === 'refunded'
                                  ? 'Zurückerstattet'
                                  : order.paymentStatus === 'disputed'
                                    ? 'Dispute geöffnet'
                                    : 'Zahlung ausstehend'}
                          </span>
                        </div>
                        {getPaymentStatusIcon(order.paymentStatus)}
                        {order.paidAt && (
                          <span className="text-sm text-gray-500">
                            Bezahlt: {new Date(order.paidAt).toLocaleDateString('de-CH')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
