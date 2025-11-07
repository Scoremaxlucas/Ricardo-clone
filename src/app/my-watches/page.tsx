'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { AlertCircle, CheckCircle, Loader2, User } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { BuyerInfoModal } from '@/components/buyer/BuyerInfoModal'

interface BuyerInfo {
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

interface WatchItem {
  id: string
  title: string
  brand: string
  model: string
  price: number
  images: string[]
  createdAt: string
  isSold?: boolean
  buyer?: BuyerInfo | null
  finalPrice?: number
}

export default function MyWatchesPage() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [watches, setWatches] = useState<WatchItem[]>([])
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const [verificationInProgress, setVerificationInProgress] = useState(false)
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerInfo | null>(null)
  const [selectedWatchTitle, setSelectedWatchTitle] = useState<string>('')
  const [showBuyerInfo, setShowBuyerInfo] = useState(false)

  const loadWatches = async () => {
    try {
      setLoading(true)
      // Cache-Busting hinzufügen
      const res = await fetch(`/api/watches/mine?t=${Date.now()}`)
      const data = await res.json()
      setWatches(Array.isArray(data.watches) ? data.watches : [])
    } catch (error) {
      console.error('Error loading watches:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWatches()
    const loadVerificationStatus = async () => {
      if (session?.user?.id) {
        try {
          const res = await fetch('/api/verification/get')
          if (res.ok) {
            const data = await res.json()
            setIsVerified(data.verified || false)
            // Prüfe ob Verifizierung in Bearbeitung ist
            if (!data.verified && data.user && (
              data.user.street || data.user.dateOfBirth || data.user.paymentMethods
            )) {
              setVerificationInProgress(true)
            }
          }
        } catch (error) {
          console.error('Error loading verification status:', error)
        }
      }
    }
    loadVerificationStatus()
  }, [session?.user?.id])

  // Neu laden wenn Seite wieder fokussiert wird (z.B. nach Bearbeitung)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadWatches()
      }
    }

    const handleFocus = () => {
      loadWatches()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  if (status === 'loading') return <div className="p-6">Lädt...</div>
  if (!session) return <div className="p-6">Bitte anmelden.</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            ← Zurück zur Hauptseite
          </Link>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Mein Verkaufen</h1>
          {isVerified === true && (
            <div className="flex items-center px-4 py-2 bg-green-100 border border-green-300 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-800 font-medium">Verifiziert</span>
            </div>
          )}
        </div>

        {/* Verifizierungs-Button/Banner */}
        {(isVerified === false || isVerified === null) && (
          <div className="mb-6">
            {verificationInProgress ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <Loader2 className="h-5 w-5 text-yellow-600 mr-2 animate-spin" />
                  <div>
                    <p className="text-yellow-800 font-medium">
                      Validierung in Bearbeitung
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Ihre Verifizierung wird derzeit bearbeitet.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                href="/verification"
                className="inline-flex items-center px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium transition-colors"
              >
                <AlertCircle className="h-5 w-5 mr-2" />
                Validierungsprozess starten
              </Link>
            )}
          </div>
        )}
        {loading ? (
          <div>Lädt...</div>
        ) : watches.length === 0 ? (
          <div className="bg-white border rounded-md p-6 text-gray-600">
            Keine Uhren vorhanden. <Link className="text-primary-600 underline" href="/sell">Uhr anbieten</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {watches.map(w => (
              <div key={w.id} className="bg-white rounded-lg shadow">
                {w.images && w.images.length > 0 ? (
                  <img src={w.images[0]} alt={w.title} className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">Kein Bild</div>
                )}
                <div className="p-4">
                  <div className="text-sm text-primary-600">{w.brand}</div>
                  <div className="font-semibold text-gray-900">{w.title}</div>
                  {w.isSold && w.finalPrice ? (
                    <div className="mt-1">
                      <div className="text-green-700 font-semibold text-lg">
                        CHF {new Intl.NumberFormat('de-CH').format(w.finalPrice)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Verkaufspreis (Startpreis: CHF {new Intl.NumberFormat('de-CH').format(w.price)})
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-700 mt-1">CHF {new Intl.NumberFormat('de-CH').format(w.price)}</div>
                  )}
                  {w.isSold && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                        Verkauft
                      </span>
                    </div>
                  )}
                  <div className="mt-4 flex flex-col gap-2">
                    <div className="flex gap-3">
                      <Link href={`/products/${w.id}`} className="px-3 py-2 bg-primary-600 text-white rounded">Ansehen</Link>
                      {!w.isSold && (
                        <Link href={`/my-watches/edit/${w.id}`} className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Bearbeiten</Link>
                      )}
                    </div>
                    {w.isSold && w.buyer && (
                      <button
                        onClick={() => {
                          setSelectedBuyer(w.buyer!)
                          setSelectedWatchTitle(w.title)
                          setShowBuyerInfo(true)
                        }}
                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center justify-center gap-2 text-sm"
                      >
                        <User className="h-4 w-4" />
                        Käufer kontaktieren
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
      
      {/* Käuferinformationen Modal */}
      {selectedBuyer && (
        <BuyerInfoModal
          buyer={selectedBuyer}
          watchTitle={selectedWatchTitle}
          isOpen={showBuyerInfo}
          onClose={() => {
            setShowBuyerInfo(false)
            setSelectedBuyer(null)
            setSelectedWatchTitle('')
          }}
        />
      )}
    </div>
  )
}
