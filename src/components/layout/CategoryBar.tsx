'use client'

import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { ChevronDown, Menu } from 'lucide-react'
import { CategorySidebarNew } from './CategorySidebarNew'
import { getCategoryConfig } from '@/data/categories'
import { useLanguage } from '@/contexts/LanguageContext'

// Main categories configuration - names will be translated in component
const mainCategoriesConfig = [
  {
    slug: 'kleidung-accessoires',
    subcategories: [
      'Damenbekleidung',
      'Herrenbekleidung',
      'Damenschuhe',
      'Herrenschuhe',
      'Taschen & Handtaschen',
      'Rucksäcke',
      'Koffer & Reisegepäck',
      'Gürtel',
      'Schals & Tücher',
      'Mützen & Caps',
      'Handschuhe',
      'Sonnenbrillen',
      'Uhren Damen',
      'Uhren Herren',
      'Schmuck',
    ],
  },
  {
    slug: 'auto-motorrad',
    subcategories: [
      'Autos',
      'Motorräder & Roller',
      'Wohnmobile & Wohnwagen',
      'Boote & Wassersport',
      'Nutzfahrzeuge',
      'Oldtimer',
      'Auto-Ersatzteile',
      'Motorrad-Ersatzteile',
      'Felgen & Reifen',
      'Autoteile allgemein',
    ],
  },
  {
    slug: 'haushalt-wohnen',
    subcategories: [
      'Möbel',
      'Sofas & Sessel',
      'Tische & Stühle',
      'Betten & Matratzen',
      'Schränke & Regale',
      'Lampen & Leuchten',
      'Teppiche',
      'Gardinen & Vorhänge',
      'Küchengeräte',
      'Haushaltsgeräte',
      'Staubsauger',
      'Waschmaschinen',
      'Kühlschränke',
      'Geschirr & Besteck',
      'Deko & Accessoires',
    ],
  },
  {
    slug: 'sport',
    subcategories: [
      'Fahrräder',
      'E-Bikes',
      'Mountainbikes',
      'Rennvelos',
      'Fitnessgeräte',
      'Laufband & Crosstrainer',
      'Ski & Snowboard',
      'Skischuhe',
      'Wintersport',
      'Fussball',
      'Tennis',
      'Golf',
      'Camping & Outdoor',
    ],
  },
  {
    slug: 'handwerk-garten',
    subcategories: [
      'Gartenmöbel',
      'Grills & Zubehör',
      'Rasenmäher',
      'Pflanzen & Samen',
      'Gartengeräte',
      'Elektrowerkzeuge',
      'Handwerkzeuge',
      'Leitern & Gerüste',
      'Gartendeko',
      'Pool & Teich',
    ],
  },
  {
    slug: 'computer-netzwerk',
    subcategories: [
      'Notebooks & Laptops',
      'Desktop-PCs',
      'Tablets',
      'Monitore & Displays',
      'Drucker & Scanner',
      'Tastaturen & Mäuse',
      'PC-Komponenten',
      'Netzwerk-Hardware',
      'Gaming-PCs',
      'Apple Mac',
    ],
  },
]

const allCategories = [
  { name: 'Auto & Motorrad', slug: 'auto-motorrad' },
  { name: 'Bücher', slug: 'buecher' },
  { name: 'Computer & Netzwerk', slug: 'computer-netzwerk' },
  { name: 'Fahrzeugzubehör', slug: 'fahrzeugzubehoer' },
  { name: 'Filme & Serien', slug: 'filme-serien' },
  { name: 'Foto & Optik', slug: 'foto-optik' },
  { name: 'Games & Spielkonsolen', slug: 'games-konsolen' },
  { name: 'Handwerk & Garten', slug: 'handwerk-garten' },
  { name: 'Handy, Festnetz & Funk', slug: 'handy-telefon' },
  { name: 'Haushalt & Wohnen', slug: 'haushalt-wohnen' },
  { name: 'Kind & Baby', slug: 'kind-baby' },
  { name: 'Kleidung & Accessoires', slug: 'kleidung-accessoires' },
  { name: 'Kosmetik & Pflege', slug: 'kosmetik-pflege' },
  { name: 'Modellbau & Hobby', slug: 'modellbau-hobby' },
  { name: 'Münzen', slug: 'muenzen' },
  { name: 'Musik & Musikinstrumente', slug: 'musik-instrumente' },
  { name: 'Sammeln & Seltenes', slug: 'sammeln-seltenes' },
  { name: 'Spielzeug & Basteln', slug: 'spielzeug-basteln' },
  { name: 'Sport', slug: 'sport' },
  { name: 'Tickets & Gutscheine', slug: 'tickets-gutscheine' },
  { name: 'Tierzubehör', slug: 'tierzubehoer' },
  { name: 'Uhren & Schmuck', slug: 'uhren-schmuck' },
  { name: 'Wein & Genuss', slug: 'wein-genuss' },
]

