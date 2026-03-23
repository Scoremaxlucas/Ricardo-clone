'use client'

import { Card } from '@/components/ui/Card'
import { getShippingCostForMethod } from '@/lib/shipping'
import { ArrowLeft, CreditCard, Loader2, Shield, ShoppingCart, MapPin, Package, Check, Truck } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useLanguage } from '@/contexts/LanguageContext'

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

// Zustand formatieren (z.B. "sehr-gut" → "Sehr gut")
const formatCondition = (condition: string): string => {
  const conditionMap: Record<string, string> = {
    'neu': 'Neu',
    'neuwertig': 'Neuwertig',
    'sehr-gut': 'Sehr gut',
    'gut': 'Gut',
    'akzeptabel': 'Akzeptabel',
    'defekt': 'Defekt',
  }
  return conditionMap[condition?.toLowerCase()] || condition
}

function CheckoutPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { language } = useLanguage()
  const { data: session, status } = useSession()
  const watchId = searchParams.get('watchId')
  const [watch, setWatch] = useState<Watch | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedShipping, setSelectedShipping] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [pricingConfig, setPricingConfig] = useState<any>(null)
  const [isMobile, setIsMobile] = useState(false)
  const copy = useMemo(() => (
    language === 'fr'
    ? {
        checkoutLoading: 'Chargement du paiement...',
        noItem: 'Aucun article selectionne',
        itemNotFound: 'Article introuvable',
        loadError: 'Erreur lors du chargement des donnees',
        chooseShipping: 'Veuillez choisir un mode de livraison',
        orderCreateError: 'Erreur lors de la creation de la commande',
        checkoutError: 'Erreur lors du paiement',
        checkoutSessionError: 'Erreur lors de la creation de la session de paiement',
        noCheckoutUrl: "Aucune URL de paiement n'a ete recue",
        errorTitle: 'Une erreur est survenue',
        back: 'Retour',
        checkout: 'Paiement',
        completeOrder: 'Finaliser la commande',
        item: 'Article',
        chooseDelivery: 'Choisir le mode de livraison',
        pickup: 'Retrait',
        packageB: 'Colis B-Post',
        packageA: 'Colis A-Post',
        pickupDesc: 'Retrait direct chez le vendeur',
        bDesc: 'Livraison en 3-4 jours ouvrables, jusqu a 2 kg',
        aDesc: 'Livraison en 1-2 jours ouvrables, jusqu a 2 kg',
        free: 'Gratuit',
        summary: 'Resume',
        itemPrice: "Prix de l'article",
        delivery: 'Livraison',
        buyerProtection: 'Protection acheteur',
        included: 'Inclus',
        total: 'Total',
        totalToPay: 'Total a payer',
        processing: 'Traitement en cours...',
        buyNow: 'Acheter maintenant',
        paySecurely: 'Payer en securite',
        secure: 'Securise',
        easy: 'Simple',
        fast: 'Rapide',
      }
    : language === 'it'
      ? {
          checkoutLoading: 'Caricamento checkout...',
          noItem: 'Nessun articolo selezionato',
          itemNotFound: 'Articolo non trovato',
          loadError: 'Errore durante il caricamento',
          chooseShipping: 'Seleziona un metodo di spedizione',
          orderCreateError: "Errore durante la creazione dell'ordine",
          checkoutError: 'Errore durante il checkout',
          checkoutSessionError: 'Errore nella creazione della sessione checkout',
          noCheckoutUrl: 'Nessun URL checkout ricevuto',
          errorTitle: 'Si e verificato un errore',
          back: 'Indietro',
          checkout: 'Checkout',
          completeOrder: "Completa l'ordine",
          item: 'Articolo',
          chooseDelivery: 'Scegli consegna',
          pickup: 'Ritiro',
          packageB: 'Pacco B-Post',
          packageA: 'Pacco A-Post',
          pickupDesc: 'Ritiro diretto dal venditore',
          bDesc: 'Consegna in 3-4 giorni lavorativi, fino a 2 kg',
          aDesc: 'Consegna in 1-2 giorni lavorativi, fino a 2 kg',
          free: 'Gratis',
          summary: 'Riepilogo',
          itemPrice: 'Prezzo articolo',
          delivery: 'Consegna',
          buyerProtection: 'Protezione acquirente',
          included: 'Inclusa',
          total: 'Totale',
          totalToPay: 'Totale da pagare',
          processing: 'Elaborazione...',
          buyNow: 'Acquista ora',
          paySecurely: 'Paga in sicurezza',
          secure: 'Sicuro',
          easy: 'Facile',
          fast: 'Rapido',
        }
      : language === 'en'
        ? {
            checkoutLoading: 'Loading checkout...',
            noItem: 'No item selected',
            itemNotFound: 'Item not found',
            loadError: 'Error loading data',
            chooseShipping: 'Please choose a shipping method',
            orderCreateError: 'Error creating order',
            checkoutError: 'Checkout error',
            checkoutSessionError: 'Error creating checkout session',
            noCheckoutUrl: 'No checkout URL received',
            errorTitle: 'An error occurred',
            back: 'Back',
            checkout: 'Checkout',
            completeOrder: 'Complete your order',
            item: 'Item',
            chooseDelivery: 'Choose delivery',
            pickup: 'Pickup',
            packageB: 'Package B-Post',
            packageA: 'Package A-Post',
            pickupDesc: 'Pick up directly from seller',
            bDesc: 'Delivery in 3-4 business days, up to 2 kg',
            aDesc: 'Delivery in 1-2 business days, up to 2 kg',
            free: 'Free',
            summary: 'Summary',
            itemPrice: 'Item price',
            delivery: 'Delivery',
            buyerProtection: 'Buyer protection',
            included: 'Included',
            total: 'Total',
            totalToPay: 'Total to pay',
            processing: 'Processing...',
            buyNow: 'Buy now',
            paySecurely: 'Pay securely',
            secure: 'Secure',
            easy: 'Easy',
            fast: 'Fast',
          }
        : {
            checkoutLoading: 'Kasse wird geladen...',
            noItem: 'Kein Artikel ausgewählt',
            itemNotFound: 'Artikel nicht gefunden',
            loadError: 'Fehler beim Laden der Daten',
            chooseShipping: 'Bitte wählen Sie eine Versandart aus',
            orderCreateError: 'Fehler beim Erstellen der Bestellung',
            checkoutError: 'Fehler beim Checkout',
            checkoutSessionError: 'Fehler beim Erstellen der Checkout Session',
            noCheckoutUrl: 'Keine Checkout URL erhalten',
            errorTitle: 'Ein Fehler ist aufgetreten',
            back: 'Zurück',
            checkout: 'Kasse',
            completeOrder: 'Bestellung abschließen',
            item: 'Artikel',
            chooseDelivery: 'Lieferart wählen',
            pickup: 'Abholung',
            packageB: 'Paket B-Post',
            packageA: 'Paket A-Post',
            pickupDesc: 'Direkt beim Verkäufer abholen',
            bDesc: 'Lieferung in 3-4 Werktagen, bis 2 kg',
            aDesc: 'Lieferung in 1-2 Werktagen, bis 2 kg',
            free: 'Gratis',
            summary: 'Zusammenfassung',
            itemPrice: 'Artikelpreis',
            delivery: 'Lieferung',
            buyerProtection: 'Käuferschutz',
            included: 'Inklusive',
            total: 'Total',
            totalToPay: 'Total zu zahlen',
            processing: 'Wird verarbeitet...',
            buyNow: 'Jetzt kaufen',
            paySecurely: 'Sicher bezahlen',
            secure: 'Sicher',
            easy: 'Einfach',
            fast: 'Schnell',
          }
  ), [language])

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
      setError(copy.noItem)
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
          setError(copy.itemNotFound)
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
          setError(copy.itemNotFound)
        }
      } catch (err) {
        console.error('Error loading data:', err)
        setError(copy.loadError)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [watchId, status, router, copy, language])

  const handleCheckout = async () => {
    if (!watch || !selectedShipping) {
      toast.error(copy.chooseShipping)
      return
    }

    setIsProcessing(true)
    setError('')

    const isPickup = selectedShipping === 'pickup'

    // Shipping code mapping
    const shippingCodeMap: Record<string, string> = {
      'b-post': 'post_economy_2kg',
      'a-post': 'post_priority_2kg',
    }

    try {
      // === EINHEITLICHER ORDER-FLOW (Ricardo-Style) ===
      // Alle Käufe gehen jetzt über /api/orders/create
      // Die API entscheidet basierend auf paymentProtectionEnabled und deliveryMode

      const createOrderRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          watchId: watch.id,
          selectedDeliveryMode: isPickup ? 'pickup' : 'shipping',
          selectedShippingCode: isPickup ? null : (shippingCodeMap[selectedShipping] || selectedShipping),
          selectedAddons: [],
        }),
      })

      if (!createOrderRes.ok) {
        let errorMsg = copy.orderCreateError
        try {
          const errorData = await createOrderRes.json()
          console.error('Order creation error response:', JSON.stringify(errorData, null, 2))
          errorMsg = errorData.error
            ? `${errorData.message}: ${errorData.error}`
            : errorData.message || errorMsg
          if (errorData.code) {
            errorMsg += ` (Code: ${errorData.code})`
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
          errorMsg = `Server error: ${createOrderRes.status} ${createOrderRes.statusText}`
        }
        throw new Error(errorMsg)
      }

      const orderData = await createOrderRes.json()
      const orderId = orderData.order.id

      // Prüfe ob Stripe-Zahlung erforderlich ist
      if (orderData.requiresStripePayment) {
        // VERSAND MIT ZAHLUNGSSCHUTZ: Stripe Checkout
        const checkoutRes = await fetch(`/api/orders/${orderId}/checkout`, {
          method: 'POST',
        })

        if (!checkoutRes.ok) {
          const errorData = await checkoutRes.json()
          throw new Error(errorData.message || copy.checkoutSessionError)
        }

        const checkoutData = await checkoutRes.json()

        // Redirect zu Stripe Checkout
        if (checkoutData.checkoutUrl) {
          window.location.href = checkoutData.checkoutUrl
        } else {
          throw new Error(copy.noCheckoutUrl)
        }
      } else {
        // ABHOLUNG ODER VERSAND OHNE ZAHLUNGSSCHUTZ
        // Order wurde bereits erstellt mit Status "confirmed"
        // Käufer erhält E-Mail mit Zahlungsinformationen/Kontaktdaten

        // Redirect zur Erfolgsseite (wie bei Ricardo)
        router.push(`/orders/${orderId}/success`)
      }
    } catch (err: any) {
      console.error('Error during checkout:', err)
      setError(err.message || copy.checkoutError)
      toast.error(err.message || copy.checkoutError)
      setIsProcessing(false)
    }
  }

  if (loading || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
          <p className="text-sm font-medium text-gray-600">{copy.checkoutLoading}</p>
        </div>
      </div>
    )
  }

  if (error || !watch) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4">
        <Card className="max-w-md overflow-hidden shadow-lg">
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <Package className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              {error ? copy.errorTitle : copy.itemNotFound}
            </h2>
            <p className="mb-6 text-sm text-gray-600">
              {error || 'Der gesuchte Artikel konnte leider nicht gefunden werden.'}
            </p>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center rounded-lg px-6 py-3 font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                boxShadow: '0px 4px 16px rgba(20, 184, 166, 0.25)',
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {copy.back}
            </button>
          </div>
        </Card>
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="mx-auto max-w-4xl px-4 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 flex items-center">
          <button
            onClick={() => router.back()}
            className="mr-3 rounded-full p-2 text-gray-600 transition-colors hover:bg-white hover:text-gray-900 hover:shadow-sm"
            aria-label={copy.back}
            title={copy.back}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 md:text-2xl">{copy.checkout}</h1>
            <p className="text-sm text-gray-500">{copy.completeOrder}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Order Summary */}
          <div className="space-y-4 md:space-y-6">
            {/* Artikel-Card */}
            <Card className="overflow-hidden shadow-sm">
              <div className="bg-white p-4 md:p-6">
                <h2 className="mb-4 flex items-center text-sm font-semibold uppercase tracking-wide text-gray-500">
                  <Package className="mr-2 h-4 w-4" />
                  {copy.item}
                </h2>

                <div className="flex gap-4">
                  {/* Bild */}
                  <div className="flex-shrink-0">
                    {watch.images && watch.images.length > 0 ? (
                      <img
                        src={watch.images[0]}
                        alt={watch.title}
                        className="h-24 w-24 rounded-lg border border-gray-100 object-cover shadow-sm md:h-28 md:w-28"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-gray-100 md:h-28 md:w-28">
                        <Package className="h-8 w-8 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <h3 className="text-base font-semibold leading-tight text-gray-900 md:text-lg">
                        {watch.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {watch.brand} {watch.model}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          {formatCondition(watch.condition)}
                        </span>
                        {watch.year && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                            {watch.year}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-lg font-bold text-primary-600">
                        CHF {itemPrice.toLocaleString(language === 'fr' ? 'fr-CH' : language === 'it' ? 'it-CH' : language === 'en' ? 'en-CH' : 'de-CH', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Versandauswahl */}
            {shippingMethods.length > 0 && (
              <Card className="overflow-hidden shadow-sm">
                <div className="bg-white p-4 md:p-6">
                  <h2 className="mb-4 flex items-center text-sm font-semibold uppercase tracking-wide text-gray-500">
                    <Truck className="mr-2 h-4 w-4" />
                    {copy.chooseDelivery}
                  </h2>
                  <div className="space-y-2">
                    {shippingMethods.map(method => {
                      const isSelected = selectedShipping === method
                      const isPickup = method === 'pickup'
                      const price = isPickup ? 0 : method === 'b-post' ? 8.50 : 12.50

                      return (
                        <label
                          key={method}
                          className={`flex cursor-pointer items-center rounded-xl border-2 p-4 transition-all ${
                            isSelected
                              ? 'border-primary-500 bg-primary-50 shadow-sm'
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="shipping"
                            value={method}
                            checked={isSelected}
                            onChange={e => setSelectedShipping(e.target.value)}
                            className="sr-only"
                          />
                          <div className={`mr-4 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                            isSelected
                              ? 'border-primary-500 bg-primary-500'
                              : 'border-gray-300 bg-white'
                          }`}>
                            {isSelected && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center">
                              {isPickup ? (
                                <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                              ) : (
                                <Package className="mr-2 h-4 w-4 text-gray-500" />
                              )}
                              <span className={`font-medium ${isSelected ? 'text-primary-700' : 'text-gray-900'}`}>
                                {isPickup ? copy.pickup : method === 'b-post' ? copy.packageB : copy.packageA}
                              </span>
                            </div>
                            <p className="ml-6 mt-0.5 text-xs text-gray-500">
                              {isPickup
                                ? copy.pickupDesc
                                : method === 'b-post'
                                  ? copy.bDesc
                                  : copy.aDesc}
                            </p>
                          </div>
                          <div className={`text-sm font-bold ${isSelected ? 'text-primary-600' : 'text-gray-900'}`}>
                            {isPickup ? copy.free : `+ CHF ${price.toFixed(2)}`}
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </Card>
            )}

            {/* Preis-Zusammenfassung */}
            <Card className="overflow-hidden shadow-sm">
              <div className="bg-white p-4 md:p-6">
                <h2 className="mb-4 flex items-center text-sm font-semibold uppercase tracking-wide text-gray-500">
                  <CreditCard className="mr-2 h-4 w-4" />
                  {copy.summary}
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{copy.itemPrice}</span>
                    <span className="font-medium text-gray-900">CHF {itemPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{copy.delivery}</span>
                    <span className={`font-medium ${shippingCost === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                      {shippingCost === 0 ? copy.free : `CHF ${shippingCost.toFixed(2)}`}
                    </span>
                  </div>
                  {watch.paymentProtectionEnabled && (
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center text-gray-600">
                        <Shield className="mr-1.5 h-3.5 w-3.5 text-green-500" />
                        {copy.buyerProtection}
                      </span>
                      <span className="font-medium text-green-600">{copy.included}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold text-gray-900">{copy.total}</span>
                      <span className="text-xl font-bold text-gray-900">
                        CHF {totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

          </div>

          {/* Right Column - Action Section */}
          <div className="space-y-4 md:space-y-6">
            {/* Info-Karte je nach Modus */}
            {selectedShipping === 'pickup' ? (
              <div className="rounded-xl border-2 border-primary-200 bg-primary-50 p-4">
                <div className="flex items-start">
                  <div className="mr-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100">
                    <MapPin className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary-800">Abholung beim Verkäufer</h3>
                    <p className="mt-1 text-sm text-primary-700">
                      Nach der Kaufbestätigung erhalten Sie die Kontaktdaten.
                      Bezahlung erfolgt bar bei Übergabe.
                    </p>
                  </div>
                </div>
              </div>
            ) : watch.paymentProtectionEnabled ? (
              <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4">
                <div className="flex items-start">
                  <div className="mr-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-800">Käuferschutz aktiv</h3>
                    <p className="mt-1 text-sm text-green-700">
                      Ihr Geld wird geschützt, bis Sie die Ware erhalten haben.
                      Bei Problemen können Sie reklamieren.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start">
                  <div className="mr-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
                    <CreditCard className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-800">Direktzahlung</h3>
                    <p className="mt-1 text-sm text-amber-700">
                      Zahlung erfolgt direkt an den Verkäufer per Banküberweisung.
                      Der Käuferschutz ist nicht aktiv.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Card - Einheitlicher Teal-Gradient Style */}
            <Card className="overflow-hidden shadow-xl ring-1 ring-gray-100">
              <div className="bg-white p-5 md:p-6">
                {/* Total prominenter anzeigen */}
                <div className="mb-5 rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">{copy.totalToPay}</span>
                    <span className="text-2xl font-bold text-gray-900">
                      CHF {totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Button - Einheitlicher Teal-Gradient */}
                <button
                  onClick={handleCheckout}
                  disabled={isProcessing || !selectedShipping}
                  className="w-full rounded-lg px-6 py-4 font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:translate-y-0 disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                    boxShadow: '0px 4px 16px rgba(20, 184, 166, 0.25)',
                  }}
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {copy.processing}
                    </span>
                  ) : selectedShipping === 'pickup' ? (
                    <span className="flex items-center justify-center">
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      {copy.buyNow}
                    </span>
                  ) : watch.paymentProtectionEnabled ? (
                    <span className="flex items-center justify-center">
                      <Shield className="mr-2 h-5 w-5" />
                      {copy.paySecurely}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      {copy.buyNow}
                    </span>
                  )}
                </button>

                {/* Erklärungstext */}
                <p className="mt-4 text-center text-xs leading-relaxed text-gray-500">
                  {selectedShipping === 'pickup' ? (
                    <>Mit Klick auf &quot;Jetzt kaufen&quot; wird der Kauf verbindlich. Bezahlung bar bei Abholung.</>
                  ) : watch.paymentProtectionEnabled ? (
                    <>Sichere Zahlung über Stripe. Ihr Geld ist geschützt bis zur Lieferung.</>
                  ) : (
                    <>Mit Klick auf &quot;Jetzt kaufen&quot; wird der Kauf verbindlich. Sie erhalten die Zahlungsdaten des Verkäufers.</>
                  )}
                </p>

                {/* Trust Badges - Kompakter */}
                <div className="mt-4 flex items-center justify-center gap-6 border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Shield className="h-4 w-4 text-primary-500" />
                    <span>{copy.secure}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Check className="h-4 w-4 text-primary-500" />
                    <span>{copy.easy}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Truck className="h-4 w-4 text-primary-500" />
                    <span>{copy.fast}</span>
                  </div>
                </div>
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
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Kasse wird geladen...</p>
          </div>
        </div>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  )
}
