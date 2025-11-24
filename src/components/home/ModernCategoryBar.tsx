'use client'

import { CategoryTile } from '@/components/ui/CategoryTile'
import { getCategoryConfig } from '@/data/categories'

const categories = [
  { name: 'Kleidung & Accessoires', slug: 'kleidung-accessoires', href: '/search?category=kleidung-accessoires' },
  { name: 'Auto & Motorrad', slug: 'auto-motorrad', href: '/search?category=auto-motorrad' },
  { name: 'Haushalt & Wohnen', slug: 'haushalt-wohnen', href: '/search?category=haushalt-wohnen' },
  { name: 'Sport', slug: 'sport', href: '/search?category=sport' },
  { name: 'Kind & Baby', slug: 'kind-baby', href: '/search?category=kind-baby' },
  { name: 'Bücher', slug: 'buecher', href: '/search?category=buecher' },
  { name: 'Games & Konsolen', slug: 'games-konsolen', href: '/search?category=games-konsolen' },
  { name: 'Uhren & Schmuck', slug: 'uhren-schmuck', href: '/search?category=uhren-schmuck' },
  { name: 'Sammeln & Seltenes', slug: 'sammeln-seltenes', href: '/search?category=sammeln-seltenes' },
  { name: 'Immobilien', slug: 'immobilien', href: '/search?category=immobilien' },
  { name: 'Jobs & Karriere', slug: 'jobs-karriere', href: '/search?category=jobs-karriere' },
  { name: 'Dienstleistungen', slug: 'dienstleistungen', href: '/search?category=dienstleistungen' },
]

export function ModernCategoryBar() {
  return (
    <section className="py-6 bg-white border-b border-[#F4F4F4]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-3 overflow-x-auto scrollbar-hide pb-2">
          {categories.map((category) => {
            const config = getCategoryConfig(category.slug)
            const IconComponent = config.icon
            return (
              <div key={category.name} className="flex flex-col items-center gap-1">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: '#0f766e' }}
                >
                  <IconComponent className="h-7 w-7 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-700">{category.name}</span>
              </div>
            )
          })}
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

