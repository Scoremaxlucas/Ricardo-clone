/**
 * PopularCategories - Beliebte Kategorien Section
 *
 * Server Component für SEO
 * Zeigt 6-8 Top-Kategorien mit Icons und Namen
 * Clean, minimal design mit weißem Hintergrund
 */

import Link from 'next/link'
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
    <section className="bg-white py-8 md:py-10 lg:py-4">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        {/* Header - kompakter auf Desktop */}
        <div className="mb-4 text-center lg:mb-3">
          <h2 className="mb-1 text-xl font-bold text-gray-900 md:text-2xl lg:text-lg">
            Beliebte Kategorien
          </h2>
          <p className="text-sm text-gray-600 lg:text-xs">
            Entdecken Sie unsere meistbesuchten Kategorien
          </p>
        </div>

        {/* Kategorien Grid - kompakter auf Desktop */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 lg:gap-2">
          {categories.map(category => {
            const IconComponent = category.icon
            return (
              <Link
                key={category.slug}
                href={category.href}
                className="group flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-transparent bg-white p-3 transition-all duration-200 ease-out hover:border-primary-200 hover:bg-primary-50/50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 lg:gap-1.5 lg:p-2"
                aria-label={`Kategorie ${category.name} durchsuchen`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600 transition-all duration-200 ease-out group-hover:bg-primary-100 md:h-14 md:w-14 lg:h-10 lg:w-10">
                  <IconComponent className="h-6 w-6 transition-transform duration-200 group-hover:scale-110 md:h-7 md:w-7 lg:h-5 lg:w-5" />
                </div>
                <span className="text-center text-xs font-medium text-gray-700 transition-colors duration-200 group-hover:text-primary-600 sm:text-sm lg:text-xs">
                  {category.name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
