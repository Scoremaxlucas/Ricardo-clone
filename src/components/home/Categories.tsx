'use client'

import Link from 'next/link'
import { getCategoryConfig } from '@/data/categories'

const categories = [
  {
    name: 'Computer & Netzwerk',
    slug: 'computer-netzwerk',
    href: '/search?category=computer-netzwerk',
    description: 'Notebooks, PCs, Tablets & mehr',
  },
  {
    name: 'Kleidung & Accessoires',
    slug: 'kleidung-accessoires',
    href: '/search?category=kleidung-accessoires',
    description: 'Mode für Damen & Herren',
  },
  {
    name: 'Haushalt & Wohnen',
    slug: 'haushalt-wohnen',
    href: '/search?category=haushalt-wohnen',
    description: 'Möbel, Deko & Haushaltsgeräte',
  },
  {
    name: 'Auto & Motorrad',
    slug: 'auto-motorrad',
    href: '/search?category=auto-motorrad',
    description: 'Fahrzeuge & Zubehör',
  },
  {
    name: 'Sport',
    slug: 'sport',
    href: '/search?category=sport',
    description: 'Fahrräder, Fitness & Outdoor',
  },
  {
    name: 'Kind & Baby',
    slug: 'kind-baby',
    href: '/search?category=kind-baby',
    description: 'Kleidung, Spielzeug & Ausstattung',
  },
  {
    name: 'Bücher',
    slug: 'buecher',
    href: '/search?category=buecher',
    description: 'Romane, Sachbücher & Comics',
  },
  {
    name: 'Games & Spielkonsolen',
    slug: 'games-konsolen',
    href: '/search?category=games-konsolen',
    description: 'PS5, Xbox, Switch & PC-Spiele',
  },
  {
    name: 'Uhren & Schmuck',
    slug: 'uhren-schmuck',
    href: '/search?category=uhren-schmuck',
    description: 'Armbanduhren & Schmuckstücke',
  },
  {
    name: 'Sammeln & Seltenes',
    slug: 'sammeln-seltenes',
    href: '/search?category=sammeln-seltenes',
    description: 'Antiquitäten, Kunst & Raritäten',
  },
  {
    name: 'Immobilien',
    slug: 'immobilien',
    href: '/search?category=immobilien',
    description: 'Wohnungen, Häuser & Grundstücke',
  },
  {
    name: 'Jobs & Karriere',
    slug: 'jobs-karriere',
    href: '/search?category=jobs-karriere',
    description: 'Stellenangebote & Karriere',
  },
  {
    name: 'Dienstleistungen',
    slug: 'dienstleistungen',
    href: '/search?category=dienstleistungen',
    description: 'Handwerk, Reparatur & Service',
  },
  {
    name: 'Camping & Outdoor',
    slug: 'camping-outdoor',
    href: '/search?category=camping-outdoor',
    description: 'Zelte, Ausrüstung & Outdoor',
  },
  {
    name: 'Wellness & Gesundheit',
    slug: 'wellness-gesundheit',
    href: '/search?category=wellness-gesundheit',
    description: 'Massage, Sauna & Fitness',
  },
  {
    name: 'Reise & Urlaub',
    slug: 'reise-urlaub',
    href: '/search?category=reise-urlaub',
    description: 'Reiseführer & Reisezubehör',
  },
  {
    name: 'Garten & Pflanzen',
    slug: 'garten-pflanzen',
    href: '/search?category=garten-pflanzen',
    description: 'Pflanzen, Samen & Gartendeko',
  },
  {
    name: 'Boote & Schiffe',
    slug: 'boote-schiffe',
    href: '/search?category=boote-schiffe',
    description: 'Yachten, Boote & Bootszubehör',
  },
  {
    name: 'Tiere',
    slug: 'tiere',
    href: '/search?category=tiere',
    description: 'Hunde, Katzen & Haustiere',
  },
  {
    name: 'Lebensmittel',
    slug: 'lebensmittel',
    href: '/search?category=lebensmittel',
    description: 'Bio-Produkte & Delikatessen',
  },
  {
    name: 'Medizin & Gesundheit',
    slug: 'medizin-gesundheit',
    href: '/search?category=medizin-gesundheit',
    description: 'Hilfsmittel & Pflegeprodukte',
  },
  {
    name: 'Flugzeuge',
    slug: 'flugzeuge',
    href: '/search?category=flugzeuge',
    description: 'Flugzeuge & Flugzeugzubehör',
  },
  {
    name: 'Smart Home',
    slug: 'smart-home',
    href: '/search?category=smart-home',
    description: 'Smart Home Systeme & Geräte',
  },
  {
    name: 'Elektrogeräte',
    slug: 'elektrogeraete',
    href: '/search?category=elektrogeraete',
    description: 'Küchen- & Haushaltsgeräte',
  },
  {
    name: 'Baustoffe',
    slug: 'baustoffe',
    href: '/search?category=baustoffe',
    description: 'Baustoffe & Dämmstoffe',
  },
  {
    name: 'Kunst & Handwerk',
    slug: 'kunst-handwerk',
    href: '/search?category=kunst-handwerk',
    description: 'Kunstwerke & Handwerkskunst',
  },
]

export function Categories() {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">Beliebte Kategorien</h2>
          <p className="text-lg text-gray-600">Entdecken Sie unsere vielfältigen Angebote</p>
        </div>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {categories.map(category => {
            const config = getCategoryConfig(category.slug)
            const IconComponent = config.icon
            return (
              <Link
                key={category.name}
                href={category.href}
                className="group flex flex-col items-center rounded-lg border border-gray-200 p-6 transition-all duration-200 hover:border-primary-300 hover:shadow-lg"
              >
                <div className="relative mb-4">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-xl"
                    style={{ backgroundColor: '#0f766e' }}
                  >
                    <IconComponent className="h-10 w-10 text-white" />
                  </div>
                </div>

                <span className="mb-1 text-center text-sm font-semibold text-gray-900 group-hover:text-primary-600">
                  {category.name}
                </span>
                <span className="text-center text-xs text-gray-500">{category.description}</span>
              </Link>
            )
          })}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/categories"
            className="inline-flex items-center font-medium text-primary-600 hover:text-primary-700"
          >
            Alle Kategorien anzeigen
            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
