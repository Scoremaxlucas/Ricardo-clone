'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { FavoriteButton } from '@/components/favorites/FavoriteButton'
import { BidComponent } from '@/components/bids/BidComponent'
import { PriceOfferComponent } from '@/components/offers/PriceOfferComponent'
import { SellerProfile } from '@/components/seller/SellerProfile'
import { PickupMap } from '@/components/product/PickupMap'
import { SimilarProducts } from '@/components/product/SimilarProducts'
import { ProductQuestions } from '@/components/product/ProductQuestions'
import { ReportModal } from '@/components/moderation/ReportModal'
import { Flag } from 'lucide-react'

interface ProductPageClientProps {
  watch: any
  images: string[]
  conditionMap: Record<string, string>
  lieferumfang: string
  seller: any
}

export function ProductPageClient({ watch, images, conditionMap, lieferumfang, seller }: ProductPageClientProps) {
  const { t } = useLanguage()
  const { data: session } = useSession()
  const [showReportModal, setShowReportModal] = useState(false)

  // Track view
  useEffect(() => {
    if (watch?.id) {
      fetch(`/api/watches/${watch.id}/view`, { method: 'POST' }).catch(() => {})
    }
  }, [watch?.id])

  if (!watch) {
    return (
      <div className="p-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-gray-700">{t.product.notFound}</p>
          <Link href="/" className="text-primary-600 underline">{t.product.backToHome}</Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600 mb-4">
        <Link href="/" className="text-primary-600 hover:text-primary-700">{t.search.homepage}</Link>
        <span className="mx-2">›</span>
        <Link href="/search" className="text-primary-600 hover:text-primary-700">{t.search.title}</Link>
        <span className="mx-2">›</span>
        <span className="line-clamp-1">{watch.title}</span>
      </div>
      
      {/* Haupt-Grid: Links Bilder & Details, Rechts Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Linke Spalte: Bilder & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Artikelbilder & Hauptinfos */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {/* Bild oder Video */}
            <div className="relative mb-6">
              {watch.video ? (
                <div className="relative">
                  <video
                    src={watch.video}
                    controls
                    className="w-full h-96 object-contain rounded-lg bg-black"
                  />
                  <div className="absolute top-4 right-4">
                    <FavoriteButton watchId={watch.id} />
                  </div>
                </div>
              ) : images.length > 0 ? (
                <>
                  <img src={images[0]} alt={watch.title} className="w-full h-96 object-cover rounded-lg" />
                  <div className="absolute top-4 right-4">
                    <FavoriteButton watchId={watch.id} />
                  </div>
                </>
              ) : (
                <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 relative">
                  {t.home.noImage}
                  <div className="absolute top-4 right-4">
                    <FavoriteButton watchId={watch.id} />
                  </div>
                </div>
              )}
            </div>

            {/* Titel & Artikelnummer */}
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900 flex-1">{watch.title}</h1>
              {watch.articleNumber && (
                <div className="ml-4 text-sm text-gray-500">
                  <span className="font-medium">Artikelnummer:</span>{' '}
                  <span className="font-mono text-gray-700">{watch.articleNumber}</span>
                </div>
              )}
            </div>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
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
              <h2 className="text-xl font-bold text-gray-900 mb-4">{t.product.details}</h2>
              
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
                  <span className="w-2/3 text-gray-900">{conditionMap[watch.condition] || watch.condition}</span>
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
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t.product.description}</h2>
                <p className="text-gray-700 whitespace-pre-line">{watch.description}</p>
              </div>
            )}

            {/* Karte für Abholort */}
            {seller?.city && seller?.postalCode && (
              <div className="border-t border-gray-200 pt-6 mt-6">
                <PickupMap city={seller.city} postalCode={seller.postalCode} />
              </div>
            )}

            {/* Fragen & Antworten */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <ProductQuestions watchId={watch.id} sellerId={watch.sellerId} />
            </div>
          </div>
        </div>

        {/* Rechte Spalte: Gebote & Verkäufer */}
        <div className="space-y-6">
          {watch.isAuction ? (
            <BidComponent
              watchId={watch.id}
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
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
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
