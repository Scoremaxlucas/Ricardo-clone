'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Menu } from 'lucide-react'
import { CategorySidebarNew } from './CategorySidebarNew'
import { getCategoryConfig } from '@/data/categories'

const mainCategories = [
  { 
    name: 'Kleidung & Accessoires', 
    slug: 'kleidung-accessoires',
    subcategories: [
      'Damenbekleidung', 'Herrenbekleidung', 'Damenschuhe', 'Herrenschuhe',
      'Taschen & Handtaschen', 'Rucksäcke', 'Koffer & Reisegepäck',
      'Gürtel', 'Schals & Tücher', 'Mützen & Caps', 'Handschuhe',
      'Sonnenbrillen', 'Uhren Damen', 'Uhren Herren', 'Schmuck'
    ]
  },
  { 
    name: 'Auto & Motorrad', 
    slug: 'auto-motorrad',
    subcategories: [
      'Autos', 'Motorräder & Roller', 'Wohnmobile & Wohnwagen', 'Boote & Wassersport',
      'Nutzfahrzeuge', 'Oldtimer', 'Auto-Ersatzteile', 'Motorrad-Ersatzteile',
      'Felgen & Reifen', 'Autoteile allgemein'
    ]
  },
  { 
    name: 'Haushalt & Wohnen', 
    slug: 'haushalt-wohnen',
    subcategories: [
      'Möbel', 'Sofas & Sessel', 'Tische & Stühle', 'Betten & Matratzen',
      'Schränke & Regale', 'Lampen & Leuchten', 'Teppiche', 'Gardinen & Vorhänge',
      'Küchengeräte', 'Haushaltsgeräte', 'Staubsauger', 'Waschmaschinen',
      'Kühlschränke', 'Geschirr & Besteck', 'Deko & Accessoires'
    ]
  },
  { 
    name: 'Sport', 
    slug: 'sport',
    subcategories: [
      'Fahrräder', 'E-Bikes', 'Mountainbikes', 'Rennvelos', 'Fitnessgeräte',
      'Laufband & Crosstrainer', 'Ski & Snowboard', 'Skischuhe', 'Wintersport',
      'Fussball', 'Tennis', 'Golf', 'Camping & Outdoor'
    ]
  },
  { 
    name: 'Handwerk & Garten', 
    slug: 'handwerk-garten',
    subcategories: [
      'Gartenmöbel', 'Grills & Zubehör', 'Rasenmäher', 'Pflanzen & Samen',
      'Gartengeräte', 'Elektrowerkzeuge', 'Handwerkzeuge', 'Leitern & Gerüste',
      'Gartendeko', 'Pool & Teich'
    ]
  },
  { 
    name: 'Computer & Netzwerk', 
    slug: 'computer-netzwerk',
    subcategories: [
      'Notebooks & Laptops', 'Desktop-PCs', 'Tablets', 'Monitore & Displays',
      'Drucker & Scanner', 'Tastaturen & Mäuse', 'PC-Komponenten', 'Netzwerk-Hardware',
      'Gaming-PCs', 'Apple Mac'
    ]
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  return (
    <>
      <CategorySidebarNew 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-3">
            {/* Alle Kategorien Button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-200 rounded-md hover:bg-primary-100 transition-colors whitespace-nowrap font-medium text-gray-900"
            >
              <Menu className="h-4 w-4" />
              Alle Kategorien
            </button>

            {/* Hauptkategorien mit Hover-Flyouts */}
            {mainCategories.map((category) => {
              const config = getCategoryConfig(category.slug)
              const IconComponent = config.icon
              return (
                <div
                  key={category.slug}
                  className="relative"
                  onMouseEnter={() => setHoveredCategory(category.slug)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <Link
                    href={`/search?category=${category.slug}`}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors whitespace-nowrap"
                  >
                    <div 
                      className="w-6 h-6 rounded flex items-center justify-center"
                      style={{ backgroundColor: '#0f766e' }}
                    >
                      <IconComponent className="h-4 w-4 text-white" />
                    </div>
                    {category.name}
                  </Link>

                {/* Flyout für Unterkategorien */}
                {hoveredCategory === category.slug && category.subcategories && category.subcategories.length > 0 && (
                  <div
                    className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-2xl p-4 w-[450px] max-h-[500px] overflow-y-auto"
                    style={{ zIndex: 9999 }}
                    onMouseEnter={() => setHoveredCategory(category.slug)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <h3 className="font-bold text-gray-900 mb-3 text-sm border-b border-gray-200 pb-2">
                      {category.name}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {category.subcategories.map((subcat) => (
                        <Link
                          key={subcat}
                          href={`/search?category=${category.slug}&subcategory=${encodeURIComponent(subcat)}`}
                          className="text-sm text-gray-700 hover:text-primary-600 py-1 transition-colors block"
                        >
                          {subcat}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
            })}
          </div>
        </div>
      </div>
    </>
  )
}