export function CategoryBar() {
  const { t, translateSubcategory } = useLanguage()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const categoryMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (categoryMenuTimeoutRef.current) {
        clearTimeout(categoryMenuTimeoutRef.current)
        categoryMenuTimeoutRef.current = null
      }
    }
  }, [])

  // Optimized handlers with useCallback
  const handleCategoryEnter = useCallback((slug: string) => {
    if (categoryMenuTimeoutRef.current) {
      clearTimeout(categoryMenuTimeoutRef.current)
      categoryMenuTimeoutRef.current = null
    }
    setHoveredCategory(slug)
  }, [])

  const handleCategoryLeave = useCallback(() => {
    categoryMenuTimeoutRef.current = setTimeout(() => {
      setHoveredCategory(null)
      setDropdownPosition(null)
    }, 400) // Längerer Delay verhindert Flackern
  }, [])

  const handleBridgeEnter = useCallback((slug: string) => {
    if (categoryMenuTimeoutRef.current) {
      clearTimeout(categoryMenuTimeoutRef.current)
      categoryMenuTimeoutRef.current = null
    }
    setHoveredCategory(slug)
  }, [])

  const handleBridgeLeave = useCallback(() => {
    categoryMenuTimeoutRef.current = setTimeout(() => {
      setHoveredCategory(null)
      setDropdownPosition(null)
    }, 400) // Längerer Delay verhindert Flackern
  }, [])

  const handleDropdownEnter = useCallback((slug: string) => {
    if (categoryMenuTimeoutRef.current) {
      clearTimeout(categoryMenuTimeoutRef.current)
      categoryMenuTimeoutRef.current = null
    }
    setHoveredCategory(slug)
  }, [])

  const handleDropdownLeave = useCallback(() => {
    categoryMenuTimeoutRef.current = setTimeout(() => {
      setHoveredCategory(null)
      setDropdownPosition(null)
    }, 400) // Längerer Delay verhindert Flackern
  }, [])

  const handleOverlayClick = useCallback(() => {
    if (categoryMenuTimeoutRef.current) {
      clearTimeout(categoryMenuTimeoutRef.current)
      categoryMenuTimeoutRef.current = null
    }
    setHoveredCategory(null)
    setDropdownPosition(null)
  }, [])

  const handleOverlayEnter = useCallback(() => {
    categoryMenuTimeoutRef.current = setTimeout(() => {
      setHoveredCategory(null)
      setDropdownPosition(null)
    }, 400) // Längerer Delay verhindert Flackern
  }, [])

  // Calculate dropdown position with useMemo
  const calculatedPosition = useMemo(() => {
    if (!hoveredCategory || !categoryRefs.current[hoveredCategory] || typeof window === 'undefined') {
      return null
    }

    const rect = categoryRefs.current[hoveredCategory]!.getBoundingClientRect()
    const dropdownWidth = 450
    const margin = 20
    const gap = 4 // Gap zwischen Button und Dropdown

    return {
      top: rect.bottom + gap,
      left: Math.max(
        10,
        Math.min(rect.left, window.innerWidth - dropdownWidth - margin)
      ),
      bridgeTop: rect.bottom, // Brücke startet direkt am Button
      bridgeHeight: gap + 36, // Brücke deckt Gap + extra Raum ab
    }
  }, [hoveredCategory])

  // Update position when hovered category changes
  useEffect(() => {
    if (calculatedPosition) {
      setDropdownPosition(calculatedPosition)
    }
  }, [calculatedPosition])

  return (
    <>
      <CategorySidebarNew isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="relative border-b border-gray-200 bg-white shadow-sm z-40">
        <div className="mx-auto w-full px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12">
          {/* Container mit Overflow-Handling - Horizontal Scroll auf kleinen Bildschirmen */}
          <div className="overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="flex min-w-0 items-center gap-2 py-3 sm:gap-3 md:gap-4">
              {/* Alle Kategorien Button - Flex-shrink-0 damit er nicht schrumpft */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-md border border-primary-200 bg-primary-50 px-3 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-primary-100 sm:px-4"
              >
                <Menu className="h-4 w-4" />
                <span className="hidden sm:inline">{t.categoryBar.allCategories}</span>
                <span className="sm:hidden">Kategorien</span>
              </button>

              {/* Hauptkategorien mit Hover-Flyouts - Flex-wrap verhindert Overflow */}
              {mainCategoriesConfig.map(category => {
                const config = getCategoryConfig(category.slug)
                const IconComponent = config.icon
                // Verwende Übersetzung für Kategorienamen
                const categoryName =
                  t.categories[category.slug as keyof typeof t.categories] || config.name
                return (
                  <div
                    key={category.slug}
                    ref={el => { categoryRefs.current[category.slug] = el }}
                    className="relative z-50"
                    onMouseEnter={() => handleCategoryEnter(category.slug)}
                    onMouseLeave={handleCategoryLeave}
                  >
                    <div className="flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary-600 sm:gap-2 sm:px-3 sm:py-2 sm:text-sm">
                      <Link
                        href={`/search?category=${category.slug}`}
                        className="flex items-center gap-1.5 sm:gap-2"
                        onClick={() => setHoveredCategory(null)}
                      >
                        <div
                          className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded sm:h-6 sm:w-6"
                          style={{ backgroundColor: '#0f766e' }}
                        >
                          <IconComponent className="h-3 w-3 text-white sm:h-4 sm:w-4" />
                        </div>
                        <span className="hidden sm:inline">{categoryName}</span>
                        <span className="sm:hidden">{categoryName.split(' ')[0]}</span>
                      </Link>
                    </div>

                    {/* Flyout für Unterkategorien - Use Portal to render outside overflow container */}
                    {hoveredCategory === category.slug &&
                      category.subcategories &&
                      category.subcategories.length > 0 &&
                      typeof window !== 'undefined' &&
                      categoryRefs.current[category.slug] &&
                      createPortal(
                        <>
                          {/* Overlay zum Schließen bei Klick außerhalb */}
                          <div
                            className="fixed inset-0 z-[9999] bg-transparent"
                            onClick={handleOverlayClick}
                            onMouseEnter={handleOverlayEnter}
                            style={{ pointerEvents: 'auto' }}
                            aria-hidden="true"
                          />
                          {/* Unsichtbare Brücke zwischen Button und Dropdown - verhindert Flackern */}
                          {dropdownPosition && calculatedPosition && categoryRefs.current[category.slug] && (
                            <div
                              className="fixed z-[10000] bg-transparent"
                              style={{
                                top: calculatedPosition.bridgeTop || categoryRefs.current[category.slug]!.getBoundingClientRect().bottom,
                                left: dropdownPosition.left,
                                width: Math.max(
                                  categoryRefs.current[category.slug]!.getBoundingClientRect().width,
                                  450
                                ),
                                height: `${calculatedPosition.bridgeHeight || 40}px`, // Dynamische Höhe deckt alles ab
                                pointerEvents: 'auto',
                              }}
                              onMouseEnter={() => handleBridgeEnter(category.slug)}
                              onMouseLeave={handleBridgeLeave}
                              aria-hidden="true"
                            />
                          )}
                          {/* Dropdown Menu */}
                          {dropdownPosition && (
                            <div
                              className="fixed z-[10000] max-h-[500px] w-[450px] overflow-y-auto rounded-xl border border-gray-200 bg-white p-5 shadow-2xl backdrop-blur-sm"
                              onMouseEnter={() => handleDropdownEnter(category.slug)}
                              onMouseLeave={handleDropdownLeave}
                              style={{
                                top: dropdownPosition.top,
                                left: dropdownPosition.left,
                                animation: 'dropdownFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                pointerEvents: 'auto',
                                maxWidth: 'calc(100vw - 20px)',
                                willChange: 'transform, opacity',
                              }}
                              role="menu"
                              aria-label={`${categoryName} Unterkategorien`}
                            >
                              <h3 className="mb-4 border-b border-gray-100 pb-3 text-base font-bold text-gray-900">
                                {categoryName}
                              </h3>
                              <div className="grid grid-cols-2 gap-2.5">
                                {category.subcategories.map(subcat => (
                                  <Link
                                    key={subcat}
                                    href={`/search?category=${category.slug}&subcategory=${encodeURIComponent(subcat)}`}
                                    className="group relative block rounded-lg px-3 py-2 text-sm text-gray-700 transition-all duration-200 hover:bg-primary-50 hover:text-primary-600 hover:shadow-sm"
                                    onClick={() => {
                                      setHoveredCategory(null)
                                      setDropdownPosition(null)
                                    }}
                                    role="menuitem"
                                  >
                                    <span className="relative z-10">{translateSubcategory(subcat)}</span>
                                    <span className="absolute inset-0 rounded-lg bg-primary-100 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                        </>,
                        document.body
                      )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
