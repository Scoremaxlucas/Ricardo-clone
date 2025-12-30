/**
 * PopularCategories - Beliebte Kategorien Section
 *
 * Server Component für SEO
 * 
 * Desktop: HIDDEN (Categories are in Header Nav Bar - Ricardo-Style)
 * Mobile/Tablet: Shows category grid for quick access
 */

import Link from 'next/link'
import { ChevronRight, Grid3x3 } from 'lucide-react'
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
    // HIDDEN on Desktop (lg:hidden) - Categories are in Header Nav Bar
    <section className="border-b border-gray-100 bg-white py-5 md:py-6 lg:hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 md:text-lg">
            Beliebte Kategorien
          </h2>
        </div>

        {/* Kategorien Grid - Mobile/Tablet only */}
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-4 md:grid-cols-8">
          {categories.map(category => {
            const IconComponent = category.icon
            return (
              <Link
                key={category.slug}
                href={category.href}
                className="group flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-transparent p-2 transition-all duration-150 hover:border-primary-100 hover:bg-primary-50/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
                aria-label={`Kategorie ${category.name} durchsuchen`}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-50 text-primary-600 transition-colors duration-150 group-hover:bg-primary-100 md:h-10 md:w-10">
                  <IconComponent className="h-5 w-5 md:h-5 md:w-5" />
                </div>
                <span className="line-clamp-1 text-center text-[11px] font-medium text-gray-700 transition-colors duration-150 group-hover:text-primary-600 sm:text-xs">
                  {category.name}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Mobile: "Alle Kategorien" as styled button */}
        <div className="mt-3 flex justify-center">
          <Link
            href="/search"
            className="flex items-center gap-1.5 rounded-full bg-gray-100 px-4 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            <Grid3x3 className="h-3.5 w-3.5" />
            Alle Kategorien
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </section>
  )
}
