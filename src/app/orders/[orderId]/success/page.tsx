'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, Shield, Package, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface Order {
  id: string
  orderNumber: string
  totalAmount: number
  paymentStatus: string
  orderStatus: string
  watch: {
    title: string
    brand: string
    model: string
  }
}

export default function CheckoutSuccessPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = params.orderId as string
  const sessionId = searchParams.get('session_id')

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch(`/api/orders/${orderId}`)
        if (!res.ok) throw new Error('Order nicht gefunden')
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
  }, [orderId])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-500">Bestellung wird geladen...</div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-lg bg-white p-8 shadow-md text-center">
          <div className="text-red-600 mb-4">{error || 'Bestellung nicht gefunden'}</div>
          <Link href="/my-watches/buying" className="text-primary-600 hover:underline">
            Zu meinen Bestellungen
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-2xl px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Zahlung erfolgreich!</h1>
          <p className="mt-2 text-gray-600">
            Ihre Bestellung {order.orderNumber} wurde erfolgreich aufgegeben.
          </p>
        </div>

        {/* Order Card */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4">Bestelldetails</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Bestellnummer:</span>
              <span className="font-mono font-medium">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Artikel:</span>
              <span className="font-medium">{order.watch.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Gesamtbetrag:</span>
              <span className="font-semibold text-primary-600">
                CHF {order.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Protection Info */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 mb-6">
          <div className="flex items-start">
            <Shield className="h-6 w-6 text-blue-600 mr-3 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Helvenda Zahlungsschutz aktiv</h3>
              <p className="text-sm text-blue-700 mt-1">
                Ihr Geld wird sicher verwahrt, bis Sie den Erhalt der Ware bestätigen.
                Sie haben 72 Stunden Zeit, die Ware zu prüfen und bei Problemen einen
                Dispute zu eröffnen.
              </p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4">Nächste Schritte</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 text-sm font-medium mr-3">
                1
              </div>
              <div>
                <h3 className="font-medium">Verkäufer wird benachrichtigt</h3>
                <p className="text-sm text-gray-600">
                  Der Verkäufer erhält eine Benachrichtigung und wird die Ware versenden.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 text-sm font-medium mr-3">
                2
              </div>
              <div>
                <h3 className="font-medium">Versand verfolgen</h3>
                <p className="text-sm text-gray-600">
                  Sie erhalten eine Sendungsverfolgungsnummer, sobald die Ware versendet wurde.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 text-sm font-medium mr-3">
                3
              </div>
              <div>
                <h3 className="font-medium">Erhalt bestätigen</h3>
                <p className="text-sm text-gray-600">
                  Prüfen Sie die Ware und bestätigen Sie den Erhalt, um die Zahlung freizugeben.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Auto-Release Notice */}
        <div className="flex items-center bg-amber-50 rounded-lg border border-amber-200 p-4 mb-6">
          <Clock className="h-5 w-5 text-amber-600 mr-3" />
          <p className="text-sm text-amber-800">
            Die Zahlung wird automatisch nach 72 Stunden freigegeben, falls Sie nicht 
            reagieren und kein Dispute eröffnet wurde.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href={`/orders/${order.id}`}
            className="flex-1 flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Bestellung ansehen
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link
            href="/my-watches/buying"
            className="flex-1 flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            Alle Bestellungen
          </Link>
        </div>
      </div>
    </div>
  )
}
