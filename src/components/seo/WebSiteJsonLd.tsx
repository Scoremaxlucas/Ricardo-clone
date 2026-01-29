import { abs } from '@/lib/seo'

export function WebSiteJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Helvenda',
    alternateName: [
      'Helvenda.ch',
      'Helvenda Marktplatz',
      'Schweizer Marktplatz',
      'Helvenda Marketplace',
    ],
    url: abs(''),
    description:
      'Helvenda: Schweizer Online-Marktplatz zum Kaufen und Verkaufen. Einfach und sicher. Marktplatz, verkaufen, kaufen, Schweiz.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${abs('/search')}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Helvenda',
      url: abs(''),
      logo: {
        '@type': 'ImageObject',
        url: abs('/images/logo-og.png'),
      },
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'support@helvenda.ch',
        contactType: 'customer service',
        availableLanguage: ['German', 'French', 'English', 'Italian'],
      },
    },
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
