'use client'

import { BidComponent } from '@/components/bids/BidComponent'
import { FavoriteButton } from '@/components/favorites/FavoriteButton'
import { ReportModal } from '@/components/moderation/ReportModal'
import { PriceOfferComponent } from '@/components/offers/PriceOfferComponent'
import { PaymentProtectionBadge } from '@/components/product/PaymentProtectionBadge'
import { PickupMap } from '@/components/product/PickupMap'
import { ProductQuestions } from '@/components/product/ProductQuestions'
import { ProductStats } from '@/components/product/ProductStats'
import { SimilarProducts } from '@/components/product/SimilarProducts'
import { SellerProfile } from '@/components/seller/SellerProfile'
import { useLanguage } from '@/contexts/LanguageContext'
import { ChevronLeft, ChevronRight, Clock, Flag, Heart, X, Zap } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useSwipeable } from 'react-swipeable'

interface ProductPageClientProps {
  watch: any
  images: string[]
  conditionMap: Record<string, string>
  lieferumfang: string
  seller: any
}

export function ProductPageClient({
  watch,
  images,
  conditionMap,
  lieferumfang,
  seller,
}: ProductPageClientProps) {
  const { t } = useLanguage()
  const { data: session } = useSession()
  const router = useRouter()
  const [showReportModal, setShowReportModal] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [modalImageIndex, setModalImageIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [pinchZoom, setPinchZoom] = useState(1)
  const [pinchStartDistance, setPinchStartDistance] = useState<number | null>(null)
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const zoomImageRef = useRef<HTMLImageElement>(null)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Track view (Feature 2: Social Proof)
  useEffect(() => {
    if (watch?.id) {
      // Track view using /api/products/[id]/view for complete WatchView tracking
      // This creates a WatchView entry AND updates ProductStats
      fetch(`/api/products/${watch.id}/view`, { method: 'POST' }).catch(err => {
        console.error('[ProductPageClient] Error tracking view:', err)
      })
    }
  }, [watch?.id])

  // Check if watch is in favorites
  useEffect(() => {
    const checkFavorite = async () => {
      if (!session?.user || !watch?.id) return
      try {
        const res = await fetch('/api/favorites')
        if (res.ok) {
          const data = await res.json()
          const favoriteIds = (data.favorites || []).map((f: any) => f.watchId)
          setIsFavorite(favoriteIds.includes(watch.id))
        }
      } catch (error) {
        console.error('Error checking favorite:', error)
      }
    }
    checkFavorite()
  }, [watch?.id, session?.user])

  // Toggle favorite
  const toggleFavorite = async () => {
    if (!session?.user) {
      const currentUrl = typeof window !== 'undefined' ? window.location.pathname : '/'
      router.push(`/login?callbackUrl=${encodeURIComponent(currentUrl)}`)
      return
    }
    if (favoriteLoading || !watch?.id) return

    setFavoriteLoading(true)
    try {
      if (isFavorite) {
        const res = await fetch(`/api/favorites/${watch.id}`, { method: 'DELETE' })
        if (res.ok) setIsFavorite(false)
      } else {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ watchId: watch.id }),
        })
        if (res.ok) setIsFavorite(true)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    } finally {
      setFavoriteLoading(false)
    }
  }

  // Berechne Aspect Ratio des aktuellen Bildes
  useEffect(() => {
    if (images.length > 0 && selectedImageIndex < images.length) {
      const img = new window.Image()
      img.onload = () => {
        setImageAspectRatio(img.width / img.height)
      }
      img.onerror = () => {
        // Fallback: Setze Standard-Aspect-Ratio wenn Bild nicht geladen werden kann
        setImageAspectRatio(1)
      }
      img.src = images[selectedImageIndex]
    }
  }, [images, selectedImageIndex])

  // Keyboard-Navigation für Modal
  useEffect(() => {
    if (!isImageModalOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsImageModalOpen(false)
      } else if (e.key === 'ArrowLeft') {
        setModalImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))
      } else if (e.key === 'ArrowRight') {
        setModalImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isImageModalOpen, images.length])

  // Öffne Modal mit dem geklickten Bild
  const openImageModal = (index: number) => {
    setModalImageIndex(index)
    setIsImageModalOpen(true)
    // Verhindere Body-Scroll wenn Modal offen ist
    document.body.style.overflow = 'hidden'
  }

  // Schließe Modal
  const closeImageModal = () => {
    setIsImageModalOpen(false)
    document.body.style.overflow = 'unset'
  }

  // Navigiere im Modal
  const navigateModalImage = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setModalImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))
    } else {
      setModalImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))
    }
    // Reset pinch zoom when navigating
    setPinchZoom(1)
  }

  // Swipe handlers for main image gallery
  const mainImageSwipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (images.length > 1) {
        setSelectedImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))
      }
    },
    onSwipedRight: () => {
      if (images.length > 1) {
        setSelectedImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))
      }
    },
    trackMouse: false, // Only track touch
    preventScrollOnSwipe: true,
  })

  // Swipe handlers for modal image gallery
  const modalImageSwipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (images.length > 1 && pinchZoom === 1) {
        navigateModalImage('next')
      }
    },
    onSwipedRight: () => {
      if (images.length > 1 && pinchZoom === 1) {
        navigateModalImage('prev')
      }
    },
    trackMouse: false,
    preventScrollOnSwipe: true,
  })

  // Touch handlers for zoom on mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
      setPinchStartDistance(distance)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDistance !== null) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
      const scale = distance / pinchStartDistance
      setPinchZoom(Math.max(1, Math.min(scale * pinchZoom, 3)))
    }
  }

  const handleTouchEnd = () => {
    setPinchStartDistance(null)
    if (pinchZoom < 1.1) {
      setPinchZoom(1)
    }
  }

  // Helper: Format shipping method from JSON or string
  const formatShippingMethod = (method: any): string => {
    if (!method) return ''

    // If it's a string that looks like JSON array
    if (typeof method === 'string') {
      try {
        const parsed = JSON.parse(method)
        if (Array.isArray(parsed)) {
          return parsed.map((m: string) => {
            if (m === 'pickup') return 'Abholung'
            if (m === 'b-post') return 'Paket B-Post, CHF 8.50'
            if (m === 'a-post') return 'Paket A-Post, CHF 12.50'
            if (m === 'shipping') return 'Versand'
            return m
          }).join(' / ')
        }
      } catch {
        // Not JSON, handle as plain string
      }

      if (method === 'shipping') return 'Versand möglich'
      if (method === 'pickup') return 'Nur Abholung'
      if (method === 'both') return 'Versand oder Abholung'
      return method
    }

    if (Array.isArray(method)) {
      return method.map((m: string) => {
        if (m === 'pickup') return 'Abholung'
        if (m === 'b-post') return 'Paket B-Post, CHF 8.50'
        if (m === 'a-post') return 'Paket A-Post, CHF 12.50'
        if (m === 'shipping') return 'Versand'
        return m
      }).join(' / ')
    }

    return String(method)
  }

  if (!watch) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-gray-700">{t.product.notFound}</p>
          <Link href="/" className="text-primary-600 underline">
            {t.product.backToHome}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Bild-Modal (Fullscreen) */}
      {isImageModalOpen && images.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={closeImageModal}
        >
          {/* Schließen-Button - Größer auf Mobile */}
          <button
            onClick={closeImageModal}
            className="absolute right-2 top-2 z-10 rounded-full bg-white/10 p-2 text-white transition-all hover:bg-white/20 md:right-4 md:top-4"
            style={{ minWidth: '44px', minHeight: '44px' }}
            aria-label="Schließen"
          >
            <X className="h-5 w-5 md:h-6 md:w-6" />
          </button>

          {/* Hauptbild im Modal */}
          <div
            {...modalImageSwipeHandlers}
            className="relative flex h-full w-full items-center justify-center p-8"
            onClick={e => e.stopPropagation()}
          >
            {/* Navigation: Vorheriges Bild */}
            {images.length > 1 && (
              <button
                onClick={e => {
                  e.stopPropagation()
                  navigateModalImage('prev')
                }}
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-all hover:bg-white/20 md:left-4"
                style={{ minWidth: '48px', minHeight: '48px' }}
                aria-label="Vorheriges Bild"
              >
                <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
              </button>
            )}

            {/* Bild */}
            <div
              className="relative h-full max-h-[90vh] w-full max-w-[90vw] overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {images[modalImageIndex]?.startsWith('data:image/') ||
              images[modalImageIndex]?.length > 1000 ||
              images[modalImageIndex]?.includes('blob.vercel-storage.com') ? (
                <img
                  src={images[modalImageIndex]}
                  alt={`${watch.title} - Bild ${modalImageIndex + 1}`}
                  className="h-full w-full object-contain transition-transform duration-200"
                  style={{
                    transform: `scale(${pinchZoom})`,
                    transformOrigin: 'center center',
                  }}
                />
              ) : (
                <div
                  className="relative h-full w-full"
                  style={{
                    transform: `scale(${pinchZoom})`,
                    transformOrigin: 'center center',
                    transition: pinchStartDistance === null ? 'transform 0.2s' : 'none',
                  }}
                >
                  <Image
                    src={images[modalImageIndex]}
                    alt={`${watch.title} - Bild ${modalImageIndex + 1}`}
                    fill
                    className="object-contain"
                    sizes="90vw"
                  />
                </div>
              )}
            </div>

            {/* Navigation: Nächstes Bild */}
            {images.length > 1 && (
              <button
                onClick={e => {
                  e.stopPropagation()
                  navigateModalImage('next')
                }}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-all hover:bg-white/20 md:right-4"
                style={{ minWidth: '48px', minHeight: '48px' }}
                aria-label="Nächstes Bild"
              >
                <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
              </button>
            )}

            {/* Bildnummer Anzeige */}
            {images.length > 1 && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-sm text-white">
                {modalImageIndex + 1} / {images.length}
              </div>
            )}

            {/* Thumbnail-Galerie im Modal */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={e => {
                      e.stopPropagation()
                      setModalImageIndex(index)
                    }}
                    className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                      modalImageIndex === index
                        ? 'border-white ring-2 ring-white/50'
                        : 'border-white/30 hover:border-white/60'
                    }`}
                  >
                    {image?.startsWith('data:image/') ||
                    image?.length > 1000 ||
                    image?.includes('blob.vercel-storage.com') ? (
                      <img
                        src={image}
                        alt={`${watch.title} - Bild ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Image
                        src={image}
                        alt={`${watch.title} - Bild ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Breadcrumb - Hidden on mobile for cleaner look */}
      <div className="mb-2 hidden text-sm text-gray-600 md:mb-4 md:block">
        <Link href="/" className="text-primary-600 hover:text-primary-700">
          {t.search.homepage}
        </Link>
        <span className="mx-2">›</span>
        <Link href="/search" className="text-primary-600 hover:text-primary-700">
          {t.search.title}
        </Link>
        <span className="mx-2">›</span>
        <span className="line-clamp-1">
          {watch.title?.replace(/^["']|["']$/g, '').trim() || watch.title}
        </span>
      </div>

      {/* Haupt-Grid: Links Bilder & Details, Rechts Sidebar */}
      <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-3">
        {/* Linke Spalte: Bilder & Details */}
        <div className="space-y-4 md:space-y-6 lg:col-span-2">
          {/* Artikelbilder & Hauptinfos */}
          <div className="rounded-lg bg-white p-3 shadow-md md:p-6">
            {/* Bild oder Video */}
            <div className="relative mb-3 md:mb-6">
              {watch.video ? (
                <div className="relative">
                  <video
                    src={watch.video}
                    controls
                    className="h-96 w-full rounded-lg bg-black object-contain"
                  />
                  <div className="absolute right-4 top-4">
                    <FavoriteButton watchId={watch.id} />
                  </div>
                </div>
              ) : images.length > 0 ? (
                <>
                  {/* Hauptbild mit Zoom-Effekt - Container passt sich an Bildformat an */}
                  <div
                    {...mainImageSwipeHandlers}
                    ref={imageContainerRef}
                    className="relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-white"
                    style={{
                      aspectRatio: imageAspectRatio ? `${imageAspectRatio}` : 'auto',
                      minHeight: isMobile ? '280px' : '400px',
                      maxHeight: isMobile ? '400px' : '600px',
                    }}
                    onClick={() => openImageModal(selectedImageIndex)}
                    onMouseMove={e => {
                      // Desktop-only hover zoom
                      if (!isMobile && imageContainerRef.current && zoomImageRef.current) {
                        const rect = imageContainerRef.current.getBoundingClientRect()
                        const x = ((e.clientX - rect.left) / rect.width) * 100
                        const y = ((e.clientY - rect.top) / rect.height) * 100
                        setZoomPosition({ x, y })
                        setIsZoomed(true)
                      }
                    }}
                    onMouseLeave={() => {
                      if (!isMobile) setIsZoomed(false)
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    {/* Hauptbild */}
                    {images[selectedImageIndex]?.startsWith('data:image/') ||
                    images[selectedImageIndex]?.length > 1000 ||
                    images[selectedImageIndex]?.includes('blob.vercel-storage.com') ? (
                      <img
                        ref={zoomImageRef}
                        src={images[selectedImageIndex]}
                        alt={watch.title}
                        className={`h-auto max-h-full w-auto max-w-full object-contain transition-transform duration-200 ease-out ${
                          !isMobile && isZoomed ? 'scale-[2.5]' : 'scale-100'
                        }`}
                        style={{
                          transformOrigin: isMobile
                            ? 'center center'
                            : `${zoomPosition.x}% ${zoomPosition.y}%`,
                          transform: isMobile ? `scale(${pinchZoom})` : undefined,
                        }}
                      />
                    ) : (
                      <Image
                        ref={zoomImageRef}
                        src={images[selectedImageIndex]}
                        alt={watch.title}
                        fill
                        className={`object-contain transition-transform duration-200 ease-out ${
                          !isMobile && isZoomed ? 'scale-[2.5]' : 'scale-100'
                        }`}
                        style={{
                          transformOrigin: isMobile
                            ? 'center center'
                            : `${zoomPosition.x}% ${zoomPosition.y}%`,
                          transform: isMobile ? `scale(${pinchZoom})` : undefined,
                        }}
                        sizes="(max-width: 768px) 100vw, 66vw"
                      />
                    )}

                    {/* Zoom-Indikator - Entfernt, da keine Verfärbung gewünscht */}

                    {/* Navigation Pfeile (wenn mehrere Bilder) - Größer auf Mobile für bessere Touch-Targets */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            setSelectedImageIndex(prev =>
                              prev === 0 ? images.length - 1 : prev - 1
                            )
                            setPinchZoom(1)
                          }}
                          className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg transition-all hover:bg-white md:left-4 md:p-2"
                          style={{ minWidth: '44px', minHeight: '44px' }}
                          aria-label="Vorheriges Bild"
                        >
                          <ChevronLeft className="h-6 w-6 text-gray-700 md:h-6 md:w-6" />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            setSelectedImageIndex(prev =>
                              prev === images.length - 1 ? 0 : prev + 1
                            )
                            setPinchZoom(1)
                          }}
                          className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg transition-all hover:bg-white md:right-4 md:p-2"
                          style={{ minWidth: '44px', minHeight: '44px' }}
                          aria-label="Nächstes Bild"
                        >
                          <ChevronRight className="h-6 w-6 text-gray-700 md:h-6 md:w-6" />
                        </button>
                      </>
                    )}

                    {/* Bildnummer Anzeige */}
                    {images.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-sm text-white">
                        {selectedImageIndex + 1} / {images.length}
                      </div>
                    )}

                    {/* Favorite Button */}
                    <div className="absolute right-4 top-4">
                      <FavoriteButton watchId={watch.id} />
                    </div>
                  </div>

                  {/* Thumbnail-Galerie */}
                  {images.length > 1 && (
                    <div className="mt-2 flex gap-1.5 overflow-x-auto pb-2 md:mt-4 md:gap-2">
                      {images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedImageIndex(index)
                            openImageModal(index)
                          }}
                          className={`relative h-14 w-14 flex-shrink-0 cursor-pointer overflow-hidden rounded-md border-2 transition-all md:h-20 md:w-20 md:rounded-lg ${
                            selectedImageIndex === index
                              ? 'border-gray-600 ring-2 ring-gray-200'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {image?.startsWith('data:image/') ||
                          image?.length > 1000 ||
                          image?.includes('blob.vercel-storage.com') ? (
                            <img
                              src={image}
                              alt={`${watch.title} - Bild ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Image
                              src={image}
                              alt={`${watch.title} - Bild ${index + 1}`}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="relative flex h-96 w-full items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400">
                  {t.home.noImage}
                  <div className="absolute right-4 top-4">
                    <FavoriteButton watchId={watch.id} />
                  </div>
                </div>
              )}
            </div>

            {/* MOBILE ONLY: Titel, Datum, Preis, Buy/Offer, Seller - Ricardo-Style */}
            <div className="lg:hidden">
              {/* Titel */}
              <h1 className="mb-1 text-lg font-bold leading-tight text-gray-900">
                {watch.title?.replace(/^["']|["']$/g, '').trim() || watch.title}
              </h1>

              {/* Einstelldatum mit Clock-Icon wie Ricardo */}
              {watch.createdAt && (
                <div className="mb-3 flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(watch.createdAt).toLocaleDateString('de-CH', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}, {new Date(watch.createdAt).toLocaleTimeString('de-CH', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })} Uhr
                </div>
              )}

              {/* Preis-Label wie Ricardo */}
              <div className="mb-1 text-xs text-gray-600">Verkaufspreis</div>
              <div className="mb-3 text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat('de-CH').format(watch.buyNowPrice || watch.price)}
              </div>

              {/* Sofortkauf Box - Ricardo Style */}
              {!watch.isAuction && (
                <div className="mb-3 rounded-lg border border-primary-200 bg-primary-50 p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary-700">
                    <Zap className="h-3.5 w-3.5" />
                    SOFORTKAUF VERFÜGBAR
                  </div>
                  <div className="text-xl font-bold text-primary-600">
                    CHF {new Intl.NumberFormat('de-CH').format(watch.buyNowPrice || watch.price)}
                  </div>
                  <div className="mt-0.5 text-xs text-primary-600">
                    Artikel sofort kaufen ohne Verhandlung
                  </div>
                </div>
              )}

              {/* Buy/Offer Section */}
              <div className="mb-3">
                {watch.isAuction ? (
                  <BidComponent
                    itemId={watch.id}
                    startPrice={watch.price}
                    buyNowPrice={watch.buyNowPrice}
                    auctionEnd={watch.auctionEnd}
                    sellerId={watch.sellerId}
                    shippingMethod={(watch as any).shippingMethod}
                    paymentProtectionEnabled={(watch as any).paymentProtectionEnabled ?? false}
                  />
                ) : (
                  <PriceOfferComponent
                    watchId={watch.id}
                    price={watch.price}
                    sellerId={watch.sellerId}
                    buyNowPrice={watch.buyNowPrice}
                    shippingMethod={(watch as any).shippingMethod}
                    paymentProtectionEnabled={(watch as any).paymentProtectionEnabled ?? false}
                  />
                )}
              </div>

              {/* Versandinfo Hinweis */}
              <div className="mb-3 text-center text-xs text-gray-500">
                Versandoptionen werden im nächsten Schritt angezeigt
              </div>

              {/* Zu Favoriten Button - Full Width wie Ricardo */}
              <button
                onClick={toggleFavorite}
                disabled={favoriteLoading}
                className={`mb-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
                  isFavorite
                    ? 'border-red-500 bg-red-50 text-red-600'
                    : 'border-primary-600 bg-white text-primary-600'
                }`}
              >
                <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                {isFavorite ? 'AUS FAVORITEN ENTFERNEN' : 'ZU FAVORITEN HINZUFÜGEN'}
              </button>

              {/* Lieferung Info */}
              {(watch as any).shippingMethod && (
                <div className="mb-3 rounded-lg bg-gray-50 px-3 py-2">
                  <div className="text-xs text-gray-600">Lieferung</div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatShippingMethod((watch as any).shippingMethod)}
                  </div>
                </div>
              )}

              {/* Seller Profile - Kompakter */}
              <div className="mb-3 rounded-lg border border-gray-200 bg-white">
                <SellerProfile
                  sellerId={watch.sellerId}
                  sellerName={seller?.name || t.common.unknown}
                  sellerEmail={seller?.email || ''}
                />
              </div>

              {/* Report-Button Mobile */}
              {session?.user && (session.user as { id?: string })?.id !== watch.sellerId && (
                <div className="mb-3 text-center">
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-red-600"
                  >
                    <Flag className="h-3.5 w-3.5" />
                    Angebot melden
                  </button>
                </div>
              )}
            </div>

            {/* Product Stats - Feature 2: Social Proof */}
            <div className="mb-3 md:mb-6">
              <ProductStats watchId={watch.id} showViewersNow={true} showSoldLast24h={true} />
            </div>

            {/* Produktdetails - Kompakt auf Mobile */}
            <div className="space-y-2 border-t border-gray-200 pt-3 md:space-y-3 md:pt-6">
              <h2 className="mb-2 text-base font-bold text-gray-900 md:mb-4 md:text-xl">{t.product.details}</h2>

              {watch.condition && (
                <div className="flex text-sm md:text-base">
                  <span className="w-1/3 font-medium text-gray-600 md:font-semibold md:text-gray-700">{t.product.condition}:</span>
                  <span className="w-2/3 text-gray-900">
                    {conditionMap[watch.condition] || watch.condition}
                  </span>
                </div>
              )}
              {watch.brand && (
                <div className="flex text-sm md:text-base">
                  <span className="w-1/3 font-medium text-gray-600 md:font-semibold md:text-gray-700">{t.product.brand}:</span>
                  <span className="w-2/3 text-gray-900">{watch.brand}</span>
                </div>
              )}
              {watch.model && (
                <div className="flex text-sm md:text-base">
                  <span className="w-1/3 font-medium text-gray-600 md:font-semibold md:text-gray-700">{t.product.model}:</span>
                  <span className="w-2/3 text-gray-900">{watch.model}</span>
                </div>
              )}
              {(watch as any).referenceNumber && (
                <div className="flex text-sm md:text-base">
                  <span className="w-1/3 font-medium text-gray-600 md:font-semibold md:text-gray-700">Referenznummer:</span>
                  <span className="w-2/3 text-gray-900">{(watch as any).referenceNumber}</span>
                </div>
              )}
              {(watch as any).year && (
                <div className="flex text-sm md:text-base">
                  <span className="w-1/3 font-medium text-gray-600 md:font-semibold md:text-gray-700">Jahr:</span>
                  <span className="w-2/3 text-gray-900">{(watch as any).year}</span>
                </div>
              )}
              {lieferumfang && (
                <div className="flex text-sm md:text-base">
                  <span className="w-1/3 font-medium text-gray-600 md:font-semibold md:text-gray-700">Lieferumfang:</span>
                  <span className="w-2/3 text-gray-900">{lieferumfang}</span>
                </div>
              )}
            </div>

            {/* Beschreibung */}
            {watch.description && (
              <div className="mt-3 border-t border-gray-200 pt-3 md:mt-6 md:pt-6">
                <h2 className="mb-2 text-base font-bold text-gray-900 md:mb-4 md:text-xl">{t.product.description}</h2>
                <p className="whitespace-pre-line text-sm text-gray-700 md:text-base">{watch.description}</p>
              </div>
            )}

            {/* Versand & Zahlung - Wie Ricardo */}
            <div className="mt-3 space-y-2 border-t border-gray-200 pt-3 md:mt-6 md:space-y-3 md:pt-6">
              {/* Versandmethode - Mit korrekter Formatierung */}
              {(watch as any).shippingMethod && (
                <div className="flex text-sm md:text-base">
                  <span className="w-1/3 font-medium text-gray-600 md:font-semibold md:text-gray-700">Lieferung:</span>
                  <span className="w-2/3 text-gray-900">
                    {formatShippingMethod((watch as any).shippingMethod)}
                  </span>
                </div>
              )}

              {/* Zahlungsmethode - Wie Ricardo */}
              <div className="flex text-sm md:text-base">
                <span className="w-1/3 font-medium text-gray-600 md:font-semibold md:text-gray-700">Zahlungsmethode:</span>
                <span className="w-2/3 text-gray-900">
                  {(watch as any).paymentProtectionEnabled
                    ? 'Sichere Zahlung via Helvenda'
                    : 'Barzahlung bei Übergabe'}
                </span>
              </div>
            </div>

            {/* Karte für Abholort - Vereinfacht wie Ricardo */}
            {seller && (
              <div className="mt-3 md:mt-6">
                <PickupMap city={seller.city || 'Schweiz'} postalCode={seller.postalCode || ''} />
              </div>
            )}

            {/* Fragen & Antworten */}
            <div className="mt-3 border-t border-gray-200 pt-3 md:mt-6 md:pt-6">
              <ProductQuestions watchId={watch.id} sellerId={watch.sellerId} />
            </div>

            {/* Artikelnummer - Ganz unten wie bei Ricardo */}
            {watch.articleNumber && (
              <div className="mt-3 border-t border-gray-200 pt-3 text-center md:mt-6 md:pt-6">
                <span className="text-xs text-gray-400 md:text-sm">
                  Artikelnummer: <span className="font-mono">{watch.articleNumber}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Rechte Spalte: DESKTOP ONLY - Wie Ricardo mit Titel, Preis, Kauf, etc. */}
        <div className="hidden space-y-4 lg:block">
          {/* Hauptkarte mit Titel, Datum, Preis */}
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            {/* Titel */}
            <h1 className="mb-2 text-xl font-bold text-gray-900 lg:text-2xl">
              {watch.title?.replace(/^["']|["']$/g, '').trim() || watch.title}
            </h1>

            {/* Datum mit Clock-Icon wie Ricardo */}
            {watch.createdAt && (
              <div className="mb-4 flex items-center gap-1.5 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                {new Date(watch.createdAt).toLocaleDateString('de-CH', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}, {new Date(watch.createdAt).toLocaleTimeString('de-CH', {
                  hour: '2-digit',
                  minute: '2-digit'
                })} Uhr
              </div>
            )}

            {/* Preis */}
            <div className="mb-4">
              {watch.buyNowPrice ? (
                <>
                  <div className="text-sm text-gray-600">Sofort-Kaufpreis</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {new Intl.NumberFormat('de-CH').format(watch.buyNowPrice)}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm text-gray-600">Verkaufspreis</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {new Intl.NumberFormat('de-CH').format(watch.price)}
                  </div>
                </>
              )}
              {(watch as any).paymentProtectionEnabled && (
                <div className="mt-1">
                  <PaymentProtectionBadge enabled={true} compact={true} showInfoLink={true} />
                </div>
              )}
            </div>

            {/* Kauf/Gebot Component */}
            {watch.isAuction ? (
              <BidComponent
                itemId={watch.id}
                startPrice={watch.price}
                buyNowPrice={watch.buyNowPrice}
                auctionEnd={watch.auctionEnd}
                sellerId={watch.sellerId}
                shippingMethod={(watch as any).shippingMethod}
                paymentProtectionEnabled={(watch as any).paymentProtectionEnabled ?? false}
              />
            ) : (
              <PriceOfferComponent
                watchId={watch.id}
                price={watch.price}
                sellerId={watch.sellerId}
                buyNowPrice={watch.buyNowPrice}
                shippingMethod={(watch as any).shippingMethod}
                paymentProtectionEnabled={(watch as any).paymentProtectionEnabled ?? false}
              />
            )}

            {/* Zu Favoriten hinzufügen - Wie Ricardo */}
            <button
              onClick={toggleFavorite}
              disabled={favoriteLoading}
              className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 px-4 py-2.5 font-semibold transition-colors disabled:opacity-50 ${
                isFavorite
                  ? 'border-red-500 bg-red-50 text-red-600 hover:bg-red-100'
                  : 'border-primary-600 bg-white text-primary-600 hover:bg-primary-50'
              }`}
            >
              <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
              {isFavorite ? 'AUS FAVORITEN ENTFERNEN' : 'ZU FAVORITEN HINZUFÜGEN'}
            </button>

            {/* Lieferung - Wie Ricardo */}
            {(watch as any).shippingMethod && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="text-sm text-gray-600">Lieferung</div>
                <div className="font-medium text-gray-900">
                  {formatShippingMethod((watch as any).shippingMethod)}
                </div>
              </div>
            )}
          </div>

          {/* Verkäufer-Karte */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <SellerProfile
              sellerId={watch.sellerId}
              sellerName={seller?.name || t.common.unknown}
              sellerEmail={seller?.email || ''}
            />
          </div>

          {/* Report-Button */}
          {session?.user && (session.user as { id?: string })?.id !== watch.sellerId && (
            <div className="text-center">
              <button
                onClick={() => setShowReportModal(true)}
                className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-red-600"
              >
                <Flag className="h-4 w-4" />
                Angebot melden
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Ähnliche Produkte */}
      {watch.brand && (
        <div className="mt-12">
          <SimilarProducts brand={watch.brand} currentProductId={watch.id} />
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        itemId={watch.id}
        itemTitle={watch.title}
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </>
  )
}
