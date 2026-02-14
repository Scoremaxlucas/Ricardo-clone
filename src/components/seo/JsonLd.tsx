/**
 * Reusable JSON-LD structured data components for Helvenda (helvenda.ch).
 * Server-compatible – no 'use client', no hooks.
 */

import { abs } from '@/lib/seo'

/** Maps condition labels to schema.org condition URIs */
function conditionToSchema(condition: string): string {
  const s = (condition || '').toLowerCase()
  if (s.includes('neu') || s.includes('wie neu')) return 'NewCondition'
  if (s.includes('sehr gut') || s.includes('sehr gut')) return 'UsedCondition'
  if (s.includes('gut')) return 'UsedCondition'
  if (s.includes('akzeptabel')) return 'UsedCondition'
  return 'UsedCondition'
}

export function OrganizationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Helvenda',
    url: 'https://helvenda.ch',
    logo: 'https://helvenda.ch/icons/icon-512x512.svg',
    description: 'Schweizer Online-Marktplatz für Private und Gewerbetreibende',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'In der Hauswiese 2',
      addressLocality: 'Zollikerberg',
      postalCode: '8125',
      addressCountry: 'CH',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@helvenda.ch',
    },
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export interface ProductJsonLdProps {
  name: string
  description: string
  image: string | null
  price: number
  currency?: string
  condition: string
  seller: { name: string }
  url: string
  availability?: 'InStock' | 'SoldOut'
  sku?: string
}

export function ProductJsonLd({
  name,
  description,
  image,
  price,
  currency = 'CHF',
  condition,
  seller,
  url,
  availability = 'InStock',
  sku,
}: ProductJsonLdProps) {
  const offer: Record<string, unknown> = {
    '@type': 'Offer',
    price,
    priceCurrency: currency,
    availability: `https://schema.org/${availability}`,
    url,
    seller: {
      '@type': 'Organization',
      name: seller.name,
    },
  }
  if (sku) offer.sku = sku

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    url,
    ...(image && { image: [image] }),
    itemCondition: {
      '@type': conditionToSchema(condition),
    },
    offers: offer,
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export interface BreadcrumbItem {
  name: string
  url: string
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function WebSiteJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Helvenda',
    url: abs(''),
    description: 'Schweizer Online-Marktplatz für Private und Gewerbetreibende',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${abs('/search')}?q={search_term}`,
      },
      'query-input': 'required name=search_term',
    },
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
