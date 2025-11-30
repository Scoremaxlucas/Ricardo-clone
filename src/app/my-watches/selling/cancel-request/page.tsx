'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, X, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

interface Sale {
  id: string
  soldAt: string
  status: string
  watch: {
    id: string
    title: string
    brand: string
    model: string
    images: string[]
    finalPrice: number
  }
  buyer: {
    name: string | null
    email: string | null
  }
}

export default function CancelRequestPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [reason, setReason] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  const CANCEL_REASONS = [
    { value: 'buyer_not_responding', label: 'Käufer antwortet nicht' },
    { value: 'payment_not_confirmed', label: 'Zahlung nicht bestätigt' },
    { value: 'item_damaged_before_shipping', label: 'Artikel beschädigt vor Versand' },
    { value: 'other', label: 'Sonstiges' }
  ]

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated' || !session) {
      router.push(`/login?callbackUrl=${encodeURIComponent('/my-watches/selling/cancel-request')}`)
      return
    }

    loadSales()
  }, [session, status, router])

  const loadSales = async () => {
    try {
      const res = await fetch(`/api/sales/my-sales?t=${Date.now()}`)
      if (res.ok) {
        const data = await res.json()
        // Nur nicht-stornierte und nicht-abgeschlossene Verkäufe anzeigen
        const availableSales = (data.sales || []).filter(
          (sale: Sale) => sale.status !== 'cancelled' && sale.status !== 'completed'
        )
        setSales(availableSales)
      }
    } catch (error) {
      console.error('Error loading sales:', error)
      toast.error('Fehler beim Laden der Verkäufe')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedSale || !reason || !description.trim()) {
      toast.error('Bitte wählen Sie einen Artikel aus und geben Sie einen Grund sowie eine Beschreibung ein')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/purchases/${selectedSale.id}/cancel-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          description: description.trim()
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Stornierungsantrag erfolgreich eingereicht. Ein Admin wird sich in Kürze darum kümmern.')
        router.push('/my-watches/selling/fees')
      } else {
        toast.error(data.message || 'Fehler beim Einreichen des Stornierungsantrags')
      }
    } catch (error) {
      console.error('Error submitting cancel request:', error)
      toast.error('Fehler beim Einreichen des Stornierungsantrags')
    } finally {
      setSubmitting(false)
    }
  }

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
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link
          href="/my-watches/selling/fees"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zu Gebühren & Rechnungen
        </Link>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Stornierungsantrag stellen
            </h1>
            <p className="text-gray-600">
              Wählen Sie einen verkauften Artikel aus und stellen Sie einen Stornierungsantrag
            </p>
          </div>

          {/* Wichtiger Hinweis */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-900 mb-1">
                  Wichtiger Hinweis
                </p>
                <p className="text-sm text-yellow-800">
                  Ein Stornierungsantrag ist eine <strong>Anfrage</strong> und wird nicht automatisch gewährt. 
                  Ein Admin wird Ihren Antrag prüfen und entscheiden, ob die Stornierung genehmigt wird. 
                  Bitte geben Sie einen detaillierten Grund an, warum Sie die Stornierung benötigen.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Artikelauswahl */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Artikel auswählen <span className="text-red-500">*</span>
              </label>
              {sales.length === 0 ? (
                <div className="border border-gray-300 rounded-lg p-4 text-center text-gray-500">
                  Keine verfügbaren Verkäufe gefunden
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {sales.map((sale) => {
                    const images = sale.watch.images || []
                    const mainImage = images.length > 0 ? images[0] : null
                    return (
                      <button
                        key={sale.id}
                        type="button"
                        onClick={() => setSelectedSale(sale)}
                        className={`w-full text-left p-4 border-2 rounded-lg transition-all ${
                          selectedSale?.id === sale.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          {mainImage ? (
                            <img
                              src={mainImage}
                              alt={sale.watch.title}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                              Kein Bild
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 mb-1">
                              {sale.watch.title}
                            </div>
                            <div className="text-sm text-gray-600 mb-1">
                              {sale.watch.brand} {sale.watch.model}
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              CHF {new Intl.NumberFormat('de-CH').format(sale.watch.finalPrice)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Verkauft am: {new Date(sale.soldAt).toLocaleDateString('de-CH')}
                            </div>
                            <div className="text-xs text-gray-500">
                              Käufer: {sale.buyer.name || sale.buyer.email || 'Unbekannt'}
                            </div>
                          </div>
                          {selectedSale?.id === sale.id && (
                            <div className="text-primary-600">
                              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Grund */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grund für Stornierung <span className="text-red-500">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Bitte wählen...</option>
                {CANCEL_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Beschreibung */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detaillierte Beschreibung <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Bitte beschreiben Sie im Detail, warum Sie die Stornierung benötigen..."
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Je detaillierter Ihre Beschreibung ist, desto schneller kann der Admin Ihren Antrag bearbeiten.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Link
                href="/my-watches/selling/fees"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-center"
              >
                Abbrechen
              </Link>
              <button
                type="submit"
                disabled={submitting || !selectedSale || !reason || !description.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Wird verarbeitet...
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4" />
                    Stornierungsantrag stellen
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  )
}

