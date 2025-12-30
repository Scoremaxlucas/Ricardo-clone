/**
 * PopularCategories - Beliebte Kategorien Section
 *
 * Server Component für SEO
 * Zeigt 6-8 Top-Kategorien mit Icons und Namen
 * Clean, minimal design mit weißem Hintergrund
 * 
 * Desktop: Sehr kompakt, horizontal, wenig vertikaler Platzverbrauch
 */

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getCategoryConfig } from '@/data/categories'

// Hauptkategorien für Popular Categories (6-8 wichtigste)
const mainCategorySlugs = [
  'kleidung-accessoires',
  'auto-motorrad',
  'haushalt-wohnen',
  'sport',
  'computer-netzwerk',
  'uhren-schmuck',
  'games-konsolen',
  'kind-baby',
]

export function PopularCategories() {
  const categories = mainCategorySlugs
    .map(slug => {
      const config = getCategoryConfig(slug)
      if (!config) return null
      const IconComponent = config.icon
      return {
        slug,
        name: config.name,
        icon: IconComponent,
        href: `/search?category=${slug}`,
      }
    })
    .filter(Boolean) as Array<{
    slug: string
    name: string
    icon: any
    href: string
  }>

  return (
    <section className="border-b border-gray-100 bg-white py-6 md:py-6 lg:py-3">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header - inline auf Desktop für Platzersparnis */}
        <div className="mb-3 flex items-center justify-between lg:mb-2">
          <h2 className="text-base font-semibold text-gray-900 md:text-lg lg:text-sm">
            Beliebte Kategorien
          </h2>
          <Link
            href="/search"
            className="hidden items-center gap-1 text-xs font-medium text-primary-600 transition-colors hover:text-primary-700 lg:flex"
          >
            Alle Kategorien
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Kategorien Grid - horizontal scrollbar auf Mobile, kompaktes Grid auf Desktop */}
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-4 md:grid-cols-8 lg:gap-1.5">
          {categories.map(category => {
            const IconComponent = category.icon
            return (
              <Link
                key={category.slug}
                href={category.href}
                className="group flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-transparent p-2 transition-all duration-150 hover:border-primary-100 hover:bg-primary-50/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 lg:gap-1 lg:p-1.5"
                aria-label={`Kategorie ${category.name} durchsuchen`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-600 transition-colors duration-150 group-hover:bg-primary-100 md:h-9 md:w-9 lg:h-8 lg:w-8">
                  <IconComponent className="h-5 w-5 md:h-4 md:w-4 lg:h-4 lg:w-4" />
                </div>
                <span className="line-clamp-1 text-center text-[10px] font-medium text-gray-700 transition-colors duration-150 group-hover:text-primary-600 sm:text-xs lg:text-[10px]">
                  {category.name}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Mobile: "Alle Kategorien" Link */}
        <div className="mt-2 flex justify-center lg:hidden">
          <Link
            href="/search"
            className="flex items-center gap-1 text-xs font-medium text-primary-600 transition-colors hover:text-primary-700"
          >
            Alle Kategorien anzeigen
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </section>
  )
}
