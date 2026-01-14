'use client'

import { Card } from '@/components/ui/Card'
import { getShippingCostForMethod } from '@/lib/shipping'
import { ArrowLeft, CreditCard, Loader2, Shield, ShoppingCart, MapPin } from 'lucide-react'
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
  paymentProtectionEnabled?: boolean
}

function CheckoutPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
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
    // Warte bis Session-Status bekannt ist
    if (status === 'loading') {
      return
    }

    // Redirect zu Login wenn nicht authentifiziert
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/checkout?watchId=' + watchId)
      return
    }

    if (!watchId) {
      setError('Kein Artikel ausgewählt')
      setLoading(false)
      return
    }

    // Lade Pricing-Config und Watch-Details parallel
    const loadData = async () => {
      try {
        const [pricingRes, watchRes] = await Promise.all([
          fetch('/api/pricing/config'),
          fetch(`/api/watches/${watchId}`),
        ])

        // Prüfe ob Responses ok sind
        if (!pricingRes.ok) {
          console.error('Pricing config error:', pricingRes.status)
        }
        if (!watchRes.ok) {
          console.error('Watch fetch error:', watchRes.status)
          setError('Artikel nicht gefunden')
          setLoading(false)
          return
        }

        const pricingData = await pricingRes.json()
        const watchData = await watchRes.json()

        setPricingConfig(pricingData)

        if (watchData.watch) {
          let images: string[] = []
          try {
            // Images können bereits ein Array sein oder ein JSON-String
            if (Array.isArray(watchData.watch.images)) {
              images = watchData.watch.images
            } else if (watchData.watch.images) {
              images = JSON.parse(watchData.watch.images)
            }
          } catch (e) {
            console.error('Error parsing images:', e)
            // Fallback: Wenn das Parsen fehlschlägt, versuche es als Array zu behandeln
            if (watchData.watch.images) {
              images = [watchData.watch.images]
            }
          }
          setWatch({
            ...watchData.watch,
            images,
            paymentProtectionEnabled: watchData.watch.paymentProtectionEnabled ?? false
          })

          // Parse shipping methods und setze ersten als Standard
          if (watchData.watch.shippingMethod) {
            try {
              const shippingMethods = JSON.parse(watchData.watch.shippingMethod)
              if (shippingMethods && shippingMethods.length > 0) {
                setSelectedShipping(shippingMethods[0])
              }
            } catch (e) {
              console.error('Error parsing shippingMethod:', e)
            }
          }
        } else {
          setError('Artikel nicht gefunden')
        }
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Fehler beim Laden der Daten')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [watchId, status, router])

  const handleCheckout = async () => {
    if (!watch || !selectedShipping) {
      toast.error('Bitte wählen Sie eine Versandart aus')
      return
    }

    setIsProcessing(true)
    setError('')

    const isPickup = selectedShipping === 'pickup'
    const needsStripePayment = !isPickup && watch.paymentProtectionEnabled

    try {
      if (needsStripePayment) {
        // VERSAND MIT ZAHLUNGSSCHUTZ: Order erstellen + Stripe Checkout
        const deliveryMode = 'shipping'
        const shippingCodeMap: Record<string, string> = {
          'b-post': 'post_economy_2kg',
          'a-post': 'post_priority_2kg',
        }

        // Schritt 1: Erstelle Order
        const createOrderRes = await fetch('/api/orders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            watchId: watch.id,
            selectedDeliveryMode: deliveryMode,
            selectedShippingCode: shippingCodeMap[selectedShipping] || selectedShipping,
            selectedAddons: [],
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
      } else {
        // ABHOLUNG ODER VERSAND OHNE ZAHLUNGSSCHUTZ: Direkte Kaufbestätigung
        // Ricardo-Logik: Kauf ist sofort verbindlich, keine Vorab-Zahlung nötig
        const createPurchaseRes = await fetch('/api/purchases/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            watchId: watch.id,
            shippingMethod: selectedShipping,
            price: watch.buyNowPrice || watch.price,
          }),
        })

        if (!createPurchaseRes.ok) {
          const errorData = await createPurchaseRes.json()
          throw new Error(errorData.message || 'Fehler beim Erstellen des Kaufs')
        }

        const purchaseData = await createPurchaseRes.json()
        
        // Erfolg! Redirect zur Kaufbestätigung
        toast.success('Kauf erfolgreich! Bitte kontaktieren Sie den Verkäufer.')
        router.push(`/my-watches/buying/purchased?highlight=${purchaseData.purchase.id}`)
      }
    } catch (err: any) {
      console.error('Error during checkout:', err)
      setError(err.message || 'Fehler beim Checkout')
      toast.error(err.message || 'Fehler beim Checkout')
      setIsProcessing(false)
    }
  }

  if (loading || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Lädt...</span>
        </div>
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

  // RICARDO-MODELL: Käufer zahlt NUR Artikelpreis + Versand
  // Zahlungsschutz ist INKLUSIVE (keine zusätzliche Gebühr)
  // Plattform-Gebühr wird vom Verkäufer bezahlt (bei Auszahlung abgezogen)
  const calculateFeesSync = () => {
    // Käufer zahlt nur: Artikelpreis + Versandkosten
    const totalAmount = Math.round((itemPrice + shippingCost) * 100) / 100

    return {
      itemPrice,
      shippingCost,
      platformFee: 0,      // Wird vom Verkäufer bezahlt, nicht relevant für Käufer
      protectionFee: 0,    // Zahlungsschutz ist inklusive
      totalAmount,
    }
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
                    {watch.paymentProtectionEnabled && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Zahlungsschutz:</span>
                        <span className="font-medium text-green-600">Inklusive</span>
                      </div>
                    )}
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

            {/* Info-Karte je nach Modus */}
            {selectedShipping === 'pickup' ? (
              <Card>
                <div className="p-6">
                  <div className="flex items-start">
                    <MapPin className="mr-3 h-6 w-6 text-primary-600" />
                    <div>
                      <h3 className="mb-2 font-semibold text-gray-900">Abholung beim Verkäufer</h3>
                      <p className="text-sm text-gray-600">
                        Nach der Kaufbestätigung erhalten Sie die Kontaktdaten des Verkäufers.
                        Vereinbaren Sie einen Termin zur Abholung. Die Bezahlung erfolgt bar bei Übergabe.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ) : watch.paymentProtectionEnabled ? (
              <Card>
                <div className="p-6">
                  <div className="flex items-start">
                    <Shield className="mr-3 h-6 w-6 text-green-600" />
                    <div>
                      <h3 className="mb-2 font-semibold text-gray-900">Zahlungsschutz inklusive</h3>
                      <p className="text-sm text-gray-600">
                        Ihr Geld wird automatisch geschützt gehalten, bis Sie die Ware erhalten haben.
                        Sie zahlen nur den Artikelpreis – ohne zusätzliche Gebühren. Bei Problemen
                        können Sie die Transaktion reklamieren.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="p-6">
                  <div className="flex items-start">
                    <Shield className="mr-3 h-6 w-6 text-gray-400" />
                    <div>
                      <h3 className="mb-2 font-semibold text-gray-900">Direktzahlung an Verkäufer</h3>
                      <p className="text-sm text-gray-600">
                        Nach der Kaufbestätigung erhalten Sie die Zahlungsdaten des Verkäufers.
                        Der Verkäufer versendet nach Zahlungseingang. Der Helvenda Zahlungsschutz ist nicht aktiv.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Action Section */}
          <div>
            <Card>
              <div className="p-6">
                {/* Unterschiedliche Darstellung je nach Modus */}
                {selectedShipping === 'pickup' ? (
                  <>
                    <h2 className="mb-4 flex items-center text-lg font-semibold">
                      <MapPin className="mr-2 h-5 w-5" />
                      Abholung
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
                        <span className="flex items-center justify-center">
                          <ShoppingCart className="mr-2 h-5 w-5" />
                          Jetzt kaufen
                        </span>
                      )}
                    </button>
                    <p className="mt-4 text-xs text-gray-500">
                      Mit Klick auf "Jetzt kaufen" wird der Kauf verbindlich. Die Bezahlung erfolgt 
                      bei Abholung direkt an den Verkäufer. Sie erhalten die Kontaktdaten des Verkäufers
                      nach Kaufbestätigung.
                    </p>
                  </>
                ) : watch.paymentProtectionEnabled ? (
                  <>
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
                      Zahlung sicher abzuschließen. Der Verkäufer versendet erst nach Zahlungseingang.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="mb-4 flex items-center text-lg font-semibold">
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Kauf bestätigen
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
                        <span className="flex items-center justify-center">
                          <ShoppingCart className="mr-2 h-5 w-5" />
                          Jetzt kaufen - CHF {totalPrice.toFixed(2)}
                        </span>
                      )}
                    </button>
                    <p className="mt-4 text-xs text-gray-500">
                      Mit Klick auf "Jetzt kaufen" wird der Kauf verbindlich. Sie erhalten die 
                      Kontakt- und Zahlungsdaten des Verkäufers nach Kaufbestätigung.
                    </p>
                  </>
                )}
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
