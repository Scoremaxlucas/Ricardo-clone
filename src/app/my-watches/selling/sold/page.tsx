'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Package, User, CreditCard, Clock, PackageCheck, AlertCircle, AlertTriangle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { BuyerInfoModal } from '@/components/buyer/BuyerInfoModal'
import { ShippingInfoCard } from '@/components/shipping/ShippingInfoCard'
import { getShippingLabels, getShippingCost } from '@/lib/shipping'

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
  // Kontaktfrist-Felder
  contactDeadline: string | null
  sellerContactedAt: string | null
  buyerContactedAt: string | null
  contactWarningSentAt: string | null
  contactDeadlineMissed: boolean
  // Dispute-Felder
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

export default function SoldPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [showBuyerInfo, setShowBuyerInfo] = useState(false)

  const loadSales = async () => {
    if (!session?.user) return
    
    try {
      setLoading(true)
      
      // Prüfe und verarbeite abgelaufene Auktionen automatisch
      try {
        await fetch('/api/auctions/check-expired', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      } catch (error) {
        console.error('Error checking expired auctions:', error)
        // Fehler ignorieren, da dies nicht kritisch ist
      }
      
      // Lade Verkäufe
      const res = await fetch(`/api/sales/my-sales?t=${Date.now()}`)
      const data = await res.json()
      setSales(data.sales || [])
    } catch (error) {
      console.error('Error loading sales:', error)
      toast.error('Fehler beim Laden der Verkäufe')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkPaid = () => {
    // Refresh sales data
    loadSales()
  }

  const handleConfirmPayment = async (purchaseId: string) => {
    try {
      const res = await fetch(`/api/purchases/${purchaseId}/confirm-payment`, {
        method: 'POST'
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Zahlung erfolgreich bestätigt!')
        // Refresh sales
        handleMarkPaid()
      } else {
        toast.error(data.message || 'Fehler beim Bestätigen der Zahlung')
      }
    } catch (error) {
      console.error('Error confirming payment:', error)
      toast.error('Fehler beim Bestätigen der Zahlung')
    }
  }

  useEffect(() => {
    const loadSalesData = async () => {
      if (!session?.user) return
      try {
        setLoading(true)
        
        // Prüfe und verarbeite abgelaufene Auktionen automatisch
        try {
          await fetch('/api/auctions/check-expired', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          })
        } catch (error) {
          console.error('Error checking expired auctions:', error)
          // Fehler ignorieren, da dies nicht kritisch ist
        }
        
        const res = await fetch(`/api/sales/my-sales?t=${Date.now()}`)
        if (res.ok) {
          const data = await res.json()
          setSales(data.sales || [])
        }
      } catch (error) {
        console.error('Error loading sales:', error)
      } finally {
        setLoading(false)
      }
    }
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

    loadSalesData()
    // Polling alle 5 Sekunden für Updates
    const interval = setInterval(loadSalesData, 5000)
    return () => clearInterval(interval)
  }, [session, status, router])

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

  // Wenn nicht authentifiziert, zeige Loading (Redirect wird in useEffect behandelt)
  if (status === 'unauthenticated' || !session) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Link
          href="/my-watches"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zu Mein Verkaufen
        </Link>

        <div className="flex items-center mb-8">
          <CheckCircle className="h-8 w-8 mr-3 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Verkauft
            </h1>
            <p className="text-gray-600 mt-1">
              Ihre erfolgreichen Verkäufe
            </p>
          </div>
        </div>

        {sales.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Noch nichts verkauft
              </h3>
              <p className="text-gray-600 mb-6">
                Sie haben noch keine Uhren verkauft.
              </p>
              <Link
                href="/sell"
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                Erste Uhr verkaufen
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sales.map((sale) => (
              <div key={sale.id} className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-green-500">
                {sale.watch.images && sale.watch.images.length > 0 ? (
                  <img src={sale.watch.images[0]} alt={sale.watch.title} className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">Kein Bild</div>
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-semibold">
                      {sale.watch.purchaseType === 'auction' ? 'Auktion' : 'Sofortkauf'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(sale.soldAt).toLocaleDateString('de-CH')}
                    </div>
                  </div>
                  <div className="text-sm text-primary-600">{sale.watch.brand} {sale.watch.model}</div>
                  <div className="font-semibold text-gray-900 line-clamp-2 mb-3">{sale.watch.title}</div>
                  
                  {sale.shippingMethod && (() => {
                    let shippingMethods: string[] = []
                    try {
                      shippingMethods = JSON.parse(sale.shippingMethod)
                    } catch {
                      shippingMethods = []
                    }
                    const shippingCost = getShippingCost(shippingMethods)
                    const total = sale.watch.finalPrice + shippingCost

                    return (
                      <>
                        <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
                          <div className="border-t border-green-300 pt-2">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs text-green-700">Verkaufspreis</span>
                              <span className="text-xs font-semibold text-green-700">
                                CHF {new Intl.NumberFormat('de-CH').format(sale.watch.finalPrice)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs text-green-700">Versand</span>
                              <span className="text-xs font-semibold text-green-700">
                                CHF {shippingCost.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-green-300">
                              <span className="text-sm font-semibold text-green-700">Total</span>
                              <span className="text-xl font-bold text-green-700">
                                CHF {new Intl.NumberFormat('de-CH').format(total)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-3">
                          <div className="text-xs text-blue-700 font-semibold mb-1">Lieferart</div>
                          <div className="text-sm text-blue-900">
                            {getShippingLabels(shippingMethods).join(', ')}
                          </div>
                        </div>
                      </>
                    )
                  })()}

                  {!sale.shippingMethod && (
                    <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
                      <div className="text-xs text-green-700 mb-1">Verkaufspreis</div>
                      <div className="text-xl font-bold text-green-700">
                        CHF {new Intl.NumberFormat('de-CH').format(sale.watch.finalPrice)}
                      </div>
                    </div>
                  )}

                  {/* 7-Tage-Kontaktfrist Hinweis (Ricardo-Style) für Verkäufer */}
                  {sale.status === 'pending' && sale.contactDeadline && (() => {
                    const deadline = new Date(sale.contactDeadline)
                    const now = new Date()
                    const timeUntilDeadline = deadline.getTime() - now.getTime()
                    const daysRemaining = Math.ceil(timeUntilDeadline / (1000 * 60 * 60 * 24))
                    const isOverdue = timeUntilDeadline < 0
                    const hasContacted = sale.sellerContactedAt !== null
                    
                    if (hasContacted) {
                      return null // Keine Warnung wenn bereits kontaktiert
                    }
                    
                    return (
                      <div className={`mb-3 p-3 rounded-lg border-2 ${
                        isOverdue || sale.contactDeadlineMissed
                          ? 'bg-red-50 border-red-400'
                          : daysRemaining <= 2
                          ? 'bg-orange-50 border-orange-400'
                          : 'bg-yellow-50 border-yellow-300'
                      }`}>
                        <div className="flex items-start gap-2">
                          <AlertCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                            isOverdue || sale.contactDeadlineMissed
                              ? 'text-red-600'
                              : daysRemaining <= 2
                              ? 'text-orange-600'
                              : 'text-yellow-600'
                          }`} />
                          <div className="flex-1">
                            <div className={`text-sm font-semibold mb-1 ${
                              isOverdue || sale.contactDeadlineMissed
                                ? 'text-red-900'
                                : daysRemaining <= 2
                                ? 'text-orange-900'
                                : 'text-yellow-900'
                            }`}>
                              {isOverdue || sale.contactDeadlineMissed ? '❌ Kontaktfrist überschritten' : '⚠️ Kontaktaufnahme erforderlich'}
                            </div>
                            <div className={`text-xs ${
                              isOverdue || sale.contactDeadlineMissed
                                ? 'text-red-800'
                                : daysRemaining <= 2
                                ? 'text-orange-800'
                                : 'text-yellow-800'
                            }`}>
                              {isOverdue || sale.contactDeadlineMissed ? (
                                <>Die 7-Tage-Kontaktfrist wurde überschritten. Der Käufer kann den Kauf jetzt stornieren. Bitte nehmen Sie umgehend Kontakt auf!</>
                              ) : daysRemaining > 0 ? (
                                <>Sie müssen innerhalb von <span className="font-bold">{daysRemaining} Tag{daysRemaining !== 1 ? 'en' : ''}</span> mit dem Käufer Kontakt aufnehmen, um Zahlungs- und Liefermodalitäten zu klären.</>
                              ) : (
                                <>Die Kontaktfrist läuft heute ab. Bitte nehmen Sie umgehend Kontakt mit dem Käufer auf.</>
                              )}
                            </div>
                            {sale.contactWarningSentAt && (
                              <div className="text-xs text-gray-600 mt-1 italic">
                                Erinnerung gesendet am {new Date(sale.contactWarningSentAt).toLocaleDateString('de-CH')}
                              </div>
                            )}
                            {/* Button zum Markieren, dass Kontakt aufgenommen wurde */}
                            {!sale.sellerContactedAt && (
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`/api/purchases/${sale.id}/mark-contacted`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ role: 'seller' })
                                    })
                                    if (res.ok) {
                                      toast.success('Kontaktaufnahme markiert!')
                                      handleMarkPaid() // Refresh data
                                    } else {
                                      const data = await res.json()
                                      toast.error(data.message || 'Fehler beim Markieren')
                                    }
                                  } catch (error) {
                                    console.error('Error marking contact:', error)
                                    toast.error('Fehler beim Markieren der Kontaktaufnahme')
                                  }
                                }}
                                className="mt-2 px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded hover:bg-primary-700 transition-colors"
                              >
                                ✓ Kontakt aufgenommen markieren
                              </button>
                            )}
                            {sale.sellerContactedAt && (
                              <div className="mt-2 text-xs text-green-700 font-medium">
                                ✓ Kontakt aufgenommen am {new Date(sale.sellerContactedAt).toLocaleDateString('de-CH')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Status-Anzeige */}
                  <div className="mb-3 p-2 rounded-lg border">
                    {sale.status === 'completed' ? (
                      <div className="flex items-center gap-2 text-green-700 bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">Abgeschlossen</span>
                      </div>
                    ) : sale.status === 'payment_confirmed' ? (
                      <div className="flex items-center gap-2 text-blue-700 bg-blue-50 border-blue-200">
                        <CreditCard className="h-4 w-4" />
                        <span className="text-xs font-medium">Zahlung bestätigt - Warten auf Erhalt-Bestätigung</span>
                      </div>
                    ) : sale.status === 'item_received' ? (
                      <div className="flex items-center gap-2 text-orange-700 bg-orange-50 border-orange-200">
                        <PackageCheck className="h-4 w-4" />
                        <span className="text-xs font-medium">Erhalt bestätigt - Warten auf Zahlungsbestätigung</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-700 bg-gray-50 border-gray-200">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs font-medium">Ausstehend</span>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-600 mb-3">
                    Käufer: {sale.buyer.name || sale.buyer.email || 'Unbekannt'}
                  </div>

                  {/* Käufer-Kontaktdaten anzeigen */}
                  {sale.buyer.phone && (
                    <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                      <div className="font-semibold text-blue-900 mb-1">Käufer-Kontaktdaten:</div>
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
                        {sale.buyer.phone && (
                          <div className="mt-1 font-medium">Tel: {sale.buyer.phone}</div>
                        )}
                        {sale.buyer.email && (
                          <div>E-Mail: {sale.buyer.email}</div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {/* Zahlung erhalten Button - nur wenn Käufer bereits als bezahlt markiert hat */}
                    {!sale.paymentConfirmed && sale.paid && (
                      <button
                        onClick={() => handleConfirmPayment(sale.id)}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded text-center text-sm hover:bg-green-700 flex items-center justify-center gap-2 font-medium"
                      >
                        <CreditCard className="h-4 w-4" />
                        Zahlung erhalten bestätigen
                      </button>
                    )}
                    
                    {/* Hinweis wenn Käufer noch nicht bezahlt hat */}
                    {!sale.paid && !sale.paymentConfirmed && (
                      <div className="w-full px-4 py-2 bg-yellow-50 border border-yellow-200 rounded text-center text-sm text-yellow-700">
                        <Clock className="h-4 w-4 inline mr-2" />
                        Warten auf Käufer-Bestätigung der Zahlung
                      </div>
                    )}
                    
                    {sale.paymentConfirmed && (
                      <div className="w-full px-4 py-2 bg-green-100 text-green-700 rounded text-center text-sm flex items-center justify-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Zahlung bestätigt {sale.paymentConfirmedAt && new Date(sale.paymentConfirmedAt).toLocaleDateString('de-CH')}
                      </div>
                    )}

                    {/* Versand-Informationen hinzufügen (nur wenn Zahlung bestätigt) */}
                    {sale.paymentConfirmed && (
                      <div className="mb-3">
                        <ShippingInfoCard 
                          purchaseId={sale.id} 
                          isSeller={true}
                          onShippingAdded={handleMarkPaid}
                        />
                      </div>
                    )}


                    <button
                      onClick={() => {
                        setSelectedSale(sale)
                        setShowBuyerInfo(true)
                      }}
                      className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded text-center text-sm hover:bg-gray-200 flex items-center justify-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      Käufer-Kontakt
                    </button>
                    <Link
                      href={`/products/${sale.watch.id}`}
                      className="block w-full px-4 py-2 bg-primary-600 text-white rounded text-center text-sm hover:bg-primary-700"
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
      
      {/* Käuferinformationen Modal */}
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
          onMarkPaid={handleMarkPaid}
        />
      )}
    </div>
  )
}
