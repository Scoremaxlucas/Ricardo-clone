'use client'

import { CategoryFields } from '@/components/forms/CategoryFieldsNew'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { useLanguage } from '@/contexts/LanguageContext'
import { getCategoryConfig } from '@/data/categories'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Shield,
  Sparkles,
  Upload
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

// Lazy load AIDetection to avoid bundling TensorFlow.js on every page
const AIDetection = dynamic(
  () => import('@/components/forms/AIDetection').then(mod => ({ default: mod.AIDetection })),
  {
    ssr: false,
    loading: () => <div className="p-4 text-center text-gray-500">Lade KI-Erkennung...</div>,
  }
)

export default function SellPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null)
  const [verificationInProgress, setVerificationInProgress] = useState(false)

  // Reset verificationInProgress beim Laden
  useEffect(() => {
    setVerificationInProgress(false)
  }, [])
  const [isCheckingVerification, setIsCheckingVerification] = useState(true)

  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0)
  const [titleImageIndex, setTitleImageIndex] = useState<number>(0)
  const [boosters, setBoosters] = useState<any[]>([])
  const [selectedBooster, setSelectedBooster] = useState<string>('none')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('')
  const [detectedProductName, setDetectedProductName] = useState<string>('')
  const [detectedConfidence, setDetectedConfidence] = useState<number>(0)
  const [showAIDetection, setShowAIDetection] = useState<boolean>(true)
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

    // Artikel-spezifische Details (für Uhren & Schmuck)
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
    video: null as string | null,
  })

  // Exklusive Auswahl für Lieferumfang (nur eine Option aktiv)
  const setExclusiveSupply = (option: 'fullset' | 'onlyBox' | 'onlyPapers' | 'onlyAllLinks') => {
    setFormData(prev => ({
      ...prev,
      fullset: option === 'fullset',
      onlyBox: option === 'onlyBox',
      onlyPapers: option === 'onlyPapers',
      onlyAllLinks: option === 'onlyAllLinks',
    }))
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
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
        shippingMethods: currentMethods,
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
            images: [...prev.images, ...newImages],
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
          video: reader.result as string,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = (index: number) => {
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
  }

  const removeVideo = () => {
    setFormData(prev => ({
      ...prev,
      video: null,
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
            const isApproved = data.verified === true && data.verificationStatus === 'approved'
            setIsVerified(isApproved)
            setVerificationStatus(data.verificationStatus || null)

            // Prüfe ob Verifizierung in Bearbeitung ist (nur wenn explizit pending)
            // Nur wenn verificationStatus explizit 'pending' ist, zeigen wir "in Bearbeitung"
            // Wenn kein Status vorhanden ist (null, undefined, oder leer), zeige "Jetzt verifizieren"
            console.log('Verification status check:', {
              verificationStatus: data.verificationStatus,
              verified: data.verified,
              isApproved,
              willSetInProgress: data.verificationStatus === 'pending',
            })

            if (data.verificationStatus === 'pending') {
              setVerificationInProgress(true)
            } else {
              // Keine Verifizierung eingereicht - zeige "Jetzt verifizieren" Button
              setVerificationInProgress(false)
            }
          } else {
            // Falls API-Fehler, zeige "Jetzt verifizieren"
            console.log('API error, setting verificationInProgress to false')
            setVerificationInProgress(false)
            setIsVerified(false)
          }
        } catch (error) {
          console.error('Error loading verification status:', error)
        } finally {
          setIsCheckingVerification(false)
        }
      } else {
        setIsCheckingVerification(false)
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

    // Client-seitige Validierung
    if (!formData.title || !formData.title.trim()) {
      toast.error('Bitte geben Sie einen Titel ein', {
        position: 'top-right',
        duration: 4000,
      })
      setIsLoading(false)
      return
    }

    if (!formData.description || !formData.description.trim()) {
      toast.error('Bitte geben Sie eine Beschreibung ein', {
        position: 'top-right',
        duration: 4000,
      })
      setIsLoading(false)
      return
    }

    if (!formData.condition) {
      toast.error('Bitte wählen Sie einen Zustand aus', {
        position: 'top-right',
        duration: 4000,
      })
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

    if (!formData.shippingMethods || formData.shippingMethods.length === 0) {
      toast.error('Bitte wählen Sie mindestens eine Lieferart aus', {
        position: 'top-right',
        duration: 4000,
      })
      setIsLoading(false)
      return
    }

    if (!formData.images || formData.images.length === 0) {
      toast.error('Bitte laden Sie mindestens ein Bild hoch', {
        position: 'top-right',
        duration: 4000,
      })
      setIsLoading(false)
      return
    }

    // Auktion-Validierung
    if (formData.isAuction) {
      if (
        !formData.auctionDuration ||
        parseInt(formData.auctionDuration) < 1 ||
        parseInt(formData.auctionDuration) > 30
      ) {
        toast.error('Bitte wählen Sie eine gültige Auktionsdauer (1-30 Tage)', {
          position: 'top-right',
          duration: 4000,
        })
        setIsLoading(false)
        return
      }
    }

    try {
      // Bereinige description: Stelle sicher, dass es ein String ist und keine Bilder enthält
      let cleanDescription = ''
      if (formData.description) {
        if (Array.isArray(formData.description)) {
          // Filtere nur Text-Elemente heraus (keine Base64-Strings)
          cleanDescription = formData.description
            .filter((item: any) => {
              if (typeof item !== 'string') return false
              // Entferne Base64-encoded Bilder
              return (
                !item.startsWith('data:image/') &&
                !item.startsWith('data:video/') &&
                !item.startsWith('iVBORw0KGgo') &&
                item.length < 10000
              )
            })
            .join(' ')
            .trim()
        } else if (typeof formData.description === 'string') {
          // Prüfe ob es ein Base64-String ist
          if (
            formData.description.startsWith('data:image/') ||
            formData.description.startsWith('data:video/') ||
            formData.description.startsWith('iVBORw0KGgo') ||
            formData.description.length > 10000
          ) {
            cleanDescription = ''
          } else {
            cleanDescription = formData.description.trim()
          }
        }
      }

      // Stelle sicher, dass images ein Array von Bildern ist
      let cleanImages: string[] = []
      if (formData.images && Array.isArray(formData.images)) {
        cleanImages = formData.images.filter((img: any) => {
          return (
            typeof img === 'string' &&
            (img.startsWith('data:image/') ||
              img.startsWith('http://') ||
              img.startsWith('https://'))
          )
        })
      }

      // Falls description Bilder enthält, füge sie zu images hinzu
      if (formData.description && Array.isArray(formData.description)) {
        const descriptionImages = formData.description.filter((item: any) => {
          return (
            typeof item === 'string' &&
            (item.startsWith('data:image/') ||
              item.startsWith('http://') ||
              item.startsWith('https://') ||
              item.startsWith('iVBORw0KGgo') ||
              item.length > 10000)
          )
        })
        cleanImages = [...cleanImages, ...descriptionImages]
      } else if (formData.description && typeof formData.description === 'string') {
        if (
          formData.description.startsWith('data:image/') ||
          formData.description.startsWith('http://') ||
          formData.description.startsWith('https://') ||
          formData.description.startsWith('iVBORw0KGgo') ||
          formData.description.length > 10000
        ) {
          cleanImages.push(formData.description)
        }
      }

      // Entferne Duplikate
      cleanImages = Array.from(new Set(cleanImages))

      console.log('Cleaned data before sending:', {
        descriptionLength: cleanDescription.length,
        imagesCount: cleanImages.length,
        originalDescriptionType: typeof formData.description,
        originalDescriptionIsArray: Array.isArray(formData.description),
      })

      // Erstelle ein sauberes Objekt OHNE formData zu spreaden (verhindert, dass Bilder mitkommen)
      const cleanPayload = {
        brand: formData.brand || '',
        model: formData.model || '',
        referenceNumber: formData.referenceNumber || '',
        year: formData.year || '',
        condition: formData.condition || '',
        material: formData.material || '',
        movement: formData.movement || '',
        caseDiameter: formData.caseDiameter || '',
        price: formData.price || '',
        buyNowPrice: formData.buyNowPrice || '',
        isAuction: formData.isAuction || false,
        auctionEnd: formData.auctionEnd || '',
        auctionStart: formData.auctionStart || '',
        auctionDuration: formData.auctionDuration || '',
        autoRenew: formData.autoRenew || false,
        shippingMethods: formData.shippingMethods || [],
        lastRevision: formData.lastRevision || '',
        accuracy: formData.accuracy || '',
        fullset: formData.fullset || false,
        onlyBox: formData.onlyBox || false,
        onlyPapers: formData.onlyPapers || false,
        onlyAllLinks: formData.onlyAllLinks || false,
        hasWarranty: formData.hasWarranty || false,
        warrantyMonths: formData.warrantyMonths || '',
        warrantyYears: formData.warrantyYears || '',
        hasSellerWarranty: formData.hasSellerWarranty || false,
        sellerWarrantyMonths: formData.sellerWarrantyMonths || '',
        sellerWarrantyYears: formData.sellerWarrantyYears || '',
        sellerWarrantyNote: formData.sellerWarrantyNote || '',
        title: formData.title || '',
        description: cleanDescription, // GARANTIERT bereinigt
        images: cleanImages, // GARANTIERT bereinigt
        video: formData.video || null,
        booster: selectedBooster !== 'none' ? selectedBooster : undefined,
        category: selectedCategory || '',
        subcategory: selectedSubcategory || '',
      }

      console.log('Final payload check:', {
        descriptionType: typeof cleanPayload.description,
        descriptionIsArray: Array.isArray(cleanPayload.description),
        descriptionLength: cleanPayload.description.length,
        imagesType: Array.isArray(cleanPayload.images),
        imagesCount: cleanPayload.images.length,
      })

      // Reale Erstellung des Artikels
      const response = await fetch('/api/watches/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanPayload),
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess('Artikel erfolgreich zum Verkauf angeboten!')

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
          video: null,
        })
        setTitleImageIndex(0)

        // Erfolg anzeigen und dann weiterleiten
        setTimeout(() => {
          router.push('/')
        }, 1500)
      } else {
        try {
          const errorData = await response.json()
          toast.error(errorData.message || 'Ein Fehler ist aufgetreten', {
            position: 'top-right',
            duration: 5000,
          })
          if (errorData.error) {
            console.error('Server error details:', errorData.error)
          }
        } catch (parseError) {
          toast.error(`Server-Fehler (Status: ${response.status}). Bitte versuchen Sie es erneut.`, {
            position: 'top-right',
            duration: 5000,
          })
        }
      }
    } catch (err: any) {
      console.error('Error submitting form:', err)
      toast.error(
        `Ein Fehler ist aufgetreten: ${err?.message || 'Unbekannter Fehler'}. Bitte versuchen Sie es erneut.`,
        {
          position: 'top-right',
          duration: 5000,
        }
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center">{t.selling.loading}</div>
  }

  if (!session) {
    const currentUrl =
      typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/sell'
    router.push(`/login?callbackUrl=${encodeURIComponent(currentUrl)}`)
    return null
  }

  // Zeige Loading während Verifizierungsstatus geprüft wird
  if (isCheckingVerification) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary-600" />
            <p className="text-gray-600">{t.selling.loading}</p>
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
            ← {t.selling.backToMySelling}
          </Link>
        </div>
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-gray-900">{t.selling.offerForSale}</h1>
              <p className="text-gray-600">{t.selling.selectCategoryInstructions}</p>
            </div>
          </div>
        </div>

        {/* Verifizierungs-Banner */}
        {isVerified === false && (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5 text-yellow-600" />
                <div>
                  {verificationInProgress ? (
                    <>
                      <p className="font-medium text-yellow-800">
                        {t.selling.validationInProgress}
                      </p>
                      <p className="mt-1 text-sm text-yellow-700">
                        {t.selling.verificationPendingFull}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-yellow-800">
                        {t.selling.verificationRequired}
                      </p>
                      <p className="mt-1 text-sm text-yellow-700">
                        {t.selling.verificationRequiredDesc}
                      </p>
                    </>
                  )}
                </div>
              </div>
              <Link
                href="/verification"
                className="whitespace-nowrap rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
              >
                {verificationInProgress ? t.common.view : t.selling.verifyNow}
              </Link>
            </div>
          </div>
        )}


        {success && (
          <div className="mb-6 flex items-center rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-700">
            <CheckCircle className="mr-2 h-5 w-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Formular nur anzeigen wenn verifiziert */}
        {isVerified === false ? (
          <div className="rounded-lg bg-white p-12 text-center shadow-md">
            <AlertCircle className="mx-auto mb-6 h-20 w-20 text-yellow-600" />
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              {t.selling.verificationRequired}
            </h2>
            <p className="mb-2 text-lg text-gray-600">
              {verificationInProgress
                ? t.selling.verificationPendingFull
                : t.selling.verificationRequiredDesc}
            </p>
            {verificationInProgress && (
              <p className="mb-6 text-sm text-yellow-700">{t.selling.verificationPending}</p>
            )}
            <Link
              href="/verification"
              className="inline-flex items-center rounded-lg bg-yellow-600 px-8 py-3 text-lg font-medium text-white transition-colors hover:bg-yellow-700"
            >
              <Shield className="mr-2 h-6 w-6" />
              {verificationInProgress ? t.common.view : t.selling.verifyNow}
            </Link>
          </div>
        ) : (
          <div className="rounded-lg bg-white p-8 shadow-md">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* KI-Erkennung (Bild oder Text) */}
              {showAIDetection && !selectedCategory ? (
                <AIDetection
                  onCategoryDetected={async (
                    category,
                    subcategory,
                    productName,
                    imageUrl,
                    confidence
                  ) => {
                    console.log(
                      '🎯 KI erkannt:',
                      productName,
                      '| Kategorie:',
                      category,
                      '| Unterkategorie:',
                      subcategory,
                      '| Konfidenz:',
                      confidence + '%'
                    )
                    // NUR Kategorie setzen, KEINE automatische Ausfüllung von Titel/Beschreibung
                    setSelectedCategory(category)
                    setSelectedSubcategory(subcategory)
                    setDetectedProductName(productName)
                    setDetectedConfidence(confidence)

                    // Falls Bild vorhanden, füge es nur zu images hinzu (KEIN automatischer Titel)
                    if (imageUrl) {
                      console.log('[sell/page] Bild erhalten von KI:', imageUrl.substring(0, 50) + '...')
                      const currentImages = formData.images || []
                      const isNewImage = !currentImages.includes(imageUrl)

                      console.log('[sell/page] Aktuelle Bilder:', currentImages.length, 'Neues Bild:', isNewImage)

                      if (isNewImage) {
                        // Neues Bild hinzufügen
                        const newImages = [...currentImages, imageUrl]
                        console.log('[sell/page] Füge Bild hinzu, neue Anzahl:', newImages.length)
                        setFormData(prev => ({
                          ...prev,
                          images: newImages,
                        }))
                        // Setze das neue Bild automatisch als Titelbild (letztes Bild in der Liste)
                        setTitleImageIndex(newImages.length - 1)
                        console.log('[sell/page] Titelbild-Index gesetzt auf:', newImages.length - 1)
                      } else {
                        // Bild bereits vorhanden - setze es als Titelbild
                        const existingIndex = currentImages.indexOf(imageUrl)
                        if (existingIndex !== -1) {
                          setTitleImageIndex(existingIndex)
                          console.log('[sell/page] Titelbild-Index gesetzt auf vorhandenes Bild:', existingIndex)
                        }
                      }
                    } else {
                      console.warn('[sell/page] Kein Bild-URL von KI erhalten!')
                    }

                    // PREISVORSCHLAG
                    try {
                      const priceResponse = await fetch('/api/ai/suggest-price', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          category,
                          subcategory,
                          brand: formData.brand,
                          model: formData.model,
                          condition: formData.condition,
                          year: formData.year,
                        }),
                      })
                      if (priceResponse.ok) {
                        const priceData = await priceResponse.json()
                        if (priceData.suggestedPrice) {
                          setFormData(prev => ({
                            ...prev,
                            price: priceData.suggestedPrice.toString(),
                          }))
                          console.log('✅ Preisvorschlag:', priceData.suggestedPrice, 'CHF')
                          if (priceData.message) {
                            setSuccess(
                              `KI-Vorschlag: ${priceData.suggestedPrice.toLocaleString('de-CH')} CHF (${priceData.message})`
                            )
                            setTimeout(() => setSuccess(''), 5000)
                          }
                        }
                      }
                    } catch (error) {
                      console.error('Fehler bei Preisvorschlag:', error)
                    }

                    setShowAIDetection(false)
                  }}
                />
              ) : selectedCategory ? (
                <>
                  {/* Gewählte Kategorie anzeigen mit KI-Info */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border border-primary-200 bg-primary-50 p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Kategorie:</span>
                        {selectedCategory &&
                          (() => {
                            const config = getCategoryConfig(selectedCategory)
                            const IconComponent = config.icon
                            return (
                              <div className="flex items-center gap-2">
                                <div
                                  className="flex h-6 w-6 items-center justify-center rounded"
                                  style={{ backgroundColor: '#0f766e' }}
                                >
                                  <IconComponent className="h-4 w-4 text-white" />
                                </div>
                                <span className="font-semibold text-primary-700">
                                  {config.name}
                                </span>
                              </div>
                            )
                          })()}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory('')
                          setSelectedSubcategory('')
                          setDetectedProductName('')
                          setShowAIDetection(true)
                          setDetectedConfidence(0)
                          // Bild und Titel bleiben erhalten
                        }}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        Kategorie neu erkennen
                      </button>
                    </div>

                    {/* KI-Erkennungs-Info mit allen Features */}
                    {detectedConfidence > 0 && (
                      <div className="rounded-lg border border-primary-200 bg-primary-50 p-4">
                        <div className="flex items-start gap-3">
                          <Sparkles className="mt-0.5 h-6 w-6 flex-shrink-0 text-green-600" />
                          <div className="flex-1">
                            <p className="mb-2 font-semibold text-gray-900">
                              Helvenda AI aktiviert
                            </p>
                            <div className="space-y-2 text-sm text-gray-700">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span>
                                  <span className="font-medium">Erkannt:</span>{' '}
                                  {detectedProductName}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span>
                                  <span className="font-medium">Unterkategorie:</span>{' '}
                                  {selectedSubcategory}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span>
                                  <span className="font-medium">Konfidenz:</span>{' '}
                                  <span
                                    className={`font-semibold ${
                                      detectedConfidence >= 90
                                        ? 'text-green-600'
                                        : detectedConfidence >= 80
                                          ? 'text-blue-600'
                                          : 'text-yellow-600'
                                    }`}
                                  >
                                    {detectedConfidence}%
                                  </span>
                                </span>
                              </div>
                              {formData.description && (
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-blue-600" />
                                  <span>
                                    <span className="font-medium">Beschreibung:</span> Automatisch
                                    generiert
                                  </span>
                                </div>
                              )}
                              {formData.price && (
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-purple-600" />
                                  <span>
                                    <span className="font-medium">Preis:</span> KI-Vorschlag:{' '}
                                    {parseFloat(formData.price).toLocaleString('de-CH')} CHF
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Titel und Beschreibung ZUERST */}
                  <div>
                    <h2 className="mb-4 text-xl font-semibold text-gray-900">
                      Artikel-Informationen
                    </h2>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <div className="mb-2 flex items-center justify-between">
                          <label className="block text-sm font-medium text-gray-700">
                            Titel *
                          </label>
                          {formData.images.length > 0 && (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  setIsLoading(true)
                                  const imageBase64 = formData.images[0]
                                  const response = await fetch('/api/ai/generate-title', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      imageBase64,
                                      category: selectedCategory,
                                      subcategory: selectedSubcategory,
                                    }),
                                  })
                                  if (response.ok) {
                                    const data = await response.json()
                                    if (data.title) {
                                      setFormData(prev => ({ ...prev, title: data.title }))
                                    }
                                  }
                                } catch (error) {
                                  console.error('Fehler bei Titel-Generierung:', error)
                                } finally {
                                  setIsLoading(false)
                                }
                              }}
                              disabled={isLoading}
                              className="flex items-center gap-1 rounded-md bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-100 disabled:opacity-50"
                            >
                              <Sparkles className="h-3 w-3" />
                              {isLoading ? 'Generiere...' : 'KI-Titel generieren'}
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          name="title"
                          required
                          value={formData.title}
                          onChange={handleInputChange}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-primary-500"
                          placeholder={
                            selectedCategory === 'auto-motorrad'
                              ? 'z.B. VW Golf 8 GTI 2.0 TSI'
                              : selectedCategory === 'fahrzeugzubehoer'
                                ? 'z.B. Thule Dachbox Pacific 780'
                                : selectedCategory === 'computer-netzwerk'
                                  ? 'z.B. MacBook Pro 16" M3 Max 1TB'
                                  : selectedCategory === 'handy-telefon'
                                    ? 'z.B. iPhone 15 Pro 256GB Spacegrau'
                                    : selectedCategory === 'foto-optik'
                                      ? 'z.B. Canon EOS R5 mit 24-70mm Objektiv'
                                      : selectedCategory === 'games-konsolen'
                                        ? 'z.B. PlayStation 5 Digital Edition'
                                        : selectedCategory === 'kleidung-accessoires'
                                          ? 'z.B. Hugo Boss Anzug Dunkelblau Größe 50'
                                          : selectedCategory === 'uhren-schmuck'
                                            ? 'z.B. Rolex Submariner 126610LN'
                                            : selectedCategory === 'kosmetik-pflege'
                                              ? 'z.B. Chanel No. 5 Eau de Parfum 100ml'
                                              : selectedCategory === 'haushalt-wohnen'
                                                ? 'z.B. IKEA Sofa Ektorp 3-Sitzer Grau'
                                                : selectedCategory === 'handwerk-garten'
                                                  ? 'z.B. Bosch Akku-Bohrschrauber 18V'
                                                  : selectedCategory === 'sport'
                                                    ? 'z.B. Trek E-Bike Powerfly 5 2023'
                                                    : selectedCategory === 'kind-baby'
                                                      ? 'z.B. Bugaboo Fox Kinderwagen Komplett-Set'
                                                      : selectedCategory === 'buecher'
                                                        ? 'z.B. Harry Potter Komplett-Box Hardcover'
                                                        : selectedCategory === 'filme-serien'
                                                          ? 'z.B. Breaking Bad Complete Series Blu-ray'
                                                          : selectedCategory === 'musik-instrumente'
                                                            ? 'z.B. Fender Stratocaster E-Gitarre'
                                                            : selectedCategory ===
                                                                'sammeln-seltenes'
                                                              ? 'z.B. Antike Vase Ming-Dynastie'
                                                              : selectedCategory === 'muenzen'
                                                                ? 'z.B. Schweizer Goldvreneli 1935'
                                                                : selectedCategory ===
                                                                    'spielzeug-basteln'
                                                                  ? 'z.B. LEGO Technic Porsche 911 GT3 RS'
                                                                  : selectedCategory ===
                                                                      'modellbau-hobby'
                                                                    ? 'z.B. Märklin H0 Starterset Digital'
                                                                    : selectedCategory ===
                                                                        'tierzubehoer'
                                                                      ? 'z.B. Hundebox Größe L'
                                                                      : selectedCategory ===
                                                                          'wein-genuss'
                                                                        ? 'z.B. Château Margaux 2015 Rotwein'
                                                                        : selectedCategory ===
                                                                            'tickets-gutscheine'
                                                                          ? 'z.B. 2× Ed Sheeran Konzert Zürich'
                                                                          : selectedCategory ===
                                                                              'buero-gewerbe'
                                                                            ? 'z.B. Canon Kopierer imageRUNNER'
                                                                            : selectedCategory ===
                                                                                'immobilien'
                                                                              ? 'z.B. 3.5-Zimmer-Wohnung Zürich Seefeld'
                                                                              : selectedCategory ===
                                                                                  'jobs-karriere'
                                                                                ? 'z.B. Software Engineer Vollzeit Zürich'
                                                                                : selectedCategory ===
                                                                                    'dienstleistungen'
                                                                                  ? 'z.B. Umzugsservice Zürich und Umgebung'
                                                                                  : selectedCategory ===
                                                                                      'camping-outdoor'
                                                                                    ? 'z.B. Coleman 4-Personen Zelt'
                                                                                    : selectedCategory ===
                                                                                        'wellness-gesundheit'
                                                                                      ? 'z.B. Beurer Massagegerät MG 159'
                                                                                      : selectedCategory ===
                                                                                          'reise-urlaub'
                                                                                        ? 'z.B. Reiseführer Thailand 2024'
                                                                                        : selectedCategory ===
                                                                                            'garten-pflanzen'
                                                                                          ? 'z.B. Tomatensamen Bio-Sorten'
                                                                                          : selectedCategory ===
                                                                                              'boote-schiffe'
                                                                                            ? 'z.B. Bavaria 40 Segelyacht'
                                                                                            : selectedCategory ===
                                                                                                'tiere'
                                                                                              ? 'z.B. Golden Retriever Welpe'
                                                                                              : selectedCategory ===
                                                                                                  'lebensmittel'
                                                                                                ? 'z.B. Bio-Honig aus der Region'
                                                                                                : selectedCategory ===
                                                                                                    'medizin-gesundheit'
                                                                                                  ? 'z.B. Rollator mit Bremsen'
                                                                                                  : selectedCategory ===
                                                                                                      'flugzeuge'
                                                                                                    ? 'z.B. Cessna 172 Flugzeug'
                                                                                                    : selectedCategory ===
                                                                                                        'smart-home'
                                                                                                      ? 'z.B. Philips Hue Starter Set'
                                                                                                      : selectedCategory ===
                                                                                                          'elektrogeraete'
                                                                                                        ? 'z.B. Küchenmaschine KitchenAid'
                                                                                                        : selectedCategory ===
                                                                                                            'baustoffe'
                                                                                                          ? 'z.B. Dämmstoff 10cm 20m²'
                                                                                                          : selectedCategory ===
                                                                                                              'kunst-handwerk'
                                                                                                            ? 'z.B. Handgemachte Keramik-Vase'
                                                                                                            : 'z.B. Beschreibender Titel Ihres Artikels'
                          }
                        />
                      </div>

                      <div className="md:col-span-2">
                        <div className="mb-2 flex items-center justify-between">
                          <label className="block text-sm font-medium text-gray-700">
                            Beschreibung *
                          </label>
                          <div className="flex items-center gap-2">
                            {(formData.images.length > 0 || formData.title) && (
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    setIsLoading(true)
                                    const imageBase64 = formData.images.length > 0 ? formData.images[0] : null
                                    const response = await fetch('/api/ai/generate-description', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        title: formData.title,
                                        category: selectedCategory,
                                        subcategory: selectedSubcategory,
                                        brand: formData.brand,
                                        model: formData.model,
                                        condition: formData.condition,
                                        imageBase64,
                                      }),
                                    })
                                    if (response.ok) {
                                      const data = await response.json()
                                      if (data.description) {
                                        // Bereinige description
                                        let cleanDesc = ''
                                        if (typeof data.description === 'string') {
                                          cleanDesc = data.description.trim()
                                        }
                                        if (cleanDesc) {
                                          setFormData(prev => ({ ...prev, description: cleanDesc }))
                                        }
                                      }
                                    }
                                  } catch (error) {
                                    console.error('Fehler bei Beschreibungs-Generierung:', error)
                                  } finally {
                                    setIsLoading(false)
                                  }
                                }}
                                disabled={isLoading}
                                className="flex items-center gap-1 rounded-md bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-100 disabled:opacity-50"
                              >
                                <Sparkles className="h-3 w-3" />
                                {isLoading ? 'Generiere...' : 'KI-Beschreibung generieren'}
                              </button>
                            )}
                          </div>
                        </div>
                        <textarea
                          name="description"
                          required
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={6}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-primary-500"
                          placeholder={
                            selectedCategory === 'auto-motorrad'
                              ? 'z.B. Gepflegter VW Golf 8 GTI, Erstzulassung 2021, 45.000 km, Vollausstattung, Scheckheft gepflegt...'
                              : selectedCategory === 'fahrzeugzubehoer'
                                ? 'z.B. Thule Dachbox Pacific 780, schwarz matt. Neuwertig, nur 2x verwendet. Inklusive Befestigungssystem...'
                                : selectedCategory === 'computer-netzwerk'
                                  ? 'z.B. MacBook Pro 16" mit M3 Max Chip und 1TB SSD. Gekauft 2024, noch 1 Jahr AppleCare. Keine Gebrauchsspuren...'
                                  : selectedCategory === 'handy-telefon'
                                    ? 'z.B. iPhone 15 Pro 256GB Spacegrau. Originalverpackung komplett, 6 Monate alt, keine Kratzer...'
                                    : selectedCategory === 'foto-optik'
                                      ? 'z.B. Canon EOS R5 mit 24-70mm Objektiv. Wenig benutzt, technisch einwandfrei. Mit Tasche und Filter...'
                                      : selectedCategory === 'games-konsolen'
                                        ? 'z.B. PlayStation 5 Digital Edition mit 2 Controllern. 6 Monate alt, mit Rechnung und OVP...'
                                        : selectedCategory === 'kleidung-accessoires'
                                          ? 'z.B. Hugo Boss Anzug Dunkelblau, Größe 50. Chemisch gereinigt, perfekter Zustand. Schurwolle...'
                                          : selectedCategory === 'uhren-schmuck'
                                            ? 'z.B. Rolex Submariner 126610LN aus 2022. Fullset mit Box, Papieren und Kaufbeleg. Wie neu...'
                                            : selectedCategory === 'kosmetik-pflege'
                                              ? 'z.B. Chanel No. 5 Eau de Parfum 100ml. Originalverpackt, ungeöffnet. Geschenk erhalten...'
                                              : selectedCategory === 'haushalt-wohnen'
                                                ? 'z.B. IKEA Sofa Ektorp 3-Sitzer Grau. Gepflegt, abnehmbarer Bezug. Nur Abholung möglich...'
                                                : selectedCategory === 'handwerk-garten'
                                                  ? 'z.B. Bosch Akku-Bohrschrauber 18V mit 2 Akkus. Wenig genutzt, volle Leistung...'
                                                  : selectedCategory === 'sport'
                                                    ? 'z.B. Trek E-Bike Powerfly 5, Akku 500Wh, 28 Zoll. 2023er Modell, wenig gefahren...'
                                                    : selectedCategory === 'kind-baby'
                                                      ? 'z.B. Bugaboo Fox Kinderwagen, Farbe Grau. Komplett-Set mit Babywanne. Sehr gepflegt...'
                                                      : selectedCategory === 'buecher'
                                                        ? 'z.B. Harry Potter Komplettbox, 7 Bände Hardcover. Sehr guter Zustand, deutsche Ausgabe...'
                                                        : selectedCategory === 'filme-serien'
                                                          ? 'z.B. Breaking Bad Complete Series Blu-ray. Alle Staffeln, deutsche und englische Tonspur...'
                                                          : selectedCategory === 'musik-instrumente'
                                                            ? 'z.B. Fender Stratocaster E-Gitarre American Standard. Vintage 1982, top Zustand...'
                                                            : selectedCategory ===
                                                                'sammeln-seltenes'
                                                              ? 'z.B. Antike chinesische Vase Ming-Dynastie. Mit Echtheitszertifikat, Höhe 45cm...'
                                                              : selectedCategory === 'muenzen'
                                                                ? 'z.B. Schweizer Goldvreneli 1935. Vorzügliche Erhaltung, mit Schutzhülle...'
                                                                : selectedCategory ===
                                                                    'spielzeug-basteln'
                                                                  ? 'z.B. LEGO Technic Porsche 911 GT3 RS. Komplett mit OVP, alle Teile vorhanden...'
                                                                  : selectedCategory ===
                                                                      'modellbau-hobby'
                                                                    ? 'z.B. Märklin H0 Digital-Starterset. Komplett mit Lok, Wagen und Gleisen...'
                                                                    : selectedCategory ===
                                                                        'tierzubehoer'
                                                                      ? 'z.B. Hundebox Größe L aus robustem Kunststoff. Wenig gebraucht, sehr sauber...'
                                                                      : selectedCategory ===
                                                                          'wein-genuss'
                                                                        ? 'z.B. Château Margaux 2015 Rotwein, Premier Grand Cru. Optimal gelagert im Weinkeller...'
                                                                        : selectedCategory ===
                                                                            'tickets-gutscheine'
                                                                          ? 'z.B. 2× Ed Sheeran Konzert Zürich 15.07.2025. Sitzplatz Kategorie 1, Block A...'
                                                                          : selectedCategory ===
                                                                              'buero-gewerbe'
                                                                            ? 'z.B. Canon Kopierer imageRUNNER mit Fax und Scanner. Gewerbeauflösung, voll funktionsfähig...'
                                                                            : selectedCategory ===
                                                                                'immobilien'
                                                                              ? 'z.B. 3.5-Zimmer-Wohnung in Zürich Seefeld, 120m², 3. OG, Südbalkon, ruhige Lage, 2020 renoviert...'
                                                                              : selectedCategory ===
                                                                                  'jobs-karriere'
                                                                                ? 'z.B. Software Engineer Vollzeit in Zürich. IT-Branche, 5 Jahre Erfahrung, Remote möglich...'
                                                                                : selectedCategory ===
                                                                                    'dienstleistungen'
                                                                                  ? 'z.B. Umzugsservice für Zürich und Umgebung. 10 Jahre Erfahrung, versichert, faire Preise...'
                                                                                  : selectedCategory ===
                                                                                      'camping-outdoor'
                                                                                    ? 'z.B. Coleman 4-Personen Zelt, wasserdicht, leicht aufzubauen. Nur 2x verwendet, wie neu...'
                                                                                    : selectedCategory ===
                                                                                        'wellness-gesundheit'
                                                                                      ? 'z.B. Beurer Massagegerät MG 159 mit Wärme. Wenig benutzt, voll funktionsfähig...'
                                                                                      : selectedCategory ===
                                                                                          'reise-urlaub'
                                                                                        ? 'z.B. Reiseführer Thailand 2024, aktuell, mit Karten. Sehr guter Zustand...'
                                                                                        : selectedCategory ===
                                                                                            'garten-pflanzen'
                                                                                          ? 'z.B. Tomatensamen Bio-Sorten, verschiedene Sorten, für 2024. Originalverpackt...'
                                                                                          : selectedCategory ===
                                                                                              'boote-schiffe'
                                                                                            ? 'z.B. Bavaria 40 Segelyacht, Baujahr 2018, 2 Kabinen, voll ausgestattet, sehr gepflegt...'
                                                                                            : selectedCategory ===
                                                                                                'tiere'
                                                                                              ? 'z.B. Golden Retriever Welpe, 8 Wochen alt, geimpft, gechipt, mit Papieren. Züchter...'
                                                                                              : selectedCategory ===
                                                                                                  'lebensmittel'
                                                                                                ? 'z.B. Bio-Honig aus der Region, 500g Glas, ungeöffnet, Haltbarkeit bis 2025...'
                                                                                                : selectedCategory ===
                                                                                                    'medizin-gesundheit'
                                                                                                  ? 'z.B. Rollator mit Bremsen, höhenverstellbar, wenig benutzt, sehr guter Zustand...'
                                                                                                  : selectedCategory ===
                                                                                                      'flugzeuge'
                                                                                                    ? 'z.B. Cessna 172 Flugzeug, Baujahr 2015, 500 Flugstunden, technisch einwandfrei...'
                                                                                                    : selectedCategory ===
                                                                                                        'smart-home'
                                                                                                      ? 'z.B. Philips Hue Starter Set mit 3 Lampen und Bridge. Komplett, funktioniert einwandfrei...'
                                                                                                      : selectedCategory ===
                                                                                                          'elektrogeraete'
                                                                                                        ? 'z.B. Küchenmaschine KitchenAid Artisan, rot, 4.7L, wenig benutzt, mit Zubehör...'
                                                                                                        : selectedCategory ===
                                                                                                            'baustoffe'
                                                                                                          ? 'z.B. Dämmstoff 10cm 20m², neu, originalverpackt. Restbestand aus Renovation...'
                                                                                                          : selectedCategory ===
                                                                                                              'kunst-handwerk'
                                                                                                            ? 'z.B. Handgemachte Keramik-Vase, einzigartig, Höhe 30cm, signiert vom Künstler...'
                                                                                                            : 'Beschreiben Sie Ihren Artikel ausführlich: Zustand, Besonderheiten, Lieferumfang...'
                          }
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Zustand *
                        </label>
                        <select
                          name="condition"
                          required
                          value={formData.condition}
                          onChange={handleInputChange}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">Bitte wählen</option>
                          <option value="neu">Neu</option>
                          <option value="wie-neu">Wie neu</option>
                          <option value="sehr-gut">Sehr gut</option>
                          <option value="gut">Gut</option>
                          <option value="gebraucht">Gebraucht</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Kategorie-spezifische Felder NACH Titel/Beschreibung */}
                  <CategoryFields
                    category={selectedCategory}
                    subcategory={selectedSubcategory}
                    formData={formData}
                    onChange={handleInputChange}
                  />

                  {/* Preis und Verkaufsart */}
                  <div>
                    <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-900">
                      <Shield className="mr-2 h-5 w-5" />
                      Preis und Verkaufsart
                    </h2>

                    {/* Verkaufsart-Auswahl: Auktion oder Sofortkauf */}
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
                                <p className="mt-1 text-sm text-gray-600">
                                  Artikel wird versteigert. Höchstbietender erhält den Artikel.
                                </p>
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
                                  Artikel wird zu einem festen Preis verkauft.
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
                        <div className="mb-2 flex items-center justify-between">
                          <label className="block text-sm font-medium text-gray-700">
                            {formData.isAuction ? 'Startpreis (CHF) *' : 'Preis (CHF) *'}
                          </label>
                          {formData.price && parseFloat(formData.price) > 0 && (
                            <span className="flex items-center gap-1 text-xs text-purple-600">
                              <Sparkles className="h-3 w-3" />
                              KI-Vorschlag
                            </span>
                          )}
                        </div>
                        <input
                          type="number"
                          name="price"
                          required
                          value={formData.price}
                          onChange={handleInputChange}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                          placeholder={formData.isAuction ? 'z.B. 5000' : 'z.B. 5000'}
                        />
                        {formData.isAuction && (
                          <p className="mt-1 text-xs text-gray-500">
                            Der Mindestpreis, ab dem geboten werden kann.
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          {formData.isAuction ? (
                            <>
                              Sofortkaufpreis (CHF){' '}
                              <span className="text-xs font-normal text-gray-400">(Optional)</span>
                            </>
                          ) : (
                            <>
                              Sofortkaufpreis (CHF){' '}
                              <span className="text-xs font-normal text-gray-400">(Optional)</span>
                            </>
                          )}
                        </label>
                        <input
                          type="number"
                          name="buyNowPrice"
                          value={formData.buyNowPrice}
                          onChange={handleInputChange}
                          className={`w-full rounded-md border px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 ${
                            formData.buyNowPrice &&
                            formData.price &&
                            parseFloat(formData.buyNowPrice) > 0 &&
                            parseFloat(formData.price) > 0 &&
                            parseFloat(formData.buyNowPrice) <= parseFloat(formData.price)
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                          }`}
                          placeholder={formData.isAuction ? 'z.B. 8000 (optional)' : 'z.B. 8000'}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          {formData.isAuction
                            ? 'Falls leer gelassen, gibt es keinen Sofortkaufpreis. Käufer können nur bieten.'
                            : 'Optional: Falls leer, wird nur der normale Preis angezeigt.'}
                          {formData.buyNowPrice &&
                            formData.price &&
                            parseFloat(formData.buyNowPrice) > 0 &&
                            parseFloat(formData.price) > 0 &&
                            parseFloat(formData.buyNowPrice) <= parseFloat(formData.price) && (
                              <span className="mt-1 block text-red-600">
                                Der Sofortkaufpreis muss höher sein als der Verkaufspreis.
                              </span>
                            )}
                        </p>
                      </div>

                      {/* Auktionsfelder - nur anzeigen wenn Auktion gewählt */}
                      {formData.isAuction && (
                        <>
                          <div className="grid grid-cols-1 items-end gap-6 md:col-span-2 md:grid-cols-2">
                            <div className="flex flex-col">
                              <label className="mb-2 block whitespace-nowrap text-sm font-medium text-gray-700">
                                Laufzeit in Tagen *
                              </label>
                              <input
                                type="number"
                                name="auctionDuration"
                                required={formData.isAuction}
                                value={formData.auctionDuration}
                                onChange={handleInputChange}
                                min="1"
                                max="30"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                                placeholder="z.B. 7, 14, 30"
                              />
                              <p className="mt-1 text-xs text-gray-500">
                                Wählen Sie die Dauer der Auktion (1-30 Tage, max. 30 Tage)
                              </p>
                            </div>
                            <div className="flex flex-col">
                              <label className="mb-2 block whitespace-nowrap text-sm font-medium text-gray-700">
                                Starttermin (Optional)
                              </label>
                              <input
                                type="datetime-local"
                                name="auctionStart"
                                value={formData.auctionStart}
                                onChange={handleInputChange}
                                min={new Date().toISOString().slice(0, 16)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                              />
                              <p className="mt-1 text-xs text-gray-500">
                                Optional: Starttermin für die Auktion. Falls leer, startet sie
                                sofort.
                              </p>
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <p className="-mt-2 mb-3 text-xs text-gray-500">
                              Die Laufzeit beginnt ab dem Starttermin oder sofort, falls kein
                              Starttermin gewählt wurde.
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
                                  Auktion automatisch verlängern
                                </span>
                              </label>
                              <p className="ml-6 mt-1 text-xs text-gray-500">
                                Wenn aktiviert, wird die Auktion automatisch um die gewählte
                                Laufzeit verlängert, sobald sie abgelaufen ist (solange kein Kauf
                                zustande gekommen ist).
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Lieferumfang - NUR für Uhren & Schmuck */}
                  {selectedCategory === 'uhren-schmuck' && (
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
                            Fullset (Box, Papiere, alle Glieder und Kaufbeleg)
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
                          <span className="text-sm font-medium text-gray-700">
                            Nur Box und Papiere
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Garantie - NUR für Uhren & Schmuck */}
                  {selectedCategory === 'uhren-schmuck' && (
                    <div>
                      <h2 className="mb-4 text-xl font-semibold text-gray-900">Garantie</h2>
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
                            <span className="text-sm font-medium text-gray-700">
                              Herstellergarantie vorhanden
                            </span>
                          </label>
                        </div>

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
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
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
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
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
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
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
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
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
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                                placeholder="z.B. Garantie nur bei normaler Nutzung..."
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Lieferart */}
                  <div>
                    <h2 className="mb-4 text-xl font-semibold text-gray-900">
                      Lieferart <span className="text-red-500">*</span>
                    </h2>
                    <div className="space-y-3">
                      <label className="flex cursor-pointer items-center rounded-lg border border-gray-300 p-4 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={formData.shippingMethods.includes('pickup')}
                          onChange={e => handleShippingMethodChange('pickup', e.target.checked)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-700">Abholung</span>
                          <span className="ml-2 text-sm font-semibold text-green-600">
                            (kostenlos)
                          </span>
                        </div>
                      </label>
                      <label className="flex cursor-pointer items-center rounded-lg border border-gray-300 p-4 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={formData.shippingMethods.includes('b-post')}
                          onChange={e => handleShippingMethodChange('b-post', e.target.checked)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-700">
                            Versand als Paket B-Post, bis 2 KG
                          </span>
                          <span className="ml-2 text-sm text-gray-600">CHF 8.50</span>
                        </div>
                      </label>
                      <label className="flex cursor-pointer items-center rounded-lg border border-gray-300 p-4 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={formData.shippingMethods.includes('a-post')}
                          onChange={e => handleShippingMethodChange('a-post', e.target.checked)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-700">
                            Versand als Paket A-Post, bis 2 KG
                          </span>
                          <span className="ml-2 text-sm text-gray-600">CHF 12.50</span>
                        </div>
                      </label>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Die Versandkosten werden dem Käufer zusätzlich zum Kaufbetrag berechnet. Es
                      wird der höchste Betrag der ausgewählten Lieferarten berechnet.
                    </p>
                    {formData.shippingMethods.length === 0 && (
                      <p className="mt-2 text-xs text-red-500">
                        Bitte wählen Sie mindestens eine Lieferart aus.
                      </p>
                    )}
                  </div>

                  {/* Booster */}
                  <div>
                    <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-900">
                      <Sparkles className="mr-2 h-5 w-5" />
                      Booster-Option
                    </h2>
                    <p className="mb-4 text-sm text-gray-600">
                      Wählen Sie, wie Ihr Angebot hervorgehoben werden soll
                    </p>
                    {boosters.length === 0 ? (
                      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                        <p className="text-sm text-yellow-800">
                          Booster-Optionen werden geladen...
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                        {boosters.map(booster => {
                          const isSelected = selectedBooster === booster.code
                          const isSuperBoost = booster.code === 'super-boost'
                          const isTurboBoost = booster.code === 'turbo-boost'
                          const isBoost = booster.code === 'boost'

                          // Gaming-ähnliche Styles für jeden Booster (helles Design)
                          let cardStyles = ''
                          let badgeStyles = ''
                          let priceStyles = ''

                          if (isSuperBoost) {
                            cardStyles = isSelected
                              ? 'border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 shadow-lg ring-2 ring-yellow-200/50'
                              : 'border-2 border-yellow-300 bg-gradient-to-br from-yellow-50/50 via-orange-50/50 to-red-50/50 hover:border-yellow-400 hover:shadow-md'
                            badgeStyles =
                              'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white'
                            priceStyles = 'text-yellow-600'
                          } else if (isTurboBoost) {
                            cardStyles = isSelected
                              ? 'border-2 border-purple-500 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 shadow-lg ring-2 ring-purple-200/50'
                              : 'border-2 border-purple-300 bg-gradient-to-br from-purple-50/50 via-blue-50/50 to-indigo-50/50 hover:border-purple-400 hover:shadow-md'
                            badgeStyles =
                              'bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-600 text-white'
                            priceStyles = 'text-purple-600'
                          } else if (isBoost) {
                            cardStyles = isSelected
                              ? 'border-2 border-emerald-500 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 shadow-lg ring-2 ring-emerald-200/50'
                              : 'border-2 border-emerald-300 bg-gradient-to-br from-emerald-50/50 via-green-50/50 to-teal-50/50 hover:border-emerald-400 hover:shadow-md'
                            badgeStyles =
                              'bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 text-white'
                            priceStyles = 'text-blue-600'
                          } else {
                            // Für "none" - Standard-Style
                            cardStyles = isSelected
                              ? 'border-2 border-gray-400 bg-gray-50 shadow-md ring-2 ring-gray-200'
                              : 'border-2 border-gray-300 bg-white hover:border-gray-400'
                            badgeStyles = 'bg-gray-500 text-white'
                            priceStyles = 'text-gray-600'
                          }

                          return (
                            <label
                              key={booster.id}
                              className={`relative flex cursor-pointer flex-col rounded-lg p-3 transition-all ${
                                isSelected ? 'scale-[1.02]' : 'hover:scale-[1.01]'
                              } ${cardStyles}`}
                            >
                              <input
                                type="radio"
                                name="booster"
                                value={booster.code}
                                checked={isSelected}
                                onChange={e => setSelectedBooster(e.target.value)}
                                className="sr-only"
                              />

                              {/* Badge/Tier Indicator */}
                              <div className="mb-2 flex items-center justify-between">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badgeStyles}`}
                                >
                                  {isSuperBoost
                                    ? '⭐ Premium'
                                    : isTurboBoost
                                      ? '🚀 Turbo'
                                      : isBoost
                                        ? '⚡ Boost'
                                        : 'Standard'}
                                </span>
                                {isSelected && (
                                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 shadow-md">
                                    <svg
                                      className="h-3 w-3 text-white"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={3}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  </div>
                                )}
                              </div>

                              {/* Booster Name */}
                              <div className="mb-1">
                                <h3
                                  className={`text-base font-bold ${isSuperBoost ? 'text-orange-900' : isTurboBoost ? 'text-purple-900' : isBoost ? 'text-blue-900' : 'text-gray-900'}`}
                                >
                                  {booster.name}
                                </h3>
                              </div>

                              {/* Description */}
                              <p className="mb-3 line-clamp-2 flex-1 text-xs leading-snug text-gray-700">
                                {booster.description}
                              </p>

                              {/* Price Section */}
                              <div className="mt-auto border-t border-gray-200/50 pt-2">
                                <div className="flex items-baseline justify-between">
                                  <span className="text-[10px] uppercase text-gray-500">Preis</span>
                                  <div className={`text-lg font-bold ${priceStyles}`}>
                                    CHF {booster.price.toFixed(2)}
                                  </div>
                                </div>
                              </div>

                              {/* Special glow effect for Super-Boost when selected */}
                              {isSuperBoost && isSelected && (
                                <div className="pointer-events-none absolute inset-0 animate-pulse rounded-lg bg-gradient-to-r from-yellow-400/15 via-orange-400/15 to-red-400/15" />
                              )}
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Bilder */}
                  <div>
                    <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-900">
                      <Upload className="mr-2 h-5 w-5" />
                      Bilder
                    </h2>

                    <div className="mb-4">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-100"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Laden Sie bis zu 10 Bilder hoch (JPG, PNG, max. 5MB pro Bild)
                      </p>
                    </div>

                    {formData.images.length > 0 && (
                      <div className="space-y-3">
                        {detectedConfidence > 0 && (
                          <p className="flex items-center gap-2 text-sm text-gray-600">
                            <Sparkles className="h-4 w-4 text-green-600" />
                            Das erste Bild wurde von der KI analysiert
                          </p>
                        )}
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                          {formData.images.map((image, index) => (
                            <div key={index} className="relative">
                              <img
                                src={image}
                                alt={`Artikel ${index + 1}`}
                                className={`h-32 w-full cursor-pointer rounded-lg border-2 object-cover ${
                                  index === titleImageIndex
                                    ? 'border-primary-500 ring-2 ring-primary-200'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => setSelectedImageIndex(index)}
                              />

                              {/* KI-Badge für erstes Bild */}
                              {index === 0 && detectedConfidence > 0 && (
                                <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-green-500 px-2 py-1 text-xs font-medium text-white">
                                  <Sparkles className="h-3 w-3" />
                                  KI
                                </div>
                              )}

                              {/* Titelbild-Button */}
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

                              {/* Entfernen-Button */}
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-sm text-white shadow-sm hover:bg-red-600"
                                title="Bild entfernen"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Video Upload */}
                    <div className="mt-8">
                      <h3 className="mb-4 text-lg font-medium text-gray-900">Video (Optional)</h3>
                      <div className="mb-4">
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoUpload}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-100"
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
                            className="h-64 w-full max-w-md rounded-lg object-cover"
                          />
                          <button
                            type="button"
                            onClick={removeVideo}
                            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-sm text-white hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
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
                          Artikel anbieten
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : null}
            </form>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
