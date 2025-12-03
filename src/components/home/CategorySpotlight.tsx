'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { ProductCard } from '@/components/ui/ProductCard'
import { getCategoryConfig } from '@/data/categories'

interface Product {
  id: string
  title: string
  brand?: string
  price: number
  images: string[]
  condition?: string
  city?: string
  postalCode?: string
  auctionEnd?: string
  buyNowPrice?: number
  isAuction?: boolean
  bids?: any[]
  boosters?: string[]
}

interface CategorySpotlight {
  category: string
  name: string
  icon: string
  color: string
  featured: Product | null
  products: Product[]
}

export function CategorySpotlight() {
  const { data: session } = useSession()
  const { t } = useLanguage()
  const [categories, setCategories] = useState<CategorySpotlight[]>([])
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const scrollRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const [canScrollLeft, setCanScrollLeft] = useState<{ [key: string]: boolean }>({})
  const [canScrollRight, setCanScrollRight] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    const fetchCategorySpotlights = async () => {
      setLoading(true)
      try {
        // Hole beliebte Kategorien (priorisiert nach Booster-Umsatz)
        const popularResponse = await fetch('/api/categories/popular')
        let categoriesToFetch: Array<{
          category: string
          name: string
          icon: string
          color: string
        }> = []

        let popularData: any = null
        if (popularResponse.ok) {
          popularData = await popularResponse.json()
          // Zeige nur die ersten 6 Kategorien (sortiert nach geboosteten Artikeln)
          // Begrenzt die Anzahl der API-Aufrufe für bessere Performance
          if (popularData?.categories && Array.isArray(popularData.categories)) {
            categoriesToFetch = popularData.categories.slice(0, 6).map((cat: any) => ({
              category: cat.category,
              name: cat.name,
              icon: cat.icon,
              color: cat.color,
            }))
          }
        }

        // Fallback: Falls API fehlschlägt ODER keine Kategorien mit Produkten zurückgegeben wurden,
        // verwende Standard-Kategorien (auch wenn sie noch keine Produkte haben)
        // Begrenzt auf 6 Kategorien für bessere Performance
        if (categoriesToFetch.length === 0) {
          const fallbackCategories = [
            'auto-motorrad',
            'computer-netzwerk',
            'sport',
            'uhren-schmuck',
            'kleidung-accessoires',
            'haushalt-wohnen',
          ]
          categoriesToFetch = fallbackCategories.map(slug => {
            const config = getCategoryConfig(slug)
            return {
              category: slug,
              name: config.name,
              icon: 'icon', // Placeholder - will use IconComponent
              color: config.color,
            }
          })
        }

        // WICHTIG: Zeige auch Kategorien OHNE Produkte, damit der Benutzer sieht, dass die Kategorie existiert
        // Filtere nur Kategorien heraus, die explizit 0 Produkte haben UND keine geboosteten Artikel
        // Aber zeige sie trotzdem, wenn sie im Fallback sind
        if (popularData?.categories && popularData.categories.length > 0) {
          const filteredCategories = categoriesToFetch.filter(cat => {
            const apiCategory = popularData.categories.find((c: any) => c.category === cat.category)
            // Zeige Kategorie wenn:
            // 1. Sie Produkte hat (productCount > 0)
            // 2. ODER sie geboostete Artikel hat (boostedCount > 0)
            // 3. ODER sie im Fallback ist (wird immer angezeigt)
            return apiCategory ? apiCategory.productCount > 0 || apiCategory.boostedCount > 0 : true
          })

          // Wenn nach Filterung Kategorien übrig sind, verwende sie
          if (filteredCategories.length > 0) {
            categoriesToFetch = filteredCategories
          }
        }

        // Limit to 4 categories max for better performance (reduced from 6)
        const limitedCategories = categoriesToFetch.slice(0, 4)
        // Execute all category fetches in parallel for maximum speed
        const promises = limitedCategories.map(async cat => {
          try {
            const url = `/api/articles/search?category=${encodeURIComponent(cat.category)}&limit=6`

            const response = await fetch(url + '&t=' + Date.now(), {
              cache: 'no-store', // No caching to ensure fresh results
            })
            if (!response.ok) {
              const errorText = await response.text().catch(() => 'Unknown error')
              console.error(
                `[CategorySpotlight] Error fetching ${cat.category}:`,
                response.status,
                response.statusText,
                errorText
              )
              return { ...cat, featured: null, products: [] }
            }

            const data = await response.json()
            const watches = data.watches || []

            if (watches.length === 0) {
              return { ...cat, featured: null, products: [] }
            }

            // Konvertiere Watches zu Product-Format
            const products: Product[] = watches.map((watch: any) => {
              // Parse images sicher
              let images: string[] = []
              try {
                if (Array.isArray(watch.images)) {
                  images = watch.images
                } else if (typeof watch.images === 'string') {
                  const parsed = JSON.parse(watch.images)
                  images = Array.isArray(parsed) ? parsed : []
                }
              } catch (e) {
                images = []
              }

              // Parse boosters
              let boosters: string[] = []
              try {
                if (watch.boosters) {
                  if (Array.isArray(watch.boosters)) {
                    boosters = watch.boosters
                  } else if (typeof watch.boosters === 'string') {
                    boosters = JSON.parse(watch.boosters)
                  }
                }
              } catch (e) {
                boosters = []
              }

              return {
                id: watch.id,
                title: watch.title || '',
                brand: watch.brand,
                price: watch.price || 0,
                images: images,
                condition: watch.condition,
                city: watch.city || watch.seller?.city,
                postalCode: watch.postalCode || watch.seller?.postalCode,
                auctionEnd: watch.auctionEnd ? new Date(watch.auctionEnd).toISOString() : undefined,
                buyNowPrice: watch.buyNowPrice,
                isAuction: watch.isAuction || false,
                bids: watch.bids || [],
                boosters: boosters,
              }
            })

            return {
              ...cat,
              featured: products[0] || null,
              products: products.slice(1, 10) || [],
            }
          } catch (error) {
            console.error(`Error fetching products for category ${cat.category}:`, error)
          }
          return { ...cat, featured: null, products: [] }
        })

        const results = await Promise.all(promises)
        // Filtere Kategorien heraus, die keine Produkte haben
        // ABER: Zeige sie trotzdem, wenn sie im Fallback sind (damit Benutzer sehen, dass die Kategorie existiert)
        const categoriesWithProducts = results.filter(
          cat => cat.featured !== null || cat.products.length > 0
        )

        // Wenn nach Filterung keine Kategorien übrig sind, zeige trotzdem die ersten 3 (auch wenn leer)
        // Das zeigt dem Benutzer, dass die Kategorien existieren, auch wenn noch keine Produkte vorhanden sind
        if (categoriesWithProducts.length === 0 && results.length > 0) {
          setCategories(results.slice(0, 3))
        } else {
          setCategories(categoriesWithProducts)
        }

      } catch (error) {
        console.error('Error fetching category spotlights:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategorySpotlights()
  }, [])

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!session?.user) return

      try {
        const response = await fetch('/api/favorites')
        if (response.ok) {
          const data = await response.json()
          setFavorites(new Set(data.favorites?.map((f: any) => f.watchId) || []))
        }
      } catch (error) {
        console.error('Error fetching favorites:', error)
      }
    }

    fetchFavorites()
  }, [session?.user])

  const checkScrollButtons = useCallback((categoryKey: string) => {
    const container = scrollRefs.current[categoryKey]
    if (!container) return

    const canScrollLeftValue = container.scrollLeft > 0
    const canScrollRightValue =
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1

    setCanScrollLeft(prev => {
      if (prev[categoryKey] === canScrollLeftValue) return prev
      return { ...prev, [categoryKey]: canScrollLeftValue }
    })
    setCanScrollRight(prev => {
      if (prev[categoryKey] === canScrollRightValue) return prev
      return { ...prev, [categoryKey]: canScrollRightValue }
    })
  }, [])

  const scroll = (categoryKey: string, direction: 'left' | 'right') => {
    const container = scrollRefs.current[categoryKey]
    if (!container) return

    // Berechne die Scroll-Menge basierend auf der sichtbaren Container-Breite
    // Scrolle ca. 80% der sichtbaren Breite, damit mehr Artikel auf einmal angezeigt werden
    const containerWidth = container.clientWidth
    const scrollAmount = containerWidth * 0.8 // 80% der sichtbaren Breite

    const targetScroll =
      direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    })

    // Check buttons after scroll animation
    setTimeout(() => checkScrollButtons(categoryKey), 300)
  }

  useEffect(() => {
    // Check scroll buttons for all categories after they load
    // Use a small delay to ensure containers are rendered
    const timer = setTimeout(() => {
      categories.forEach(cat => {
        checkScrollButtons(cat.category)
      })
    }, 100)

    return () => clearTimeout(timer)
  }, [categories, checkScrollButtons])

  useEffect(() => {
    // Add scroll listeners with debounce
    const scrollTimeouts: { [key: string]: NodeJS.Timeout } = {}

    const handleScroll = (categoryKey: string) => () => {
      // Debounce scroll events
      if (scrollTimeouts[categoryKey]) {
        clearTimeout(scrollTimeouts[categoryKey])
      }
      scrollTimeouts[categoryKey] = setTimeout(() => {
        checkScrollButtons(categoryKey)
      }, 50)
    }

    const listeners: { [key: string]: () => void } = {}
    categories.forEach(cat => {
      const container = scrollRefs.current[cat.category]
      if (container) {
        listeners[cat.category] = handleScroll(cat.category)
        container.addEventListener('scroll', listeners[cat.category], { passive: true })
      }
    })

    return () => {
      Object.entries(listeners).forEach(([key, listener]) => {
        const container = scrollRefs.current[key]
        if (container) {
          container.removeEventListener('scroll', listener)
        }
      })
      Object.values(scrollTimeouts).forEach(timeout => clearTimeout(timeout))
    }
  }, [categories, checkScrollButtons])

  if (loading) {
    return null
  }

  if (categories.length === 0) {
    return null
  }

  return (
    <section className="bg-gray-50 py-6">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Kategorie-Highlights</h2>
        </div>

        <div className="space-y-6">
          {categories.map(category => (
            <div
              key={category.category}
              className="rounded-lg border border-gray-200 bg-white shadow-sm"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between border-b border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  {(() => {
                    const config = getCategoryConfig(category.category)
                    const IconComponent = config.icon
                    return (
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-lg shadow-sm"
                        style={{ backgroundColor: '#0f766e' }}
                      >
                        <IconComponent className="h-7 w-7 text-white" />
                      </div>
                    )
                  })()}
                  <h3 className="text-lg font-bold text-gray-900">{category.name}</h3>
                </div>
                <Link
                  href={`/search?category=${category.category}`}
                  className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  Weitere Artikel
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Horizontal Scroll Container */}
              <div className="relative p-4">
                {/* Left Arrow */}
                {canScrollLeft[category.category] && (
                  <button
                    onClick={() => scroll(category.category, 'left')}
                    className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-gray-200 bg-white p-2 shadow-lg transition-all duration-200 hover:bg-gray-50"
                    aria-label="Nach links scrollen"
                  >
                    <ArrowLeft className="h-5 w-5 text-gray-700" />
                  </button>
                )}

                {/* Right Arrow */}
                {canScrollRight[category.category] && (
                  <button
                    onClick={() => scroll(category.category, 'right')}
                    className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-gray-200 bg-white p-2 shadow-lg transition-all duration-200 hover:bg-gray-50"
                    aria-label="Nach rechts scrollen"
                  >
                    <ArrowRight className="h-5 w-5 text-gray-700" />
                  </button>
                )}

                {/* Scrollable Container */}
                <div
                  ref={el => {
                    scrollRefs.current[category.category] = el
                    if (el) {
                      checkScrollButtons(category.category)
                    }
                  }}
                  className="scrollbar-hide flex gap-4 overflow-x-auto scroll-smooth"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {/* Alle Produkte (inkl. Featured) */}
                  {category.featured && (
                    <div className="w-[200px] flex-shrink-0">
                      <ProductCard
                        {...category.featured}
                        favorites={favorites}
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
                  )}

                  {/* Other Items */}
                  {category.products.length > 0 ? (
                    category.products.map(product => (
                      <div key={product.id} className="w-[200px] flex-shrink-0">
                        <ProductCard
                          {...product}
                          favorites={favorites}
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
                    ))
                  ) : (
                    // Zeige Meldung wenn keine Produkte vorhanden
                    <div className="w-full flex-shrink-0 px-4 py-8 text-center text-sm text-gray-500">
                      {category.featured ? null : 'Keine Produkte in dieser Kategorie'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  )
}
