'use client'

import { ProductItem } from '@/lib/products'
import { ProductCard } from '@/components/ui/ProductCard'
import { useLanguage } from '@/contexts/LanguageContext'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface FeaturedProductsServerProps {
  initialProducts: ProductItem[]
}

export function FeaturedProductsServer({ initialProducts }: FeaturedProductsServerProps) {
  const { t } = useLanguage()
  const { data: session } = useSession()
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  // OPTIMIERT: initialProducts enthalten keine Base64-Bilder mehr (reduziert ISR-Größe)
  // Bilder werden client-side nachgeladen
  const [products, setProducts] = useState<ProductItem[]>(initialProducts)
  const [loading, setLoading] = useState(initialProducts.length === 0)
  const [imagesLoaded, setImagesLoaded] = useState<Record<string, string[]>>({})

  // OPTIMIERT: Lade Bilder aus localStorage Cache oder von API
  // Cache wird persistent gespeichert, damit Bilder nach Navigation erhalten bleiben
  useEffect(() => {
    if (initialProducts.length > 0) {
      // Lade Cache aus localStorage
      const cacheKey = 'product-images-cache'
      const cachedImages: Record<string, { images: string[]; timestamp: number }> = (() => {
        try {
          const cached = localStorage.getItem(cacheKey)
          if (cached) {
            const parsed = JSON.parse(cached)
            // Entferne alte Einträge (älter als 1 Stunde)
            const now = Date.now()
            const oneHour = 60 * 60 * 1000
            Object.keys(parsed).forEach(id => {
              if (parsed[id].timestamp && now - parsed[id].timestamp > oneHour) {
                delete parsed[id]
              }
            })
            return parsed
          }
        } catch (error) {
          console.error('Error loading image cache:', error)
        }
        return {}
      })()

      // Initialisiere mit gecachten Bildern
      const initialImagesMap: Record<string, string[]> = {}
      initialProducts.forEach(product => {
        if (cachedImages[product.id]?.images) {
          initialImagesMap[product.id] = cachedImages[product.id].images
        }
      })
      setImagesLoaded(initialImagesMap)

      // Lade fehlende Bilder von API
      const productsToLoad = initialProducts.filter(p => !cachedImages[p.id]?.images)
      if (productsToLoad.length > 0) {
        Promise.all(
          productsToLoad.map(async (product) => {
            try {
              const response = await fetch(`/api/watches/${product.id}/images`)
              if (response.ok) {
                const data = await response.json()
                return { id: product.id, images: data.images || [] }
              }
            } catch (error) {
              console.error(`Error loading images for product ${product.id}:`, error)
            }
            return { id: product.id, images: [] }
          })
        ).then((imageData) => {
          const newImagesMap: Record<string, string[]> = { ...initialImagesMap }
          imageData.forEach(({ id, images }) => {
            newImagesMap[id] = images
            // Speichere im Cache
            cachedImages[id] = { images, timestamp: Date.now() }
          })
          setImagesLoaded(newImagesMap)
          
          // Speichere aktualisierten Cache
          try {
            localStorage.setItem(cacheKey, JSON.stringify(cachedImages))
          } catch (error) {
            console.error('Error saving image cache:', error)
          }
        })
      }
    }
  }, [initialProducts.length])

  // WICHTIG: Wenn initialProducts leer ist, lade sofort von API-Route
  useEffect(() => {
    if (initialProducts.length === 0) {
      let retryCount = 0
      const maxRetries = 3

      const loadProducts = async () => {
        try {
          setLoading(true)
          const response = await fetch('/api/articles/fast?limit=6')
          if (response.ok) {
            const data = await response.json()
            if (data.watches && Array.isArray(data.watches) && data.watches.length > 0) {
              // Transformiere API-Format zu ProductItem-Format
              const transformedProducts: ProductItem[] = data.watches.map((w: any) => {
                // WICHTIG: Verwende articleNumber für Link, falls vorhanden, sonst CUID
                // Dies stellt sicher, dass Produkte korrekt verlinkt sind
                const productId = w.articleNumber ? w.articleNumber.toString() : w.id

                return {
                  id: w.id, // Behalte CUID für interne Verwendung
                  title: w.title || '',
                  brand: w.brand || '',
                  model: w.model || '',
                  price: w.price || 0,
                  buyNowPrice: w.buyNowPrice,
                  isAuction: w.isAuction || false,
                  auctionEnd: w.auctionEnd || null,
                  images: Array.isArray(w.images) ? w.images : [],
                  condition: w.condition || '',
                  createdAt: w.createdAt || new Date().toISOString(),
                  boosters: w.boosters || [],
                  city: w.city || null,
                  postalCode: w.postalCode || null,
                  articleNumber: w.articleNumber || null,
                  // WICHTIG: Setze href explizit, damit der richtige Link verwendet wird
                  href: `/products/${productId}`,
                }
              })
              setProducts(transformedProducts)
              setLoading(false)
              return
            }
          }
          // Wenn keine Daten, retry wenn noch Versuche übrig
          if (retryCount < maxRetries) {
            retryCount++
            setTimeout(() => {
              loadProducts()
            }, 2000)
          } else {
            setLoading(false)
          }
        } catch (error) {
          console.error('Error loading products from API:', error)
          // Retry nach 2 Sekunden wenn Fehler und noch Versuche übrig
          if (retryCount < maxRetries) {
            retryCount++
            setTimeout(() => {
              loadProducts()
            }, 2000)
          } else {
            setLoading(false)
          }
        }
      }
      loadProducts()
    }
  }, [initialProducts.length])

  // Load favorites client-side (non-blocking)
  useEffect(() => {
    if (!session?.user) return

    fetch('/api/favorites')
      .then(res => res.json())
      .then(data => {
        setFavorites(new Set(data.favorites?.map((f: any) => f.watchId) || []))
      })
      .catch(() => {
        // Silently fail - favorites are not critical
      })
  }, [session?.user])

  if (loading) {
    return (
      <section className="bg-[#FAFAFA] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-3xl font-extrabold text-gray-900 md:text-4xl">
              {t.home.featured}
            </h2>
            <p className="text-lg leading-relaxed text-gray-600">{t.home.discoverLatest}</p>
          </div>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            <p className="ml-3 text-gray-600">Artikel werden geladen...</p>
          </div>
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return (
      <section className="bg-[#FAFAFA] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">{t.home.featured}</h2>
            <p className="text-lg text-gray-600">{t.home.noItemsYet}</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-[#FAFAFA] py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-3xl font-extrabold text-gray-900 md:text-4xl">
            {t.home.featured}
          </h2>
          <p className="text-lg leading-relaxed text-gray-600">{t.home.discoverLatest}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="flex h-full min-w-0 animate-in fade-in slide-in-from-bottom-4 duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <ProductCard
                id={product.id}
                title={product.title}
                brand={product.brand}
                model={product.model}
                price={product.price}
                buyNowPrice={product.buyNowPrice ?? undefined}
                isAuction={product.isAuction}
                auctionEnd={product.auctionEnd ?? undefined}
                images={imagesLoaded[product.id]?.length > 0 ? imagesLoaded[product.id] : product.images} // Verwende gecachte Bilder oder Server-Bilder
                condition={product.condition}
                city={product.city ?? undefined}
                postalCode={product.postalCode ?? undefined}
                boosters={product.boosters}
                href={product.href} // WICHTIG: Verwende expliziten href, falls vorhanden
                showCondition={true}
                showViewButton={true}
                viewButtonText={t.home.viewOffer}
                favorites={favorites}
                className="w-full"
                onFavoriteToggle={(id, isFavorite) => {
                  setFavorites(prev => {
                    const newSet = new Set(prev)
                    if (isFavorite) {
                      newSet.add(id)
                    } else {
                      newSet.delete(id)
                    }
                    return newSet
                  })
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

