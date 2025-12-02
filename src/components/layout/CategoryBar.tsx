'use client'

import { useState, useRef } from 'react'
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

  return (
    <>
      <CategorySidebarNew isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="relative border-b border-gray-200 bg-white shadow-sm z-40">
        <div className="mx-auto max-w-[1400px] px-2 sm:px-4 md:px-6 lg:px-8">
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
                    onMouseEnter={() => {
                      // Sofortiges Schließen des alten Dropdowns und Öffnen des neuen
                      if (categoryMenuTimeoutRef.current) {
                        clearTimeout(categoryMenuTimeoutRef.current)
                        categoryMenuTimeoutRef.current = null
                      }
                      // Sofort setzen - kein Delay beim Wechsel zwischen Kategorien
                      setHoveredCategory(category.slug)
                    }}
                    onMouseLeave={(e) => {
                      // Prüfe ob Maus zu einer anderen Kategorie bewegt wird
                      let isMovingToAnotherCategory = false
                      Object.keys(categoryRefs.current).forEach(slug => {
                        if (slug !== category.slug && categoryRefs.current[slug]) {
                          const rect = categoryRefs.current[slug]!.getBoundingClientRect()
                          const mouseX = e.clientX
                          const mouseY = e.clientY
                          
                          // Prüfe ob Maus in Richtung einer anderen Kategorie bewegt wird
                          if (mouseX >= rect.left - 10 && mouseX <= rect.right + 10 && 
                              mouseY >= rect.top - 10 && mouseY <= rect.bottom + 10) {
                            isMovingToAnotherCategory = true
                            // Sofort zur neuen Kategorie wechseln
                            if (categoryMenuTimeoutRef.current) {
                              clearTimeout(categoryMenuTimeoutRef.current)
                              categoryMenuTimeoutRef.current = null
                            }
                            setHoveredCategory(slug)
                          }
                        }
                      })

                      // Delay nur wenn nicht zu einer anderen Kategorie bewegt wird
                      if (!isMovingToAnotherCategory) {
                        categoryMenuTimeoutRef.current = setTimeout(() => {
                          setHoveredCategory(null)
                        }, 150) // Kürzerer Delay für bessere Reaktivität
                      }
                    }}
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
                          {/* Overlay zum Schließen bei Klick oder MouseEnter außerhalb */}
                          <div
                            className="fixed inset-0 z-[9999] bg-transparent"
                            onClick={() => {
                              if (categoryMenuTimeoutRef.current) {
                                clearTimeout(categoryMenuTimeoutRef.current)
                                categoryMenuTimeoutRef.current = null
                              }
                              setHoveredCategory(null)
                            }}
                            onMouseEnter={(e) => {
                              // Prüfe ob Maus über einer anderen Kategorie ist
                              let isOverAnotherCategory = false
                              Object.keys(categoryRefs.current).forEach(slug => {
                                if (slug !== category.slug && categoryRefs.current[slug]) {
                                  const rect = categoryRefs.current[slug]!.getBoundingClientRect()
                                  const mouseX = e.clientX
                                  const mouseY = e.clientY

                                  if (mouseX >= rect.left && mouseX <= rect.right &&
                                      mouseY >= rect.top && mouseY <= rect.bottom) {
                                    isOverAnotherCategory = true
                                  }
                                }
                              })

                              // Nur schließen wenn nicht über einer anderen Kategorie
                              if (!isOverAnotherCategory) {
                                const rect = categoryRefs.current[category.slug]!.getBoundingClientRect()
                                const mouseX = e.clientX
                                const mouseY = e.clientY

                                // Prüfe ob Maus außerhalb des Button-Bereichs ist
                                const isOutsideButton = mouseX < rect.left || mouseX > rect.right || mouseY < rect.top || mouseY > rect.bottom + 10

                                if (isOutsideButton) {
                                  categoryMenuTimeoutRef.current = setTimeout(() => {
                                    setHoveredCategory(null)
                                  }, 100)
                                }
                              }
                            }}
                            style={{ pointerEvents: 'auto' }}
                          />
                          {/* Unsichtbare Brücke zwischen Button und Dropdown - nur so breit wie Button */}
                          <div
                            className="fixed z-[10000] bg-transparent"
                            style={{
                              top: categoryRefs.current[category.slug]!.getBoundingClientRect().bottom,
                              left: categoryRefs.current[category.slug]!.getBoundingClientRect().left,
                              width: categoryRefs.current[category.slug]!.getBoundingClientRect().width, // Nur Button-Breite, nicht breiter
                              height: '6px',
                              pointerEvents: 'auto',
                            }}
                            onMouseEnter={(e) => {
                              // Prüfe ob Maus über einer anderen Kategorie ist
                              let isOverAnotherCategory = false
                              Object.keys(categoryRefs.current).forEach(slug => {
                                if (slug !== category.slug && categoryRefs.current[slug]) {
                                  const rect = categoryRefs.current[slug]!.getBoundingClientRect()
                                  const mouseX = e.clientX
                                  const mouseY = e.clientY
                                  
                                  if (mouseX >= rect.left && mouseX <= rect.right && 
                                      mouseY >= rect.top && mouseY <= rect.bottom) {
                                    isOverAnotherCategory = true
                                    // Sofort zur neuen Kategorie wechseln
                                    setHoveredCategory(slug)
                                  }
                                }
                              })

                              if (!isOverAnotherCategory) {
                                if (categoryMenuTimeoutRef.current) {
                                  clearTimeout(categoryMenuTimeoutRef.current)
                                  categoryMenuTimeoutRef.current = null
                                }
                                setHoveredCategory(category.slug)
                              }
                            }}
                          />
                          <div
                            className="fixed z-[10000] max-h-[500px] w-[450px] overflow-y-auto rounded-lg border border-gray-200 bg-white p-4 shadow-2xl dropdown-enter"
                            onMouseEnter={(e) => {
                              // Prüfe ob Maus über einer anderen Kategorie ist
                              let isOverAnotherCategory = false
                              Object.keys(categoryRefs.current).forEach(slug => {
                                if (slug !== category.slug && categoryRefs.current[slug]) {
                                  const rect = categoryRefs.current[slug]!.getBoundingClientRect()
                                  const mouseX = e.clientX
                                  const mouseY = e.clientY
                                  
                                  if (mouseX >= rect.left && mouseX <= rect.right && 
                                      mouseY >= rect.top && mouseY <= rect.bottom) {
                                    isOverAnotherCategory = true
                                    // Sofort zur neuen Kategorie wechseln
                                    if (categoryMenuTimeoutRef.current) {
                                      clearTimeout(categoryMenuTimeoutRef.current)
                                      categoryMenuTimeoutRef.current = null
                                    }
                                    setHoveredCategory(slug)
                                  }
                                }
                              })

                              if (!isOverAnotherCategory) {
                                if (categoryMenuTimeoutRef.current) {
                                  clearTimeout(categoryMenuTimeoutRef.current)
                                  categoryMenuTimeoutRef.current = null
                                }
                                setHoveredCategory(category.slug)
                              }
                            }}
                            onMouseLeave={() => {
                              // Kürzerer Delay für bessere Reaktivität
                              categoryMenuTimeoutRef.current = setTimeout(() => {
                                setHoveredCategory(null)
                              }, 150)
                            }}
                            style={{
                              top: categoryRefs.current[category.slug]!.getBoundingClientRect().bottom + 4,
                              left: typeof window !== 'undefined'
                                ? Math.max(
                                    10, // Minimum 10px from left edge
                                    Math.min(
                                      categoryRefs.current[category.slug]!.getBoundingClientRect().left,
                                      window.innerWidth - 470 // 450px width + 20px margin
                                    )
                                  )
                                : categoryRefs.current[category.slug]!.getBoundingClientRect().left,
                              pointerEvents: 'auto',
                              maxWidth: 'calc(100vw - 20px)', // Prevent cutoff on small screens
                            }}
                          >
                            <h3 className="mb-3 border-b border-gray-200 pb-2 text-sm font-bold text-gray-900">
                              {categoryName}
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                              {category.subcategories.map(subcat => (
                                <Link
                                  key={subcat}
                                  href={`/search?category=${category.slug}&subcategory=${encodeURIComponent(subcat)}`}
                                  className="block py-1 text-sm text-gray-700 transition-colors hover:text-primary-600"
                                  onClick={() => setHoveredCategory(null)}
                                >
                                  {translateSubcategory(subcat)}
                                </Link>
                              ))}
                            </div>
                          </div>
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
