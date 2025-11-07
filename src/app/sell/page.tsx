'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Upload, Clock, Shield, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export default function SellPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const [verificationInProgress, setVerificationInProgress] = useState(false)

  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0)
  const [titleImageIndex, setTitleImageIndex] = useState<number>(0)
  const [boosters, setBoosters] = useState<any[]>([])
  const [selectedBooster, setSelectedBooster] = useState<string>('none')
  const [formData, setFormData] = useState({
    // Grunddaten
    brand: '',
    model: '',
    referenceNumber: '',
    year: '',
    condition: '',
    material: '',
    movement: '',
    caseDiameter: '',
    price: '',
    buyNowPrice: '',
    isAuction: false,
    auctionEnd: '',
    auctionStart: '',
    auctionDuration: '',
    autoRenew: false,
    shippingMethods: [] as string[], // Array: ['pickup', 'b-post', 'a-post']
    
    // Uhren-spezifische Details
    lastRevision: '',
    accuracy: '',
    
    // Lieferumfang
    fullset: false,
    onlyBox: false,
    onlyPapers: false,
    onlyAllLinks: false,
    
    // Garantie
    hasWarranty: false,
    warrantyMonths: '',
    warrantyYears: '',
    hasSellerWarranty: false,
    sellerWarrantyMonths: '',
    sellerWarrantyYears: '',
    sellerWarrantyNote: '',
    
    
    // Beschreibung
    title: '',
    description: '',
    images: [] as string[],
    video: null as string | null
  })

  // Exklusive Auswahl für Lieferumfang (nur eine Option aktiv)
  const setExclusiveSupply = (option: 'fullset' | 'onlyBox' | 'onlyPapers' | 'onlyAllLinks') => {
    setFormData(prev => ({
      ...prev,
      fullset: option === 'fullset',
      onlyBox: option === 'onlyBox',
      onlyPapers: option === 'onlyPapers',
      onlyAllLinks: option === 'onlyAllLinks'
    }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleShippingMethodChange = (method: string, checked: boolean) => {
    setFormData(prev => {
      const currentMethods = [...prev.shippingMethods]
      if (checked) {
        // Füge hinzu, falls noch nicht vorhanden
        if (!currentMethods.includes(method)) {
          currentMethods.push(method)
        }
      } else {
        // Entferne aus Array
        const index = currentMethods.indexOf(method)
        if (index > -1) {
          currentMethods.splice(index, 1)
        }
      }
      return {
        ...prev,
        shippingMethods: currentMethods
      }
    })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newImages: string[] = []
    
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = () => {
        newImages.push(reader.result as string)
        if (newImages.length === files.length) {
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, ...newImages]
          }))
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Prüfe Dateigröße (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert('Das Video ist zu groß. Maximale Größe: 50MB')
        return
      }

      // Prüfe Dateityp
      if (!file.type.startsWith('video/')) {
        alert('Bitte wählen Sie eine Video-Datei aus')
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        setFormData(prev => ({
          ...prev,
          video: reader.result as string
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
    if (selectedImageIndex >= index) {
      setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))
    }
    if (titleImageIndex >= index) {
      setTitleImageIndex(Math.max(0, titleImageIndex - 1))
    }
  }

  const removeVideo = () => {
    setFormData(prev => ({
      ...prev,
      video: null
    }))
  }

  // Lade Verifizierungsstatus und Booster
  useEffect(() => {
    const loadVerificationStatus = async () => {
      if (session?.user?.id) {
        try {
          const res = await fetch('/api/verification/get')
          if (res.ok) {
            const data = await res.json()
            setIsVerified(data.verified || false)
            // Prüfe ob Verifizierung in Bearbeitung ist (Daten vorhanden aber nicht verifiziert)
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

  // Lade Booster-Preise
  useEffect(() => {
    const loadBoosters = async () => {
      try {
        const res = await fetch('/api/admin/boosters')
        console.log('Boosters API response status:', res.status)
        if (res.ok) {
          const data = await res.json()
          console.log('Boosters loaded:', data)
          setBoosters(data.sort((a: any, b: any) => a.price - b.price))
        } else {
          console.error('Boosters API error:', res.status)
        }
      } catch (error) {
        console.error('Error loading boosters:', error)
      }
    }
    loadBoosters()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      // Reale Erstellung der Uhr
      const response = await fetch('/api/watches/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          images: formData.images,
          video: formData.video,
          booster: selectedBooster,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess('Uhr erfolgreich zum Verkauf angeboten!')
        
        // Formular zurücksetzen
        setFormData({
          brand: '',
          model: '',
          referenceNumber: '',
          year: '',
          condition: '',
          material: '',
          movement: '',
          caseDiameter: '',
          price: '',
          buyNowPrice: '',
          isAuction: false,
          auctionEnd: '',
          auctionStart: '',
          auctionDuration: '',
          autoRenew: false,
          shippingMethods: [],
          lastRevision: '',
          accuracy: '',
          fullset: false,
          onlyBox: false,
          onlyPapers: false,
          onlyAllLinks: false,
          hasWarranty: false,
          warrantyMonths: '',
          warrantyYears: '',
          hasSellerWarranty: false,
          sellerWarrantyMonths: '',
          sellerWarrantyYears: '',
          sellerWarrantyNote: '',
          title: '',
          description: '',
          images: [],
          video: null
        })
        setTitleImageIndex(0)
        
        // Erfolg anzeigen und dann weiterleiten
        setTimeout(() => {
          router.push('/')
        }, 1500)
      } else {
        try {
          const errorData = await response.json()
          setError(errorData.message || 'Ein Fehler ist aufgetreten')
          if (errorData.error) {
            console.error('Server error details:', errorData.error)
          }
        } catch (parseError) {
          setError(`Server-Fehler (Status: ${response.status}). Bitte versuchen Sie es erneut.`)
        }
      }
    } catch (err: any) {
      console.error('Error submitting form:', err)
      setError(`Ein Fehler ist aufgetreten: ${err?.message || 'Unbekannter Fehler'}. Bitte versuchen Sie es erneut.`)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center">Lädt...</div>
  }

  if (!session) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/my-watches"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            ← Zurück zu Mein Verkaufen
          </Link>
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Uhr zum Verkauf anbieten
          </h1>
          <p className="text-gray-600">
            Bitte füllen Sie alle relevanten Felder aus, um Ihre Uhr erfolgreich zu verkaufen.
          </p>
        </div>

        {/* Verifizierungs-Banner */}
        {isVerified === false && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                <div>
                  {verificationInProgress ? (
                    <>
                      <p className="text-yellow-800 font-medium">
                        Validierung in Bearbeitung
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Ihre Verifizierung wird derzeit bearbeitet. Sie können erst verkaufen, sobald die Validierung abgeschlossen ist.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-yellow-800 font-medium">
                        Verifizierung erforderlich
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Um Uhren zum Verkauf anzubieten, müssen Sie sich zuerst verifizieren.
                      </p>
                    </>
                  )}
                </div>
              </div>
              <Link
                href="/verification"
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm font-medium whitespace-nowrap"
              >
                {verificationInProgress ? 'Status ansehen' : 'Jetzt verifizieren'}
              </Link>
            </div>
          </div>
        )}

        {isVerified === true && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-green-800 font-medium">
                Sie sind verifiziert und können Uhren verkaufen.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            {success}
          </div>
        )}

        {/* Formular nur anzeigen wenn verifiziert */}
        {(isVerified === false || isVerified === null) ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <AlertCircle className="h-20 w-20 text-yellow-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Verifizierung erforderlich
            </h2>
            <p className="text-gray-600 mb-2 text-lg">
              Um Uhren zum Verkauf anzubieten, müssen Sie sich zuerst verifizieren.
            </p>
            {verificationInProgress && (
              <p className="text-yellow-700 mb-6">
                Ihre Verifizierung wird derzeit bearbeitet.
              </p>
            )}
            <Link
              href="/verification"
              className="inline-flex items-center px-8 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium transition-colors text-lg"
            >
              <Shield className="h-6 w-6 mr-2" />
              {verificationInProgress ? 'Status ansehen' : 'Jetzt verifizieren'}
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
            {/* Grunddaten */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Grunddaten
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marke *
                  </label>
                  <input
                    type="text"
                    name="brand"
                    required
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    placeholder="z.B. Rolex, Omega, Patek Philippe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modell *
                  </label>
                  <input
                    type="text"
                    name="model"
                    required
                    value={formData.model}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    placeholder="z.B. Submariner, Speedmaster"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Referenznummer (Optional)
                  </label>
                  <input
                    type="text"
                    name="referenceNumber"
                    value={formData.referenceNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    placeholder="z.B. 126610LN, 321.10.42.50.01.001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Baujahr
                  </label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    placeholder="z.B. 2020"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zustand *
                  </label>
                  <select
                    name="condition"
                    required
                    value={formData.condition}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  >
                    <option value="">Bitte wählen</option>
                    <option value="fabrikneu-verklebt">Fabrikneu und verklebt</option>
                    <option value="ungetragen">Ungetragen</option>
                    <option value="leichte-tragespuren">Leichte Tragespuren (Mikrokratzer aber keine Dellen oder grössere Kratzer)</option>
                    <option value="tragespuren">Tragespuren (grössere Kratzer, teilweise leichte Dellen)</option>
                    <option value="stark-gebraucht">Stark gebraucht</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Material
                  </label>
                  <input
                    type="text"
                    name="material"
                    value={formData.material}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    placeholder="z.B. Edelstahl, Gold, Titan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Uhrwerk
                  </label>
                  <input
                    type="text"
                    name="movement"
                    value={formData.movement}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    placeholder="z.B. Automatik, Quarz"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gehäusedurchmesser (mm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="caseDiameter"
                    value={formData.caseDiameter}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    placeholder="z.B. 42.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Letzte Revision
                  </label>
                  <input
                    type="date"
                    name="lastRevision"
                    value={formData.lastRevision}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ganggenauigkeit
                  </label>
                  <input
                    type="text"
                    name="accuracy"
                    value={formData.accuracy}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    placeholder="z.B. +2/-1 Sekunden pro Tag"
                  />
                </div>
              </div>
            </div>

            {/* Preis und Verkaufsart */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Preis und Verkaufsart
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Startpreis (CHF) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    required
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    placeholder="z.B. 5000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sofortkaufpreis (CHF)
                  </label>
                  <input
                    type="number"
                    name="buyNowPrice"
                    value={formData.buyNowPrice}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    placeholder="z.B. 8000"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <div className="flex flex-col">
                    <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">
                      Laufzeit in Tagen
                    </label>
                    <input
                      type="number"
                      name="auctionDuration"
                      value={formData.auctionDuration}
                      onChange={handleInputChange}
                      min="1"
                      max="30"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                      placeholder="z.B. 7, 14, 30"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Wählen Sie die Dauer des Angebots (1-30 Tage, max. 30 Tage)
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">
                      Starttermin (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      name="auctionStart"
                      value={formData.auctionStart}
                      onChange={handleInputChange}
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Optional: Starttermin für das Angebot. Falls leer, startet es sofort.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 -mt-2">
                  Die Laufzeit beginnt ab dem Starttermin oder sofort, falls kein Starttermin gewählt wurde.
                </p>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="autoRenew"
                      checked={formData.autoRenew}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Angebot automatisch verlängern
                    </span>
                  </label>
                  <p className="mt-1 ml-6 text-xs text-gray-500">
                    Wenn aktiviert, wird das Angebot automatisch um die gewählte Laufzeit verlängert, sobald es abgelaufen ist (solange kein Kauf zustande gekommen ist).
                  </p>
                </div>
              </div>
            </div>

            {/* Lieferart */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Lieferart <span className="text-red-500">*</span>
              </h2>
              <div className="space-y-3">
                <label className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.shippingMethods.includes('pickup')}
                    onChange={(e) => handleShippingMethodChange('pickup', e.target.checked)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700">Abholung</span>
                    <span className="text-sm text-green-600 ml-2 font-semibold">(kostenlos)</span>
                  </div>
                </label>
                <label className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.shippingMethods.includes('b-post')}
                    onChange={(e) => handleShippingMethodChange('b-post', e.target.checked)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700">Versand als Paket B-Post, bis 2 KG</span>
                    <span className="text-sm text-gray-600 ml-2">CHF 8.50</span>
                  </div>
                </label>
                <label className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.shippingMethods.includes('a-post')}
                    onChange={(e) => handleShippingMethodChange('a-post', e.target.checked)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700">Versand als Paket A-Post, bis 2 KG</span>
                    <span className="text-sm text-gray-600 ml-2">CHF 12.50</span>
                  </div>
                </label>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Die Versandkosten werden dem Käufer zusätzlich zum Kaufbetrag berechnet. Es wird der höchste Betrag der ausgewählten Lieferarten berechnet.
              </p>
              {formData.shippingMethods.length === 0 && (
                <p className="mt-2 text-xs text-red-500">
                  Bitte wählen Sie mindestens eine Lieferart aus.
                </p>
              )}
            </div>

            {/* Lieferumfang */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Lieferumfang (inkl. Uhr selbst)
              </h2>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="fullset"
                    checked={formData.fullset}
                    onChange={() => setExclusiveSupply('fullset')}
                    className="mr-3"
                  />
                  <span className="text-sm font-medium text-gray-700">Fullset (Box, Papiere, alle Glieder und Kaufbeleg)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="onlyBox"
                    checked={formData.onlyBox}
                    onChange={() => setExclusiveSupply('onlyBox')}
                    className="mr-3"
                  />
                  <span className="text-sm font-medium text-gray-700">Nur Box</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="onlyPapers"
                    checked={formData.onlyPapers}
                    onChange={() => setExclusiveSupply('onlyPapers')}
                    className="mr-3"
                  />
                  <span className="text-sm font-medium text-gray-700">Nur Papiere</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="onlyAllLinks"
                    checked={formData.onlyAllLinks}
                    onChange={() => setExclusiveSupply('onlyAllLinks')}
                    className="mr-3"
                  />
                  <span className="text-sm font-medium text-gray-700">Nur Box und Papiere</span>
                </label>
              </div>
            </div>

            {/* Garantie */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Garantie
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="hasWarranty"
                      checked={formData.hasWarranty}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <span className="text-sm font-medium text-gray-700">Herstellergarantie vorhanden</span>
                  </label>
                </div>

                {formData.hasWarranty && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Garantie in Monaten
                      </label>
                      <input
                        type="number"
                        name="warrantyMonths"
                        value={formData.warrantyMonths}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                        placeholder="z.B. 24"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Garantie in Jahren
                      </label>
                      <input
                        type="number"
                        name="warrantyYears"
                        value={formData.warrantyYears}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                        placeholder="z.B. 2"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="hasSellerWarranty"
                      checked={formData.hasSellerWarranty}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <span className="text-sm font-medium text-gray-700">Garantie durch Verkäufer</span>
                  </label>
                </div>

                {formData.hasSellerWarranty && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Verkäufer-Garantie in Monaten
                      </label>
                      <input
                        type="number"
                        name="sellerWarrantyMonths"
                        value={formData.sellerWarrantyMonths}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                        placeholder="z.B. 12"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Verkäufer-Garantie in Jahren
                      </label>
                      <input
                        type="number"
                        name="sellerWarrantyYears"
                        value={formData.sellerWarrantyYears}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                        placeholder="z.B. 1"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bemerkungen zur Verkäufer-Garantie
                      </label>
                      <textarea
                        name="sellerWarrantyNote"
                        value={formData.sellerWarrantyNote}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                        placeholder="z.B. Garantie nur bei normaler Nutzung, keine Wasserschäden..."
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Booster */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Sparkles className="h-5 w-5 mr-2" />
                Booster-Option
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Wählen Sie, wie Ihr Angebot hervorgehoben werden soll
              </p>
              <div className="space-y-3">
                {boosters.map((booster) => (
                  <label
                    key={booster.id}
                    className={`relative flex cursor-pointer rounded-lg border p-4 ${
                      selectedBooster === booster.code
                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="booster"
                      value={booster.code}
                      checked={selectedBooster === booster.code}
                      onChange={(e) => setSelectedBooster(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {booster.name}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {booster.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            CHF {booster.price.toFixed(2)}
                          </p>
                          {booster.price > 0 && (
                            <p className="text-xs text-gray-500">pro Laufzeit</p>
                          )}
                        </div>
                      </div>
                    </div>
                    {selectedBooster === booster.code && (
                      <CheckCircle className="h-5 w-5 text-primary-600 ml-3" />
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Bilder */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Bilder
              </h2>
              
              <div className="mb-4">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Laden Sie bis zu 10 Bilder hoch (JPG, PNG, max. 5MB pro Bild)
                </p>
              </div>

              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Uhr ${index + 1}`}
                        className={`w-full h-32 object-cover rounded-lg cursor-pointer border-2 ${
                          index === titleImageIndex 
                            ? 'border-primary-500 ring-2 ring-primary-200' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedImageIndex(index)}
                      />
                      
                      {/* Titelbild-Button */}
                      <button
                        type="button"
                        onClick={() => setTitleImageIndex(index)}
                        className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${
                          index === titleImageIndex
                            ? 'bg-primary-500 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {index === titleImageIndex ? 'Titelbild' : 'Als Titelbild'}
                      </button>
                      
                      {/* Entfernen-Button */}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-white text-black rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-gray-100 border border-gray-300 shadow-sm"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Video Upload */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Video (Optional)</h3>
                <div className="mb-4">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Laden Sie ein Video hoch (MP4, AVI, MOV, max. 50MB)
                  </p>
                </div>

                {formData.video && (
                  <div className="relative">
                    <video
                      src={formData.video}
                      controls
                      className="w-full max-w-md h-64 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={removeVideo}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Beschreibung */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Beschreibung
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titel *
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    placeholder="z.B. Rolex Submariner Date, 2020, Sehr guter Zustand"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beschreibung *
                  </label>
                  <textarea
                    name="description"
                    required
                    rows={6}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    placeholder="Beschreiben Sie Ihre Uhr detailliert..."
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-600 text-white py-3 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Clock className="h-5 w-5 mr-2 animate-spin" />
                    Wird gespeichert...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Uhr anbieten
                  </>
                )}
              </button>
            </div>
          </form>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}