'use client'

import Link from 'next/link'
import { getCategoryConfig } from '@/data/categories'

// Hauptkategorien für Quick Links (6-8 wichtigste)
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

export function CategoryQuickLinks() {
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
    <div className="border-t border-white/20 bg-white/5 py-8 backdrop-blur-sm md:py-12">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-4 overflow-x-auto pb-2 scrollbar-hide md:gap-6">
          {categories.map(category => {
            const IconComponent = category.icon
            return (
              <Link
                key={category.slug}
                href={category.href}
                className="group flex min-w-[80px] flex-col items-center gap-2 rounded-xl p-3 transition-all duration-200 hover:bg-white/10 hover:scale-[1.02] md:min-w-[100px]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white transition-all duration-200 group-hover:bg-white/20 group-hover:scale-[1.05] md:h-14 md:w-14">
                  <IconComponent className="h-6 w-6 md:h-7 md:w-7" />
                </div>
                <span className="text-center text-xs font-medium text-white/90 transition-colors group-hover:text-white md:text-sm">
                  {category.name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
