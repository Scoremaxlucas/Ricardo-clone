'use client'

import { ProductItem } from '@/lib/products'
import { ProductCard } from '@/components/ui/ProductCard'
import { useLanguage } from '@/contexts/LanguageContext'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { preloadProductImages } from '@/lib/image-preloader'

interface FeaturedProductsServerProps {
  initialProducts: ProductItem[]
}

export function FeaturedProductsServer({ initialProducts }: FeaturedProductsServerProps) {
  const { t } = useLanguage()
  const { data: session } = useSession()
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  // OPTIMIERT: initialProducts können Base64-Bilder enthalten (mit VERCEL_BYPASS_FALLBACK_OVERSIZED_ERROR)
  // Cache wird verwendet um Bilder nach Navigation zu erhalten
  // KRITISCH: WIE RICARDO - Produkte sind sofort verfügbar, kein Loading-State!
  // WICHTIG: Initialisiere products State mit initialProducts UND stelle sicher, dass Bilder vorhanden sind
  const [products, setProducts] = useState<ProductItem[]>(() => {
    // Stelle sicher, dass alle Produkte ihre Bilder haben
    return initialProducts.map(p => ({
      ...p,
      // Stelle sicher, dass images immer ein Array ist
      images: Array.isArray(p.images) && p.images.length > 0 ? p.images : []
    }))
  })
  const [loading, setLoading] = useState(false) // Kein Loading mehr - alles sofort verfügbar!
  // WICHTIG: Initialisiere imagesLoaded sofort mit Server-Bildern, keine Wartezeit
  const [imagesLoaded, setImagesLoaded] = useState<Record<string, string[]>>(() => {
    const initialMap: Record<string, string[]> = {}
    initialProducts.forEach(product => {
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        initialMap[product.id] = product.images
      }
    })
    return initialMap
  })

  // OPTIMIERT: Verwende Server-Bilder sofort, keine Wartezeit auf Cache/API
  // Cache wird nur für Persistenz nach Navigation verwendet
  useEffect(() => {
    if (initialProducts.length === 0) return

    let isMounted = true
    const abortController = new AbortController()

    // Setze Bilder sofort aus initialProducts (Server-Response)
    const initialImagesMap: Record<string, string[]> = {}
    initialProducts.forEach(product => {
      // Verwende Server-Bilder wenn vorhanden
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        initialImagesMap[product.id] = product.images
      }
    })

    // KRITISCH: Setze State synchron, damit Bilder SOFORT angezeigt werden
    // Wie Ricardo - alles ist bereits im initialProducts, keine Verzögerung!
    setImagesLoaded(initialImagesMap)

    // KRITISCH: Stelle sicher, dass products State sofort gesetzt ist
    // Keine Wartezeit auf API-Calls - alles sofort verfügbar!
    // Stelle sicher, dass alle Produkte ihre Bilder haben
    setProducts(initialProducts.map(p => ({
      ...p,
      // Stelle sicher, dass images immer ein Array ist
      images: Array.isArray(p.images) && p.images.length > 0 ? p.images : []
    })))

    // OPTIMIERT: Preload images immediately for instant display
    if (initialProducts.length > 0) {
      preloadProductImages(initialProducts)
    }

    // Lade Cache aus localStorage für Persistenz nach Navigation
    const cacheKey = 'product-images-cache'
    let cachedImages: Record<string, { images: string[]; timestamp: number }> = {}
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
        cachedImages = parsed
      }
    } catch (error) {
      // Ignore cache errors
    }

    // Aktualisiere Cache mit Server-Bildern (asynchron, blockiert nicht)
    Object.keys(initialImagesMap).forEach(id => {
      cachedImages[id] = { images: initialImagesMap[id], timestamp: Date.now() }
    })

    try {
      localStorage.setItem(cacheKey, JSON.stringify(cachedImages))
    } catch (error) {
      // Ignore localStorage errors (quota exceeded, etc.)
    }

      // OPTIMIERT: Lade fehlende Bilder über Batch-API wenn nötig
      // Nur für Produkte ohne Bilder (wurden wegen Größe gefiltert)
      const productsToLoad = initialProducts.filter(
        p => !p.images?.length && !cachedImages[p.id]?.images
      )

      if (productsToLoad.length > 0) {
        const productIds = productsToLoad.map(p => p.id)

        // Timeout nach 2 Sekunden (schneller)
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Image loading timeout')), 2000)
        })

        Promise.race([
          fetch('/api/watches/images/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: productIds }),
            signal: abortController.signal,
          }),
          timeoutPromise,
        ])
          .then(async (response) => {
            if (!isMounted || !response.ok) return

            try {
              const data = await response.json()
              const batchImages = data.images || {}

              if (!isMounted) return

              setImagesLoaded(prev => {
                const newImagesMap = { ...prev }
                Object.entries(batchImages).forEach(([id, images]: [string, any]) => {
                  if (images && Array.isArray(images) && images.length > 0) {
                    newImagesMap[id] = images
                    cachedImages[id] = { images, timestamp: Date.now() }
                  }
                })

                try {
                  localStorage.setItem(cacheKey, JSON.stringify(cachedImages))
                } catch (error) {
                  // Ignore localStorage errors
                }

                return newImagesMap
              })

              setProducts(prev => {
                const updated = prev.map(p => {
                  const images = batchImages[p.id]
                  if (images && Array.isArray(images) && images.length > 0) {
                    return { ...p, images }
                  }
                  return p
                })
                preloadProductImages(updated)
                return updated
              })
            } catch (error: any) {
              // Silently fail - images will show from cache or remain empty
              if (error?.name !== 'AbortError' && error?.message !== 'Image loading timeout') {
                // Silent fail
              }
            }
          })
          .catch((error: any) => {
            // Silently fail - images already shown from initialProducts
            if (error.name !== 'AbortError' && error.message !== 'Image loading timeout' && isMounted) {
              // Silent fail
            }
          })
      }

    return () => {
      isMounted = false
      abortController.abort()
    }
  }, [initialProducts])

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

    let isMounted = true
    const abortController = new AbortController()

    fetch('/api/favorites', {
      signal: abortController.signal,
    })
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setFavorites(new Set(data.favorites?.map((f: any) => f.watchId) || []))
        }
      })
      .catch((error: any) => {
        // Silently fail - favorites are not critical
        if (error.name !== 'AbortError') {
          // Ignore abort errors
        }
      })

    return () => {
      isMounted = false
      abortController.abort()
    }
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
                images={
                  // KRITISCH: WIE RICARDO - Verwende product.images ODER imagesLoaded
                  // Priorisiere product.images (Server-Bilder), fallback zu imagesLoaded (Cache/Batch-API)
                  // Stelle sicher, dass immer ein Array zurückgegeben wird
                  (() => {
                    // 1. Priorität: product.images (Server-Bilder)
                    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
                      return product.images
                    }
                    // 2. Fallback: imagesLoaded (Cache/Batch-API)
                    if (imagesLoaded[product.id] && Array.isArray(imagesLoaded[product.id]) && imagesLoaded[product.id].length > 0) {
                      return imagesLoaded[product.id]
                    }
                    // 3. Fallback: Leeres Array
                    return []
                  })()
                }
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

