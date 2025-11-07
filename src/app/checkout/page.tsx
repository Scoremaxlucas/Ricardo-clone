'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PaymentForm } from '@/components/payment/PaymentForm'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, CreditCard, Shield } from 'lucide-react'
import { getShippingCost } from '@/lib/shipping'

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

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const watchId = searchParams.get('watchId')
  const [watch, setWatch] = useState<Watch | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedShipping, setSelectedShipping] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!watchId) {
      setError('Keine Uhr ausgewählt')
      setLoading(false)
      return
    }

    // Lade Watch-Details
    fetch(`/api/watches/${watchId}`)
      .then(res => res.json())
      .then(data => {
        if (data.watch) {
          const images = data.watch.images ? JSON.parse(data.watch.images) : []
          setWatch({ ...data.watch, images })
          
          // Parse shipping methods und setze ersten als Standard
          if (data.watch.shippingMethod) {
            const shippingMethods = JSON.parse(data.watch.shippingMethod)
            if (shippingMethods && shippingMethods.length > 0) {
              setSelectedShipping(shippingMethods[0])
            }
          }
        } else {
          setError('Uhr nicht gefunden')
        }
      })
      .catch(err => {
        console.error('Error loading watch:', err)
        setError('Fehler beim Laden der Uhr')
      })
      .finally(() => setLoading(false))
  }, [watchId])

  const handlePaymentSuccess = async (paymentIntent: any) => {
    setIsProcessing(true)
    
    // Erstelle Purchase-Record
    if (watch && selectedShipping) {
      try {
        const response = await fetch('/api/purchases/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            watchId: watch.id,
            shippingMethod: selectedShipping,
            price: watch.buyNowPrice || watch.price
          })
        })
        
        if (!response.ok) {
          console.error('Error creating purchase:', await response.text())
        }
      } catch (error) {
        console.error('Error creating purchase:', error)
      }
    }
    
    // Redirect to success page
    router.push(`/checkout/success?payment_intent=${paymentIntent.id}`)
  }

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error)
    setError(error)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Lädt...</div>
      </div>
    )
  }

  if (error || !watch) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">{error || 'Uhr nicht gefunden'}</div>
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
  const shippingCost = getShippingCost(shippingMethods.filter(m => m === selectedShipping))
  const totalPrice = (watch.buyNowPrice || watch.price) + shippingCost

  const isBase64Image = (src: string) => {
    return src && (src.startsWith('data:image/') || src.length > 1000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Kasse</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Bestellübersicht</h2>
                
                <div className="flex items-center space-x-4 mb-4">
                  {watch.images && watch.images.length > 0 ? (
                    <img
                      src={watch.images[0]}
                      alt={watch.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-lg" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{watch.title}</h3>
                    <p className="text-sm text-gray-500">{watch.brand} {watch.model}</p>
                    <p className="text-sm text-gray-500">{watch.condition}</p>
                    {watch.year && <p className="text-sm text-gray-500">{watch.year}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      CHF {(watch.buyNowPrice || watch.price).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Versandauswahl */}
                {shippingMethods.length > 0 && (
                  <div className="border-t pt-4 mb-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Lieferart</h3>
                    <div className="space-y-2">
                      {shippingMethods.map((method) => (
                        <label key={method} className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name="shipping"
                            value={method}
                            checked={selectedShipping === method}
                            onChange={(e) => setSelectedShipping(e.target.value)}
                            className="mr-3"
                          />
                          <div className="flex-1">
                            {method === 'pickup' && <span className="text-sm text-gray-700">Abholung (kostenlos)</span>}
                            {method === 'b-post' && <span className="text-sm text-gray-700">Versand als Paket B-Post, bis 2 KG (CHF 8.50)</span>}
                            {method === 'a-post' && <span className="text-sm text-gray-700">Versand als Paket A-Post, bis 2 KG (CHF 12.50)</span>}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Zwischensumme</span>
                    <span className="text-gray-900">CHF {(watch.buyNowPrice || watch.price).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Versand</span>
                    <span className="text-gray-900">CHF {shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Gesamt</span>
                      <span className="text-lg font-bold text-primary-600">
                        CHF {totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Security Info */}
            <Card>
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Shield className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">Sichere Zahlung</h3>
                </div>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• SSL-verschlüsselte Übertragung</li>
                  <li>• Stripe PCI DSS konform</li>
                  <li>• 30-Tage Geld-zurück-Garantie</li>
                  <li>• Authentizitäts-Garantie</li>
                </ul>
              </div>
            </Card>
          </div>

          {/* Payment Form */}
          <div>
            <Card>
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <CreditCard className="h-5 w-5 text-primary-600" />
                  <h2 className="text-lg font-semibold">Zahlungsinformationen</h2>
                </div>

                <PaymentForm
                  amount={totalPrice}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

