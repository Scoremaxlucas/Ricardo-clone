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
    <section className="bg-white py-12 md:py-16">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">
            Beliebte Kategorien
          </h2>
          <p className="text-gray-600">
            Entdecken Sie unsere meistbesuchten Kategorien
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {categories.map(category => {
            const IconComponent = category.icon
            return (
              <Link
                key={category.slug}
                href={category.href}
                className="group flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-transparent bg-white p-4 transition-all duration-200 ease-out hover:border-primary-200 hover:bg-primary-50/50 hover:shadow-lg hover:scale-[1.02]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-600 transition-all duration-200 group-hover:bg-primary-100 group-hover:scale-110 md:h-16 md:w-16">
                  <IconComponent className="h-7 w-7 md:h-8 md:w-8" />
                </div>
                <span className="text-center text-sm font-medium text-gray-700 transition-colors group-hover:text-primary-600">
                  {category.name}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Alle Kategorien anzeigen Link */}
        <div className="mt-8 text-center">
          <Link
            href="/search"
            className="group inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-base font-semibold text-primary-600 transition-all duration-200 hover:bg-primary-100 hover:translate-x-1"
          >
            Alle Kategorien anzeigen
            <svg
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
