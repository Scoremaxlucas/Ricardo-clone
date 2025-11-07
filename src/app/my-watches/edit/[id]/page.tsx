'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Calendar, Upload, Clock, Shield, CheckCircle, Lock, Sparkles } from 'lucide-react'

export default function EditWatchPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const watchId = params.id as string

  const [isLoading, setIsLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [hasBids, setHasBids] = useState(false)

  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0)
  const [titleImageIndex, setTitleImageIndex] = useState<number>(0)
  const [boosters, setBoosters] = useState<any[]>([])
  const [selectedBooster, setSelectedBooster] = useState<string>('none')
  const [currentBooster, setCurrentBooster] = useState<string>('none')
  const [formData, setFormData] = useState({
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
    images: [] as string[],
    video: null as string | null,
    additionalInfo: ''
  })

  useEffect(() => {
    const loadWatch = async () => {
      try {
        setLoadingData(true)
        setError('')
        const res = await fetch(`/api/watches/${watchId}`)
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          throw new Error(errorData.message || 'Uhr nicht gefunden')
        }
        const data = await res.json()
        const watch = data.watch

        if (!watch) {
          throw new Error('Uhr nicht gefunden')
        }

        // Prüfe ob Gebote existieren
        setHasBids(watch.bids && watch.bids.length > 0)

        // Parse images - watch.images ist bereits ein Array wenn von API zurückgegeben
        const images = Array.isArray(watch.images) ? watch.images : (watch.images ? JSON.parse(watch.images) : [])
        
        // Parse current booster
        let currentBoosterCode = 'none'
        if ((watch as any).boosters) {
          try {
            const boosterArray = typeof (watch as any).boosters === 'string' 
              ? JSON.parse((watch as any).boosters) 
              : (watch as any).boosters
            if (Array.isArray(boosterArray) && boosterArray.length > 0) {
              currentBoosterCode = boosterArray[0] // Nimm ersten Booster
            }
          } catch (e) {
            console.error('Error parsing boosters:', e)
          }
        }
        console.log('[Edit Watch] Current booster from watch:', currentBoosterCode, 'Raw boosters:', (watch as any).boosters)
        setCurrentBooster(currentBoosterCode)
        setSelectedBooster(currentBoosterCode)

        setFormData({
          brand: watch.brand || '',
          model: watch.model || '',
          referenceNumber: (watch as any).referenceNumber || '',
          year: watch.year ? watch.year.toString() : '',
          condition: watch.condition || '',
          material: watch.material || '',
          movement: watch.movement || '',
          caseDiameter: (watch as any).caseDiameter ? (watch as any).caseDiameter.toString() : '',
          price: watch.price ? watch.price.toString() : '',
          buyNowPrice: watch.buyNowPrice ? watch.buyNowPrice.toString() : '',
          isAuction: watch.isAuction || false,
          auctionEnd: watch.auctionEnd ? new Date(watch.auctionEnd).toISOString().slice(0, 16) : '',
          lastRevision: watch.lastRevision ? new Date(watch.lastRevision).toISOString().slice(0, 10) : '',
          accuracy: watch.accuracy || '',
          fullset: watch.fullset || false,
          onlyBox: (watch as any).box || false,
          onlyPapers: (watch as any).papers || false,
          onlyAllLinks: (watch as any).allLinks || false,
          hasWarranty: !!(watch as any).warranty,
          warrantyMonths: (watch as any).warrantyMonths ? (watch as any).warrantyMonths.toString() : '',
          warrantyYears: (watch as any).warrantyYears ? (watch as any).warrantyYears.toString() : '',
          hasSellerWarranty: !!(watch as any).warrantyNote,
          sellerWarrantyMonths: '',
          sellerWarrantyYears: '',
          sellerWarrantyNote: (watch as any).warrantyNote || '',
          title: watch.title || '',
          description: watch.description || '',
          images: images,
          video: watch.video || null,
          additionalInfo: ''
        })
        setTitleImageIndex(0)
      } catch (err: any) {
        console.error('Error loading watch:', err)
        setError('Fehler beim Laden: ' + (err.message || 'Unbekannter Fehler'))
        setLoadingData(false)
      } finally {
        setLoadingData(false)
      }
    }
    if (watchId && session?.user) {
      loadWatch()
    }
  }, [watchId, session?.user])

  // Lade Booster-Preise
  useEffect(() => {
    const loadBoosters = async () => {
      try {
        const res = await fetch('/api/admin/boosters')
        if (res.ok) {
          const data = await res.json()
          // API gibt direkt ein Array zurück, nicht ein Objekt mit boosters Property
          const boostersArray = Array.isArray(data) ? data : (data.boosters || [])
          console.log('[Edit Watch] Loaded boosters:', boostersArray)
          setBoosters(boostersArray)
        } else {
          console.error('[Edit Watch] Failed to load boosters, status:', res.status)
        }
      } catch (error) {
        console.error('Error loading boosters:', error)
      }
    }
    loadBoosters()
  }, [])

  const setExclusiveSupply = (option: 'fullset' | 'onlyBox' | 'onlyPapers' | 'onlyAllLinks') => {
    if (hasBids) return // Blockiert wenn Gebote
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
    
    // Blockiere Preisfelder wenn Gebote existieren
    if (hasBids && (name === 'price' || name === 'buyNowPrice')) {
      return
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
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

  const removeImage = (index: number) => {
    if (hasBids) return // Keine Löschung wenn Gebote
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/watches/${watchId}/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          booster: selectedBooster
        }),
      })

      if (response.ok) {
        const responseData = await response.json()
        if (responseData.warning) {
          setError(responseData.warning) // Zeige Warnung als Fehler, damit User sie sieht
          setTimeout(() => {
            router.push('/my-watches')
            router.refresh() // Seite neu laden
          }, 3000)
        } else {
          setSuccess('Angebot erfolgreich aktualisiert!')
          setTimeout(() => {
            router.push('/my-watches')
            router.refresh() // Seite neu laden
          }, 1500)
        }
      } else {
        const errorData = await response.json()
        setError(errorData.message || errorData.error || 'Ein Fehler ist aufgetreten')
      }
    } catch (err) {
      console.error('Error updating watch:', err)
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || loadingData) {
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
        <div className="mb-8">
          <Link href="/my-watches" className="text-primary-600 hover:text-primary-700 mb-4 inline-block">← Zurück zu Mein Verkaufen</Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Angebot bearbeiten
          </h1>
          {hasBids && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md mb-4">
              <strong>Wichtig:</strong> Es existieren bereits Gebote. Preise können nicht mehr geändert werden. Sie können nur zusätzliche Bilder hinzufügen und eine "Nachträgliche Information" erfassen.
            </div>
          )}
        </div>

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

        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Grunddaten */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Grunddaten
                {hasBids && <Lock className="h-4 w-4 ml-2 text-gray-400" />}
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
                    disabled={hasBids}
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                    disabled={hasBids}
                    value={formData.model}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                    disabled={hasBids}
                    value={formData.referenceNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="z.B. 126610LN"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Baujahr
                  </label>
                  <input
                    type="number"
                    name="year"
                    disabled={hasBids}
                    value={formData.year}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                    disabled={hasBids}
                    value={formData.condition}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Bitte wählen</option>
                    <option value="fabrikneu-verklebt">Fabrikneu und verklebt</option>
                    <option value="ungetragen">Ungetragen</option>
                    <option value="leichte-tragespuren">Leichte Tragespuren</option>
                    <option value="tragespuren">Tragespuren</option>
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
                    disabled={hasBids}
                    value={formData.material}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="z.B. Edelstahl, Gold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Uhrwerk
                  </label>
                  <input
                    type="text"
                    name="movement"
                    disabled={hasBids}
                    value={formData.movement}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                    disabled={hasBids}
                    value={formData.caseDiameter}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                    disabled={hasBids}
                    value={formData.lastRevision}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ganggenauigkeit
                  </label>
                  <input
                    type="text"
                    name="accuracy"
                    disabled={hasBids}
                    value={formData.accuracy}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                {hasBids && <Lock className="h-4 w-4 ml-2 text-red-500" />}
              </h2>
              {hasBids && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md mb-4">
                  Diese Felder sind gesperrt, da bereits Gebote vorhanden sind.
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Startpreis (CHF) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    required
                    disabled={hasBids}
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                    disabled={hasBids}
                    value={formData.buyNowPrice}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="z.B. 8000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Laufzeitende der Auktion
                  </label>
                  <input
                    type="datetime-local"
                    name="auctionEnd"
                    disabled={hasBids}
                    value={formData.auctionEnd}
                    onChange={handleInputChange}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Lieferumfang */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Lieferumfang (inkl. Uhr selbst)
              </h2>
              {hasBids && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2 rounded-md mb-4">
                  Diese Felder sind gesperrt, da bereits Gebote vorhanden sind.
                </div>
              )}
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="fullset"
                    disabled={hasBids}
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
                    disabled={hasBids}
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
                    disabled={hasBids}
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
                    disabled={hasBids}
                    checked={formData.onlyAllLinks}
                    onChange={() => setExclusiveSupply('onlyAllLinks')}
                    className="mr-3"
                  />
                  <span className="text-sm font-medium text-gray-700">Nur Box und Papiere</span>
                </label>
              </div>
            </div>

            {/* Garantie */}
            {!hasBids && (
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
                          placeholder="z.B. Garantie nur bei normaler Nutzung..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bilder */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Bilder
                {hasBids && <span className="ml-2 text-sm text-gray-500">(Nur zusätzliche Bilder möglich)</span>}
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
                  {hasBids ? 'Laden Sie zusätzliche Bilder hoch' : 'Laden Sie bis zu 10 Bilder hoch (JPG, PNG, max. 5MB pro Bild)'}
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
                      
                      {!hasBids && (
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-white text-black rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-gray-100 border border-gray-300 shadow-sm"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Nachträgliche Information (nur wenn Gebote) */}
            {hasBids && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Nachträgliche Information
                </h2>
                <textarea
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  placeholder="Geben Sie hier nachträgliche Informationen ein, die dem System als 'Nachträgliche Information' gekennzeichnet werden..."
                />
              </div>
            )}

            {/* Beschreibung */}
            {!hasBids && (
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
                      placeholder="z.B. Rolex Submariner Date, 2020"
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
            )}

            {/* Booster-Auswahl */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Sparkles className="h-5 w-5 mr-2" />
                Booster auswählen
              </h2>
              
              {/* Aktueller Booster Anzeige */}
              {currentBooster !== 'none' && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md mb-4">
                  <p className="text-sm font-medium">
                    ✓ Aktuell aktiver Booster: <strong>{boosters.find(b => b.code === currentBooster)?.name || currentBooster}</strong>
                    {boosters.find(b => b.code === currentBooster) && (
                      <span className="ml-2">(CHF {boosters.find(b => b.code === currentBooster)!.price.toFixed(2)})</span>
                    )}
                  </p>
                  <p className="text-xs mt-1 text-green-700">
                    {boosters.find(b => b.code === currentBooster)?.description || `Aktiver Booster auf diesem Angebot (Code: ${currentBooster})`}
                  </p>
                  {!boosters.find(b => b.code === currentBooster) && (
                    <p className="text-xs mt-1 text-yellow-700 italic">
                      ⚠️ Dieser Booster ist aktuell nicht mehr verfügbar, bleibt aber auf diesem Angebot aktiv. Sie können einen anderen Booster auswählen.
                    </p>
                  )}
                </div>
              )}
              
              <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md mb-4">
                <p className="text-sm">
                  {selectedBooster !== currentBooster && selectedBooster !== 'none' 
                    ? 'Der ausgewählte Booster wird sofort aktiviert und berechnet, sobald Sie die Änderungen speichern.'
                    : selectedBooster === 'none' && currentBooster !== 'none'
                    ? 'Wenn Sie den Booster entfernen, wird keine Rückerstattung vorgenommen.'
                    : currentBooster === 'none'
                    ? 'Sie können einen Booster hinzufügen, um Ihr Angebot besser zu bewerben.'
                    : 'Sie können jederzeit auf einen teureren Booster upgraden.'}
                </p>
              </div>
              
              {boosters.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md mb-4">
                  <p className="text-sm">Lade verfügbare Booster...</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <label className={`relative flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedBooster === 'none'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}>
                  <input
                    type="radio"
                    name="booster"
                    value="none"
                    checked={selectedBooster === 'none'}
                    onChange={(e) => setSelectedBooster(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">Kein Booster</span>
                    <span className="text-sm text-gray-600">CHF 0.00</span>
                  </div>
                  <p className="text-sm text-gray-600">Standard-Anzeige ohne zusätzliche Features</p>
                </label>

                {boosters.length > 0 ? (
                  boosters.map((booster) => {
                    const isSelected = selectedBooster === booster.code
                    const isCurrent = currentBooster === booster.code
                    const currentBoosterPrice = boosters.find(b => b.code === currentBooster)?.price || 0
                    const isUpgrade = booster.price > currentBoosterPrice
                    const isDowngrade = booster.price < currentBoosterPrice && currentBooster !== 'none'
                    
                    return (
                      <label
                        key={booster.code}
                        className={`relative flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50'
                            : isCurrent
                            ? 'border-green-400 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="booster"
                          value={booster.code}
                          checked={isSelected}
                          onChange={(e) => setSelectedBooster(e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900 flex items-center">
                            {booster.name}
                            {isCurrent && (
                              <span className="ml-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                                AKTIV
                              </span>
                            )}
                          </span>
                          <span className="text-sm font-medium text-primary-600">
                            CHF {booster.price.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{booster.description}</p>
                        {isCurrent && (
                          <span className="text-xs text-green-600 font-medium">✓ Momentan auf diesem Angebot aktiv</span>
                        )}
                        {!isCurrent && isSelected && isUpgrade && (
                          <span className="text-xs text-blue-600 font-medium">
                            → Upgrade: Differenz von CHF {(booster.price - currentBoosterPrice).toFixed(2)} wird berechnet
                          </span>
                        )}
                        {!isCurrent && isSelected && isDowngrade && (
                          <span className="text-xs text-orange-600 font-medium">
                            ⚠️ Downgrade: Keine Rückerstattung, neuer Booster wird aktiviert
                          </span>
                        )}
                        {!isCurrent && isSelected && currentBooster === 'none' && (
                          <span className="text-xs text-blue-600 font-medium">
                            → Wird sofort aktiviert und berechnet (CHF {booster.price.toFixed(2)})
                          </span>
                        )}
                      </label>
                    )
                  })
                ) : (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    <p>Keine Booster verfügbar</p>
                  </div>
                )}
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
                    Änderungen speichern
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

