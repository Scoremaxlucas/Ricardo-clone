'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Upload,
  Plus,
  X,
  Trash2,
  Download,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  Copy,
  ChevronRight,
  FileText,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  Flame,
} from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { categoryConfig } from '@/data/categories'
import { CategoryFields } from '@/components/forms/CategoryFieldsNew'

interface ProductForm {
  id: string
  title: string
  description: string
  condition: string
  images: File[]
  imagePreviews: string[]
  // Gemeinsame Einstellungen (werden später gesetzt)
  price?: string
  buyNowPrice?: string
  brand?: string
  model?: string
  year?: string
  category?: string
  subcategory?: string
  shippingMethods?: string[]
  isAuction?: boolean
  auctionDuration?: string
  booster?: string // Booster pro Artikel
  errors: string[]
}

type Step = 'articles' | 'settings' | 'review'

export default function BulkUploadPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [currentStep, setCurrentStep] = useState<Step>('articles')
  const [products, setProducts] = useState<ProductForm[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null)
  const [isCheckingVerification, setIsCheckingVerification] = useState(true)
  const [boosters, setBoosters] = useState<any[]>([])

  // Gemeinsame Einstellungen (Schritt 2)
  const [commonSettings, setCommonSettings] = useState({
    price: '',
    buyNowPrice: '',
    brand: '',
    model: '',
    year: '',
    category: '',
    subcategory: '',
    shippingMethods: ['pickup'] as string[],
    isAuction: false,
    auctionDuration: '7',
  })

  // Ausgewählte Artikel für Veröffentlichung
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())

  // Prüfe Verifizierungsstatus und lade Booster
  useEffect(() => {
    const loadVerificationStatus = async () => {
      if ((session?.user as { id?: string })?.id) {
        try {
          const res = await fetch('/api/verification/get')
          if (res.ok) {
            const data = await res.json()
            const isApproved = data.verified === true && data.verificationStatus === 'approved'
            setIsVerified(isApproved)
            setVerificationStatus(data.verificationStatus || null)
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

    const loadBoosters = async () => {
      try {
        const res = await fetch('/api/admin/boosters')
        if (res.ok) {
          const data = await res.json()
          setBoosters(data.sort((a: any, b: any) => a.price - b.price))
        }
      } catch (error) {
        console.error('Error loading boosters:', error)
      }
    }

    loadVerificationStatus()
    loadBoosters()
  }, [(session?.user as { id?: string })?.id])

  if (status === 'loading' || isCheckingVerification) {
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

  if (isVerified === false || verificationStatus !== 'approved') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-6">
            <div className="flex items-start">
              <AlertCircle className="mr-3 mt-0.5 h-6 w-6 text-yellow-600" />
              <div>
                <h3 className="mb-2 text-lg font-semibold text-yellow-900">
                  Verifizierung erforderlich
                </h3>
                <p className="mb-4 text-yellow-800">
                  {verificationStatus === 'pending'
                    ? 'Ihre Verifizierung wird derzeit geprüft. Sie können Artikel verkaufen, sobald die Verifizierung abgeschlossen ist.'
                    : 'Sie müssen sich zuerst verifizieren, bevor Sie Artikel verkaufen können.'}
                </p>
                {verificationStatus !== 'pending' && (
                  <Link
                    href="/verification"
                    className="inline-block rounded-md bg-yellow-600 px-4 py-2 text-white transition-colors hover:bg-yellow-700"
                  >
                    Jetzt verifizieren
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const addProduct = () => {
    if (products.length >= 100) {
      setError('Maximal 100 Artikel können gleichzeitig erstellt werden.')
      return
    }

    const newProduct: ProductForm = {
      id: `product-${Date.now()}-${Math.random()}`,
      title: '',
      description: '',
      condition: '',
      images: [],
      imagePreviews: [],
      booster: undefined,
      errors: [],
    }

    setProducts([...products, newProduct])
  }

  const duplicateProduct = (id: string) => {
    const product = products.find(p => p.id === id)
    if (!product) return

    if (products.length >= 100) {
      setError('Maximal 100 Artikel können gleichzeitig erstellt werden.')
      return
    }

    const duplicated: ProductForm = {
      ...product,
      id: `product-${Date.now()}-${Math.random()}`,
      title: product.title + ' (Kopie)',
      images: [],
      imagePreviews: [],
      booster: undefined,
    }

    setProducts([...products, duplicated])
    setSuccess('Artikel dupliziert!')
    setTimeout(() => setSuccess(''), 2000)
  }

  const duplicateMultiple = (id: string, count: number) => {
    const product = products.find(p => p.id === id)
    if (!product) return

    if (products.length + count > 100) {
      setError(`Sie können maximal ${100 - products.length} weitere Artikel hinzufügen.`)
      return
    }

    const duplicates: ProductForm[] = []
    for (let i = 0; i < count; i++) {
      duplicates.push({
        ...product,
        id: `product-${Date.now()}-${Math.random()}-${i}`,
        title: `${product.title} ${i + 1}`,
        images: [],
        imagePreviews: [],
      })
    }

    setProducts([...products, ...duplicates])
    setSuccess(`${count} Artikel dupliziert!`)
    setTimeout(() => setSuccess(''), 2000)
  }

  const removeProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id))
    setSelectedProducts(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
  }

  const updateProduct = (id: string, field: keyof ProductForm, value: any) => {
    setProducts(prevProducts => prevProducts.map(p => (p.id === id ? { ...p, [field]: value } : p)))
  }

  const handleImageUpload = (productId: string, files: FileList | null) => {
    if (!files) return

    const fileArray = Array.from(files).filter(file => file.type.startsWith('image/'))
    if (fileArray.length === 0) return

    const product = products.find(p => p.id === productId)
    if (!product) return

    // Erstelle Previews synchron, bevor wir den State aktualisieren
    const previewPromises = fileArray.map(file => {
      return new Promise<string>(resolve => {
        const reader = new FileReader()
        reader.onload = e => {
          resolve(e.target?.result as string)
        }
        reader.onerror = () => resolve('')
        reader.readAsDataURL(file)
      })
    })

    // Warte auf alle Previews, dann aktualisiere State einmal
    Promise.all(previewPromises).then(previews => {
      setProducts(currentProducts =>
        currentProducts.map(p => {
          if (p.id === productId) {
            // Filtere leere Previews heraus
            const validPreviews = previews.filter(p => p !== '')
            return {
              ...p,
              images: [...p.images, ...fileArray],
              imagePreviews: [...p.imagePreviews, ...validPreviews],
            }
          }
          return p
        })
      )
    })
  }

  const removeImage = (productId: string, index: number) => {
    const product = products.find(p => p.id === productId)
    if (!product) return

    const newImages = product.images.filter((_, i) => i !== index)
    const newPreviews = product.imagePreviews.filter((_, i) => i !== index)
    updateProduct(productId, 'images', newImages)
    updateProduct(productId, 'imagePreviews', newPreviews)
  }

  const validateStep1 = (): boolean => {
    if (products.length === 0) {
      setError('Bitte fügen Sie mindestens einen Artikel hinzu.')
      return false
    }

    let hasErrors = false
    const validatedProducts = products.map(p => {
      const errors: string[] = []
      if (!p.title.trim()) errors.push('Titel fehlt')
      if (!p.description.trim()) errors.push('Beschreibung fehlt')
      if (!p.condition) errors.push('Zustand fehlt')
      // Prüfe sowohl images als auch imagePreviews, da images sofort gesetzt wird
      if (p.images.length === 0 && p.imagePreviews.length === 0) {
        errors.push('Mindestens ein Bild erforderlich')
      }

      if (errors.length > 0) hasErrors = true
      return { ...p, errors }
    })

    setProducts(validatedProducts)

    if (hasErrors) {
      setError('Bitte beheben Sie zuerst alle Fehler.')
      return false
    }

    return true
  }

  const goToStep2 = () => {
    if (validateStep1()) {
      setCurrentStep('settings')
      setError('')
    }
  }

  const applyCommonSettings = () => {
    setProducts(
      products.map(p => ({
        ...p,
        price: commonSettings.price || p.price,
        buyNowPrice: commonSettings.buyNowPrice || p.buyNowPrice,
        brand: commonSettings.brand || p.brand,
        model: commonSettings.model || p.model,
        year: commonSettings.year || p.year,
        category: commonSettings.category || p.category,
        subcategory: commonSettings.subcategory || p.subcategory,
        shippingMethods:
          commonSettings.shippingMethods.length > 0
            ? [...commonSettings.shippingMethods]
            : p.shippingMethods,
        isAuction: commonSettings.isAuction !== undefined ? commonSettings.isAuction : p.isAuction,
        auctionDuration: commonSettings.auctionDuration || p.auctionDuration,
      }))
    )
    setSuccess('Einstellungen auf alle Artikel angewendet!')
    setTimeout(() => setSuccess(''), 3000)
  }

  const goToStep3 = () => {
    // Wende gemeinsame Einstellungen an
    applyCommonSettings()
    // Wähle alle Artikel aus
    setSelectedProducts(new Set(products.map(p => p.id)))
    setCurrentStep('review')
    setError('')
  }

  const toggleProductSelection = (id: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const selectAll = () => {
    setSelectedProducts(new Set(products.map(p => p.id)))
  }

  const deselectAll = () => {
    setSelectedProducts(new Set())
  }

  const handlePublish = async () => {
    if (selectedProducts.size === 0) {
      setError('Bitte wählen Sie mindestens einen Artikel zum Veröffentlichen aus.')
      return
    }

    const productsToPublish = products.filter(p => selectedProducts.has(p.id))

    // Validierung
    const invalidProducts = productsToPublish.filter(
      p => !p.price || isNaN(parseFloat(p.price)) || parseFloat(p.price) <= 0 || !p.category
    )

    if (invalidProducts.length > 0) {
      setError(
        'Bitte stellen Sie sicher, dass alle ausgewählten Artikel einen Preis und eine Kategorie haben.'
      )
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      // Konvertiere Bilder zu Base64
      const productsWithImages = await Promise.all(
        productsToPublish.map(async product => {
          const imageBase64s = await Promise.all(
            product.images.map(file => {
              return new Promise<string>(resolve => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.readAsDataURL(file)
              })
            })
          )

          return {
            title: product.title,
            description: product.description,
            price: product.price!,
            buyNowPrice: product.buyNowPrice || undefined,
            condition: product.condition, // Zustand kommt aus Schritt 1 (Artikeldetails)
            brand: product.brand || undefined,
            model: product.model || undefined,
            year: product.year || undefined,
            category: product.category!,
            subcategory: product.subcategory || undefined,
            images: imageBase64s,
            shippingMethods: product.shippingMethods || commonSettings.shippingMethods,
            isAuction:
              product.isAuction !== undefined ? product.isAuction : commonSettings.isAuction,
            auctionDuration: (
              product.isAuction !== undefined ? product.isAuction : commonSettings.isAuction
            )
              ? product.auctionDuration || commonSettings.auctionDuration
              : undefined,
            booster: product.booster && product.booster !== 'none' ? product.booster : undefined,
          }
        })
      )

      const response = await fetch('/api/watches/bulk-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: productsWithImages }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Fehler beim Erstellen der Artikel')
      }

      setSuccess(`${data.created} Artikel erfolgreich veröffentlicht!`)

      // Entferne veröffentlichte Artikel
      setProducts(products.filter(p => !selectedProducts.has(p.id)))
      setSelectedProducts(new Set())

      setTimeout(() => {
        router.push('/my-watches/selling')
      }, 2000)
    } catch (err) {
      setError('Fehler: ' + (err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      setError('Bitte laden Sie eine CSV-Datei hoch.')
      return
    }

    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      parseCSV(text)
    }
    reader.readAsText(file)
  }

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }

    result.push(current.trim())
    return result
  }

  const parseCSV = (csvText: string) => {
    try {
      const lines = csvText.split('\n').filter(line => line.trim())
      if (lines.length < 2) {
        setError('CSV-Datei muss mindestens eine Kopfzeile und eine Datenzeile enthalten.')
        return
      }

      const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim().toLowerCase())
      const requiredHeaders = ['titel', 'beschreibung', 'zustand']
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))

      if (missingHeaders.length > 0) {
        setError(`Fehlende Spalten: ${missingHeaders.join(', ')}`)
        return
      }

      const parsedProducts: ProductForm[] = []

      for (let i = 1; i < lines.length && parsedProducts.length < 100; i++) {
        const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, '').trim())

        const product: ProductForm = {
          id: `csv-${i}-${Date.now()}`,
          title: '',
          description: '',
          condition: '',
          images: [],
          imagePreviews: [],
          errors: [],
        }

        headers.forEach((header, index) => {
          const value = values[index] || ''

          switch (header) {
            case 'titel':
              product.title = value
              break
            case 'beschreibung':
              product.description = value
              break
            case 'zustand':
              product.condition = value
              break
          }
        })

        parsedProducts.push(product)
      }

      setProducts([...products, ...parsedProducts])
      setError('')
      setSuccess(`${parsedProducts.length} Artikel aus CSV geladen.`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Fehler beim Lesen der CSV-Datei: ' + (err as Error).message)
    }
  }

  const downloadTemplate = () => {
    const headers = ['Titel', 'Beschreibung', 'Zustand']
    const example = ['Beispiel Artikel', 'Dies ist eine Beispielbeschreibung', 'Sehr gut']

    const csv = [headers.join(','), example.join(',')].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'bulk-upload-vorlage.csv'
    link.click()
  }

  // Lade Kategorien für Dropdown
  const categories = Object.keys(categoryConfig).map(slug => ({
    slug,
    name: categoryConfig[slug].name,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <Link
            href="/sell"
            className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            ← Zurück zum Verkaufen
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Mehrere Artikel gleichzeitig hochladen
          </h1>
          <p className="text-gray-600">
            Erstellen Sie bis zu 100 Artikel in drei einfachen Schritten.
          </p>
        </div>

        {/* Schritt-Anzeige */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center gap-4">
              <div
                className={`flex items-center gap-2 ${currentStep === 'articles' ? 'text-primary-600' : currentStep === 'settings' || currentStep === 'review' ? 'text-green-600' : 'text-gray-400'}`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${currentStep === 'articles' ? 'bg-primary-600 text-white' : currentStep === 'settings' || currentStep === 'review' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                >
                  1
                </div>
                <span className="font-medium">Artikel-Details</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
              <div
                className={`flex items-center gap-2 ${currentStep === 'settings' ? 'text-primary-600' : currentStep === 'review' ? 'text-green-600' : 'text-gray-400'}`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${currentStep === 'settings' ? 'bg-primary-600 text-white' : currentStep === 'review' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                >
                  2
                </div>
                <span className="font-medium">Angebotsdetails</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
              <div
                className={`flex items-center gap-2 ${currentStep === 'review' ? 'text-primary-600' : 'text-gray-400'}`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${currentStep === 'review' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                >
                  3
                </div>
                <span className="font-medium">Veröffentlichen</span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-start rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
            <div className="flex-1">
              <p className="text-red-800">{error}</p>
            </div>
            <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-start rounded-lg border border-green-200 bg-green-50 p-4">
            <CheckCircle className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
            <div className="flex-1">
              <p className="text-green-800">{success}</p>
            </div>
            <button onClick={() => setSuccess('')} className="text-green-600 hover:text-green-800">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* SCHRITT 1: Artikel-Details */}
        {currentStep === 'articles' && (
          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                Schritt 1: Artikel-Details eingeben
              </h2>
              <p className="mb-6 text-gray-600">
                Geben Sie für jeden Artikel Titel, Beschreibung, Zustand und Fotos ein. Diese werden
                als Entwürfe gespeichert.
              </p>

              {/* CSV Upload Option */}
              <div className="mb-6 rounded-lg border-2 border-dashed border-gray-300 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mb-1 text-sm font-medium text-gray-700">
                      Oder laden Sie eine CSV-Datei hoch
                    </p>
                    <p className="text-xs text-gray-500">Spalten: Titel, Beschreibung, Zustand</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      CSV hochladen
                    </button>
                    <button
                      onClick={downloadTemplate}
                      className="flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Vorlage
                    </button>
                  </div>
                </div>
              </div>

              {/* Artikel-Liste */}
              <div className="mb-6 space-y-4">
                {products.map((product, index) => (
                  <div key={product.id} className="rounded-lg border border-gray-200 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">Artikel {index + 1}</h3>
                      <div className="flex items-center gap-2">
                        <div className="group relative">
                          <button
                            className="p-2 text-gray-600 transition-colors hover:text-primary-600"
                            title="Duplizieren"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <div className="invisible absolute right-0 top-full z-10 mt-1 rounded-md border border-gray-200 bg-white opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
                            <div className="p-2">
                              <div className="mb-2 text-xs text-gray-600">Anzahl:</div>
                              {[1, 2, 3, 4, 5, 10].map(count => (
                                <button
                                  key={count}
                                  onClick={() => duplicateMultiple(product.id, count)}
                                  className="block w-full rounded px-3 py-1 text-left text-sm hover:bg-gray-100"
                                >
                                  {count} {count === 1 ? 'Kopie' : 'Kopien'}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => duplicateProduct(product.id)}
                          className="p-2 text-gray-600 transition-colors hover:text-primary-600"
                          title="Einmal duplizieren"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeProduct(product.id)}
                          className="p-2 text-red-600 transition-colors hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {product.errors && product.errors.length > 0 && (
                      <div className="mb-4 rounded border border-red-200 bg-red-50 p-3">
                        <ul className="list-inside list-disc text-sm text-red-700">
                          {product.errors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Titel <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={product.title}
                          onChange={e => updateProduct(product.id, 'title', e.target.value)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500"
                          placeholder="z.B. iPhone 13 Pro"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Beschreibung <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={product.description}
                          onChange={e => updateProduct(product.id, 'description', e.target.value)}
                          rows={3}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500"
                          placeholder="Beschreiben Sie den Artikel..."
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Zustand <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={product.condition}
                          onChange={e => updateProduct(product.id, 'condition', e.target.value)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">Bitte wählen</option>
                          <option value="Neu">Neu</option>
                          <option value="Wie neu">Wie neu</option>
                          <option value="Sehr gut">Sehr gut</option>
                          <option value="Gut">Gut</option>
                          <option value="Gebraucht">Gebraucht</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Bilder <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-4">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={e => handleImageUpload(product.id, e.target.files)}
                            className="hidden"
                            id={`image-upload-${product.id}`}
                          />
                          <label
                            htmlFor={`image-upload-${product.id}`}
                            className="flex cursor-pointer items-center rounded-md border border-gray-300 px-4 py-2 text-sm transition-colors hover:bg-gray-50"
                          >
                            <ImageIcon className="mr-2 h-4 w-4" />
                            Bilder auswählen
                          </label>
                          {product.imagePreviews.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {product.imagePreviews.map((preview, imgIndex) => {
                                // Sicherstellen, dass nur gültige Previews angezeigt werden
                                if (!preview || preview === '') return null
                                return (
                                  <div key={`${product.id}-${imgIndex}`} className="relative">
                                    <img
                                      src={preview}
                                      alt={`Preview ${imgIndex + 1}`}
                                      className="h-16 w-16 rounded border border-gray-300 object-cover"
                                    />
                                    <button
                                      onClick={() => removeImage(product.id, imgIndex)}
                                      className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                          {product.imagePreviews.length === 0 && product.images.length > 0 && (
                            <div className="mt-1 text-xs text-gray-500">
                              {product.images.length}{' '}
                              {product.images.length === 1 ? 'Bild' : 'Bilder'} werden
                              verarbeitet...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={addProduct}
                  disabled={products.length >= 100}
                  className="flex items-center rounded-md bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Artikel hinzufügen ({products.length}/100)
                </button>

                <button
                  onClick={goToStep2}
                  disabled={products.length === 0}
                  className="flex items-center rounded-md bg-primary-600 px-6 py-2 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Weiter zu Schritt 2
                  <ChevronRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SCHRITT 2: Angebotsdetails */}
        {currentStep === 'settings' && (
          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                Schritt 2: Angebotsdetails festlegen
              </h2>
              <p className="mb-6 text-gray-600">
                Legen Sie Angebotstyp, Preis, Lieferart und weitere Details fest, die auf ein oder
                mehrere Angebote angewendet werden sollen.
              </p>

              <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Kategorie <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={commonSettings.category}
                    onChange={e =>
                      setCommonSettings(prev => ({
                        ...prev,
                        category: e.target.value,
                        subcategory: '',
                      }))
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Bitte wählen</option>
                    {categories.map(cat => (
                      <option key={cat.slug} value={cat.slug}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Preis (CHF) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={commonSettings.price}
                    onChange={e => setCommonSettings(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500"
                    placeholder="100.00"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Sofortkaufpreis (CHF)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={commonSettings.buyNowPrice}
                    onChange={e =>
                      setCommonSettings(prev => ({ ...prev, buyNowPrice: e.target.value }))
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500"
                    placeholder="120.00"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Marke</label>
                  <input
                    type="text"
                    value={commonSettings.brand}
                    onChange={e => setCommonSettings(prev => ({ ...prev, brand: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500"
                    placeholder="z.B. Apple"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Modell</label>
                  <input
                    type="text"
                    value={commonSettings.model}
                    onChange={e => setCommonSettings(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500"
                    placeholder="z.B. iPhone 13 Pro"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Jahr</label>
                  <input
                    type="number"
                    value={commonSettings.year}
                    onChange={e => setCommonSettings(prev => ({ ...prev, year: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500"
                    placeholder="z.B. 2020"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Lieferart</label>
                  <div className="space-y-2">
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={commonSettings.shippingMethods.includes('pickup')}
                        onChange={e => {
                          const methods = e.target.checked
                            ? [...commonSettings.shippingMethods, 'pickup']
                            : commonSettings.shippingMethods.filter(m => m !== 'pickup')
                          setCommonSettings(prev => ({ ...prev, shippingMethods: methods }))
                        }}
                        className="mr-2"
                      />
                      Abholung
                    </label>
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={commonSettings.shippingMethods.includes('b-post')}
                        onChange={e => {
                          const methods = e.target.checked
                            ? [...commonSettings.shippingMethods, 'b-post']
                            : commonSettings.shippingMethods.filter(m => m !== 'b-post')
                          setCommonSettings(prev => ({ ...prev, shippingMethods: methods }))
                        }}
                        className="mr-2"
                      />
                      B-Post
                    </label>
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={commonSettings.shippingMethods.includes('a-post')}
                        onChange={e => {
                          const methods = e.target.checked
                            ? [...commonSettings.shippingMethods, 'a-post']
                            : commonSettings.shippingMethods.filter(m => m !== 'a-post')
                          setCommonSettings(prev => ({ ...prev, shippingMethods: methods }))
                        }}
                        className="mr-2"
                      />
                      A-Post
                    </label>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Angebotstyp
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="offerType"
                        checked={!commonSettings.isAuction}
                        onChange={() => setCommonSettings(prev => ({ ...prev, isAuction: false }))}
                        className="mr-2"
                      />
                      Sofortkauf
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="offerType"
                        checked={commonSettings.isAuction}
                        onChange={() => setCommonSettings(prev => ({ ...prev, isAuction: true }))}
                        className="mr-2"
                      />
                      Auktion
                    </label>
                    {commonSettings.isAuction && (
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={commonSettings.auctionDuration}
                        onChange={e =>
                          setCommonSettings(prev => ({ ...prev, auctionDuration: e.target.value }))
                        }
                        placeholder="Dauer (Tage)"
                        className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <button
                  onClick={() => setCurrentStep('articles')}
                  className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Zurück
                </button>
                <div className="flex gap-4">
                  <button
                    onClick={applyCommonSettings}
                    className="rounded-md bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    Auf alle anwenden
                  </button>
                  <button
                    onClick={goToStep3}
                    disabled={!commonSettings.price || !commonSettings.category}
                    className="flex items-center rounded-md bg-primary-600 px-6 py-2 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Weiter zu Schritt 3
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCHRITT 3: Veröffentlichen */}
        {currentStep === 'review' && (
          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow-md">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Schritt 3: Veröffentlichen</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAll}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Alle auswählen
                  </button>
                  <span className="text-gray-400">|</span>
                  <button
                    onClick={deselectAll}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Alle abwählen
                  </button>
                </div>
              </div>

              <p className="mb-6 text-gray-600">
                Wählen Sie die Artikel aus, die Sie veröffentlichen möchten. Sie können einzelne
                oder mehrere gleichzeitig veröffentlichen.
              </p>

              <div className="mb-6 space-y-3">
                {products.map((product, index) => {
                  const isSelected = selectedProducts.has(product.id)
                  const hasAllSettings = product.price || commonSettings.price

                  return (
                    <div
                      key={product.id}
                      className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                        isSelected
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleProductSelection(product.id)}
                    >
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleProductSelection(product.id)}
                          onClick={e => e.stopPropagation()}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="mb-2 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">
                              Artikel {index + 1}: {product.title || 'Ohne Titel'}
                            </h3>
                            {!hasAllSettings && (
                              <span className="rounded bg-red-50 px-2 py-1 text-xs text-red-600">
                                Unvollständig
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 md:grid-cols-4">
                            <div>
                              <span className="font-medium">Preis:</span>{' '}
                              {product.price || commonSettings.price || 'Nicht gesetzt'} CHF
                            </div>
                            <div>
                              <span className="font-medium">Kategorie:</span>{' '}
                              {product.category || commonSettings.category || 'Nicht gesetzt'}
                            </div>
                            <div>
                              <span className="font-medium">Bilder:</span>{' '}
                              {product.imagePreviews.length || product.images.length}
                            </div>
                            <div>
                              <span className="font-medium">Booster:</span>{' '}
                              {product.booster && product.booster !== 'none'
                                ? boosters.find(b => b.code === product.booster)?.name ||
                                  product.booster
                                : 'Keiner'}
                            </div>
                          </div>
                          {product.imagePreviews.length > 0 && (
                            <div className="mt-3 flex gap-2">
                              {product.imagePreviews.slice(0, 3).map((preview, imgIndex) => {
                                if (!preview || preview === '') return null
                                return (
                                  <img
                                    key={`${product.id}-preview-${imgIndex}`}
                                    src={preview}
                                    alt={`Preview ${imgIndex + 1}`}
                                    className="h-16 w-16 rounded border border-gray-300 object-cover"
                                  />
                                )
                              })}
                              {product.imagePreviews.length > 3 && (
                                <div className="flex h-16 w-16 items-center justify-center rounded border border-gray-300 bg-gray-100 text-xs text-gray-600">
                                  +{product.imagePreviews.length - 3}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Booster-Auswahl pro Artikel */}
                          <div className="mt-4 border-t border-gray-200 pt-4">
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                              Booster für diesen Artikel
                            </label>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation()
                                  updateProduct(product.id, 'booster', 'none')
                                }}
                                className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                                  !product.booster || product.booster === 'none'
                                    ? 'border-gray-400 bg-gray-100 font-semibold text-gray-900'
                                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                Keiner
                              </button>
                              {boosters
                                .filter((b: any) => b.code !== 'none')
                                .map((booster: any) => {
                                  const isSelected = product.booster === booster.code
                                  return (
                                    <button
                                      key={booster.id}
                                      type="button"
                                      onClick={e => {
                                        e.stopPropagation()
                                        updateProduct(product.id, 'booster', booster.code)
                                      }}
                                      className={`flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs transition-colors ${
                                        isSelected
                                          ? 'border-primary-400 bg-primary-100 font-semibold text-primary-900'
                                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                      }`}
                                    >
                                      {booster.code === 'super-boost' && (
                                        <Sparkles className="h-3 w-3" />
                                      )}
                                      {booster.code === 'turbo-boost' && (
                                        <Zap className="h-3 w-3" />
                                      )}
                                      {booster.code === 'boost' && <Flame className="h-3 w-3" />}
                                      {booster.name} (CHF {booster.price.toFixed(2)})
                                    </button>
                                  )
                                })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <button
                  onClick={() => setCurrentStep('settings')}
                  className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Zurück
                </button>
                <button
                  onClick={handlePublish}
                  disabled={isLoading || selectedProducts.size === 0}
                  className="flex items-center rounded-md bg-green-600 px-6 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Veröffentliche...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {selectedProducts.size} Artikel veröffentlichen
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
