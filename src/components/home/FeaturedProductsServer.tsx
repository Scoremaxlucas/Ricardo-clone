'use client'

import { ProductItem } from '@/lib/products'
import { ProductCard } from '@/components/ui/ProductCard'
import { useLanguage } from '@/contexts/LanguageContext'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'
import { preloadProductImages } from '@/lib/image-preloader'

// Anzahl Produkte pro "Mehr laden"
const PRODUCTS_PER_PAGE = 12

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
  // KRITISCH: Setze State SYNCHRON beim Initialisieren, keine Verzögerung!
  const [products, setProducts] = useState<ProductItem[]>(initialProducts)
  const [loading, setLoading] = useState(false) // Kein Loading mehr - alles sofort verfügbar!

  // "Mehr laden" State
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true) // Gibt es noch mehr Produkte?
  const [currentPage, setCurrentPage] = useState(2) // Seite 1 wurde bereits initial geladen
  // KRITISCH: KEIN imagesLoaded State mehr - verwende direkt product.images!
  // Dies eliminiert Verzögerung und stellt sicher, dass Bilder sofort angezeigt werden

  // KRITISCH: WIE RICARDO - Bilder SOFORT anzeigen, Batch-API nur für fehlende große Bilder
  useEffect(() => {
    if (initialProducts.length === 0) return

    let isMounted = true
    const abortController = new AbortController()

    // OPTIMIERT: Preload images immediately for instant display
    preloadProductImages(initialProducts)

    // Aktualisiere Cache für Persistenz nach Navigation (asynchron, blockiert nicht)
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

      // Aktualisiere Cache mit Server-Bildern
      initialProducts.forEach(product => {
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
          cachedImages[product.id] = { images: product.images, timestamp: Date.now() }
        }
      })

      localStorage.setItem(cacheKey, JSON.stringify(cachedImages))
    } catch (error) {
      // Ignore localStorage errors (quota exceeded, etc.)
    }

    // KRITISCH: Lade fehlende Bilder über Batch-API
    // Dies lädt auch Base64-Bilder, die automatisch zu Blob Storage migriert werden
    const productsToLoad = initialProducts.filter(
      p => {
        const hasImages = p.images && Array.isArray(p.images) && p.images.length > 0
        const hasCachedImages = cachedImages[p.id]?.images && cachedImages[p.id].images.length > 0
        return !hasImages && !hasCachedImages
      }
    )

    if (productsToLoad.length > 0 && isMounted) {
      console.log(`[FeaturedProducts] Loading ${productsToLoad.length} products without images via Batch API (will auto-migrate Base64 to Blob Storage)`)
      const productIds = productsToLoad.map(p => p.id)

      // Schneller Timeout (2 Sekunden) - Bilder sollten bereits vorhanden sein
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

            // Aktualisiere products State mit Batch-API Bildern
            // KRITISCH: Prüfe isMounted vor State-Update
            if (!isMounted) return

            setProducts(prev => {
              if (!isMounted) return prev // Double-check
              const updated = prev.map(p => {
                const images = batchImages[p.id]
                if (images && Array.isArray(images) && images.length > 0) {
                  return { ...p, images }
                }
                return p
              })
              if (isMounted) {
                preloadProductImages(updated)
              }
              return updated
            })

            // Aktualisiere Cache
            Object.entries(batchImages).forEach(([id, images]: [string, any]) => {
              if (images && Array.isArray(images) && images.length > 0) {
                cachedImages[id] = { images, timestamp: Date.now() }
              }
            })

            try {
              localStorage.setItem(cacheKey, JSON.stringify(cachedImages))
            } catch (error) {
              // Ignore localStorage errors
            }
          } catch (error: any) {
            // Silently fail - images already shown from initialProducts
          }
        })
        .catch((error: any) => {
          // Silently fail - images already shown from initialProducts
          if (error.name !== 'AbortError' && error.message !== 'Image loading timeout') {
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
      let isMounted = true
      const abortController = new AbortController()
      let retryCount = 0
      const maxRetries = 3

      const loadProducts = async () => {
        if (!isMounted) return

        try {
          if (isMounted) {
            setLoading(true)
          }

          const response = await fetch('/api/articles/fast?limit=6', {
            signal: abortController.signal,
          })

          if (!isMounted) return

          if (response.ok) {
            const data = await response.json()
            if (!isMounted) return

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
                  paymentProtectionEnabled: w.paymentProtectionEnabled || false,
                  // WICHTIG: Setze href explizit, damit der richtige Link verwendet wird
                  href: `/products/${productId}`,
                }
              })

              if (isMounted) {
                setProducts(transformedProducts)
                setLoading(false)
              }
              return
            }
          }

          // Wenn keine Daten, retry wenn noch Versuche übrig
          if (!isMounted) return

          if (retryCount < maxRetries) {
            retryCount++
            setTimeout(() => {
              if (isMounted) {
                loadProducts()
              }
            }, 2000)
          } else {
            if (isMounted) {
              setLoading(false)
            }
          }
        } catch (error: any) {
          if (error.name === 'AbortError') return

          if (isMounted) {
            console.error('Error loading products from API:', error)
          }

          // Retry nach 2 Sekunden wenn Fehler und noch Versuche übrig
          if (!isMounted) return

          if (retryCount < maxRetries) {
            retryCount++
            setTimeout(() => {
              if (isMounted) {
                loadProducts()
              }
            }, 2000)
          } else {
            if (isMounted) {
              setLoading(false)
            }
          }
        }
      }

      loadProducts()

      return () => {
        isMounted = false
        abortController.abort()
      }
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

  // "Mehr laden" Funktion
  const loadMoreProducts = async () => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)

    try {
      const response = await fetch(
        `/api/articles/fast?limit=${PRODUCTS_PER_PAGE}&page=${currentPage}`
      )

      if (response.ok) {
        const data = await response.json()
        const newWatches = data.watches || []

        if (newWatches.length === 0) {
          setHasMore(false)
        } else {
          // Transformiere API-Format zu ProductItem-Format
          const transformedProducts: ProductItem[] = newWatches.map((w: any) => {
            const productId = w.articleNumber ? w.articleNumber.toString() : w.id
            return {
              id: w.id,
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
              paymentProtectionEnabled: w.paymentProtectionEnabled || false,
              href: `/products/${productId}`,
            }
          })

          // Filtere Duplikate basierend auf ID
          const existingIds = new Set(products.map(p => p.id))
          const uniqueNewProducts = transformedProducts.filter(p => !existingIds.has(p.id))

          if (uniqueNewProducts.length === 0) {
            setHasMore(false)
          } else {
            setProducts(prev => [...prev, ...uniqueNewProducts])
            setCurrentPage(prev => prev + 1)
            preloadProductImages(uniqueNewProducts)

            // Wenn weniger als erwartet zurückkommen, gibt es keine mehr
            if (newWatches.length < PRODUCTS_PER_PAGE) {
              setHasMore(false)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading more products:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  if (loading) {
    return (
      <section className="bg-[#FAFAFA] py-8 md:py-10 lg:py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 text-center lg:mb-4">
            <h2 className="mb-2 text-2xl font-extrabold text-gray-900 md:text-3xl lg:text-2xl">
              Neu eingestellt
            </h2>
            <p className="text-base leading-relaxed text-gray-600 lg:text-sm">Die neuesten Artikel auf Helvenda</p>
          </div>
          <div className="flex items-center justify-center py-8 lg:py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            <p className="ml-3 text-gray-600">Artikel werden geladen...</p>
          </div>
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return (
      <section className="bg-[#FAFAFA] py-8 md:py-10 lg:py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="mb-3 text-2xl font-bold text-gray-900 lg:text-xl">Neu eingestellt</h2>
            <p className="text-base text-gray-600 lg:text-sm">{t.home.noItemsYet}</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-[#FAFAFA] py-8 md:py-10 lg:py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header - kompakter auf Desktop */}
        <div className="mb-6 text-center lg:mb-4">
          <h2 className="mb-2 text-2xl font-extrabold text-gray-900 md:text-3xl lg:text-2xl">
            Neu eingestellt
          </h2>
          <p className="text-base leading-relaxed text-gray-600 lg:text-sm">Die neuesten Artikel auf Helvenda</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="flex h-full min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-200"
              style={{ animationDelay: `${Math.min(index, 11) * 30}ms` }}
            >
              <ProductCard
                product={{
                  id: product.id,
                  title: product.title,
                  brand: product.brand,
                  model: product.model,
                  price: product.price,
                  buyNowPrice: product.buyNowPrice ?? undefined,
                  isAuction: product.isAuction,
                  auctionEnd: product.auctionEnd ?? undefined,
                  images: Array.isArray(product.images) && product.images.length > 0 ? product.images : [],
                  condition: product.condition,
                  city: product.city ?? undefined,
                  postalCode: product.postalCode ?? undefined,
                  boosters: product.boosters,
                  href: product.href,
                  createdAt: product.createdAt,
                  paymentProtectionEnabled: product.paymentProtectionEnabled ?? false,
                }}
                showCondition={true}
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

        {/* "Mehr laden" Button - wie Ricardo */}
        {hasMore && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={loadMoreProducts}
              disabled={loadingMore}
              className="group flex items-center gap-2 rounded-full border-2 border-primary-600 bg-white px-8 py-3 font-semibold text-primary-600 transition-all hover:bg-primary-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Wird geladen...</span>
                </>
              ) : (
                <>
                  <span>Mehr Artikel laden</span>
                  <ChevronDown className="h-5 w-5 transition-transform group-hover:translate-y-0.5" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Alle Artikel anzeigen Link */}
        {!hasMore && products.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Sie haben alle {products.length} Artikel gesehen
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

