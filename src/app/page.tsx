import { OrganizationJsonLd, WebSiteJsonLd } from '@/components/seo/JsonLd'
import { FeaturedProductsServer } from '@/components/home/FeaturedProductsServer'
import { HeroServer } from '@/components/home/HeroServer'
import { HomeClient } from '@/components/home/HomeClient'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { WohnenMarketingHome } from '@/components/wohnen/WohnenMarketingHome'
import { getFeaturedProducts } from '@/lib/products'
import { sellLinkWithReturn } from '@/lib/sell-navigation'
import { isWohnenMatchingHostFromHeaders } from '@/lib/tenant-host'
import { WOHNEN_SITE_ORIGIN } from '@/lib/site-urls'
import type { Metadata } from 'next'
import Link from 'next/link'
import { headers } from 'next/headers'
import { Suspense } from 'react'

export const revalidate = 60

const MARKETPLACE_METADATA: Metadata = {
  title: 'Helvenda - Der Schweizer Online-Marktplatz | Kaufen & Verkaufen',
  description:
    'Helvenda: Schweizer Marktplatz zum Kaufen und Verkaufen. Einfach und sicher – Privat und Händler. Marktplatz, verkaufen, kaufen, Schweiz.',
  keywords: [
    'Helvenda',
    'Schweizer Marktplatz',
    'Online-Marktplatz',
    'kaufen',
    'verkaufen',
    'marketplace',
    'selling',
    'Schweiz',
  ],
  openGraph: {
    title: 'Helvenda - Schweizer Marktplatz | Kaufen & Verkaufen',
    description: 'Helvenda: Schweizer Marktplatz zum Kaufen und Verkaufen. Einfach und sicher.',
    type: 'website',
    locale: 'de_CH',
    siteName: 'Helvenda',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Helvenda - Schweizer Marktplatz | Kaufen & Verkaufen',
    description: 'Helvenda: Schweizer Marktplatz zum Kaufen und Verkaufen. Einfach und sicher.',
  },
  alternates: {
    canonical: 'https://helvenda.ch',
  },
}

const WOHNEN_METADATA: Metadata = {
  title: 'Helvenda Wohnungen — Fair mieten und vermieten in der Schweiz',
  description:
    'Kostenlos inserieren, keine Abo-Pflicht für Mieter, verifizierte Bewerbungen mit Betreibungsregister. Helvenda Wohnungen — der faire Schweizer Mietmarkt.',
  openGraph: {
    title: 'Helvenda Wohnungen — Fair mieten und vermieten in der Schweiz',
    description:
      'Kostenlos inserieren, keine Abo-Pflicht für Mieter, verifizierte Bewerbungen mit Betreibungsregister.',
    type: 'website',
    locale: 'de_CH',
    siteName: 'Helvenda Wohnungen',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Helvenda Wohnungen — Fair mieten und vermieten in der Schweiz',
    description:
      'Kostenlos inserieren, keine Abo-Pflicht für Mieter, verifizierte Bewerbungen mit Betreibungsregister.',
  },
  alternates: {
    canonical: WOHNEN_SITE_ORIGIN,
  },
}

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers()
  if (isWohnenMatchingHostFromHeaders(h)) {
    return WOHNEN_METADATA
  }
  return MARKETPLACE_METADATA
}

export default async function Home() {
  const h = await headers()
  if (isWohnenMatchingHostFromHeaders(h)) {
    return <WohnenMarketingHome />
  }

  const featuredProducts = await getFeaturedProducts(10)

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAFA]">
      <OrganizationJsonLd />
      <WebSiteJsonLd />
      <Header />
      <main id="main-content" className="flex-1 pb-8" tabIndex={-1}>
        <HeroServer title="Verkaufen ohne hohe Gebühren – nur 5%, max. CHF 150." />

        <section className="bg-white">
          <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 sm:p-6">
              <h2 className="text-lg font-bold text-emerald-900 sm:text-xl">Warum Helvenda?</h2>
              <p className="mt-2 max-w-4xl text-sm text-emerald-800 sm:text-base">
                Bei Ricardo zahlst du bis zu CHF 290 Gebühren pro Verkauf. Bei uns maximal CHF 150 – egal wie teuer dein Artikel ist.
              </p>
              <div className="mt-4">
                <Link
                  href={sellLinkWithReturn('/')}
                  className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                >
                  Jetzt verkaufen
                </Link>
              </div>
            </div>
          </div>
        </section>

        <FeaturedProductsServer initialProducts={featuredProducts} />

        <Suspense fallback={null}>
          <HomeClient featuredProductIds={featuredProducts.map(p => p.id)} />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
