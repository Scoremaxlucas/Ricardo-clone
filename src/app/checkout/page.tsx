'use client'

import { Card } from '@/components/ui/Card'
import { getShippingCostForMethod } from '@/lib/shipping'
import { ArrowLeft, CreditCard, Loader2, Shield } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

interface Watch {
  id: string
  title: string
  brand: string
  model: string
  price: number
  buyNowPrice?: number
  images: string[]
  condition: string
  year?: number
  shippingMethod: string | null
}

function CheckoutPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const watchId = searchParams.get('watchId')
  const [watch, setWatch] = useState<Watch | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedShipping, setSelectedShipping] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [pricingConfig, setPricingConfig] = useState<any>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (!session) {
      router.push('/login?callbackUrl=/checkout?watchId=' + watchId)
      return
    }

    if (!watchId) {
      setError('Kein Artikel ausgewählt')
      setLoading(false)
      return
    }

    // Lade Pricing-Config und Watch-Details parallel
    Promise.all([
      fetch('/api/pricing/config').then(res => res.json()),
      fetch(`/api/watches/${watchId}`).then(res => res.json()),
    ])
      .then(([pricingData, watchData]) => {
        setPricingConfig(pricingData)

        if (watchData.watch) {
          const images = watchData.watch.images ? JSON.parse(watchData.watch.images) : []
          setWatch({ ...watchData.watch, images })

          // Parse shipping methods und setze ersten als Standard
          if (watchData.watch.shippingMethod) {
            const shippingMethods = JSON.parse(watchData.watch.shippingMethod)
            if (shippingMethods && shippingMethods.length > 0) {
              setSelectedShipping(shippingMethods[0])
            }
          }
        } else {
          setError('Uhr nicht gefunden')
        }
      })
      .catch(err => {
        console.error('Error loading data:', err)
        setError('Fehler beim Laden der Daten')
      })
      .finally(() => setLoading(false))
  }, [watchId, session, router])

  const handleCheckout = async () => {
    if (!watch || !selectedShipping) {
      toast.error('Bitte wählen Sie eine Versandart aus')
      return
    }

    setIsProcessing(true)
    setError('')

    try {
      // Schritt 1: Erstelle Order
      const createOrderRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          watchId: watch.id,
          shippingMethod: selectedShipping,
        }),
      })

      if (!createOrderRes.ok) {
        const errorData = await createOrderRes.json()
        throw new Error(errorData.message || 'Fehler beim Erstellen der Bestellung')
      }

      const orderData = await createOrderRes.json()
      const orderId = orderData.order.id

      // Schritt 2: Erstelle Checkout Session
      const checkoutRes = await fetch(`/api/orders/${orderId}/checkout`, {
        method: 'POST',
      })

      if (!checkoutRes.ok) {
        const errorData = await checkoutRes.json()
        throw new Error(errorData.message || 'Fehler beim Erstellen der Checkout Session')
      }

      const checkoutData = await checkoutRes.json()

      // Schritt 3: Redirect zu Stripe Checkout
      if (checkoutData.checkoutUrl) {
        window.location.href = checkoutData.checkoutUrl
      } else {
        throw new Error('Keine Checkout URL erhalten')
      }
    } catch (err: any) {
      console.error('Error during checkout:', err)
      setError(err.message || 'Fehler beim Checkout')
      toast.error(err.message || 'Fehler beim Checkout')
      setIsProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-500">Lädt...</div>
      </div>
    )
  }

  if (error || !watch) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-lg bg-white p-8 shadow-md">
          <div className="text-red-600">{error || 'Artikel nicht gefunden'}</div>
          <button onClick={() => router.back()} className="mt-4 text-primary-600 hover:underline">
            Zurück
          </button>
        </div>
      </div>
    )
  }

  // Parse shipping methods
  let shippingMethods: string[] = []
  try {
    if (watch.shippingMethod && watch.shippingMethod.trim()) {
      shippingMethods = JSON.parse(watch.shippingMethod)
    }
  } catch (e) {
    console.error('Error parsing shippingMethod:', e)
  }
  // Berechne Fees synchron mit Pricing-Config
  const shippingCost = getShippingCostForMethod(selectedShipping as any)
  const itemPrice = watch.buyNowPrice || watch.price

  // Verwende Pricing-Config für synchrone Berechnung
  const calculateFeesSync = () => {
    if (!pricingConfig) {
      return {
        itemPrice,
        shippingCost,
        platformFee: 0,
        protectionFee: 0,
        totalAmount: itemPrice + shippingCost,
      }
    }

    const platformFee = Math.round(itemPrice * pricingConfig.platformFeeRate * 100) / 100
    const protectionFee = Math.round(itemPrice * pricingConfig.protectionFeeRate * 100) / 100
    const totalAmount =
      Math.round((itemPrice + shippingCost + platformFee + protectionFee) * 100) / 100

    return { itemPrice, shippingCost, platformFee, protectionFee, totalAmount }
  }

  const fees = calculateFeesSync()
  const totalPrice = fees.totalAmount

  const isBase64Image = (src: string) => {
    return src && (src.startsWith('data:image/') || src.length > 1000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center">
          <button onClick={() => router.back()} className="mr-4 rounded-lg p-2 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Kasse</h1>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <div className="p-6">
                <h2 className="mb-4 text-lg font-semibold">Bestellübersicht</h2>

                <div className="mb-4 flex items-center space-x-4">
                  {watch.images && watch.images.length > 0 ? (
                    <img
                      src={watch.images[0]}
                      alt={watch.title}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-gray-200" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{watch.title}</h3>
                    <p className="text-sm text-gray-500">
                      {watch.brand} {watch.model}
                    </p>
                    <p className="text-sm text-gray-500">{watch.condition}</p>
                    {watch.year && <p className="text-sm text-gray-500">{watch.year}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">CHF {itemPrice.toLocaleString()}</p>
                  </div>
                </div>

                {/* Versandauswahl */}
                {shippingMethods.length > 0 && (
                  <div className="mb-4 border-t pt-4">
                    <h3 className="mb-3 text-sm font-medium text-gray-900">Lieferart</h3>
                    <div className="space-y-2">
                      {shippingMethods.map(method => (
                        <label
                          key={method}
                          className="flex cursor-pointer items-center rounded-lg border border-gray-300 p-3 hover:bg-gray-50"
                          style={{ minHeight: '44px' }}
                        >
                          <input
                            type="radio"
                            name="shipping"
                            value={method}
                            checked={selectedShipping === method}
                            onChange={e => setSelectedShipping(e.target.value)}
                            className="mr-3"
                            style={{ minWidth: '20px', minHeight: '20px' }}
                          />
                          <div className="flex-1">
                            {method === 'pickup' && (
                              <span className="text-sm text-gray-700">Abholung (kostenlos)</span>
                            )}
                            {method === 'b-post' && (
                              <span className="text-sm text-gray-700">
                                Versand als Paket B-Post, bis 2 KG (CHF 8.50)
                              </span>
                            )}
                            {method === 'a-post' && (
                              <span className="text-sm text-gray-700">
                                Versand als Paket A-Post, bis 2 KG (CHF 12.50)
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {method === 'pickup'
                              ? 'CHF 0.00'
                              : method === 'b-post'
                                ? 'CHF 8.50'
                                : 'CHF 12.50'}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preis-Zusammenfassung */}
                <div className="border-t pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Artikelpreis:</span>
                      <span className="font-medium">CHF {itemPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Versandkosten:</span>
                      <span className="font-medium">CHF {shippingCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plattform-Gebühr:</span>
                      <span className="font-medium">CHF {fees.platformFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Zahlungsschutz:</span>
                      <span className="font-medium">CHF {fees.protectionFee.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-900">Gesamt:</span>
                        <span className="text-lg font-bold text-primary-600">
                          CHF {totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Zahlungsschutz Info */}
            <Card>
              <div className="p-6">
                <div className="flex items-start">
                  <Shield className="mr-3 h-6 w-6 text-blue-600" />
                  <div>
                    <h3 className="mb-2 font-semibold text-gray-900">Zahlungsschutz</h3>
                    <p className="text-sm text-gray-600">
                      Ihr Geld wird geschützt gehalten, bis Sie die Ware erhalten haben. Sie können
                      die Zahlung freigeben, sobald alles in Ordnung ist.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Payment Section */}
          <div>
            <Card>
              <div className="p-6">
                <h2 className="mb-4 flex items-center text-lg font-semibold">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Zahlung
                </h2>

                <button
                  onClick={handleCheckout}
                  disabled={isProcessing || !selectedShipping}
                  className="w-full rounded-md bg-primary-600 px-6 py-3 text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Wird verarbeitet...
                    </span>
                  ) : (
                    `Jetzt bezahlen - CHF ${totalPrice.toFixed(2)}`
                  )}
                </button>

                <p className="mt-4 text-xs text-gray-500">
                  Durch Klicken auf "Jetzt bezahlen" werden Sie zu Stripe weitergeleitet, um Ihre
                  Zahlung sicher abzuschließen.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={<div className="flex min-h-screen items-center justify-center">Lädt...</div>}
    >
      <CheckoutPageContent />
    </Suspense>
  )
}
