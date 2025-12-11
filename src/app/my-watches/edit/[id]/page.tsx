'use client'

import { CategoryFields } from '@/components/forms/CategoryFieldsNew'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Lock,
  Shield,
  Sparkles,
  Upload,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

/**
 * Bearbeitungsseite für Artikel
 *
 * Regeln:
 * - Wenn Gebote vorhanden: Nur Beschreibung und Bilder können ergänzt werden
 * - Wenn kein Kauf: Vollständige Bearbeitung möglich
 * - Gleiche Maske wie beim Erstellen
 */
export default function EditWatchPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const watchId = params.id as string

  const [isLoading, setIsLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [hasBids, setHasBids] = useState(false)
  const [hasActivePurchase, setHasActivePurchase] = useState(false)

  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0)
  const [titleImageIndex, setTitleImageIndex] = useState<number>(0)
  const [boosters, setBoosters] = useState<any[]>([])
  const [selectedBooster, setSelectedBooster] = useState<string>('none')
  const [currentBooster, setCurrentBooster] = useState<string>('none')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

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
    auctionStart: '',
    auctionEnd: '',
    auctionDuration: '',
    autoRenew: false,
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
    shippingMethods: [] as string[],
  })

  // Paste from clipboard support
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      const imageItems = Array.from(items).filter(item => item.type.startsWith('image/'))
      if (imageItems.length === 0) return

      e.preventDefault()

      for (const item of imageItems) {
        const file = item.getAsFile()
        if (!file) continue

        try {
          const { compressImage } = await import('@/lib/image-compression')
          const compressedImage = await compressImage(file, {
            maxWidth: 1600,
            maxHeight: 1600,
            quality: 0.75,
            maxSizeMB: 1.5,
          })

          setFormData(prev => ({
            ...prev,
            images: [...prev.images, compressedImage],
          }))

          toast.success('Bild aus Zwischenablage hinzugefügt.', {
            position: 'top-right',
            duration: 3000,
          })
        } catch (error) {
          console.error('Fehler beim Verarbeiten von Bild aus Zwischenablage:', error)
          toast.error('Fehler beim Verarbeiten des Bildes aus der Zwischenablage.', {
            position: 'top-right',
            duration: 4000,
          })
        }
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => {
      window.removeEventListener('paste', handlePaste)
    }
  }, [])

  // Lade Watch-Daten
  useEffect(() => {
    const loadWatch = async () => {
      if (!watchId || !session?.user) return

      try {
        setLoadingData(true)
        setError('')

        const res = await fetch(`/api/watches/${watchId}`)
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          throw new Error(errorData.message || 'Artikel nicht gefunden')
        }

        const data = await res.json()
        const watch = data.watch

        if (!watch) {
          throw new Error('Artikel nicht gefunden')
        }

        // Prüfe Status
        setHasBids(watch.bids && watch.bids.length > 0)

        // Prüfe ob aktiver Kauf vorhanden (lade zusätzlich Purchases und Sales)
        try {
          const resStatus = await fetch(`/api/watches/${watchId}/edit-status`)
          if (resStatus.ok) {
            const statusData = await resStatus.json()
            setHasActivePurchase(statusData.hasActivePurchase || false)
          }
        } catch (err) {
          console.error('Error checking purchase status:', err)
          // Fallback: Prüfe direkt über Watch-Daten
          // Wenn keine Purchases/Sales in der Antwort sind, nehmen wir an, dass keine vorhanden sind
        }

        // Lade Kategorie
        if (watch.categories && Array.isArray(watch.categories) && watch.categories.length > 0) {
          const primaryCategory = watch.categories[0]
          setSelectedCategory(primaryCategory.slug || '')
        }

        // Parse Bilder
        const images = Array.isArray(watch.images)
          ? watch.images
          : watch.images
            ? JSON.parse(watch.images)
            : []

        // Parse Booster
        let currentBoosterCode = 'none'
        if (watch.boosters) {
          try {
            const boosterArray =
              typeof watch.boosters === 'string' ? JSON.parse(watch.boosters) : watch.boosters
            if (Array.isArray(boosterArray) && boosterArray.length > 0) {
              currentBoosterCode = boosterArray[0]
            }
          } catch (e) {
            console.error('Error parsing boosters:', e)
          }
        }
        setCurrentBooster(currentBoosterCode)
        setSelectedBooster(currentBoosterCode)

        // Parse Versandmethoden
        let shippingMethods: string[] = []
        if (watch.shippingMethod) {
          try {
            const parsed =
              typeof watch.shippingMethod === 'string'
                ? JSON.parse(watch.shippingMethod)
                : watch.shippingMethod
            shippingMethods = Array.isArray(parsed) ? parsed : []
          } catch (e) {
            console.error('Error parsing shippingMethod:', e)
          }
        }

        // Berechne Auktionsdauer
        let auctionDuration = ''
        if (watch.auctionStart && watch.auctionEnd) {
          const start = new Date(watch.auctionStart)
          const end = new Date(watch.auctionEnd)
          const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
          if (diffDays > 0 && diffDays <= 30) {
            auctionDuration = diffDays.toString()
          }
        }

        // Setze Formular-Daten
        setFormData({
          brand: watch.brand || '',
          model: watch.model || '',
          referenceNumber: watch.referenceNumber || '',
          year: watch.year ? watch.year.toString() : '',
          condition: watch.condition || '',
          material: watch.material || '',
          movement: watch.movement || '',
          caseDiameter: watch.caseDiameter ? watch.caseDiameter.toString() : '',
          price: watch.price ? watch.price.toString() : '',
          buyNowPrice: watch.buyNowPrice ? watch.buyNowPrice.toString() : '',
          isAuction: watch.isAuction || false,
          auctionStart: watch.auctionStart
            ? new Date(watch.auctionStart).toISOString().slice(0, 16)
            : '',
          auctionEnd: watch.auctionEnd ? new Date(watch.auctionEnd).toISOString().slice(0, 16) : '',
          auctionDuration: auctionDuration,
          autoRenew: watch.autoRenew || false,
          lastRevision: watch.lastRevision
            ? new Date(watch.lastRevision).toISOString().slice(0, 10)
            : '',
          accuracy: watch.accuracy || '',
          fullset: watch.fullset || false,
          onlyBox: watch.box || false,
          onlyPapers: watch.papers || false,
          onlyAllLinks: (watch.box && watch.papers) || false,
          hasWarranty: !!watch.warranty,
          warrantyMonths: watch.warrantyMonths ? watch.warrantyMonths.toString() : '',
          warrantyYears: watch.warrantyYears ? watch.warrantyYears.toString() : '',
          hasSellerWarranty: !!watch.warrantyNote,
          sellerWarrantyMonths: watch.warrantyDescription?.match(/(\d+)\s*Monat/i)?.[1] || '',
          sellerWarrantyYears: watch.warrantyDescription?.match(/(\d+)\s*Jahr/i)?.[1] || '',
          sellerWarrantyNote: watch.warrantyNote || '',
          title: watch.title || '',
          description: watch.description || '',
          images: images,
          shippingMethods: shippingMethods,
        })

        setTitleImageIndex(0)
      } catch (err: any) {
        console.error('Error loading watch:', err)
        setError('Fehler beim Laden: ' + (err.message || 'Unbekannter Fehler'))
        toast.error('Fehler beim Laden des Artikels')
      } finally {
        setLoadingData(false)
      }
    }

    loadWatch()
  }, [watchId, session?.user])

  // Lade Booster
  useEffect(() => {
    const loadBoosters = async () => {
      try {
        const res = await fetch('/api/admin/boosters')
        if (res.ok) {
          const data = await res.json()
          const boostersArray = Array.isArray(data) ? data : data.boosters || []
          const filteredBoosters = boostersArray.filter(
            (booster: any) =>
              booster.code !== 'none' &&
              booster.name?.toLowerCase() !== 'kein booster' &&
              booster.name?.toLowerCase() !== 'no booster'
          )
          setBoosters(filteredBoosters)
        }
      } catch (error) {
        console.error('Error loading boosters:', error)
      }
    }
    loadBoosters()
  }, [])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target

    // Blockiere gesperrte Felder bei Geboten
    if (
      hasBids &&
      [
        'price',
        'buyNowPrice',
        'isAuction',
        'auctionDuration',
        'auctionStart',
        'auctionEnd',
        'autoRenew',
        'shippingMethods',
        'brand',
        'model',
        'condition',
        'title',
      ].includes(name)
    ) {
      toast.error('Dieses Feld kann bei vorhandenen Geboten nicht geändert werden.')
      return
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const processFiles = async (files: File[]) => {
    const newImages: string[] = []
    let processedCount = 0

    for (const file of files) {
      // Prüfe Dateityp - nur Bilder erlauben
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} ist kein Bild. Bitte wählen Sie nur Bilddateien aus.`, {
          position: 'top-right',
          duration: 4000,
        })
        continue
      }

      // Prüfe Dateigröße (max 10MB pro Bild vor Komprimierung)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} ist zu groß. Maximale Größe: 10MB`, {
          position: 'top-right',
          duration: 4000,
        })
        continue
      }

      try {
        // WICHTIG: Verwende Bildkomprimierung wie auf der Sell-Seite
        const { compressImage } = await import('@/lib/image-compression')

        // Aggressive Komprimierung um 413 Fehler zu vermeiden
        const compressedImage = await compressImage(file, {
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 0.75,
          maxSizeMB: 1.5,
        })

        // Prüfe finale Größe des komprimierten Bildes
        const base64SizeMB = (compressedImage.length * 3) / 4 / (1024 * 1024)
        if (base64SizeMB > 1.5) {
          console.warn(
            `Bild ${file.name} ist nach Komprimierung noch ${base64SizeMB.toFixed(2)}MB groß`
          )
          toast(
            `Bild ${file.name} ist sehr groß (${base64SizeMB.toFixed(2)}MB). Bitte verwenden Sie ein kleineres Bild.`,
            {
              icon: '⚠️',
              position: 'top-right',
              duration: 5000,
            }
          )
        }

        newImages.push(compressedImage)
        processedCount++

        // Wenn alle Dateien verarbeitet sind
        if (processedCount === files.length) {
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, ...newImages],
          }))

          if (newImages.length > 0) {
            toast.success(
              `${newImages.length} Bild${newImages.length > 1 ? 'er' : ''} hinzugefügt.`,
              {
                position: 'top-right',
                duration: 3000,
              }
            )
          }
        }
      } catch (error) {
        console.error('Fehler beim Komprimieren von Bild:', file.name, error)
        toast.error(`Fehler beim Verarbeiten von ${file.name}`, {
          position: 'top-right',
          duration: 4000,
        })
      }
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    // Reset input
    e.target.value = ''

    await processFiles(files)
  }

  const removeImage = (index: number) => {
    if (hasBids) {
      toast.error('Bilder können bei vorhandenen Geboten nicht entfernt werden')
      return
    }

    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))

    if (selectedImageIndex >= index) {
      setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))
    }
    if (titleImageIndex >= index) {
      setTitleImageIndex(Math.max(0, titleImageIndex - 1))
    }

    toast.success('Bild entfernt')
  }

  const setExclusiveSupply = (option: 'fullset' | 'onlyBox' | 'onlyPapers' | 'onlyAllLinks') => {
    if (hasBids) {
      toast.error('Lieferumfang kann bei vorhandenen Geboten nicht geändert werden')
      return
    }

    setFormData(prev => ({
      ...prev,
      fullset: option === 'fullset',
      onlyBox: option === 'onlyBox',
      onlyPapers: option === 'onlyPapers',
      onlyAllLinks: option === 'onlyAllLinks',
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Validierung
      if (!hasBids) {
        if (!formData.title || !formData.title.trim()) {
          setError('Bitte geben Sie einen Titel ein')
          setIsLoading(false)
          return
        }
        if (!formData.description || !formData.description.trim()) {
          setError('Bitte geben Sie eine Beschreibung ein')
          setIsLoading(false)
          return
        }
        if (!formData.condition) {
          setError('Bitte wählen Sie einen Zustand aus')
          setIsLoading(false)
          return
        }
        if (!formData.price || parseFloat(formData.price) <= 0) {
          toast.error('Bitte geben Sie einen gültigen Preis ein', {
            position: 'top-right',
            duration: 4000,
          })
          setIsLoading(false)
          return
        }

        // Validierung: Sofortkaufpreis muss höher sein als Verkaufspreis (falls angegeben)
        if (
          formData.buyNowPrice &&
          formData.price &&
          parseFloat(formData.buyNowPrice) > 0 &&
          parseFloat(formData.price) > 0 &&
          parseFloat(formData.buyNowPrice) <= parseFloat(formData.price)
        ) {
          toast.error('Der Sofortkaufpreis muss höher sein als der Verkaufspreis', {
            position: 'top-right',
            duration: 4000,
          })
          setIsLoading(false)
          return
        }
      }

      const response = await fetch(`/api/watches/${watchId}/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          booster: selectedBooster,
          category: selectedCategory,
          subcategory: selectedSubcategory,
        }),
      })

      if (response.ok) {
        toast.success('Angebot erfolgreich aktualisiert!')
        router.push('/my-watches')
        router.refresh()
      } else {
        const errorData = await response.json()
        const errorMessage = errorData.message || errorData.error || 'Ein Fehler ist aufgetreten'
        setError(errorMessage)
        toast.error(errorMessage)
      }
    } catch (err) {
      console.error('Error updating watch:', err)
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
      toast.error('Fehler beim Aktualisieren')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary-600" />
            <p className="text-gray-600">Lädt...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!session) {
    router.push('/login')
    return null
  }

  if (hasActivePurchase) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
            <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-600" />
            <h2 className="mb-4 text-2xl font-bold text-gray-900">Bearbeitung nicht möglich</h2>
            <p className="mb-6 text-gray-700">
              Das Angebot kann nicht mehr bearbeitet werden, da bereits ein Kauf stattgefunden hat.
            </p>
            <Link
              href="/my-watches"
              className="inline-flex items-center rounded-lg bg-primary-600 px-6 py-3 text-white hover:bg-primary-700"
            >
              Zurück zu Meine Angebote
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <Link
            href="/my-watches"
            className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            ← Zurück zu Meine Angebote
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Angebot bearbeiten</h1>
          <p className="text-gray-600">
            Bearbeiten Sie Ihr Angebot.{' '}
            {hasBids &&
              'Bei vorhandenen Geboten können nur Beschreibung und Bilder ergänzt werden.'}
          </p>
        </div>

        {hasBids && (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-start gap-3">
              <Lock className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
              <div>
                <p className="mb-1 font-semibold text-yellow-800">Wichtig: Gebote vorhanden</p>
                <p className="text-sm text-yellow-700">
                  Es existieren bereits Gebote auf dieses Angebot. Sie können nur noch die
                  Beschreibung ändern sowie zusätzliche Bilder hinzufügen. Preis, Auktionsdauer und
                  andere wichtige Felder sind gesperrt.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-center rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            <AlertCircle className="mr-2 h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="rounded-lg bg-white p-8 shadow-md">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Titel und Beschreibung */}
            <div>
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Artikel-Informationen</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Titel {!hasBids && '*'}
                  </label>
                  <input
                    type="text"
                    name="title"
                    required={!hasBids}
                    disabled={hasBids}
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                    placeholder="z.B. Rolex Submariner Date, 2020"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Beschreibung {!hasBids && '*'}
                    {hasBids && (
                      <span className="ml-2 text-xs font-normal text-gray-500">
                        (kann ergänzt werden)
                      </span>
                    )}
                  </label>
                  <textarea
                    name="description"
                    required={!hasBids}
                    rows={6}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Beschreiben Sie Ihren Artikel detailliert..."
                  />
                </div>
              </div>
            </div>

            {/* Kategorie-spezifische Felder */}
            {selectedCategory && !hasBids && (
              <CategoryFields
                category={selectedCategory}
                subcategory={selectedSubcategory}
                formData={formData}
                onChange={handleInputChange}
                disabled={hasBids}
              />
            )}

            {/* Preis und Verkaufsart */}
            {!hasBids && (
              <div>
                <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-900">
                  <Shield className="mr-2 h-5 w-5" />
                  Preis und Verkaufsart
                </h2>

                <div className="mb-6">
                  <label className="mb-3 block text-sm font-medium text-gray-700">
                    Verkaufsart *
                  </label>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label
                      className={`relative flex cursor-pointer rounded-lg border-2 p-4 transition-all ${
                        formData.isAuction
                          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                          : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="saleType"
                        checked={formData.isAuction}
                        onChange={() => setFormData(prev => ({ ...prev, isAuction: true }))}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                              <Clock className="h-5 w-5 text-primary-600" />
                              Auktion
                            </p>
                            <p className="mt-1 text-sm text-gray-600">Artikel wird versteigert</p>
                          </div>
                          {formData.isAuction && (
                            <CheckCircle className="ml-3 h-5 w-5 text-primary-600" />
                          )}
                        </div>
                      </div>
                    </label>

                    <label
                      className={`relative flex cursor-pointer rounded-lg border-2 p-4 transition-all ${
                        !formData.isAuction
                          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                          : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="saleType"
                        checked={!formData.isAuction}
                        onChange={() =>
                          setFormData(prev => ({
                            ...prev,
                            isAuction: false,
                            auctionDuration: '',
                            auctionStart: '',
                            autoRenew: false,
                          }))
                        }
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              Sofortkauf
                            </p>
                            <p className="mt-1 text-sm text-gray-600">
                              Artikel wird zu einem festen Preis verkauft
                            </p>
                          </div>
                          {!formData.isAuction && (
                            <CheckCircle className="ml-3 h-5 w-5 text-primary-600" />
                          )}
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      {formData.isAuction ? 'Startpreis (CHF) *' : 'Preis (CHF) *'}
                    </label>
                    <input
                      type="number"
                      name="price"
                      required
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="z.B. 5000"
                      step="0.01"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Sofortkaufpreis (CHF){' '}
                      <span className="text-xs font-normal text-gray-400">(Optional)</span>
                    </label>
                    <input
                      type="number"
                      name="buyNowPrice"
                      value={formData.buyNowPrice}
                      onChange={handleInputChange}
                      disabled={hasBids}
                      className={`w-full rounded-md border px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 ${
                        hasBids
                          ? 'cursor-not-allowed border-gray-300 bg-gray-100'
                          : formData.buyNowPrice &&
                              formData.price &&
                              parseFloat(formData.buyNowPrice) > 0 &&
                              parseFloat(formData.price) > 0 &&
                              parseFloat(formData.buyNowPrice) <= parseFloat(formData.price)
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-primary-500'
                      }`}
                      placeholder={formData.isAuction ? 'z.B. 8000 (optional)' : 'z.B. 8000'}
                      step="0.01"
                      min="0"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.isAuction
                        ? 'Falls leer gelassen, gibt es keinen Sofortkaufpreis. Käufer können nur bieten.'
                        : 'Optional: Falls leer, wird nur der normale Preis angezeigt.'}
                      {formData.buyNowPrice &&
                        parseFloat(formData.buyNowPrice) > 0 &&
                        formData.price &&
                        parseFloat(formData.price) > 0 &&
                        parseFloat(formData.buyNowPrice) <= parseFloat(formData.price) && (
                          <span className="mt-1 block text-red-600">
                            Der Sofortkaufpreis muss höher sein als der Verkaufspreis.
                          </span>
                        )}
                    </p>
                  </div>

                  {formData.isAuction && (
                    <>
                      <div>
                        <label
                          htmlFor="auctionDuration"
                          className="mb-2 block text-sm font-medium text-gray-700"
                        >
                          Auktionsdauer (Tage) *
                        </label>
                        <select
                          id="auctionDuration"
                          name="auctionDuration"
                          required={formData.isAuction}
                          value={formData.auctionDuration}
                          onChange={handleInputChange}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">Bitte wählen</option>
                          {[1, 2, 3, 5, 7, 10, 14, 21, 30].map(days => (
                            <option key={days} value={days}>
                              {days} Tag{days > 1 ? 'e' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="auctionStart"
                          className="mb-2 block text-sm font-medium text-gray-700"
                        >
                          Starttermin (optional)
                        </label>
                        <input
                          id="auctionStart"
                          type="datetime-local"
                          name="auctionStart"
                          value={formData.auctionStart}
                          onChange={handleInputChange}
                          min={new Date().toISOString().slice(0, 16)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            name="autoRenew"
                            checked={formData.autoRenew}
                            onChange={handleInputChange}
                            className="mr-3"
                          />
                          <span className="text-sm text-gray-700">
                            Automatisch verlängern, wenn keine Gebote vorhanden sind
                          </span>
                        </label>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Lieferumfang - NUR für Uhren & Schmuck */}
            {!hasBids && selectedCategory === 'uhren-schmuck' && (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-900">
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
                    <span className="text-sm font-medium text-gray-700">
                      Fullset (Box, Papiere, alle Glieder)
                    </span>
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
                    <span className="text-sm font-medium text-gray-700">Box und Papiere</span>
                  </label>
                </div>
              </div>
            )}

            {/* Garantie - NUR für Uhren & Schmuck */}
            {!hasBids && selectedCategory === 'uhren-schmuck' && (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-900">Garantie</h2>
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="hasWarranty"
                      checked={formData.hasWarranty}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Herstellergarantie vorhanden
                    </span>
                  </label>

                  {formData.hasWarranty && (
                    <div className="grid grid-cols-1 gap-6 pl-6 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Garantie in Monaten
                        </label>
                        <input
                          type="number"
                          name="warrantyMonths"
                          value={formData.warrantyMonths}
                          onChange={handleInputChange}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="z.B. 24"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Garantie in Jahren
                        </label>
                        <input
                          type="number"
                          name="warrantyYears"
                          value={formData.warrantyYears}
                          onChange={handleInputChange}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="z.B. 2"
                        />
                      </div>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="hasSellerWarranty"
                        checked={formData.hasSellerWarranty}
                        onChange={handleInputChange}
                        className="mr-3"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Garantie durch Verkäufer
                      </span>
                    </label>
                  </div>

                  {formData.hasSellerWarranty && (
                    <div className="grid grid-cols-1 gap-6 pl-6 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Verkäufer-Garantie in Monaten
                        </label>
                        <input
                          type="number"
                          name="sellerWarrantyMonths"
                          value={formData.sellerWarrantyMonths}
                          onChange={handleInputChange}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="z.B. 12"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Verkäufer-Garantie in Jahren
                        </label>
                        <input
                          type="number"
                          name="sellerWarrantyYears"
                          value={formData.sellerWarrantyYears}
                          onChange={handleInputChange}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="z.B. 1"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Bemerkungen zur Verkäufer-Garantie
                        </label>
                        <textarea
                          name="sellerWarrantyNote"
                          value={formData.sellerWarrantyNote}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="z.B. Garantie nur bei normaler Nutzung..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Versand */}
            {!hasBids && (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-900">Versand</h2>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.shippingMethods.includes('pickup')}
                      onChange={e => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            shippingMethods: [...prev.shippingMethods, 'pickup'],
                          }))
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            shippingMethods: prev.shippingMethods.filter(m => m !== 'pickup'),
                          }))
                        }
                      }}
                      className="mr-3"
                    />
                    <span className="text-sm font-medium text-gray-700">Abholung</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.shippingMethods.includes('b-post')}
                      onChange={e => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            shippingMethods: [...prev.shippingMethods, 'b-post'],
                          }))
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            shippingMethods: prev.shippingMethods.filter(m => m !== 'b-post'),
                          }))
                        }
                      }}
                      className="mr-3"
                    />
                    <span className="text-sm font-medium text-gray-700">B-Post</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.shippingMethods.includes('a-post')}
                      onChange={e => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            shippingMethods: [...prev.shippingMethods, 'a-post'],
                          }))
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            shippingMethods: prev.shippingMethods.filter(m => m !== 'a-post'),
                          }))
                        }
                      }}
                      className="mr-3"
                    />
                    <span className="text-sm font-medium text-gray-700">A-Post</span>
                  </label>
                </div>
              </div>
            )}

            {/* Bilder */}
            <div>
              <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-900">
                <Upload className="mr-2 h-5 w-5" />
                Bilder
                {hasBids && (
                  <span className="ml-2 text-sm text-gray-500">
                    (Nur zusätzliche Bilder möglich)
                  </span>
                )}
              </h2>

              {/* Verstecktes File Input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                aria-label="Bilder hochladen"
              />

              {/* Drag and Drop Zone - Anklickbar */}
              <div
                className={`relative mb-4 cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-all ${
                  isDragging
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-primary-50/50'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsDragging(true)
                }}
                onDragLeave={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsDragging(false)
                }}
                onDrop={async e => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsDragging(false)

                  const files = Array.from(e.dataTransfer.files).filter(file =>
                    file.type.startsWith('image/')
                  )
                  if (files.length > 0) {
                    await processFiles(files)
                  }
                }}
              >
                <Upload className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                <p className="text-sm font-medium text-gray-700">
                  {formData.images.length === 0
                    ? 'Klicken Sie hier oder ziehen Sie Bilder hierher'
                    : 'Klicken Sie hier oder ziehen Sie weitere Bilder hierher'}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {formData.images.length === 0
                    ? 'Titelbild hochladen (JPG, PNG, max. 10MB)'
                    : 'Weitere Bilder hinzufügen (JPG, PNG, max. 10MB pro Bild). Bis zu 10 Bilder insgesamt.'}
                </p>
              </div>

              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Bild ${index + 1}`}
                        className={`h-32 w-full cursor-pointer rounded-lg border-2 object-cover ${
                          index === titleImageIndex
                            ? 'border-primary-500 ring-2 ring-primary-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedImageIndex(index)}
                      />

                      <button
                        type="button"
                        onClick={() => setTitleImageIndex(index)}
                        className={`absolute left-2 top-2 rounded px-2 py-1 text-xs font-medium ${
                          index === titleImageIndex
                            ? 'bg-primary-500 text-white'
                            : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {index === titleImageIndex ? 'Titelbild' : 'Als Titelbild'}
                      </button>

                      {!hasBids && (
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 bg-white text-sm text-black shadow-sm hover:bg-gray-100"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Booster */}
            <div>
              <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-900">
                <Sparkles className="mr-2 h-5 w-5" />
                Booster auswählen
              </h2>

              {currentBooster !== 'none' && (
                <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800">
                  <p className="text-sm font-medium">
                    ✓ Aktuell aktiver Booster:{' '}
                    <strong>
                      {boosters.find(b => b.code === currentBooster)?.name || currentBooster}
                    </strong>
                    {boosters.find(b => b.code === currentBooster) && (
                      <span className="ml-2">
                        (CHF {boosters.find(b => b.code === currentBooster)!.price.toFixed(2)})
                      </span>
                    )}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <label
                  className={`relative flex cursor-pointer flex-col rounded-lg border-2 p-4 transition-all ${
                    selectedBooster === 'none'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="booster"
                    value="none"
                    checked={selectedBooster === 'none'}
                    onChange={e => setSelectedBooster(e.target.value)}
                    className="sr-only"
                  />
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-semibold text-gray-900">Kein Booster</span>
                    <span className="text-sm text-gray-600">CHF 0.00</span>
                  </div>
                  <p className="text-sm text-gray-600">Standard-Anzeige</p>
                </label>

                {boosters.map(booster => {
                  const isSelected = selectedBooster === booster.code
                  const isCurrent = currentBooster === booster.code

                  return (
                    <label
                      key={booster.code}
                      className={`relative flex cursor-pointer flex-col rounded-lg border-2 p-4 transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : isCurrent
                            ? 'border-green-400 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="booster"
                        value={booster.code}
                        checked={isSelected}
                        onChange={e => setSelectedBooster(e.target.value)}
                        className="sr-only"
                      />
                      <div className="mb-2 flex items-center justify-between">
                        <span className="flex items-center font-semibold text-gray-900">
                          {booster.name}
                          {isCurrent && (
                            <span className="ml-2 rounded-full bg-green-600 px-2 py-0.5 text-xs text-white">
                              AKTIV
                            </span>
                          )}
                        </span>
                        <span className="text-sm font-medium text-primary-600">
                          CHF {booster.price.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{booster.description}</p>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Submit */}
            <div className="border-t border-gray-200 pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center rounded-md bg-primary-600 px-4 py-3 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Clock className="mr-2 h-5 w-5 animate-spin" />
                    Wird gespeichert...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
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
