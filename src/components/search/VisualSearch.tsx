'use client'

import { ProductCard } from '@/components/ui/ProductCard'
import { Camera, ImageIcon, Loader2, Search, Upload, X } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

interface AnalysisResult {
  productType: string
  brand: string | null
  model: string | null
  category: string | null
  style: string | null
  color: string | null
  searchQuery: string
  confidence: number
}

interface SearchResult {
  id: string
  title: string
  brand: string
  model: string
  price: number
  buyNowPrice: number | null
  images: string[]
  condition: string
  isAuction: boolean
  auctionEnd: string | null
  createdAt: string
  city: string | null
  postalCode: string | null
}

interface VisualSearchProps {
  onClose?: () => void
  className?: string
}

export function VisualSearch({ onClose, className = '' }: VisualSearchProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [results, setResults] = useState<SearchResult[]>([])
  const [error, setError] = useState<string | null>(null)

  // Check if visual search is enabled
  useEffect(() => {
    const checkEnabled = async () => {
      try {
        const res = await fetch('/api/search/visual')
        const data = await res.json()
        setIsEnabled(data.enabled)
      } catch {
        setIsEnabled(false)
      }
    }
    checkEnabled()
  }, [])

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Bitte nur Bilder hochladen (JPG, PNG, etc.)')
      return
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError('Das Bild darf maximal 10MB gross sein')
      return
    }

    setSelectedFile(file)
    setError(null)

    // Create preview
    const reader = new FileReader()
    reader.onload = e => {
      setSelectedImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [handleFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleAnalyze = async () => {
    if (!selectedFile) return

    setIsLoading(true)
    setError(null)
    setAnalysis(null)
    setResults([])

    try {
      const formData = new FormData()
      formData.append('image', selectedFile)

      const res = await fetch('/api/search/visual', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Analyse fehlgeschlagen')
      }

      setAnalysis(data.analysis)
      setResults(data.results || [])
    } catch (err) {
      console.error('Visual search error:', err)
      setError(err instanceof Error ? err.message : 'Analyse fehlgeschlagen')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchWithQuery = () => {
    if (analysis?.searchQuery) {
      router.push(`/search?q=${encodeURIComponent(analysis.searchQuery)}`)
      onClose?.()
    }
  }

  const handleReset = () => {
    setSelectedImage(null)
    setSelectedFile(null)
    setAnalysis(null)
    setResults([])
    setError(null)
  }

  // Not enabled state
  if (isEnabled === false) {
    return (
      <div className={`rounded-xl border border-gray-200 bg-white p-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Bildersuche</h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Schliessen"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <p className="mt-4 text-center text-gray-500">
          Die Bildersuche ist derzeit nicht verfügbar. Bitte später erneut versuchen.
        </p>
      </div>
    )
  }

  // Loading state for checking enabled
  if (isEnabled === null) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-gray-200 bg-white p-8 ${className}`}
      >
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" aria-label="Lädt" />
      </div>
    )
  }

  return (
    <div className={`rounded-xl border border-gray-200 bg-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary-600" />
          <h3 className="font-semibold text-gray-900">Bildersuche</h3>
          <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
            NEU
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Schliessen"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="p-6">
        {/* Upload Area */}
        {!selectedImage && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
              isDragging
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
            }`}
          >
            <Upload className="mb-4 h-10 w-10 text-gray-400" />
            <p className="mb-2 text-center text-gray-600">
              <span className="font-medium">Bild hierher ziehen</span> oder klicken zum Auswählen
            </p>
            <p className="text-center text-sm text-gray-400">JPG, PNG bis 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) handleFileSelect(file)
              }}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Bild auswählen"
              title="Klicken um ein Bild auszuwählen"
            />
          </div>
        )}

        {/* Selected Image Preview */}
        {selectedImage && !analysis && (
          <div className="space-y-4">
            <div className="relative mx-auto max-w-md overflow-hidden rounded-xl border border-gray-200">
              <Image
                src={selectedImage}
                alt="Ausgewähltes Bild"
                width={400}
                height={300}
                className="h-auto w-full object-contain"
              />
              <button
                onClick={handleReset}
                className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
                aria-label="Bild entfernen"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && <p className="text-center text-sm text-red-600">{error}</p>}

            <div className="flex justify-center gap-3">
              <button
                onClick={handleReset}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Anderes Bild
              </button>
              <button
                onClick={handleAnalyze}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analysiere...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Suche starten
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Analysis Summary */}
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Erkannte Produkt</h4>
                <span className="text-xs text-gray-500">
                  {Math.round(analysis.confidence * 100)}% sicher
                </span>
              </div>

              <div className="grid gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Produkttyp:</span>
                  <span className="font-medium text-gray-900">{analysis.productType}</span>
                </div>
                {analysis.brand && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Marke:</span>
                    <span className="font-medium text-gray-900">{analysis.brand}</span>
                  </div>
                )}
                {analysis.model && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Modell:</span>
                    <span className="font-medium text-gray-900">{analysis.model}</span>
                  </div>
                )}
                {analysis.color && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Farbe:</span>
                    <span className="font-medium text-gray-900">{analysis.color}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleReset}
                  className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Neues Bild
                </button>
                <button
                  onClick={handleSearchWithQuery}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-600 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                >
                  <Search className="h-4 w-4" />
                  &quot;{analysis.searchQuery}&quot; suchen
                </button>
              </div>
            </div>

            {/* Search Results */}
            {results.length > 0 && (
              <div>
                <h4 className="mb-3 font-medium text-gray-900">
                  {results.length} ähnliche Artikel gefunden
                </h4>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {results.slice(0, 8).map(result => (
                    <ProductCard key={result.id} product={result} variant="compact" />
                  ))}
                </div>
                {results.length > 8 && (
                  <button
                    onClick={handleSearchWithQuery}
                    className="mt-4 w-full rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Alle {results.length} Ergebnisse anzeigen
                  </button>
                )}
              </div>
            )}

            {results.length === 0 && (
              <div className="py-8 text-center">
                <ImageIcon className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                <p className="text-gray-500">Keine ähnlichen Artikel gefunden.</p>
                <button
                  onClick={handleSearchWithQuery}
                  className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  Textsuche versuchen
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
