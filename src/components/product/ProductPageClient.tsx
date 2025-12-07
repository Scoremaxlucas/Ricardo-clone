'use client'

import { BidComponent } from '@/components/bids/BidComponent'
import { FavoriteButton } from '@/components/favorites/FavoriteButton'
import { ReportModal } from '@/components/moderation/ReportModal'
import { PriceOfferComponent } from '@/components/offers/PriceOfferComponent'
import { PickupMap } from '@/components/product/PickupMap'
import { ProductQuestions } from '@/components/product/ProductQuestions'
import { SimilarProducts } from '@/components/product/SimilarProducts'
import { SellerProfile } from '@/components/seller/SellerProfile'
import { useLanguage } from '@/contexts/LanguageContext'
import { ChevronLeft, ChevronRight, Flag } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

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
  const [showReportModal, setShowReportModal] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const zoomImageRef = useRef<HTMLImageElement>(null)

  // Track view
  useEffect(() => {
    if (watch?.id) {
      fetch(`/api/watches/${watch.id}/view`, { method: 'POST' }).catch(() => {})
    }
  }, [watch?.id])

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
      {/* Breadcrumb */}
      <div className="mb-4 text-sm text-gray-600">
        <Link href="/" className="text-primary-600 hover:text-primary-700">
          {t.search.homepage}
        </Link>
        <span className="mx-2">›</span>
        <Link href="/search" className="text-primary-600 hover:text-primary-700">
          {t.search.title}
        </Link>
        <span className="mx-2">›</span>
        <span className="line-clamp-1">{watch.title}</span>
      </div>

      {/* Haupt-Grid: Links Bilder & Details, Rechts Sidebar */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Linke Spalte: Bilder & Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Artikelbilder & Hauptinfos */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            {/* Bild oder Video */}
            <div className="relative mb-6">
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
                  {/* Hauptbild mit Zoom-Effekt */}
                  <div
                    ref={imageContainerRef}
                    className="relative h-96 w-full overflow-hidden rounded-lg bg-gray-100"
                    onMouseMove={(e) => {
                      if (!imageContainerRef.current || !zoomImageRef.current) return
                      const rect = imageContainerRef.current.getBoundingClientRect()
                      const x = ((e.clientX - rect.left) / rect.width) * 100
                      const y = ((e.clientY - rect.top) / rect.height) * 100
                      setZoomPosition({ x, y })
                      setIsZoomed(true)
                    }}
                    onMouseLeave={() => setIsZoomed(false)}
                  >
                    {/* Hauptbild */}
                    {images[selectedImageIndex]?.startsWith('data:image/') ||
                    images[selectedImageIndex]?.length > 1000 ? (
                      <img
                        ref={zoomImageRef}
                        src={images[selectedImageIndex]}
                        alt={watch.title}
                        className={`h-full w-full object-contain transition-transform duration-200 ${
                          isZoomed ? 'scale-[2]' : 'scale-100'
                        }`}
                        style={{
                          transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                        }}
                      />
                    ) : (
                      <Image
                        ref={zoomImageRef}
                        src={images[selectedImageIndex]}
                        alt={watch.title}
                        fill
                        className={`object-contain transition-transform duration-200 ${
                          isZoomed ? 'scale-[2]' : 'scale-100'
                        }`}
                        style={{
                          transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                        }}
                        sizes="(max-width: 768px) 100vw, 66vw"
                      />
                    )}

                    {/* Zoom-Indikator - Entfernt, da keine Verfärbung gewünscht */}

                    {/* Navigation Pfeile (wenn mehrere Bilder) */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedImageIndex((prev) =>
                              prev === 0 ? images.length - 1 : prev - 1
                            )
                          }}
                          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg transition-all hover:bg-white"
                          aria-label="Vorheriges Bild"
                        >
                          <ChevronLeft className="h-6 w-6 text-gray-700" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedImageIndex((prev) =>
                              prev === images.length - 1 ? 0 : prev + 1
                            )
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg transition-all hover:bg-white"
                          aria-label="Nächstes Bild"
                        >
                          <ChevronRight className="h-6 w-6 text-gray-700" />
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
                    <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                      {images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                            selectedImageIndex === index
                              ? 'border-gray-600 ring-2 ring-gray-200'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {image?.startsWith('data:image/') || image?.length > 1000 ? (
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
                <div className="relative flex h-96 w-full items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                  {t.home.noImage}
                  <div className="absolute right-4 top-4">
                    <FavoriteButton watchId={watch.id} />
                  </div>
                </div>
              )}
            </div>

            {/* Titel & Artikelnummer */}
            <div className="mb-4 flex items-start justify-between">
              <h1 className="flex-1 text-3xl font-bold text-gray-900">{watch.title}</h1>
              {watch.articleNumber && (
                <div className="ml-4 text-sm text-gray-500">
                  <span className="font-medium">Artikelnummer:</span>{' '}
                  <span className="font-mono text-gray-700">{watch.articleNumber}</span>
                </div>
              )}
            </div>

            <div className="mb-6 rounded-lg bg-gray-50 p-4">
              {watch.buyNowPrice ? (
                <>
                  <div className="mb-3">
                    <div className="text-sm text-gray-600">{t.product.startingPrice}</div>
                    <div className="text-2xl font-bold text-primary-600">
                      {t.common.chf} {new Intl.NumberFormat('de-CH').format(watch.price)}
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="text-sm text-gray-600">{t.product.buyNowPrice}</div>
                    <div className="text-3xl font-bold text-green-600">
                      {t.common.chf} {new Intl.NumberFormat('de-CH').format(watch.buyNowPrice)}
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <div className="text-sm text-gray-600">{t.product.price}</div>
                  <div className="text-3xl font-bold text-primary-600">
                    {t.common.chf} {new Intl.NumberFormat('de-CH').format(watch.price)}
                  </div>
                </div>
              )}
            </div>

            {/* Produktdetails */}
            <div className="space-y-3 border-t border-gray-200 pt-6">
              <h2 className="mb-4 text-xl font-bold text-gray-900">{t.product.details}</h2>

              {watch.brand && (
                <div className="flex">
                  <span className="w-1/3 font-semibold text-gray-700">{t.product.brand}:</span>
                  <span className="w-2/3 text-gray-900">{watch.brand}</span>
                </div>
              )}
              {watch.model && (
                <div className="flex">
                  <span className="w-1/3 font-semibold text-gray-700">{t.product.model}:</span>
                  <span className="w-2/3 text-gray-900">{watch.model}</span>
                </div>
              )}
              {(watch as any).referenceNumber && (
                <div className="flex">
                  <span className="w-1/3 font-semibold text-gray-700">Referenznummer:</span>
                  <span className="w-2/3 text-gray-900">{(watch as any).referenceNumber}</span>
                </div>
              )}
              {watch.condition && (
                <div className="flex">
                  <span className="w-1/3 font-semibold text-gray-700">{t.product.condition}:</span>
                  <span className="w-2/3 text-gray-900">
                    {conditionMap[watch.condition] || watch.condition}
                  </span>
                </div>
              )}
              {(watch as any).year && (
                <div className="flex">
                  <span className="w-1/3 font-semibold text-gray-700">Jahr:</span>
                  <span className="w-2/3 text-gray-900">{(watch as any).year}</span>
                </div>
              )}
              {lieferumfang && (
                <div className="flex">
                  <span className="w-1/3 font-semibold text-gray-700">Lieferumfang:</span>
                  <span className="w-2/3 text-gray-900">{lieferumfang}</span>
                </div>
              )}
            </div>

            {/* Beschreibung */}
            {watch.description && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h2 className="mb-4 text-xl font-bold text-gray-900">{t.product.description}</h2>
                <p className="whitespace-pre-line text-gray-700">{watch.description}</p>
              </div>
            )}

            {/* Karte für Abholort - IMMER anzeigen wenn Seller vorhanden */}
            {seller && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <PickupMap
                  city={seller.city || 'Schweiz'}
                  postalCode={seller.postalCode || ''}
                />
              </div>
            )}

            {/* Fragen & Antworten */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <ProductQuestions watchId={watch.id} sellerId={watch.sellerId} />
            </div>
          </div>
        </div>

        {/* Rechte Spalte: Gebote & Verkäufer */}
        <div className="space-y-6">
          {watch.isAuction ? (
            <BidComponent
              itemId={watch.id}
              startPrice={watch.price}
              buyNowPrice={watch.buyNowPrice}
              auctionEnd={watch.auctionEnd}
              sellerId={watch.sellerId}
              shippingMethod={(watch as any).shippingMethod}
            />
          ) : (
            <PriceOfferComponent
              watchId={watch.id}
              price={watch.price}
              sellerId={watch.sellerId}
              buyNowPrice={watch.buyNowPrice}
              shippingMethod={(watch as any).shippingMethod}
            />
          )}

          <SellerProfile
            sellerId={watch.sellerId}
            sellerName={seller?.name || t.common.unknown}
            sellerEmail={seller?.email || ''}
          />

          {/* Report-Button */}
          {session?.user && session.user.id !== watch.sellerId && (
            <div className="mt-4 border-t border-gray-200 pt-4">
              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-red-600"
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
