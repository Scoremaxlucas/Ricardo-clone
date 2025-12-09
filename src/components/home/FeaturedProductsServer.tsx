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
  // OPTIMIERT: initialProducts können Base64-Bilder enthalten (mit VERCEL_BYPASS_FALLBACK_OVERSIZED_ERROR)
  // Cache wird verwendet um Bilder nach Navigation zu erhalten
  const [products, setProducts] = useState<ProductItem[]>(initialProducts)
  const [loading, setLoading] = useState(initialProducts.length === 0)
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

    // Setze State synchron, damit Bilder sofort angezeigt werden
    setImagesLoaded(initialImagesMap)

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

      // Lade fehlende oder große Bilder von API
      // Wenn initialProducts keine Bilder hat ODER nur kleine Bilder hat, lade alle Bilder
      const productsToLoad = initialProducts.filter(
        p => {
          // Lade Bilder wenn:
          // 1. Keine Bilder im initialProducts vorhanden
          // 2. ODER nur kleine Bilder vorhanden (große wurden gefiltert)
          return !p.images?.length || (p.images.length === 0 && !cachedImages[p.id]?.images)
        }
      )
    if (productsToLoad.length > 0) {
      Promise.all(
        productsToLoad.map(async (product) => {
          try {
            const response = await fetch(`/api/watches/${product.id}/images`, {
              signal: abortController.signal,
            })
            if (response.ok && isMounted) {
              const data = await response.json()
              return { id: product.id, images: data.images || [] }
            }
          } catch (error: any) {
            if (error.name !== 'AbortError' && isMounted) {
              console.error(`Error loading images for product ${product.id}:`, error)
            }
          }
          return { id: product.id, images: [] }
        })
      ).then((imageData) => {
        // Prüfe ob Component noch gemountet ist
        if (!isMounted) return

        setImagesLoaded(prev => {
          const newImagesMap = { ...prev }
          imageData.forEach(({ id, images }) => {
            if (images.length > 0) {
              newImagesMap[id] = images
              // Speichere im Cache
              cachedImages[id] = { images, timestamp: Date.now() }
            }
          })

          // Speichere aktualisierten Cache
          try {
            localStorage.setItem(cacheKey, JSON.stringify(cachedImages))
          } catch (error) {
            // Ignore localStorage errors
          }

          return newImagesMap
        })
      }).catch(() => {
        // Ignore errors
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
                  // WICHTIG: Verwende immer Server-Bilder wenn vorhanden (sofort verfügbar im initialProducts)
                  // imagesLoaded wird nur für nachgeladene Bilder verwendet
                  (product.images && product.images.length > 0)
                    ? product.images
                    : (imagesLoaded[product.id]?.length > 0 ? imagesLoaded[product.id] : [])
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

